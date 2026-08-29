import Ele, { svg } from './ele'
import className from '@/config/class-name'
import type { HistoryItem, SideTab } from './data'
import type { FolderEntry } from './folder'
import { basename, parentDir, shortPath, stripHashSafe } from './folder'
import fileIcon from '@/images/icon_file.svg'
import folderIcon from '@/images/icon_folder.svg'
import historyIcon from '@/images/icon_history.svg'
import backIcon from '@/images/icon_back.svg'

export type { SideTab } from './data'

type Localize = (field: string) => string

export interface SideNav {
  root: Ele<HTMLElement>
  outlineList: Ele<HTMLElement>
  filesPanel: Ele<HTMLElement>
  historyPanel: Ele<HTMLElement>
  setTab: (tab: SideTab) => void
}

const TABS: Array<{ id: SideTab; label: string }> = [
  { id: 'files', label: 'side_files' },
  { id: 'outline', label: 'side_outline' },
  { id: 'history', label: 'side_history' },
]

export function createSideNav(options: {
  localize: Localize
  initialTab: SideTab
  onTabChange: (tab: SideTab) => void
  onHoverChange: (hover: boolean) => void
}): SideNav {
  const root = new Ele<HTMLElement>('aside', { className: className.MD_SIDE })
  const tabs = new Ele<HTMLElement>('nav', {
    className: className.MD_SIDE_TABS,
  })
  const panels = new Ele<HTMLElement>('div', {
    className: className.MD_SIDE_PANELS,
  })
  const filesPanel = new Ele<HTMLElement>('div', {
    className: className.MD_SIDE_PANEL,
    'data-panel': 'files',
  })
  const outlinePanel = new Ele<HTMLElement>('div', {
    className: className.MD_SIDE_PANEL,
    'data-panel': 'outline',
  })
  const historyPanel = new Ele<HTMLElement>('div', {
    className: className.MD_SIDE_PANEL,
    'data-panel': 'history',
  })
  const outlineList = new Ele<HTMLElement>('ul', {
    className: className.MD_SIDE_LIST,
  })

  outlinePanel.append(outlineList)
  panels.append([filesPanel, outlinePanel, historyPanel])

  const tabButtons = new Map<SideTab, Ele<HTMLElement>>()

  TABS.forEach(tab => {
    const button = new Ele<HTMLElement>('button', {
      className: className.MD_SIDE_TAB,
      type: 'button',
    })
    button.textContent = options.localize(tab.label)
    button.on('click', () => {
      setTab(tab.id)
      options.onTabChange(tab.id)
    })
    tabs.append(button)
    tabButtons.set(tab.id, button)
  })

  function setTab(tab: SideTab) {
    tabButtons.forEach((button, id) => {
      button.classList.toggle(className.MD_SIDE_TAB_ACTIVE, id === tab)
    })
    filesPanel.classList.toggle(className.MD_SIDE_PANEL_ACTIVE, tab === 'files')
    outlinePanel.classList.toggle(
      className.MD_SIDE_PANEL_ACTIVE,
      tab === 'outline',
    )
    historyPanel.classList.toggle(
      className.MD_SIDE_PANEL_ACTIVE,
      tab === 'history',
    )
  }

  root.on('mouseenter', () => options.onHoverChange(true))
  root.on('mouseleave', () => options.onHoverChange(false))
  root.append([tabs, panels])
  setTab(options.initialTab)

  return { root, outlineList, filesPanel, historyPanel, setTab }
}

export function renderFileList(
  container: Ele<HTMLElement>,
  options: {
    localize: Localize
    dirUrl: string
    entries: FolderEntry[]
    currentUrl: string
    loading?: boolean
    error?: string
    onOpen: (url: string) => void
    onOpenDir: (url: string) => void
  },
) {
  const df = new Ele<DocumentFragment>('#document-fragment')
  const canGoParent = Boolean(parentDir(options.dirUrl))

  const header = new Ele<HTMLElement>('div', {
    className: className.MD_SIDE_HEAD,
  })
  if (canGoParent) {
    const back = new Ele<HTMLElement>('button', {
      className: className.MD_SIDE_BACK,
      type: 'button',
      title: options.localize('side_parent'),
    })
    back.append(svg(backIcon))
    back.on('click', () => {
      const parent = parentDir(options.dirUrl)
      if (parent) {
        options.onOpenDir(parent)
      }
    })
    header.append(back)
  }
  const title = new Ele<HTMLElement>('span', {
    className: className.MD_SIDE_HEAD_TITLE,
    title: options.dirUrl,
  })
  title.textContent = basename(options.dirUrl) || shortPath(options.dirUrl)
  header.append(title)
  df.append(header)

  if (options.loading) {
    df.append(emptyItem(options.localize('side_loading')))
  } else if (options.error) {
    df.append(emptyItem(options.localize('side_list_error')))
  } else if (!options.entries.length) {
    df.append(emptyItem(options.localize('side_empty_files')))
  } else {
    const list = new Ele<HTMLElement>('ul', {
      className: className.MD_SIDE_LIST,
    })
    const current = stripHashSafe(options.currentUrl)
    options.entries.forEach(entry => {
      const isDir = entry.type === 'dir'
      const li = new Ele<HTMLElement>('li', {
        className: [
          className.MD_SIDE_FILE,
          isDir ? className.MD_SIDE_FILE_DIR : '',
          !isDir && stripHashSafe(entry.url) === current
            ? className.MD_SIDE_FILE_ACTIVE
            : '',
        ],
      })
      const row = isDir
        ? new Ele<HTMLElement>('button', {
            className: className.MD_SIDE_ENTRY,
            type: 'button',
            title: `${entry.name}/`,
          })
        : new Ele<HTMLElement>('a', {
            className: className.MD_SIDE_ENTRY,
            href: entry.url,
            title: entry.name,
          })
      row.append(svg(isDir ? folderIcon : fileIcon))
      const label = new Ele<HTMLElement>('span')
      label.textContent = isDir ? `${entry.name}/` : entry.name
      row.append(label)
      row.on('click', e => {
        e.preventDefault()
        e.stopPropagation()
        if (isDir) {
          options.onOpenDir(entry.url)
        } else {
          options.onOpen(entry.url)
        }
      })
      li.append(row)
      list.append(li)
    })
    df.append(list)
  }

  container.innerHTML = ''
  container.append(df)
}

export function renderHistoryList(
  container: Ele<HTMLElement>,
  options: {
    localize: Localize
    items: HistoryItem[]
    currentUrl: string
    onOpen: (url: string) => void
    onOpenFolder: (folder: string) => void
  },
) {
  const df = new Ele<DocumentFragment>('#document-fragment')

  if (!options.items.length) {
    df.append(emptyItem(options.localize('side_empty_history')))
  } else {
    const list = new Ele<HTMLElement>('ul', {
      className: className.MD_SIDE_LIST,
    })
    const current = stripHashSafe(options.currentUrl)
    options.items.forEach(item => {
      const li = new Ele<HTMLElement>('li', {
        className: [
          className.MD_SIDE_FILE,
          className.MD_SIDE_HISTORY_ITEM,
          stripHashSafe(item.url) === current
            ? className.MD_SIDE_FILE_ACTIVE
            : '',
        ],
      })
      const link = new Ele<HTMLElement>('a', {
        href: item.url,
        title: item.url,
      })
      link.append(svg(historyIcon))
      const textWrap = new Ele<HTMLElement>('span', {
        className: className.MD_SIDE_HISTORY_TEXT,
      })
      const name = new Ele<HTMLElement>('span', {
        className: className.MD_SIDE_HISTORY_NAME,
      })
      name.textContent = item.title || basename(item.url)
      const path = new Ele<HTMLElement>('span', {
        className: className.MD_SIDE_HISTORY_PATH,
      })
      path.textContent = shortPath(item.folder)
      textWrap.append([name, path])
      link.append(textWrap)
      link.on('click', e => {
        e.preventDefault()
        options.onOpen(item.url)
      })

      const folderBtn = new Ele<HTMLElement>('button', {
        className: className.MD_SIDE_FOLDER_BTN,
        type: 'button',
        title: options.localize('history_open_folder'),
      })
      folderBtn.append(svg(folderIcon))
      folderBtn.on('click', e => {
        e.preventDefault()
        e.stopPropagation()
        options.onOpenFolder(item.folder)
      })

      li.append([link, folderBtn])
      list.append(li)
    })
    df.append(list)
  }

  container.innerHTML = ''
  container.append(df)
}

function emptyItem(text: string): Ele<HTMLElement> {
  const empty = new Ele<HTMLElement>('p', {
    className: className.MD_SIDE_EMPTY,
  })
  empty.textContent = text
  return empty
}
