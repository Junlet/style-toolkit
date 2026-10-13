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
| **列表** | 层级字号与灰度、无序列表竖线、项目符号、嵌套缩进 |
| **标题与链接** | H1~H6 颜色、尾部虚线、文件标题、正文与标题内的链接下划线 |
| **Callout** | Callout 内的文字、强调、紧凑间距、缩放、列表灰度、行内代码 |
| **代码块** | 代码块背景、字号、语法高亮配色 |
| **界面** | 左侧功能区、块 ID、pin 图标、Canvas（含缩略图文件名）、Kanban 缩放 |

分组开关只在**总览**页出现，不会在对应的标签页里再来一份 —— 两个控件绑同一个值时，改了一个另一个在界面上不会跟着变。

### 原来的 15 个片段去哪了

收进插件的有 13 个：

| 原片段 | 归到 |
|---|---|
| `文字样式层级列表设置.css` | 文字与强调 + 列表 |
| `光标所在删除线隐藏.css` | 文字与强调 |
| `标题渲染更改.css` | 标题与链接 |
| `链接样式.css` | 标题与链接 |
| `callout样式设置.css` | Callout |
| `层级列表竖线.css` | 列表 |
| `代码块颜色.css` | 代码块 |
| `功能区调整.css` | 界面 |
| `块id颜色变淡.css` | 界面 |
| `隐藏侧边栏pin标志.css` | 界面 |
| `canvas隐藏标题.css` | 界面 |
| `canvas文件名显示大小.css` | 界面（隐藏底部菜单栏 + Canvas 缩略图文件名） |
| `缩小看板.css` | 界面（Kanban） |

> `canvas文件名显示大小.css` 里那条缩略图文件名固定字号的规则，在原片段中是**注释掉的**（注明已由 canvas-loom 接管）。插件里**实现了它**，但**默认关闭** —— 因为它当前并未生效，打开会改变外观。见下面「Canvas 缩略图文件名」。

### 有 2 个片段刻意没有收录

| 原片段 | 为什么 |
|---|---|
| `测试用.css` | 它给**编辑器行**加了 `margin-top`，会破坏正文的编辑与选中。见下 |
| `代码块字体大小.css` | 它把 Obsidian 的 `--code-size` 改成 `0.5em`，等于把**所有行内代码**缩到一半。代码块字号另有专门的设置项 |

#### 为什么 `测试用.css` 那条会让文字编辑不了

它写的是：

```css
.markdown-source-view.mod-cm6 .HyperMD-list-line:has(...) {
    margin-top: 1em !important;
}
```

CodeMirror 6 靠一张**每行高度的映射表**把鼠标坐标换算成文档位置。这张表由 `ResizeObserver` 观察每个行元素的 **border box** 得来 —— 而 `margin` 在 border box **之外**，永远不会被观察到。

于是每经过一个列表行，映射表算出的累积偏移就比实际少 1em。列表越多、位置越靠下，偏差越大：点击落在相邻行上，选区也跟着错位，表现就是**"有些文字无法编辑和选中"**。

Obsidian 自己是**用 `padding`（`--list-spacing`）做行距**的，不是 margin，正是这个原因。所以插件里不生成任何加在编辑器行上的 `margin`，测试里也有一条专门的断言守着这一点。

> 想要列表上方的间距，请在主题/外观里调 `--list-spacing`，或者干脆不要 —— 用 margin 加间距是行不通的。

### 标题虚线只在「不是你正在编辑的那一行」生效

实时预览里，标题尾部那条虚线需要把所在行变成 flex 容器。这件事**只在光标不在该行时**才做 —— 这个限定是必需的，不是装饰：

一旦行变成 flex 容器，`##` 后面那个**空的**标题 span 就成了一个 flex item，而**空内容的 flex item 不产生行盒**。没有盒子，CodeMirror 就没地方画光标，光标会掉到文字下方。表现就是：**打到第二个 `#` 的瞬间光标跳走，第三个 `#` 打不出来，二级及更深的标题根本没法输入。**

阅读视图不受影响 —— 那里的 `h1`~`h6` 是真正的块级元素，也没有光标。

所以原来那个「编辑时当前行不画虚线」的开关**已经移除**：它不再是可选项，而是编辑器能正常工作的前提。

### 和 CSS 片段一起用会怎样

会**双重叠加**。装了插件并把原来的片段也打开，同一套样式会被应用两次（虽然结果通常看不出来，因为值一样）。

建议：插件调好之后，把 `.obsidian/snippets/` 里对应的片段关掉或删掉。想回退也很简单 —— 在「总览」页点**复制当前生成的 CSS**，粘贴回一个片段即可。

### 安装

把 `main.js`、`manifest.json`、`styles.css` 放进 `<仓库>/.obsidian/plugins/style-toolkit/`，重载后在「设置 → 第三方插件」启用。文件夹名必须与 `manifest.json` 里的 `id` 完全一致。

或用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) → **Add a beta plugin for testing** → 填 `Junlet/style-toolkit`。

> 装好后插件是**默认全开**的，也就是你原来那套片段的外观。想先看看效果再决定，就在「总览」页关掉总开关。

### 依赖

只需要 Obsidian ≥ 1.8.7。纯 CSS，不依赖 Canvas、Excalidraw 或任何其它插件。移动端也能用。

### Canvas 缩略图文件名

卡片缩小到只显示文件名时（`.canvas-node-placeholder`）那行字，可以单独设置。在「界面」页：

| 设置 | 默认 | 说明 |
|---|---|---|
| 自定义缩略图文件名 | **关** | 总开关 |
| 字号（px） | 55 | Obsidian 自带的是 32px，原片段里写的是 55px |
| 文字颜色 | 跟随卡片颜色 | 或自定义颜色 / 保持默认 |
| 背景色 | 保持默认 | 或跟随卡片颜色（淡色）/ 自定义颜色 |
| 淡色底浓度（%） | 10 | 仅在背景选「跟随卡片颜色（淡色）」时生效 |

**「跟随卡片颜色」是怎么实现的**：Obsidian 给有颜色的节点加的是 class（预设色是 `mod-canvas-color-1`~`6`，手选颜色是 `mod-canvas-color-custom` 加一条内联的 `--canvas-color`），这些都会把 `--canvas-color` 设成该卡片的颜色；没设过颜色的卡片则用它写在 `body` 上的中性默认值（浅色主题 `#c0c0c0`、深色 `#7e7e7e`）。

所以一条 `color: var(--canvas-color)` 就同时覆盖了预设色、自定义色和未着色三种情况，不需要把六种预设逐个列出来。

> 默认关闭的原因：原片段里这段是注释掉的，也就是**当前没生效**。而且 canvas-loom 也管这件事 —— 两边都开的话会叠加。

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

A bundle of fifteen hand-written Obsidian CSS snippets, of which **thirteen** are reimplemented here as a plugin whose styling is **generated from your settings** rather than shipped as a static stylesheet. That distinction is what makes the toggles honest: switching a feature off removes its rules outright instead of layering another `!important` rule on top, and disabling the plugin removes the injected `<style>` entirely.

Settings are split across seven tabs — Overview (master switch, seven section gates, copy the generated CSS, reset), Text & emphasis, Lists, Headings & links, Callout, Code, and Interface. Nearly a hundred individual controls; the section gates live only on the Overview tab so that no two controls are ever bound to the same key.

### Two editor-safety rules

- **No vertical margin on an editor line.** `测试用.css` added one, and it breaks editing: CodeMirror's vertical position map comes from a `ResizeObserver` watching each line's *border box*, and a margin sits outside it, so the map is never told the space exists. Every list line makes the computed offset drift by another em — the further down the document, the worse — so clicks land on neighbouring lines and selections come out shifted. Obsidian spaces lines with `padding` (`--list-spacing`) for the same reason.
- **The heading leader only applies to the line you are *not* editing.** Building it needs `display: flex` on the line, and that is scoped to `:not(.cm-active)`. It has to be: an empty heading span inside a flex container generates no line box, so CodeMirror has no box to draw the caret in and it drops below the text — which made H2 and deeper headings impossible to type at all, because the caret fell away the moment the second `#` completed the marker. Reading view is unaffected (`hN` is a real block there). The old "hide the dash while editing" toggle is gone, since it is no longer optional.

Also removed: `代码块字体大小.css`, which set `--code-size: 0.5em` and halved every piece of inline code. Code block sizing is a setting of its own, keeping its current 0.8em default.

Every other default reproduces the snippet it replaces, so installing changes nothing you were already looking at. Three spots where the original snippets contradicted themselves were unified, and they are listed in the Chinese section above.

`canvas文件名显示大小.css`'s thumbnail-font-size rule was commented out in the source, where canvas-loom had taken it over. It **is** implemented here — with a size, a colour, a follow-the-card-colour option, and background controls — but it **defaults to off**, because it is not currently in effect and enabling it changes how your canvas looks. The "follow the card colour" option works through Obsidian's own `--canvas-color`, which a node carries whether its colour was picked from the six presets, chosen by hand, or never set at all.

Requires Obsidian ≥ 1.8.7 and nothing else — it is pure CSS, with no Canvas, Excalidraw or other plugin dependency, and it works on mobile.

## 许可 / License

MIT
