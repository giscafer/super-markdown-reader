import storage from './storage'
import type { HistoryItem } from './data'
import { basename, dirname } from './folder'

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

export async function recordVisit(
  url: string,
  title?: string,
): Promise<HistoryItem[]> {
  const item = createHistoryItem(url, title)
  const data = await storage.get('visitHistory')
  const prev = data.visitHistory || []
  const next = [
    item,
    ...prev.filter(entry => stripHash(entry.url) !== item.url),
  ].slice(0, HISTORY_LIMIT)
  await storage.set('visitHistory', next)
  return next
}

export async function getHistory(): Promise<HistoryItem[]> {
  const data = await storage.get('visitHistory')
  return data.visitHistory || []
}

export async function clearHistory(): Promise<void> {
  await storage.set('visitHistory', [])
}
