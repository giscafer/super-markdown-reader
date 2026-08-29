import storage from '@/core/storage'
import commands from '@/core/commands'
import { listDirectory, toDirUrl, type FolderListResult } from '@/core/folder'

const ASYNC_ACTIONS = new Set(['storage', 'fetch', 'listDir'])

chrome.runtime.onMessage.addListener((message, sender, callback) => {
  const action = message?.action
  // Offscreen document owns these; claiming them here steals the response.
  if (action === 'offscreenListDir' || action === 'offscreenFetch') {
    return
  }
  if (!ASYNC_ACTIONS.has(action)) {
    return
  }
  messageHandler(action, message?.data, sender, callback)
  return true
})

async function messageHandler(
  action: string,
  data: any,
  sender: chrome.runtime.MessageSender,
  callback?: (response?: any) => void,
) {
  switch (action) {
    case 'storage':
      await storage.set({ [data.key]: data.value })
      updatePage(data.key, data.value)
      callback?.(data)
      break
    case 'fetch':
      fetchData(data?.url || sender.url).then(callback)
      break
    case 'listDir':
      listLocalDirectory(data.url).then(callback)
      break
  }
}

async function listLocalDirectory(url: string): Promise<FolderListResult> {
  const dir = toDirUrl(url)
  if (dir.startsWith('file:')) {
    const allowed = await isFileSchemeAllowed()
    if (!allowed) {
      return { dir, entries: [], error: 'file_access' }
    }
  }

  const result = await listDirectory(dir)
  if (result.error && dir.startsWith('file:')) {
    const fallback = await listViaOffscreen(dir)
    if (fallback && (!fallback.error || fallback.entries.length)) {
      return fallback
    }
  }
  return result
}

function isFileSchemeAllowed(): Promise<boolean> {
  return new Promise(resolve => {
    if (!chrome.extension?.isAllowedFileSchemeAccess) {
      resolve(true)
      return
    }
    chrome.extension.isAllowedFileSchemeAccess(resolve)
  })
}

async function listViaOffscreen(dir: string): Promise<FolderListResult | null> {
  const offscreen = (chrome as any).offscreen
  if (!offscreen?.createDocument) {
    return null
  }
  try {
    await ensureOffscreenDocument()
    let lastError = ''
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const result = await chrome.runtime.sendMessage({
          action: 'offscreenListDir',
          data: { url: dir },
        })
        if (result) {
          return result
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    return lastError ? { dir, entries: [], error: lastError } : null
  } catch (error) {
    return {
      dir,
      entries: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function fetchViaOffscreen(
  url: string,
): Promise<{ ok: boolean; text?: string; error?: string } | null> {
  const offscreen = (chrome as any).offscreen
  if (!offscreen?.createDocument) {
    return null
  }
  try {
    await ensureOffscreenDocument()
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const result = await chrome.runtime.sendMessage({
          action: 'offscreenFetch',
          data: { url },
        })
        if (result) {
          return result
        }
      } catch {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    return null
  } catch {
    return null
  }
}

async function ensureOffscreenDocument() {
  const offscreen = (chrome as any).offscreen
  try {
    const contexts = await (chrome.runtime as any).getContexts?.({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    })
    if (contexts?.length) {
      return
    }
  } catch {
    // Chrome < 116 does not have getContexts; createDocument will throw if it exists.
  }
  try {
    await offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification:
        'Read local folder listings and markdown files for soft navigation',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/already exists|only one offscreen/i.test(message)) {
      throw error
    }
  }
}

/** Returns markdown text, or null when fetch failed (never an error string). */
async function fetchData(url?: string): Promise<string | null> {
  if (!url) {
    console.error(new Error('Fetch error: URL is undefined.'))
    return null
  }

  try {
    const res = await fetch(url)
    // file:// often reports status 0; treat that as success when body is readable.
    if (!res.ok && res.status !== 0) {
      throw new Error(`HTTP ${res.status}`)
    }
    return await res.text()
  } catch (err) {
    console.error(err)
    if (url.startsWith('file:')) {
      const fallback = await fetchViaOffscreen(url)
      if (fallback?.ok && typeof fallback.text === 'string') {
        return fallback.text
      }
    }
    return null
  }
}

// Chrome extension shortcuts
chrome.commands.onCommand.addListener(action => {
  commands[action]?.(messageHandler)
})

const actionMap = {
  enable: 'reload',
  refresh: 'toggleRefresh',
  centered: 'toggleCentered',
  mdPlugins: 'updateMdPlugins',
  pageTheme: 'updatePageTheme',
  colorTheme: 'updateColorTheme',
  hiddenSide: 'toggleSide',
}

function updatePage(key: keyof typeof actionMap, value?: any) {
  const action = actionMap[key]
  action &&
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      tabs.length &&
        chrome.tabs.sendMessage(tabs[0].id, { action, data: { key, value } })
    })
}

chrome.runtime.setUninstallURL(
  'https://github.com/giscafer/super-markdown-reader/issues',
)
