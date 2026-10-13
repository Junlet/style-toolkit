# Style Toolkit

把一堆手写的 CSS 片段整合成一个插件：**每个功能都能单独开关，每个数值都能在设置里调**。

A set of Obsidian CSS snippets, reimplemented as toggleable and adjustable plugin settings.

---

## 中文

### 它做了什么

样式不是写死在 `styles.css` 里的，而是**按你的设置实时生成**，注入到一个 `<style>` 元素里。这带来一个关键区别：

> 关掉一项，它的 CSS 就**完全不输出**，而不是靠另一条 `!important` 去压住它。

关掉插件时整个 `<style>` 会被移除，不留残留。

### 设置页分成 7 个标签页

| 标签页 | 管什么 |
|---|---|
| **总览** | 总开关、7 个分组开关、复制生成的 CSS、全部恢复默认 |
| **文字与强调** | 基础文字颜色、光标所在行、中文斜体/加粗/删除线、行内代码 |
| **列表** | 层级字号与灰度、无序列表竖线、项目符号、间距与缩进 |
| **标题与链接** | H1~H6 颜色、尾部虚线、文件标题、正文与标题内的链接下划线 |
| **Callout** | Callout 内的文字、强调、紧凑间距、缩放、列表灰度、行内代码 |
| **代码块** | 代码块背景、字号、语法高亮配色 |
| **界面** | 左侧功能区、块 ID、pin 图标、Canvas、Kanban 缩放 |

分组开关只在**总览**页出现，不会在对应的标签页里再来一份 —— 两个控件绑同一个值时，改了一个另一个在界面上不会跟着变。

### 原来的 15 个片段去哪了

| 原片段 | 归到 |
|---|---|
| `文字样式层级列表设置.css` | 文字与强调 + 列表 |
| `光标所在删除线隐藏.css` | 文字与强调 |
| `标题渲染更改.css` | 标题与链接 |
| `链接样式.css` | 标题与链接 |
| `callout样式设置.css` | Callout |
| `层级列表竖线.css` | 列表 |
| `测试用.css` | 列表（列表与上方文本的间距） |
| `代码块颜色.css` | 代码块 |
| `代码块字体大小.css` | 代码块 |
| `功能区调整.css` | 界面 |
| `块id颜色变淡.css` | 界面 |
| `隐藏侧边栏pin标志.css` | 界面 |
| `canvas隐藏标题.css` | 界面 |
| `canvas文件名显示大小.css` | 界面（只保留「隐藏底部菜单栏」） |
| `缩小看板.css` | 界面（Kanban） |

> `canvas文件名显示大小.css` 里那条缩略图文件名固定字号的规则本来就是注释掉的，注释说已由 canvas-loom 插件接管，所以**没有实现**。

### 和 CSS 片段一起用会怎样

会**双重叠加**。装了插件并把原来的片段也打开，同一套样式会被应用两次（虽然结果通常看不出来，因为值一样）。

建议：插件调好之后，把 `.obsidian/snippets/` 里对应的片段关掉或删掉。想回退也很简单 —— 在「总览」页点**复制当前生成的 CSS**，粘贴回一个片段即可。

### 安装

把 `main.js`、`manifest.json`、`styles.css` 放进 `<仓库>/.obsidian/plugins/style-toolkit/`，重载后在「设置 → 第三方插件」启用。文件夹名必须与 `manifest.json` 里的 `id` 完全一致。

或用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) → **Add a beta plugin for testing** → 填 `Junlet/style-toolkit`。

> 装好后插件是**默认全开**的，也就是你原来那套片段的外观。想先看看效果再决定，就在「总览」页关掉总开关。

### 依赖

只需要 Obsidian ≥ 1.8.7。纯 CSS，不依赖 Canvas、Excalidraw 或任何其它插件。移动端也能用。

### 三处和原片段不一致的地方

原片段内部有前后矛盾的地方，整合时统一了：

1. **H6 虚线粗细**：阅读模式写的是 1px，实时预览写的是 2px。统一取 **2px**。
2. **行内代码 + 加粗的颜色**：编辑模式是 `#7f7f7f`，阅读模式是 `#595959`。统一取 **`#595959`**。
3. **Callout 内列表灰度**：阅读模式有一二档灰度，编辑模式却把所有层级压成同一个颜色。这一条**没有改**，按原样复刻。

### 怎么确认它输出了什么

「总览」页 → **复制当前生成的 CSS**。剪贴板里就是完整的样式表，可以直接拿去比对或当片段用。

### 开发

```bash
npm install
npm run build     # typecheck + bundle to main.js
npm run dev       # rebuild on change
npm run deploy    # copy the three files into .obsidian/plugins/
npm run ship      # build + deploy
```

源码在 `src/`：`settings.ts`（结构与默认值）、`css.ts`（生成器）、`rows.ts`（声明式设置行）、`tabs.ts`（7 个标签页）、`main.ts`（注入与持久化）。

---

## English

A bundle of fifteen hand-written Obsidian CSS snippets, reimplemented as a plugin whose styling is **generated from your settings** rather than shipped as a static stylesheet. That distinction is what makes the toggles honest: switching a feature off removes its rules outright instead of layering another `!important` rule on top, and disabling the plugin removes the injected `<style>` entirely.

Settings are split across seven tabs — Overview (master switch, seven section gates, copy the generated CSS, reset), Text & emphasis, Lists, Headings & links, Callout, Code, and Interface. Roughly a hundred individual controls; the section gates live only on the Overview tab so that no two controls are ever bound to the same key.

Every default reproduces the snippet it replaces, so installing changes nothing you were already looking at. Three spots where the original snippets contradicted themselves were unified, and they are listed in the Chinese section above. `canvas文件名显示大小.css`'s thumbnail-font-size rule was already commented out in the source (canvas-loom took it over) and is deliberately not implemented.

Requires Obsidian ≥ 1.8.7 and nothing else — it is pure CSS, with no Canvas, Excalidraw or other plugin dependency, and it works on mobile.

## 许可 / License

MIT
