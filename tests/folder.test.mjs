import test from 'node:test'
import assert from 'node:assert/strict'

const loadFolder = () => import('../src/core/folder.ts')

const CHROME_LISTING = `<!DOCTYPE html>
<html><head><title id="title">Index of /Users/giscafer/Code/bywork/ebook-webgis/</title>
<script>
function addRow(name, url, isdir, size, size_string, date_modified, date_modified_string) {}
</script>
</head>
<body>
<h1 id="header">Index of /Users/giscafer/Code/bywork/ebook-webgis/</h1>
<script>addRow("demo","demo",1,224,"224 B",1,"today");</script>
<script>addRow("images","images",1,2368,"2.3 kB",1,"today");</script>
<script>addRow("01.WebGIS概述.md","01.WebGIS%E6%A6%82%E8%BF%B0.md",0,5781,"5.6 kB",1,"today");</script>
<script>addRow("README.md","README.md",0,2942,"2.9 kB",1,"today");</script>
<script>addRow("13.AI篇:ChatGPT在项目开发过程的使用.md","13.AI%E7%AF%87:ChatGPT.md",0,7489,"7.3 kB",1,"today");</script>
<script>addRow("package.json","package.json",0,100,"100 B",1,"today");</script>
</body></html>`

test('parses Chrome file:// directory listings including Chinese names', async () => {
  const { parseDirectoryHtml } = await loadFolder()
  const dir = 'file:///Users/giscafer/Code/bywork/ebook-webgis/'
  const entries = parseDirectoryHtml(CHROME_LISTING, dir)
  const files = entries
    .filter(entry => entry.type === 'file')
    .map(entry => entry.name)
  const dirs = entries
    .filter(entry => entry.type === 'dir')
    .map(entry => entry.name)

  assert.deepEqual(dirs, ['demo', 'images'])
  assert.ok(files.includes('README.md'))
  assert.ok(files.includes('01.WebGIS概述.md'))
  assert.ok(files.includes('13.AI篇:ChatGPT在项目开发过程的使用.md'))
  assert.equal(
    entries.find(entry => entry.name === 'README.md')?.url,
    'file:///Users/giscafer/Code/bywork/ebook-webgis/README.md',
  )
})

test('ignores non-markdown files in directory listings', async () => {
  const { parseDirectoryHtml } = await loadFolder()
  const entries = parseDirectoryHtml(CHROME_LISTING, 'file:///tmp/docs/')
  assert.equal(
    entries.some(entry => entry.name === 'package.json'),
    false,
  )
})

test('treats empty HTML as a listing error instead of an empty folder', async () => {
  const { listingFromHtml } = await loadFolder()
  const result = listingFromHtml('', 'file:///tmp/docs/')
  assert.equal(result.entries.length, 0)
  assert.ok(result.error)
})

test('keeps a real empty Chrome listing as empty, not an error', async () => {
  const { listingFromHtml } = await loadFolder()
  const html = `<title>Index of /tmp/empty/</title><h1>Index of /tmp/empty/</h1>`
  const result = listingFromHtml(html, 'file:///tmp/empty/')
  assert.equal(result.entries.length, 0)
  assert.equal(result.error, undefined)
})

test('builds a same-folder relative URL for in-page file switches', async () => {
  const { relativeUrl } = await loadFolder()
  assert.equal(
    relativeUrl(
      'file:///Users/giscafer/Code/bywork/ebook-webgis/README.md',
      'file:///Users/giscafer/Code/bywork/ebook-webgis/01.WebGIS%E6%A6%82%E8%BF%B0.md',
    ),
    '01.WebGIS%E6%A6%82%E8%BF%B0.md',
  )
  assert.equal(
    relativeUrl(
      'file:///Users/a/docs/README.md',
      'file:///Users/a/notes/guide.md',
    ),
    '../notes/guide.md',
  )
})
