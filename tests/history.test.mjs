import test from 'node:test'
import assert from 'node:assert/strict'

const loadHistory = () => import('../src/core/history.ts')

const FILE_A = 'file:///Users/giscafer/Code/bywork/ebook-webgis/README.md'
const FILE_B =
  'file:///Users/giscafer/Code/bywork/ebook-webgis/01.WebGIS%E6%A6%82%E8%BF%B0.md'
const FILE_OTHER = 'file:///Users/giscafer/Code/notes/guide.md'

test('createHistoryItem records file name and parent folder name', async () => {
  const { createHistoryItem, historyLabels } = await loadHistory()
  const item = createHistoryItem(FILE_B)
  const labels = historyLabels(item)

  assert.equal(item.title, '01.WebGIS概述.md')
  assert.equal(item.folder, 'file:///Users/giscafer/Code/bywork/ebook-webgis/')
  assert.equal(labels.title, '01.WebGIS概述.md')
  assert.equal(labels.folder, 'ebook-webgis')
})

test('mergeHistory keeps one entry per parent folder and updates the latest file', async () => {
  const { createHistoryItem, mergeHistory } = await loadHistory()
  const first = createHistoryItem(FILE_A)
  const second = createHistoryItem(FILE_B)
  const other = createHistoryItem(FILE_OTHER)

  const merged = mergeHistory(mergeHistory([first], second), other)

  assert.equal(merged.length, 2)
  assert.equal(merged[0].url, FILE_OTHER)
  assert.equal(merged[1].url, FILE_B)
  assert.equal(merged[1].title, '01.WebGIS概述.md')
})

test('historyLabels still shows names when stored title/folder are missing', async () => {
  const { historyLabels } = await loadHistory()
  const labels = historyLabels({
    url: FILE_A,
    title: '',
    folder: '',
    visitedAt: 1,
  })

  assert.equal(labels.title, 'README.md')
  assert.equal(labels.folder, 'ebook-webgis')
})

test('historyLabels recovers names from a raw URL string', async () => {
  const { historyLabels } = await loadHistory()
  const labels = historyLabels(FILE_A)

  assert.equal(labels.title, 'README.md')
  assert.equal(labels.folder, 'ebook-webgis')
  assert.equal(labels.url, FILE_A)
})

test('normalizeHistory collapses existing same-folder records keeping the newest file', async () => {
  const { createHistoryItem, normalizeHistory } = await loadHistory()
  const older = createHistoryItem(FILE_A)
  const newer = createHistoryItem(FILE_B)
  const other = createHistoryItem(FILE_OTHER)

  const normalized = normalizeHistory([newer, older, other, older])

  assert.equal(normalized.length, 2)
  assert.equal(normalized[0].url, FILE_B)
  assert.equal(normalized[1].url, FILE_OTHER)
})
