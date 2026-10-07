# Super MD Reader

<img alt="Super MD Reader Logo" src="https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/src/images/logo-stroke.svg" align="right" width="120">

English | [中文](./README-cn.md) | [한국어](./README-ko.md)

Install from [Super MD Reader](https://chromewebstore.google.com/detail/super-md-reader/hpncdiedfhcnojbljonoboiffpmheflf)


**Super MD Reader** is a browser extension for previewing Markdown documents in your browser.

- **Document Formats**: Preview `file://`, `http://`, and `https://` URLs with `.md`, `.mkd`, `.mdx`, or `.markdown` extensions:
  - `https://example.com/example.md` (online Markdown URL)
  - `https://raw.githubusercontent.com/owner/repo/ref/README.md` (GitHub raw file; the Files tab can list that folder)
  - `file:///Users/my-project/readme.markdown` (local Markdown file, \*[requires specific permissions](#allowing-file-access-permission))
- **Syntax Plugins**: Emoji, superscripts/subscripts, checkboxes, math (KaTeX), Mermaid, Graphviz/DOT (`dot` / `digraph` / `graphviz` fences), TOC, insertions, abbreviations, footnotes, definition lists, and alerts. Code blocks can be copied; images can be zoomed.
- **Themes**: Light / dark / auto page themes, eight accent colors, and code highlighting.
- **Sidebar**: **Files**, **Outline**, and **History** tabs. Browse Markdown files in the current folder (or a GitHub raw folder), open a file on the right without reloading the page, and jump to headings in the outline.
- **History**: One recent record per folder, showing the file name and folder name in the sidebar and popup. Click the file to reopen it, or the folder icon to list sibling Markdown files.
- **Hot Reloading**: Watch local files for changes, with optional centered layout and a raw-source toggle.
- **Languages**: English, Simplified Chinese, Traditional Chinese, Korean, and Ukrainian.
- **Shortcuts**: Toggle sidebar, centered layout, auto-refresh, and theme (`Alt+Shift+B` / `C` / `R` / `T`).

![banner](./example/example-1.png)

The default theme styles are stored in https://github.com/md-reader/theme. If you’d like to view or customize the theme styles, feel free to visit the link and adjust the CSS files as needed.

## Installation

### A. Install from web extension Store

<img src="./src/images/Chrome.png" alt="Chrome" style="width:50px"/>
<img src="./src/images/Edge.png" alt="Edge" style="width:50px"/>
<img src="./src/images/Firefox.png" alt="Firefox" style="width:50px"/>
<img src="./src/images/Arc.png" alt="Arc" style="width:50px"/>

### B. Building installation

Example of Chrome:

1. Clone this repository and build it:

   ```bash
   # Clone this repository
   git clone https://github.com/giscafer/super-markdown-reader.git && cd super-markdown-reader

   # Install dependencies
   pnpm install

   # Build the extension
   pnpm build
   ```

2. After a successful build, the unpacked extension is at `dist/md-reader`.

3. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select the `dist/md-reader` folder. Do this once. Later `pnpm build` or `pnpm dev` updates the same folder. Use `pnpm dev` while coding so the extension reloads automatically.

   Optional: `pnpm zip` still writes `dist/md-reader-x.y.z.zip` if you need a store package.

## Usage

Example of Chrome:

After installation, Chrome is now able to preview online markdown documents. However, it is not able to preview local markdown documents by default and requires enabling file access permission for the Chrome extension.

### Allowing File Access Permission

> Due to security reasons, Chrome by default disables extension access to local files. Therefore, after installing the plugin, you need to manually enable the permission in order to preview local markdown files.

In the Chrome Extensions management page, locate the installed "Super MD Reader" extension, click on "Details", and find the option "Allow access to file URLs" in the details page. Switch it to the enabled state (Please rest assured that "Super MD Reader" only performs read and display operations on markdown files and will not modify or upload user file data).

<br/>

Now all the work is done~!ヾ(◍°∇°◍)ﾉ

Try the effect by opening this online document: [Example Document](https://raw.githubusercontent.com/giscafer/super-markdown-reader/main/example/example.md); You can also try dragging a Markdown document directly into the browser!

Feel free to ask any questions or provide suggestions.

## License

License [MIT](./LICENSE)
