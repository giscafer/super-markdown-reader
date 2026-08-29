export const MD_FILE_RE = /\.(md|mdx|mkd|markdown)$/i

export interface FolderEntry {
  name: string
  url: string
  type: 'file' | 'dir'
}

export interface FolderListResult {
  dir: string
  entries: FolderEntry[]
  error?: string
}

export function relativeUrl(fromUrl: string, toUrl: string): string {
  try {
    const from = new URL(fromUrl)
    const to = new URL(toUrl)
    if (from.protocol !== to.protocol || from.host !== to.host) {
      return to.href
    }
    const fromParts = from.pathname.split('/').filter(Boolean)
    if (!from.pathname.endsWith('/')) {
      fromParts.pop()
    }
    const toParts = to.pathname.split('/').filter(Boolean)
    const file = toParts.pop() || ''
    let i = 0
    while (
      i < fromParts.length &&
      i < toParts.length &&
      fromParts[i] === toParts[i]
    ) {
      i++
    }
    const rel = `${'../'.repeat(fromParts.length - i)}${[
      ...toParts.slice(i),
      file,
    ].join('/')}`
    return `${rel || file}${to.search}${to.hash}`
  } catch {
    return toUrl
  }
}

export function stripHashSafe(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url.split('#')[0]
  }
}

export function toDirUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.search = ''
    if (MD_FILE_RE.test(parsed.pathname)) {
      return dirname(url)
    }
    if (!parsed.pathname.endsWith('/')) {
      parsed.pathname += '/'
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export function dirname(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.search = ''
    if (!parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/[^/]+$/, '')
    }
    if (!parsed.pathname.endsWith('/')) {
      parsed.pathname += '/'
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export function basename(url: string): string {
  try {
    const name = new URL(url).pathname.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(name)
  } catch {
    return url
  }
}

export function shortPath(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url).pathname).replace(/\/$/, '')
    const parts = path.split('/').filter(Boolean)
    if (parts.length <= 3) {
      return parts.join('/') || '/'
    }
    return parts.slice(-3).join('/')
  } catch {
    return url
  }
}

export function parseGithubRaw(
  url: string,
): { owner: string; repo: string; ref: string; path: string } | null {
  const matched = url.match(
    /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/?(.*)$/,
  )
  if (!matched) {
    return null
  }
  return {
    owner: matched[1],
    repo: matched[2],
    ref: matched[3],
    path: matched[4] || '',
  }
}

export function parentDir(dirUrl: string): string | null {
  const github = parseGithubRaw(dirUrl)
  if (github) {
    const parts = github.path.replace(/\/$/, '').split('/').filter(Boolean)
    if (!parts.length) {
      return null
    }
    parts.pop()
    const rest = parts.length ? `${parts.join('/')}/` : ''
    return `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.ref}/${rest}`
  }

  try {
    const parsed = new URL(dirUrl)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (!parts.length) {
      return null
    }
    parts.pop()
    parsed.pathname = `/${parts.length ? `${parts.join('/')}/` : ''}`
    parsed.hash = ''
    parsed.search = ''
    return parsed.toString()
  } catch {
    return null
  }
}

export function resolveListingUrl(base: string, href: string): string {
  try {
    const root = base.endsWith('/') ? base : `${base}/`
    return new URL(href, root).toString()
  } catch {
    return href
  }
}

function resolveUrl(base: string, href: string): string {
  return resolveListingUrl(base, href)
}

function unescapeJsString(value: string): string {
  return value.replace(/\\(.)/g, '$1')
}

function shouldSkipName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed || trimmed === '.' || trimmed === '..') {
    return true
  }
  if (/^parent directory$/i.test(trimmed)) {
    return true
  }
  if (trimmed.startsWith('?')) {
    return true
  }
  return false
}

function toEntry(
  name: string,
  url: string,
  type: FolderEntry['type'],
): FolderEntry | null {
  const cleanName = name.replace(/\/$/, '').trim()
  if (shouldSkipName(cleanName)) {
    return null
  }
  if (type === 'file' && !MD_FILE_RE.test(cleanName)) {
    return null
  }
  let entryUrl = url
  if (type === 'dir' && !entryUrl.endsWith('/')) {
    entryUrl += '/'
  }
  return { name: cleanName, url: entryUrl, type }
}

function collect(map: Map<string, FolderEntry>, entry: FolderEntry | null) {
  if (!entry) {
    return
  }
  const key = `${entry.type}:${entry.name}`
  if (!map.has(key)) {
    map.set(key, entry)
  }
}

export function isDirectoryListingHtml(html: string): boolean {
  if (!html) {
    return false
  }
  return (
    /addRow\s*\(\s*"/i.test(html) ||
    /<h1[^>]*>\s*Index of\s+/i.test(html) ||
    /<title[^>]*>\s*Index of\s+/i.test(html)
  )
}

export function listingFromHtml(
  html: string,
  dirUrl: string,
): FolderListResult {
  const entries = parseDirectoryHtml(html, dirUrl)
  if (entries.length) {
    return { dir: dirUrl, entries }
  }
  if (isDirectoryListingHtml(html)) {
    return { dir: dirUrl, entries: [] }
  }
  return {
    dir: dirUrl,
    entries: [],
    error: html?.trim()
      ? 'Unable to parse directory listing'
      : 'Empty directory listing',
  }
}

export function parseDirectoryHtml(
  html: string,
  dirUrl: string,
): FolderEntry[] {
  const map = new Map<string, FolderEntry>()
  const addRowRe =
    /addRow\("((?:\\.|[^"\\])*)","((?:\\.|[^"\\])*)",(0|1|true|false)/gi

  for (const match of html.matchAll(addRowRe)) {
    const name = unescapeJsString(match[1])
    const href = unescapeJsString(match[2])
    const isDir = match[3] === '1' || match[3] === 'true'
    collect(
      map,
      toEntry(name, resolveUrl(dirUrl, href), isDir ? 'dir' : 'file'),
    )
  }

  const anchorRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  for (const match of html.matchAll(anchorRe)) {
    const href = match[1].trim()
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('?')
    ) {
      continue
    }
    const label = (match[2] || '').replace(/\/$/, '').trim() || basename(href)
    const looksLikeFile = MD_FILE_RE.test(label) || MD_FILE_RE.test(href)
    const looksLikeDir =
      href.endsWith('/') ||
      /\/$/.test(match[2] || '') ||
      (!looksLikeFile && !/\.[a-z0-9]{1,8}(?:\?.*)?$/i.test(label))
    collect(
      map,
      toEntry(
        label || basename(href),
        resolveUrl(dirUrl, href),
        looksLikeDir ? 'dir' : 'file',
      ),
    )
  }

  return sortEntries([...map.values()])
}

function sortEntries(entries: FolderEntry[]): FolderEntry[] {
  return entries.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

async function listGithub(dirUrl: string): Promise<FolderListResult> {
  const github = parseGithubRaw(dirUrl)
  if (!github) {
    return { dir: dirUrl, entries: [], error: 'Not a GitHub raw URL' }
  }

  const path = github.path.replace(/\/$/, '')
  const apiUrl = `https://api.github.com/repos/${github.owner}/${
    github.repo
  }/contents/${path}?ref=${encodeURIComponent(github.ref)}`

  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) {
      return {
        dir: dirUrl,
        entries: [],
        error: `GitHub API ${response.status}`,
      }
    }
    const payload = await response.json()
    const items = Array.isArray(payload) ? payload : []
    const entries = sortEntries(
      items
        .map(
          (item: { name?: string; type?: string; download_url?: string }) => {
            if (!item?.name) {
              return null
            }
            if (item.type === 'dir') {
              const childPath = path ? `${path}/${item.name}` : item.name
              return toEntry(
                item.name,
                `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.ref}/${childPath}/`,
                'dir',
              )
            }
            if (item.type === 'file' && MD_FILE_RE.test(item.name)) {
              return toEntry(
                item.name,
                item.download_url ||
                  `https://raw.githubusercontent.com/${github.owner}/${
                    github.repo
                  }/${github.ref}/${path ? `${path}/` : ''}${item.name}`,
                'file',
              )
            }
            return null
          },
        )
        .filter(Boolean) as FolderEntry[],
    )
    return { dir: dirUrl, entries }
  } catch (error) {
    return {
      dir: dirUrl,
      entries: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function listHtmlDirectory(dirUrl: string): Promise<FolderListResult> {
  try {
    const response = await fetch(dirUrl)
    if (!response.ok) {
      return {
        dir: dirUrl,
        entries: [],
        error: `HTTP ${response.status}`,
      }
    }
    const html = await response.text()
    return listingFromHtml(html, dirUrl)
  } catch (error) {
    return {
      dir: dirUrl,
      entries: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function listDirectory(dirUrl: string): Promise<FolderListResult> {
  const normalized = toDirUrl(dirUrl)
  if (parseGithubRaw(normalized)) {
    return listGithub(normalized)
  }
  return listHtmlDirectory(normalized)
}
