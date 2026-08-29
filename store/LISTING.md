# Chrome Web Store listing (copy into the dashboard)

Developer console: https://chrome.google.com/webstore/devconsole

Upload package: `dist/md-reader-3.0.0.zip`

## Product details

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Product name   | Super MD Reader                                                        |
| Category       | Productivity                                                           |
| Language       | English (add Simplified Chinese locale after first save)               |
| Homepage       | https://github.com/giscafer/super-markdown-reader                      |
| Support        | https://github.com/giscafer/super-markdown-reader/issues               |
| Privacy policy | https://github.com/giscafer/super-markdown-reader/blob/main/PRIVACY.md |

Manifest summary (already in the zip): `A markdown reader extension for Chrome.`

## Detailed description (English)

Super MD Reader previews Markdown in your browser. Open a `.md`, `.mdx`, `.mkd`, or `.markdown` file from the web or your computer and read it with themes, a sidebar, and syntax plugins.

**What you can open**

- Online files: `https://example.com/readme.md`
- GitHub raw files: `https://raw.githubusercontent.com/owner/repo/ref/README.md` (the Files tab can list that folder)
- Local files: `file:///…/notes.md` (enable “Allow access to file URLs” in the extension details)

**Features**

- Sidebar: Files, Outline, and History. Open another Markdown file without reloading the page
- History: one recent file per folder; reopen the file or browse the folder
- Plugins: emoji, math (KaTeX), Mermaid, Graphviz/DOT, task lists, footnotes, alerts, and more
- Themes: light / dark / auto, accent colors, and code highlighting
- Shortcuts: Alt+Shift+B (sidebar), C (centered), R (auto-refresh), T (theme)

Super MD Reader only reads Markdown to display it. Settings and history stay on your device.

After install: chrome://extensions → Super MD Reader → Details → turn on “Allow access to file URLs” if you want local files.

## 详细描述（简体中文）

Super MD Reader 可在浏览器中预览 Markdown。打开网上或本地的 `.md`、`.mdx`、`.mkd`、`.markdown` 文件，即可使用主题、侧边栏和语法插件阅读。

**可打开的文档**

- 在线文件：`https://example.com/readme.md`
- GitHub raw 文件：`https://raw.githubusercontent.com/owner/repo/ref/README.md`（「文件」页可列出该目录）
- 本地文件：`file:///…/notes.md`（需在扩展详情中开启「允许访问文件网址」）

**功能**

- 侧边栏：文件、大纲、历史。切换同目录 Markdown 无需整页刷新
- 历史：每个文件夹保留一条最近记录，可重新打开文件或浏览目录
- 插件：表情、数学公式（KaTeX）、Mermaid、Graphviz/DOT、任务列表、脚注、提醒等
- 主题：浅色 / 深色 / 跟随系统、主题色、代码高亮
- 快捷键：Alt+Shift+B（侧边栏）、C（居中）、R（自动刷新）、T（主题）

扩展只读取 Markdown 用于展示。设置和历史保存在本机。

安装后如需预览本地文件：chrome://extensions → Super MD Reader → 详细信息 → 开启「允许访问文件网址」。

## Privacy practices

Single purpose: Preview Markdown documents in the browser.

### Permission justifications

- **activeTab**: Detect that the current tab is a Markdown file so the reader can render it.
- **storage**: Save preferences (theme, language, plugins, layout) and local reading history on the device.
- **offscreen**: Read local `file://` Markdown files and folder listings after the user allows file URL access.
- **Host permission `*://*/*`**: Render Markdown the user opens on any site (for example GitHub raw URLs) and list sibling `.md` files in that folder.
- **Host permission `file://*/*`**: Preview local Markdown files the user opens, only after they enable file URL access.

### Data usage

Check only if you truly collect that type. Recommended answers:

- Personally identifiable information: No
- Health: No
- Financial: No
- Authentication: No
- Personal communications: No
- Location: No
- Web history: Yes — recent Markdown file URLs stored locally so History can reopen them. Not sent to our servers.
- User activity: Yes — theme and layout preferences stored locally.
- Website content: Yes — the Markdown file the user opened is fetched and rendered. Not sent to our servers.

Certify Limited Use. Remote code: No.

### Content rating

Not mature. Suitable for all ages.

### Distribution

Publish in all regions unless you have a reason to restrict.

## Graphic assets (this folder)

| File                   | Use                                |
| ---------------------- | ---------------------------------- |
| `icon-128.png`         | Store icon                         |
| `tile-440x280.png`     | Small promo tile                   |
| `marquee-1400x560.png` | Marquee promo tile (optional)      |
| `screenshot-1.png`     | Screenshot (popup + rendered page) |
| `screenshot-2.png`     | Screenshot (dark theme + outline)  |

Video is optional. You can leave it empty.

## Before you click Publish

1. Pay the one-time $5 Chrome Web Store developer registration if this is a new account.
2. Complete identity verification if the dashboard asks for it.
3. Push `PRIVACY.md` to GitHub so the privacy URL works.
4. Prefer replacing the two screenshots with captures of the current Super MD Reader UI (Files / Outline / History). The generated files are cropped from `example/example-*.png`.
