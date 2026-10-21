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

### 分节顺序是有意义的，不要随便挪

这套样式大量使用 `!important`，但**真正会冲突的那些规则特异性完全相同**（两边都是三个 class）。这时 `!important` 不解决问题 —— **谁在样式表里靠后谁赢**。

所以「光标所在行」被单独排在**倒数第二节**，这是必需的：

- 它要把文字压成黑色，而**列表的层级灰度**和它是平手的（都是三个 class），必须排在后面才压得住
- **Callout** 那一节排在最后，是为了让 Callout 内部的「光标所在行变浅」压过全局的「变黑」

> **移动任何一节都是行为变更，不是排版调整。**
>
> 具体后果：在 v1.3.0 及更早版本里，**光标停在列表行上时文字不会变黑**（被层级灰压住了），而删除线却能变黑 —— 因为删除线那条是后代选择器（`.cm-line.cm-active .cm-strikethrough`），特异性真的更高。这个"只有一部分生效"的假象，正是顺序问题最难察觉的地方。

### 优先级阶梯（这套插件里最容易出错的地方）

样式里**几乎每条规则都带 `!important`**，所以 `!important` 在这些规则之间**不起任何作用** —— 决定胜负的是**特异性**，特异性相同时才看**先后顺序**。

这一点已经造成过两次真实故障：一个开关静默失效（Callout 的列表着色被全局层级灰压住），以及同一个功能在 Callout 的**列表行**和**段落行**上表现不一样。所以阶梯写在这里，并且**由测试逐条断言**，而不是靠记忆：

| 层级 | 作用 | 选择器 | 特异性 |
|---|---|---|---|
| 1 | 基础行色 | `.cm-s-obsidian .cm-line` | (0,2,0) |
| 2 | 列表层级色 | `.markdown-source-view.mod-cm6 .HyperMD-list-line-N` | (0,3,0) |
| 3 | 光标所在行（列表） | `.cm-line.cm-active.HyperMD-list-line` | (0,3,0) |
| 3 | 光标所在行（段落） | `.cm-line.cm-active:not(…):not(…)` | (0,4,0) |
| 4 | Callout 内列表色 | `.markdown-source-view.mod-cm6 .callout .HyperMD-list-line-N` | (0,4,0) |
| 5 | Callout 内光标行 | `.markdown-source-view.mod-cm6 .callout .cm-line.cm-active:not(…)` | (0,6,0) |

**两条判断原则**：

- **更窄的语境压过更宽的语境** —— Callout 比整篇文档窄，所以 Callout 单独设的值压过全局
- **更短暂的状态压过静止的状态** —— 光标所在行比列表层级更"瞬时"，所以它压过层级灰

**打平**的地方（第 3 层的列表规则与第 2 层都是 (0,3,0)）由分节顺序决定 —— 这就是为什么**分节顺序是行为契约，不是排版**。

**强调的阶梯**：斜体 < 加粗 < **删除线** < 粗斜体。原片段在普通文字和行内代码上用了**两套互相矛盾**的顺序，这里统一成一套：

> 删除线压过单一其它标记，是因为它表示"这段内容已作废"，而它的颜色本来就是刻意做淡的；两个标记的组合压过任何单一标记，因为它更具体。

### 标题**不会**被「光标所在行」影响

「光标所在行文字变黑」和「隐藏删除线」这两项，对标题行**完全不起作用**，而且**没有开关** —— 这是刻意做成不可配置的。

原因值得记下来，因为它踩了三次：

1. 标题的颜色画在 `.cm-header-N` **span** 上，而元素上的显式颜色**优先于从行继承的颜色** —— 所以给**行**上色根本到不了标题文字。原来那个「对标题行生效」开关在接通 span 之前一直是**空转**的，开着也没效果。
2. 为了让它"真的有用"而去打到 span 之后，问题变成了：**改默认值对已有安装无效**。插件每次保存都会把整个设置对象写进 `data.json`，只要那个键存在，`normalizeSettings` 就会沿用存储里的值，默认值只影响**全新安装**。于是"默认关闭"对任何动过设置的人都不生效，升级后标题照样变黑。
3. 把开关留着，就等于把这个失败模式留着。

所以最终**删掉了这个开关和对应的规则**，改成结构上不可能命中：

```css
.cm-line.cm-active.HyperMD-list-line,
.cm-line.cm-active:not(.HyperMD-header):not(.HyperMD-list-line) { color: #000000 !important; }

.cm-line.cm-active:not(.HyperMD-header) .cm-strikethrough, ... { ... }
```

整个小节里**没有任何以标题行为主体的选择器**，只有 `:not(.HyperMD-header)` 的**排除**。删掉开关还有一个附带好处：删除线隐藏以前即使关掉也会作用于标题（半生效，看起来像 bug），现在也一并排除了。

> 这条经验是通用的：**改默认值不能修已有安装**。要让一个已经存在的行为消失，要么做数据迁移，要么把代码删掉。

### 和 CSS 片段一起用会怎样

会**双重叠加**。装了插件并把原来的片段也打开，同一套样式会被应用两次（虽然结果通常看不出来，因为值一样）。

建议：插件调好之后，把 `.obsidian/snippets/` 里对应的片段关掉或删掉。想回退也很简单 —— 在「总览」页点**复制当前生成的 CSS**，粘贴回一个片段即可。

### 安装

把 `main.js`、`manifest.json`、`styles.css` 放进 `<仓库>/.obsidian/plugins/style-toolkit/`，重载后在「设置 → 第三方插件」启用。文件夹名必须与 `manifest.json` 里的 `id` 完全一致。

或用 [BRAT](https://github.com/TfTHacker/obsidian42-brat) → **Add a beta plugin for testing** → 填 `Junlet/style-toolkit`。

> 装好后插件是**默认全开**的，也就是你原来那套片段的外观。想先看看效果再决定，就在「总览」页关掉总开关。

### 依赖

只需要 Obsidian ≥ 1.8.7，不依赖 Canvas、Excalidraw 或任何其它插件。移动端也能用。

除「文本卡片首行文字」这一项外全是纯 CSS。那一项需要读 Canvas 节点，见下面 Canvas 一节。

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

### Canvas 文本卡片的首行文字

文本卡片不是文件，所以缩小时 Obsidian 只画一个居中的图标（`.canvas-icon-placeholder`），没有「文件名」那行字 —— 一整屏缩小的卡片就分不出哪张有内容、哪张是空的。

打开「文本卡片显示首行文字」后，占位里显示卡片**第一行**的文字：

| 设置 | 默认 | 说明 |
|---|---|---|
| 文本卡片显示首行文字 | **关** | 总开关 |
| 文本卡片字号（px） | 24 | 与文件名那一项**互相独立** |
| 首行只显示前几个字 | 0 | **0 = 不限制**（整行）；大于 0 时按字数截断 |
| 文本卡片文字颜色 | 跟随卡片颜色 | 或自定义颜色 / 保持默认 |

规则：

- 取**第一个非空行**，行内连续空白折成一个空格
- 行首的 `#`~`######` 标题标记会去掉（`# 项目计划` → `项目计划`），其余原样保留
- 字数上限拖到 **0** = 不限制，整行交给占位自己的 `overflow: hidden` 裁切；大于 0 时按**码点**把文字截到 N 个 —— 所以 emoji 不会被切成半个，而且截断结果与卡片有多宽无关
- JS 截断**不追加省略号**：省略号会白占一个用户明确要求的字位。占位本身最多显示 3 行，更多行时由 CSS 加省略号
- 有标签时 Obsidian 那个图标会隐藏，免得在很小的框里跟文字抢位置
- 第一行没内容的卡片不加标签，保持 Obsidian 原样

**这一项和别的项不同：它需要 JS。** CSS 读不到元素里的文字；而卡片内容在**缩小时正好被 Obsidian 从 DOM 里摘掉**（内容上屏时占位元素被 `detach()`，缩小时再 `appendChild()` 回来），所以在唯一看得见标签的那一刻，文字已经不在 DOM 里了 —— 只能从 Canvas 节点对象上读，节点始终持有原文。

相关代码在 `src/cardlabel.ts`：`view.canvas.nodes` 拿节点，节点上的 `.text` / `getData()` 取原文，再写进它自己的 `.canvas-node-placeholder`。Canvas 没有公开 API，所以查找是**结构式**的（扫视图自己的属性找那个带节点 Map 的对象），取不到就什么都不做 —— 绝不改坏原有外观，只在控制台留一条提示。

### 左侧竖线：由「最外层列表」的类型决定

紫色竖线**不是逐行按自己那个符号画的**，而是看这一行所属列表的**最外层**是什么：

| 最外层 | 下级是什么 | 竖线 |
|---|---|---|
| 无序 `-` | 无序 / 有序 / 普通段落 / 更深的混合 | **画**，一路延伸到底 |
| 有序 `1.` | 无序 / 有序 / 普通段落 / 更深的混合 | **不画** |

（原来的规则是"这一行自己是不是无序列表"。于是 `-` 里嵌一个 `1.` 会把线打断，`1.` 里嵌一个 `-` 又会冒出一小截孤零零的线。）

**怎么实现的**：实时预览里每一行都是**扁平的兄弟节点**，DOM 里**根本不包含"这一行属于哪个列表"这个信息** —— CSS 只能看出这一行自己的符号类型。所以插件做了一次结构分析：

| 文件 | 做什么 |
|---|---|
| `src/listroot.ts` | 扫描文档文本，逐行算出它所属列表的最外层类型（**纯逻辑，无 DOM、无 Obsidian**，所以可以完整测试） |
| `src/editor.ts` | 用 CodeMirror 的**行装饰**给"最外层是无序"的行加一个 `style-toolkit-ul-root` class |
| `src/css.ts` | 竖线只认这个 class |

阅读视图不需要这么麻烦 —— 那里的嵌套是**真的 DOM**，`:not(ul ul):not(ol ul)` 就能直接表达"最外层"。

> [!warning] 这里依赖 Obsidian 自己那份 CodeMirror
> Obsidian 通过模块注册表把 `@codemirror/view` / `@codemirror/state` 暴露给插件。**必须用它那一份** —— 自己打包一份会因为 `instanceof` 检查失败而直接报错（Obsidian 自己的报错信息就写着 "multiple instances of @codemirror/state are loaded, breaking instanceof checks"）。
>
> 所以插件用 `require` 取它那份，并且 `--packages=external` **不把它打进产物**（已核对：产物里只有 `require("@codemirror/view")`，没有 CM 的代码）。取不到时会退回旧的按符号判断的规则 —— 会断线，但不会没有线 —— 并在控制台记录原因。

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

### Section order is load-bearing

The sheet leans on `!important`, but the rules that actually collide do so at *identical* specificity — three classes on each side — where `!important` settles nothing and the later rule simply wins. That is why the active-line rules sit in their own section second from the end: they have to beat the list-level greys, which tie with them, and the callout section has to come after *them* so the callout-scoped "fade the active line" beats the generic "make it black". In v1.3.0 and earlier the active list line therefore never turned black — while a struck-through line did, because `.cm-line.cm-active .cm-strikethrough` is a descendant selector and genuinely more specific. That "only some of it works" appearance is what makes an ordering bug hard to spot.

Relatedly, heading colours are painted on the `.cm-header-N` *span*, and an explicit colour on an element beats one inherited from its line — so colouring the line could never turn heading text black. That was first "fixed" by targeting the spans, which turned a long-inert option into a visible effect nobody had asked for; the option was then defaulted to off, which did not help either, because **changing a default cannot reach an install that already has the key saved** — the plugin writes the whole settings object on every save, so an existing `data.json` pins the old value. The option and its rules are gone instead: `activeSection` excludes headings with `:not(.HyperMD-header)` and contains no selector whose subject is a heading line, so headings are structurally immune rather than conditionally immune. The same removal also stopped the strikethrough-hiding from reaching headings, which it previously did even with the option off.

**Moving a section is a behaviour change, not a formatting one.**

### The cascade ladder

Nearly every rule here carries `!important`, so importance settles nothing between them: specificity decides, and document order breaks the ties. That has caused two real faults — an option that silently did nothing (the callout list colour lost to the global greyscale), and the same feature behaving differently for list lines and paragraph lines inside a callout. The ladder is therefore written down and asserted in the tests rather than trusted: base line colour (0,2,0) < list level colour (0,3,0) < active line, list (0,3,0) < active line, paragraph (0,4,0) < callout list colour (0,4,0) < active line inside a callout (0,6,0).

Two rules of thumb: **a narrower context outranks a wider one** (a callout is narrower than the document, so its own values win), and **a transient state outranks a resting one** (the line under the caret is more transient than a list level, so it wins). Where two rules genuinely tie — the active list line against the list greyscale, both (0,3,0) — the later section wins, which is why moving a section is a behaviour change rather than a formatting one.

Within emphasis the ladder is italics < bold < strikethrough < bold+italics, and it is the same for plain text and inline code. The original snippets used two contradictory orders for those two cases; strikethrough outranks a single other mark because it means the text is retracted and its colour is deliberately faint, and a two-mark combination outranks any single mark because it is more specific.

### The vertical rule follows the *outermost* list, not the line's own marker

The purple rule is drawn for a line when the list that line ultimately belongs to is rooted in an unordered list — whatever its nested levels are — and not at all when the root is ordered. The previous rule keyed off the line's own marker, so an ordered item nested in an unordered list broke the rule, and an unordered item nested in an ordered list grew a stray segment.

Live Preview makes this awkward: lines are flat siblings and the DOM contains no record of which list a line belongs to. CSS can see a line's own marker kind and nothing more. So the structure is recovered in three steps — `src/listroot.ts` scans the text and decides each line's outermost list kind (pure logic, no DOM, and therefore fully testable), `src/editor.ts` turns that into a CodeMirror line decoration adding a `style-toolkit-ul-root` class, and the stylesheet keys off the class. Reading view needs none of it, because the nesting there is real DOM and `:not(ul ul):not(ol ul)` expresses "outermost" directly.

The CodeMirror modules are taken from Obsidian's own registry at runtime and are deliberately **not bundled**: Obsidian throws on decorations built from a second copy of `@codemirror/state` ("multiple instances ... breaking instanceof checks"). The built file contains `require("@codemirror/view")` and no CodeMirror code. If that registry is ever unavailable, the rule falls back to the old marker-based selectors — broken by nesting, but present — and logs why.

Every other default reproduces the snippet it replaces, so installing changes nothing you were already looking at. Three spots where the original snippets contradicted themselves were unified, and they are listed in the Chinese section above.

`canvas文件名显示大小.css`'s thumbnail-font-size rule was commented out in the source, where canvas-loom had taken it over. It **is** implemented here — with a size, a colour, a follow-the-card-colour option, and background controls — but it **defaults to off**, because it is not currently in effect and enabling it changes how your canvas looks. The "follow the card colour" option works through Obsidian's own `--canvas-color`, which a node carries whether its colour was picked from the six presets, chosen by hand, or never set at all.

Requires Obsidian ≥ 1.8.7 and nothing else — it is pure CSS, with no Canvas, Excalidraw or other plugin dependency, and it works on mobile.

## 许可 / License

MIT
