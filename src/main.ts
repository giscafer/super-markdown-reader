import throttle from 'lodash.throttle'
import Event from '@/core/event'
import storage from '@/core/storage'
import Ele, { svg } from '@/core/ele'
import { initPlugins } from '@/plugins'
import lifecycle from '@/core/lifecycle'
import className from '@/config/class-name'
import type { Theme } from '@/config/page-themes'
import type { ColorTheme } from '@/config/color-themes'
import { getDefaultData, type Data, type SideTab } from '@/core/data'
import { mdRender, type MdOptions } from '@/core/markdown'
import {
  getHeads,
  getRawContainer,
  setTheme,
  setColorTheme,
  CONTENT_TYPES,
  darkMediaQuery,
  getMediaQueryTheme,
  toTheme,
  xhr,
} from '@/shared'
import {
  createSideNav,
  highlightCurrentFile,
  renderFileList,
  renderHistoryList,
} from '@/core/side-nav'
import {
  MD_FILE_RE,
  basename,
  listingFromHtml,
  parseGithubRaw,
  relativeUrl,
  stripHashSafe,
  toDirUrl,
  type FolderEntry,
} from '@/core/folder'
import { getHistory, recordVisit } from '@/core/history'
import i18n from '@/config/i18n'
import codeIcon from '@/images/icon_code.svg'
import sideIcon from '@/images/icon_side.svg'
import goTopIcon from '@/images/icon_go_top.svg'
import '@/style/index.less'

function main(data: Data) {
  const configData = getDefaultData(data)
  const localize = i18n(configData.language)
  const actions = {
    reload() {
      window.location.reload()
    },
    updateMdPlugins() {
      reloading = true
      if (mdRaw != null) {
        safeContentRender(mdRaw)
        renderSide()
      } else {
        window.location.reload()
      }
      reloading = false
    },
    updatePageTheme(theme: Theme, prevTheme: Theme) {
      setTheme(theme)
      renderContentByTheme(theme, prevTheme)
    },
    updateColorTheme(color: ColorTheme) {
      setColorTheme(color)
    },
    toggleRefresh(value) {
      clearTimeout(pollingTimer)
      pollingTimer = null
      value && polling()
    },
    toggleCentered(value) {
      mdContent.classList.toggle('centered', value)
    },
    toggleSide() {
      onToggleSide()
    },
  }
  chrome.runtime.onMessage.addListener(message => {
    const { action, data } = message || {}
    if (!action || !data || !actions[action]) {
      return
    }
    const { key, value } = data
    const oldValue = configData[key]
    configData[key] = value
    actions[action](value, oldValue)
  })

  if (!configData.enable || !CONTENT_TYPES.includes(document.contentType)) {
    return
  }

  let pollingTimer: number = null
  let reloading: boolean = false
  let mdRaw: string = null
  let isSideHover: boolean = false
  let globalEvent: Event = new Event()

  initPlugins({ event: globalEvent })

  /* init md page */
  setTheme(configData.pageTheme)
  setColorTheme(configData.colorTheme)
  document.body.classList.toggle(
    className.SIDE_COLLAPSED,
    configData.hiddenSide,
  )

  const rawContainer = getRawContainer()
  lifecycle.init(rawContainer)
  mdRaw = rawContainer?.textContent

  /* render content */
  const mdContent = new Ele<HTMLElement>('article', {
    className: `${className.MD_CONTENT} ${
      configData.centered ? 'centered' : ''
    }`,
  })

  const mdRenderer =
    (target: HTMLElement | Ele) =>
    (code: string = '', options?: MdOptions) => {
      target.innerHTML = mdRender(code, {
        theme: toTheme(configData.pageTheme),
        plugins: configData.mdPlugins,
        ...options,
      })
      globalEvent.emit(
        'contentRendered',
        target instanceof Ele ? target.ele : target,
      )
    }
  const contentRender = mdRenderer(mdContent)

  function safeContentRender(code: string, options?: MdOptions) {
    try {
      contentRender(code, options)
      return true
    } catch (error) {
      console.error('[md-reader] render failed', error)
      return false
    }
  }

  if (mdRaw != null) {
    safeContentRender(mdRaw)
  }

  mdContent.on(
    'click',
    async e => {
      globalEvent.emit('click', e.target)
      const target = e.target as HTMLElement
      const anchor = target.closest?.('a')
      if (!anchor) {
        return
      }
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return
      }
      try {
        const resolved = new URL(href, location.href)
        if (MD_FILE_RE.test(resolved.pathname)) {
          e.preventDefault()
          e.stopPropagation()
          openUrl(resolved.toString())
        }
      } catch {
        // keep native navigation for invalid URLs
      }
    },
    true,
  )

  const mdBody = new Ele<HTMLElement>(
    'main',
    { className: className.MD_BODY },
    mdContent,
  )

  /* render side */
  const sideNav = createSideNav({
    localize,
    initialTab: configData.sideTab || 'files',
    onTabChange(tab: SideTab) {
      configData.sideTab = tab
      storage.set('sideTab', tab)
      if (tab === 'history') {
        refreshHistory()
      }
    },
    onHoverChange(value) {
      isSideHover = value
    },
  })
  const mdSide = sideNav.root
  const outlineList = sideNav.outlineList
  let idCache: { [content: string]: number } = Object.create(null)
  let headElements: HTMLElement[] = []
  let sideLiElements: HTMLElement[] = []
  let df: Ele<DocumentFragment> = null
  let targetIndex: number = null

  let folderRequestId = 0
  let documentRequestId = 0
  let currentFileUrl = stripHashSafe(location.href)
  let currentDir = toDirUrl(location.href)
  let cachedFolderEntries: FolderEntry[] = []
  let cachedFolderDir = ''

  function openUrl(url: string) {
    let next: URL
    try {
      next = new URL(url, location.href)
    } catch {
      window.location.href = url
      return
    }
    if (MD_FILE_RE.test(next.pathname)) {
      loadDocument(next.toString())
      return
    }
    window.location.href = next.toString()
  }

  function isExtensionContextInvalidated(error?: unknown) {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
        ? error.message
        : error
        ? String(error)
        : chrome.runtime.lastError?.message || ''
    return /Extension context invalidated/i.test(message)
  }

  function fetchFromPage(url: string): Promise<string> {
    return xhr(url).then((request: XMLHttpRequest) => {
      const text = request.responseText
      if (text == null) {
        throw new Error('Empty response')
      }
      return text
    })
  }

  function fetchFromBackground(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({ action: 'fetch', data: { url } }, res => {
          if (
            chrome.runtime.lastError ||
            typeof res !== 'string' ||
            res == null
          ) {
            reject(
              new Error(chrome.runtime.lastError?.message || 'Empty response'),
            )
            return
          }
          resolve(res)
        })
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  async function fetchMarkdown(url: string): Promise<string> {
    if (url.startsWith('file:')) {
      try {
        return await fetchFromPage(url)
      } catch {
        return fetchFromBackground(url)
      }
    }
    try {
      return await fetchFromBackground(url)
    } catch {
      return fetchFromPage(url)
    }
  }

  function setDocumentBase(fileUrl: string) {
    const href = stripHashSafe(fileUrl)
    let base = document.querySelector('base')
    if (!base) {
      base = document.createElement('base')
      document.head.insertBefore(base, document.head.firstChild)
    }
    base.setAttribute('href', href)
  }

  function syncDocumentUrl(target: string) {
    const hash = new URL(target, location.href).hash
    const clean = stripHashSafe(target)
    if (stripHashSafe(location.href) === clean) {
      if (hash) {
        location.hash = hash
      }
      return true
    }
    try {
      history.pushState({ mdReaderUrl: clean }, '', target)
      return true
    } catch {
      try {
        history.pushState(
          { mdReaderUrl: clean },
          '',
          relativeUrl(location.href, target),
        )
        return true
      } catch {
        return false
      }
    }
  }

  async function loadDocument(url: string, fromHistory = false) {
    let parsed: URL
    try {
      parsed = new URL(url, location.href)
    } catch {
      window.location.href = url
      return
    }
    const target = stripHashSafe(parsed.toString())
    if (!MD_FILE_RE.test(parsed.pathname)) {
      window.location.href = parsed.toString()
      return
    }
    if (target === currentFileUrl) {
      if (parsed.hash) {
        location.hash = parsed.hash
        updateAnchorPosition()
      }
      return
    }

    const requestId = ++documentRequestId
    let text: string
    try {
      text = await fetchMarkdown(target)
    } catch {
      window.location.href = parsed.toString()
      return
    }
    if (requestId !== documentRequestId) {
      return
    }
    if (!fromHistory) {
      syncDocumentUrl(parsed.toString())
    }

    currentFileUrl = target
    mdRaw = text
    if (rawContainer) {
      rawContainer.textContent = text
    }
    setDocumentBase(target)
    document.title = basename(target)
    if (!safeContentRender(text)) {
      window.location.href = parsed.toString()
      return
    }
    renderSide()

    const nextDir = toDirUrl(target)
    if (nextDir === currentDir) {
      highlightCurrentFile(sideNav.filesPanel, target)
    } else {
      currentDir = nextDir
      loadFolder(nextDir)
    }
    highlightCurrentFile(sideNav.historyPanel, target)
    recordVisit(target)
      .then(refreshHistory)
      .catch(() => undefined)
    if (parsed.hash) {
      updateAnchorPosition()
    } else {
      window.scrollTo(0, 0)
    }
  }

  function loadFolder(dirUrl: string) {
    const requestId = ++folderRequestId
    const dir = toDirUrl(dirUrl)
    currentDir = dir
    if (cachedFolderDir !== dir) {
      renderFileList(sideNav.filesPanel, {
        localize,
        dirUrl: dir,
        entries: [],
        currentUrl: currentFileUrl,
        loading: true,
        onOpen: openUrl,
        onOpenDir: loadFolder,
      })
    }
    try {
      chrome.runtime.sendMessage(
        { action: 'listDir', data: { url: dir } },
        async res => {
          if (requestId !== folderRequestId) {
            return
          }
          if (
            isExtensionContextInvalidated(chrome.runtime.lastError?.message)
          ) {
            return
          }
          let result = chrome.runtime.lastError
            ? { dir, entries: [], error: chrome.runtime.lastError.message }
            : res || { dir, entries: [], error: 'Empty response' }
          if (
            result.error &&
            result.error !== 'file_access' &&
            !parseGithubRaw(dir)
          ) {
            result = await listFolderFromPage(dir)
          }
          if (requestId !== folderRequestId) {
            return
          }
          cachedFolderDir = result.dir || dir
          cachedFolderEntries = result.entries || []
          renderFileList(sideNav.filesPanel, {
            localize,
            dirUrl: result.dir || dir,
            entries: cachedFolderEntries,
            error: result.error,
            currentUrl: currentFileUrl,
            onOpen: openUrl,
            onOpenDir: loadFolder,
          })
        },
      )
    } catch (error) {
      if (isExtensionContextInvalidated(error)) {
        return
      }
      void listFolderFromPage(dir).then(result => {
        if (requestId !== folderRequestId) {
          return
        }
        cachedFolderDir = result.dir || dir
        cachedFolderEntries = result.entries || []
        renderFileList(sideNav.filesPanel, {
          localize,
          dirUrl: result.dir || dir,
          entries: cachedFolderEntries,
          error: result.error,
          currentUrl: currentFileUrl,
          onOpen: openUrl,
          onOpenDir: loadFolder,
        })
      })
    }
  }

  async function listFolderFromPage(dirUrl: string) {
    try {
      const dir = toDirUrl(dirUrl)
      const request = (await xhr(dir)) as XMLHttpRequest
      return listingFromHtml(request.responseText || '', dir)
    } catch (error) {
      return {
        dir: dirUrl,
        entries: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async function refreshHistory() {
    try {
      const items = await getHistory()
      renderHistoryList(sideNav.historyPanel, {
        localize,
        items,
        currentUrl: currentFileUrl,
        onOpen: openUrl,
        onOpenFolder(folder) {
          sideNav.setTab('files')
          configData.sideTab = 'files'
          storage.set('sideTab', 'files')
          loadFolder(folder)
        },
      })
    } catch (error) {
      if (!isExtensionContextInvalidated(error)) {
        console.error('[md-reader] history render failed', error)
      }
    }
  }

  renderSide()
  loadFolder(currentDir)
  recordVisit(currentFileUrl)
    .then(refreshHistory)
    .catch(() => undefined)
  document.addEventListener('scroll', throttle(onScroll, 100))
  window.addEventListener('popstate', () => {
    loadDocument(location.href, true)
  })

  /* render raw toggle button */
  const rawToggleBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.CODE_TOGGLE_BTN],
      title: 'Toggle raw',
    },
    svg(codeIcon),
  )
  rawToggleBtn.on('click', () => {
    lifecycle.toggleRaw([mdBody, mdSide])
  })

  /* render side expand button */
  const sideExpandBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.SIDE_EXPAND_BTN],
      title: 'Expand side',
    },
    svg(sideIcon),
  )
  sideExpandBtn.on('click', () => {
    chrome.runtime.sendMessage({
      action: 'storage',
      data: {
        key: 'hiddenSide',
        value: !configData.hiddenSide,
      },
    })
  })
  function onToggleSide() {
    if (window.innerWidth <= 960) {
      const value = document.body.classList.toggle(className.SIDE_EXPANDED)
      mdBody.off('click', foldSide, true)
      window.removeEventListener('resize', foldSide)
      document.removeEventListener('keydown', foldSide)
      if (value) {
        setTimeout(() => {
          mdBody.on('click', foldSide, { capture: true, once: true })
          window.addEventListener('resize', foldSide, { once: true })
          document.addEventListener('keydown', foldSide, { once: true })
        }, 0)
      }
    } else {
      configData.hiddenSide = document.body.classList.toggle(
        className.SIDE_COLLAPSED,
      )
    }
  }
  function foldSide(e: UIEvent) {
    if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Escape') {
      return
    }
    document.body.classList.remove(className.SIDE_EXPANDED)
    mdBody.off('click', foldSide, true)
    window.removeEventListener('resize', foldSide)
    document.removeEventListener('keydown', foldSide)
    e.stopPropagation()
    e.preventDefault()
    return false
  }
  /* render go top button */
  const goTopBtn = new Ele<HTMLElement>(
    'button',
    {
      className: [className.MD_BUTTON, className.GO_TOP_BTN],
      title: 'Go top',
    },
    svg(goTopIcon),
  )
  goTopBtn.hide()
  goTopBtn.on('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))

  const buttonWrap = new Ele<HTMLElement>(
    'div',
    { className: className.BUTTON_WRAP_ELE },
    [sideExpandBtn, rawToggleBtn, goTopBtn],
  )

  /* mount elements */
  lifecycle.mount([buttonWrap, mdBody, mdSide])
  updateAnchorPosition()

  darkMediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
    if (configData.pageTheme === 'auto') {
      renderContentByTheme(
        e.matches ? 'light' : 'dark',
        e.matches ? 'dark' : 'light',
      )
    }
  })

  /* auto refresh */
  if (configData.refresh) {
    polling()
  }

  function polling() {
    void (function watch() {
      clearTimeout(pollingTimer)
      try {
        chrome.runtime.sendMessage(
          { action: 'fetch', data: { url: currentFileUrl } },
          res => {
            const lastError = chrome.runtime.lastError?.message
            if (isExtensionContextInvalidated(lastError)) {
              pollingTimer = null
              return
            }
            if (typeof res === 'string') {
              if (mdRaw == null) {
                if (res) {
                  window.location.reload()
                  return
                }
              } else if (mdRaw !== res) {
                mdRaw = res
                if (safeContentRender(res)) {
                  renderSide()
                  setTimeout(() => {
                    if (rawContainer) {
                      rawContainer.textContent = res
                    }
                  }, 0)
                }
              }
            }
            pollingTimer = setTimeout(watch, 500)
          },
        )
      } catch (error) {
        if (isExtensionContextInvalidated(error)) {
          pollingTimer = null
          return
        }
        pollingTimer = setTimeout(watch, 500)
      }
    })()
  }

  function renderSide() {
    idCache = Object.create(null)
    headElements = getHeads(mdContent)
    df = new Ele<DocumentFragment>('#document-fragment')
    sideLiElements = headElements.reduce(handleHeadItem, [])
    outlineList.innerHTML = null
    outlineList.append(df)
    setTimeout(onScroll, 0)
  }

  function handleHeadItem(
    eleList: HTMLElement[],
    head: HTMLElement,
  ): HTMLElement[] {
    const content = String(head.textContent).trim()
    const encodeContent = getDecodeContent(content)

    head.setAttribute('id', encodeContent)

    const headAnchor = new Ele<HTMLElement>('a', {
      className: className.HEAD_ANCHOR,
      href: `#${encodeContent}`,
    })
    headAnchor.textContent = '#'
    head.insertBefore(headAnchor.ele, head.firstChild)

    const link = new Ele<HTMLElement>('a', {
      title: content,
      href: `#${encodeContent}`,
    })
    link.textContent = content
    const li = new Ele<HTMLElement>('li', {
      className: `${className.MD_SIDE}-${head.tagName.toLowerCase()}`,
    })
    eleList.push(li.ele)
    li.append(link)
    df.append(li.ele)

    return eleList
  }

  function getDecodeContent(content: string): string {
    return (function unique(key: string): string {
      if (key in idCache) {
        return unique(`${key}-${idCache[key]++}`)
      } else {
        idCache[key] = 1
        return key
      }
    })(encodeURIComponent(content.toLowerCase().replace(/\s+/g, '-')))
  }

  function onScroll() {
    const documentScrollTop = document.documentElement.scrollTop
    goTopBtn.toggle(documentScrollTop >= 640)

    headElements.some((_, index) => {
      let sectionHeight = -20
      const item = headElements[index + 1]
      if (item) {
        sectionHeight += item.offsetTop
      }

      const hit = sectionHeight <= 0 || sectionHeight > documentScrollTop

      if (hit && (targetIndex !== index || reloading)) {
        let target = sideLiElements[targetIndex]
        target && target.classList.remove(className.MD_SIDE_ACTIVE)

        target = sideLiElements[(targetIndex = index)]
        if (target) {
          target.classList.add(className.MD_SIDE_ACTIVE)
          if (!isSideHover && target.scrollIntoView) {
            target.scrollIntoView({ block: 'nearest' })
          }
        }
      }
      return hit
    })
  }

  function renderContentByTheme(theme: Theme, prevTheme: Theme) {
    if (!configData.mdPlugins.includes('Mermaid') || mdRaw == null) {
      return
    }
    if (theme === 'auto' || prevTheme === 'auto') {
      const themeScheme = getMediaQueryTheme()
      if (theme !== themeScheme && prevTheme !== themeScheme) {
        if (safeContentRender(mdRaw)) {
          renderSide()
        }
      }
    } else if (safeContentRender(mdRaw)) {
      renderSide()
    }
  }

  function updateAnchorPosition() {
    if (window.location.hash) {
      setTimeout(() => {
        const hash = window.location.hash.slice(1)
        const target = headElements.find(head => {
          return head.getAttribute('id') === hash
        })
        if (target) {
          const top = target.offsetTop
          top && window.scrollTo(0, top)
        }
      })
    }
  }
}

storage.get().then(main)
