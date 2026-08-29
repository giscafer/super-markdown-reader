import type { HistoryItem } from './data'
import { basename, dirname, shortPath } from './folder.ts'

export const HISTORY_LIMIT = 50

export function stripHash(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url.split('#')[0]
  }
}

export function createHistoryItem(url: string, title?: string): HistoryItem {
  const cleanUrl = stripHash(url)
  return {
    url: cleanUrl,
    title: title || basename(cleanUrl),
    folder: dirname(cleanUrl),
    visitedAt: Date.now(),
  }
}

export function resolveHistoryItem(item: unknown): HistoryItem | null {
  if (typeof item === 'string' && item.trim()) {
    return createHistoryItem(item)
  }
  if (!item || typeof item !== 'object') {
    return null
  }
  const rec = item as Record<string, unknown>
  const url = String(rec.url || rec.href || '').trim()
  if (!url) {
    return null
  }
  return {
    url: stripHash(url),
    title: String(rec.title || '') || basename(url),
    folder: String(rec.folder || '') || dirname(url),
    visitedAt: Number(rec.visitedAt) || 0,
  }
}

export function historyLabels(item: unknown): {
  title: string
  folder: string
  url: string
  folderUrl: string
} {
  const resolved = resolveHistoryItem(item)
  const fileUrl = resolved?.url || ''
  const folderUrl = resolved?.folder || dirname(fileUrl)
  return {
    url: fileUrl,
    folderUrl,
    title: resolved?.title || basename(fileUrl) || fileUrl,
    folder: basename(folderUrl) || shortPath(folderUrl) || folderUrl,
  }
}

export function mergeHistory(
  prev: HistoryItem[],
  item: HistoryItem,
): HistoryItem[] {
  const folder = stripHash(item.folder || dirname(item.url))
  return [
    item,
    ...(prev || []).filter(
      entry => stripHash(entry.folder || dirname(entry.url)) !== folder,
    ),
  ].slice(0, HISTORY_LIMIT)
}

export function normalizeHistory(items: unknown): HistoryItem[] {
  const list = Array.isArray(items) ? items : []
  return list.reduceRight((acc, item) => {
    const resolved = resolveHistoryItem(item)
    return resolved ? mergeHistory(acc, resolved) : acc
  }, [] as HistoryItem[])
}

export async function recordVisit(
  url: string,
  title?: string,
): Promise<HistoryItem[]> {
  const storage = (await import('./storage')).default
  const item = createHistoryItem(url, title)
  const data = await storage.get('visitHistory')
  const next = mergeHistory(normalizeHistory(data.visitHistory || []), item)
  await storage.set('visitHistory', next)
  return next
}

export async function getHistory(): Promise<HistoryItem[]> {
  const storage = (await import('./storage')).default
  const data = await storage.get('visitHistory')
  return normalizeHistory(data.visitHistory || [])
}

export async function clearHistory(): Promise<void> {
  const storage = (await import('./storage')).default
  await storage.set('visitHistory', [])
}
