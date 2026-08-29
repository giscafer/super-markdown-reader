import { listingFromHtml, toDirUrl } from '@/core/folder'

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'offscreenListDir') {
    readDirectory(message.data?.url).then(sendResponse)
    return true
  }
  if (message?.action === 'offscreenFetch') {
    fetchText(message.data?.url).then(sendResponse)
    return true
  }
})

async function readDirectory(url?: string) {
  const dir = toDirUrl(url || '')
  try {
    const html = await xhrText(dir)
    return listingFromHtml(html, dir)
  } catch (error) {
    return {
      dir,
      entries: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function fetchText(url?: string) {
  if (!url) {
    return { ok: false, error: 'Fetch error: URL is undefined.' }
  }
  try {
    const text = await xhrText(url, true)
    return { ok: true, text }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function xhrText(url: string, allowEmpty = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.onload = () => {
      const ok =
        request.status === 0 || (request.status >= 200 && request.status < 400)
      const text = request.responseText || ''
      if (ok && (text || allowEmpty)) {
        resolve(text)
        return
      }
      reject(
        new Error(
          text
            ? `HTTP ${request.status}`
            : allowEmpty
            ? `HTTP ${request.status}`
            : 'Empty directory listing',
        ),
      )
    }
    request.onerror = () => reject(new Error('Request failed'))
    request.open('GET', url)
    request.send()
  })
}
