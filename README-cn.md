# Super MD Reader

<img alt="Super MD Reader Logo" src="https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/src/images/logo-stroke.svg" align="right" width="120">

[English](./README.md) | 中文 | [한국어](./README-ko.md)

https://markdown.giscafer.com

**Super MD Reader** 是一款浏览器扩展，能在浏览器中快捷预览 Markdown 文档。

- **文档格式**: 支持预览 `file://`、`http://`、`https://` 协议以及 `.md`、`.mkd`、`.mdx`、`.markdown` 等扩展名的文件:
  - `https://example.com/example.md`（在线 Markdown 链接）
  - `file:///Users/my-project/readme.markdown`（本地 Markdown 文件，[\*需要开启特定权限](#允许本地文件访问权限)）
- **语法插件**: 支持表情符号、上标/下标、复选框、数学公式、流程图、甘特图、目录、插入内容、缩写、注释、提醒等。
- **主题**: 提供高质量的明暗主题、多套主题色和代码高亮功能。
- **实时刷新**: 支持实时文档变更和居中显示，提升阅读体验。
- **文档组织**: 侧边栏可列出当前文件夹内的 Markdown 文件，并保留文档大纲、原始内容预览和图像媒体预览。
- **历史记录**: 弹窗和侧边栏可查看最近浏览的文件，点击即可打开文件或进入当前文件夹内的其他文件。
- **快捷键**: 支持通过浏览器扩展快捷键快速调用功能。

![banner](./example/example-1.png)

默认的主题样式存储在 https://github.com/md-reader/theme 中。如果你想查看或自定义主题样式，可以访问该链接并根据需要调整 CSS 文件。

## 安装

### A. 在浏览器应用商店安装（需要机智上网）

<img src="./src/images/Chrome.png" alt="Chrome" style="width:50px"/>
<img src="./src/images/Edge.png" alt="Edge" style="width:50px"/>
<img src="./src/images/Firefox.png" alt="Firefox" style="width:50px"/>
<img src="./src/images/Arc.png" alt="Arc" style="width:50px"/>

### B. 本地构建

以 Chrome 为例：

1. 克隆本仓库到本地并编译:

   ```bash
   # 克隆本仓库
   git clone https://github.com/giscafer/super-markdown-reader.git && cd super-markdown-reader

   # 安装依赖
   pnpm install

   # 构建扩展程序
   pnpm build
   ```

2. 构建成功后，未打包的扩展目录在 `dist/md-reader`。

3. 打开 `chrome://extensions`，开启 **开发者模式**，点击 **加载已解压的扩展程序**，选择 `dist/md-reader` 文件夹即可。只需选一次。之后 `pnpm build` 或 `pnpm dev` 都会更新同一个目录。日常开发用 `pnpm dev`，扩展会自动热重载。

   如需上传商店，可额外执行 `pnpm zip` 生成 `dist/md-reader-x.y.z.zip`。

## 使用

以 Chrome 为例：

安装完成后，此时 Chrome 已经可以预览在线的 markdown 文档了，但是还不可以预览本地的 markdown 文档，需要开启 Chrome 扩展的文件访问权限。

### 允许本地文件访问权限

> 由于 Chrome 出于安全考虑，默认关闭了扩展程序对本地文件的访问权限，所以在安装完插件后需要手动开启权限，这样就可以正常预览本地 markdown 文件了。

在 Chrome 扩展程序管理页中，找到刚刚安装的 `Super MD Reader`，点击 `详细信息`，在详情页找到 `允许访问文件网址` 选项，然后切换为开启状态即可（请放心：`Super MD Reader` 只对 markdown 文件进行读取和展示的操作，不会修改和上传用户文件数据）。

<br/>

现在所有工作都完成啦~！ヾ(◍°∇°◍)ﾉ

打开这个在线文档试一下效果吧：[示例文档](https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/example/example.md)；你还可以试试直接将 Markdown 文档 **拖进浏览器**！

欢迎提出你的使用问题和建议。

## 协议

License [MIT](./LICENSE)
