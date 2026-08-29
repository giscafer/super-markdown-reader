# Super MD Reader Privacy Policy

**Last updated:** 29 August 2026

Super MD Reader is a browser extension that previews Markdown documents in Chrome. This policy describes what data is handled and how.

## Data we handle

The extension stores the following **on your device only** (`chrome.storage.local`):

- Preferences: enable/disable, theme, accent color, language, plugins, layout, sidebar tab
- Reading history: recent Markdown file URLs, file names, folder paths, and visit times (up to 50 folders)

It does **not** create an account, and it does **not** send your files, history, or preferences to Super MD Reader servers.

## How documents are loaded

When you open a Markdown URL, the extension fetches **that same URL** so it can render the file. For a GitHub raw folder, it may request the public GitHub Contents API for the repository path you opened, only to list sibling Markdown files.

Local `file://` documents are read only after you enable **Allow access to file URLs** in Chrome. The extension reads Markdown for display; it does not modify or upload your files.

## What we do not do

- No analytics, advertising, or tracking SDKs
- No sale or transfer of user data
- No use of data to train AI models
- No remote code

## Chrome Web Store Limited Use

This extension complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide Super MD Reader’s core functionality (preview Markdown and remember your settings).

## Contact

- GitHub: https://github.com/giscafer/super-markdown-reader/issues
- Author: Nicky (giscafer)

---

# Super MD Reader 隐私政策

**更新日期：** 2026 年 8 月 29 日

Super MD Reader 是一款在 Chrome 中预览 Markdown 的浏览器扩展。本政策说明扩展如何处理数据。

## 我们处理的数据

扩展仅将以下信息保存在**你的设备本地**（`chrome.storage.local`）：

- 偏好设置：开关、主题、主题色、语言、插件、布局、侧边栏页签
- 阅读历史：最近打开的 Markdown 文件地址、文件名、文件夹路径和访问时间（最多 50 个文件夹）

扩展**不会**创建账号，也**不会**把你的文件、历史或偏好上传到 Super MD Reader 服务器。

## 文档如何加载

打开 Markdown 链接时，扩展会请求**该链接本身**以便渲染。若打开的是 GitHub raw 目录，扩展可能请求公开的 GitHub Contents API，仅用于列出同目录下的 Markdown 文件。

本地 `file://` 文档仅在你于 Chrome 中开启 **允许访问文件网址** 后读取。扩展只读取并展示 Markdown，不会修改或上传文件。

## 我们不会做的事

- 无统计、广告或追踪 SDK
- 不出售或转让用户数据
- 不将数据用于训练 AI 模型
- 不加载远程代码

## Chrome 网上应用店有限使用

本扩展遵守 Chrome 网上应用店用户数据政策（含 Limited Use）。数据仅用于提供 Super MD Reader 的核心功能（预览 Markdown 与记住你的设置）。

## 联系

- GitHub：https://github.com/giscafer/super-markdown-reader/issues
- 作者：Nicky（giscafer）
