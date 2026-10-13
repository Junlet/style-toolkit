/**
 * The settings tabs.
 *
 * Obsidian renders one entry in the settings sidebar per registered
 * `PluginSettingTab`, labelled from `tab.name`. That property is used by the
 * app (it labels the nav item and the search results) but is missing from the
 * published typings, so each tab declares its own.
 *
 * The Overview tab owns the `group*` gates. They are deliberately NOT repeated
 * inside the tabs they gate: two controls bound to one key would drift apart on
 * screen the moment one of them is used.
 */

import { App, PluginSettingTab } from "obsidian";
import type StyleToolkitPlugin from "./main";
import { renderRows, type Row } from "./rows";

/**
 * Shared plumbing: keep the container clean, hand rows to the renderer, and
 * apply the tab label.
 *
 * The label arrives as a constructor argument rather than an abstract property,
 * because a subclass property is not readable from a base constructor.
 */
export abstract class ToolkitTab extends PluginSettingTab {
	protected readonly host: StyleToolkitPlugin;

	constructor(app: App, plugin: StyleToolkitPlugin, name: string) {
		super(app, plugin);
		this.host = plugin;
		// `name` is read by Obsidian -- it labels the settings nav item and the
		// search results -- but it is missing from the published typings.
		(this as unknown as { name: string }).name = name;
	}

	/** The rows to render, rebuilt on every display. */
	protected abstract rows(): Row[];

	display(): void {
		this.containerEl.empty();
		renderRows(this.containerEl, this.rows(), this.host);
	}
}

// -- overview ------------------------------------------------------------

/**
 * Master switch, one gate per section, and the two utility buttons.
 *
 * @returns The rows.
 */
function overviewRows(): Row[] {
	return [
		{
			kind: "note",
			text:
				"这个插件把一组 CSS 片段整合成了可以逐项开关的设置。所有样式都是实时生成的：" +
				"关掉一项，它的规则就完全不输出，不会和主题互相压制。",
		},
		{ kind: "heading", name: "总开关" },
		{
			kind: "toggle",
			key: "masterEnabled",
			name: "启用 Style Toolkit",
			desc: "关掉后本插件不输出任何样式，等于临时停用，但设置会原样保留。",
		},
		{
			kind: "heading",
			name: "分组开关",
			desc: "整组关掉比逐项去关快得多。下面每一组对应一个标签页。",
		},
		{ kind: "toggle", key: "groupText", name: "文字与强调" },
		{ kind: "toggle", key: "groupList", name: "列表" },
		{ kind: "toggle", key: "groupHeading", name: "标题" },
		{ kind: "toggle", key: "groupLink", name: "链接" },
		{ kind: "toggle", key: "groupCallout", name: "Callout" },
		{ kind: "toggle", key: "groupCode", name: "代码块" },
		{ kind: "toggle", key: "groupUi", name: "界面" },
		{ kind: "heading", name: "工具" },
		{
			kind: "button",
			name: "复制当前生成的 CSS",
			desc: "把这一套设置生成的完整样式表复制到剪贴板。想改回用 CSS 片段，或者只想看看它输出了什么，都可以用这个。",
			label: "复制",
			onClick: (host) => host.copyCss(),
		},
		{
			kind: "button",
			name: "全部恢复默认",
			desc: "把每一项都还原成出厂值（也就是你原来那组片段的样子）。",
			label: "恢复默认",
			onClick: (host) => host.resetAll(),
		},
	];
}

// -- text ----------------------------------------------------------------

/**
 * Base text colour, the active line, emphasis, and inline code.
 *
 * @returns The rows.
 */
function textRows(): Row[] {
	return [
		{ kind: "heading", name: "基础文字颜色" },
		{
			kind: "toggle",
			key: "textBaseEnabled",
			name: "统一基础文字颜色",
			desc: "给正文、预览视图和编辑区的普通行一个固定颜色，不再跟着主题走。",
		},
		{ kind: "color", key: "textBaseColor", name: "颜色" },

		{ kind: "heading", name: "光标所在行" },
		{
			kind: "toggle",
			key: "activeLineEnabled",
			name: "光标所在行文字变黑",
			desc: "只作用于编辑模式，方便一眼看出光标在哪一行。",
		},
		{ kind: "color", key: "activeLineColor", name: "变成的颜色" },
		{ kind: "toggle", key: "activeLineList", name: "对列表行生效" },
		{ kind: "toggle", key: "activeLineParagraph", name: "对普通段落生效" },
		{ kind: "toggle", key: "activeLineHeading", name: "对标题行生效" },
		{
			kind: "toggle",
			key: "activeStrikeHideEnabled",
			name: "光标所在行隐藏删除线",
			desc: "在光标所在行把 ~~删除线~~ 的下划线去掉，只留下文字，编辑时不会被划线挡住。",
		},
		{ kind: "color", key: "activeStrikeColor", name: "该行删除线文字的颜色" },

		{ kind: "heading", name: "标题里的删除线" },
		{
			kind: "toggle",
			key: "strikeHeadingGreyEnabled",
			name: "含删除线的标题整行变灰",
			desc: "光标不在这一行时，只要标题里带了删除线，整行标题就变灰，但仍保留划线。",
		},
		{ kind: "color", key: "strikeHeadingGreyColor", name: "变灰的颜色" },

		{ kind: "heading", name: "强调样式" },
		{
			kind: "toggle",
			key: "emphasisEnabled",
			name: "自定义斜体 / 加粗 / 删除线",
			desc: "统一这三种强调的颜色，不再用系统 accent 色。",
		},
		{ kind: "color", key: "emphasisItalicColor", name: "斜体颜色" },
		{
			kind: "toggle",
			key: "emphasisItalicUnslant",
			name: "斜体改用正体显示",
			desc: "保留颜色，但不再倾斜。",
		},
		{ kind: "color", key: "emphasisBoldColor", name: "加粗颜色" },
		{ kind: "color", key: "emphasisStrikeColor", name: "删除线颜色" },
		{ kind: "color", key: "headingStrikeColor", name: "标题内删除线颜色" },

		{ kind: "heading", name: "行内代码" },
		{
			kind: "toggle",
			key: "inlineCodeEnabled",
			name: "自定义行内代码",
			desc: "给 `行内代码` 一个固定底色，并统一它在各种强调组合下的颜色。",
		},
		{ kind: "color", key: "inlineCodeBackground", name: "背景色" },
		{
			kind: "toggle",
			key: "inlineCodeFollowLevel",
			name: "颜色随列表层级",
			desc: "复用「列表」页里的三档灰度，让行内代码和它所在的层级一致。",
		},
		{ kind: "color", key: "inlineCodeEmColor", name: "行内代码 + 斜体" },
		{ kind: "color", key: "inlineCodeStrikeColor", name: "行内代码 + 删除线" },
		{ kind: "color", key: "inlineCodeStrongColor", name: "行内代码 + 加粗" },
	];
}

// -- lists ---------------------------------------------------------------

/**
 * List sizes, greyscale, the unordered rule, markers, and spacing.
 *
 * @returns The rows.
 */
function listRows(): Row[] {
	return [
		{ kind: "heading", name: "层级字号" },
		{
			kind: "toggle",
			key: "listSizeEnabled",
			name: "字号随层级递减",
			desc: "从一级开始每深一层减一点，减到最小值就不再变。",
		},
		{
			kind: "slider",
			key: "listSizeBase",
			name: "一级字号（em）",
			min: 0.5,
			max: 2,
			step: 0.01,
		},
		{
			kind: "slider",
			key: "listSizeStep",
			name: "每级递减（em）",
			min: 0,
			max: 0.3,
			step: 0.01,
		},
		{
			kind: "slider",
			key: "listSizeMin",
			name: "最小字号（em）",
			min: 0.4,
			max: 2,
			step: 0.01,
		},

		{ kind: "heading", name: "层级文字颜色" },
		{ kind: "toggle", key: "listColorEnabled", name: "颜色随层级变淡" },
		{ kind: "color", key: "listColor1", name: "一级颜色" },
		{ kind: "color", key: "listColor2", name: "二级颜色" },
		{ kind: "color", key: "listColor3", name: "三级及以下颜色" },

		{ kind: "heading", name: "无序列表竖线" },
		{
			kind: "toggle",
			key: "ulLineEnabled",
			name: "一级无序列表左侧竖线",
			desc: "在整块一级无序列表左边画一条竖线，代替圆点。只影响无序列表，有序列表保持原样。",
		},
		{ kind: "color", key: "ulLineColor", name: "竖线颜色" },
		{
			kind: "slider",
			key: "ulLineWidth",
			name: "竖线粗细（px）",
			min: 0,
			max: 8,
			step: 0.5,
		},
		{
			kind: "slider",
			key: "ulLinePaddingRead",
			name: "阅读模式左内边距（em）",
			desc: "调小可以让竖线和文字更紧凑。",
			min: 0,
			max: 4,
			step: 0.05,
		},
		{
			kind: "slider",
			key: "ulLinePaddingEdit",
			name: "编辑模式左内边距（em）",
			min: 0,
			max: 4,
			step: 0.05,
		},

		{ kind: "heading", name: "项目符号" },
		{
			kind: "toggle",
			key: "ulMarkerHideEnabled",
			name: "隐藏无序列表符号",
			desc: "阅读模式全部隐藏（改由竖线表示层级）；编辑模式下光标所在行仍会显示，否则没法编辑。",
		},
		{
			kind: "toggle",
			key: "ulMarkerColorEnabled",
			name: "指定无序列表符号颜色",
			desc: "关掉后无序符号会跟着下面有序列表的彩虹色走。",
		},
		{
			kind: "text",
			key: "ulMarkerColor",
			name: "无序列表符号颜色",
			desc: "可以填 #hex，也可以填 var(--text-normal) 这类主题变量。",
			placeholder: "#rrggbb 或 var(--text-normal)",
		},
		{ kind: "toggle", key: "olRainbowEnabled", name: "有序列表符号彩虹色" },
		{ kind: "colorArray", key: "olRainbowColors", index: 0, name: "一级颜色" },
		{ kind: "colorArray", key: "olRainbowColors", index: 1, name: "二级颜色" },
		{ kind: "colorArray", key: "olRainbowColors", index: 2, name: "三级颜色" },
		{ kind: "colorArray", key: "olRainbowColors", index: 3, name: "四级颜色" },

		{ kind: "heading", name: "嵌套缩进" },
		{
			kind: "toggle",
			key: "nestedUlIndentEnabled",
			name: "二级及以上无序列表缩进",
			desc: "阅读模式下给嵌套的无序列表加左内边距，让层级更明显。",
		},
		{
			kind: "slider",
			key: "nestedUlIndent",
			name: "缩进（em）",
			min: 0,
			max: 4,
			step: 0.1,
		},
	];
}

// -- headings and links --------------------------------------------------

/**
 * Heading colours, dashed leaders, the file title, and link decorations.
 *
 * @returns The rows.
 */
function headingRows(): Row[] {
	return [
		{ kind: "heading", name: "标题颜色" },
		{ kind: "toggle", key: "headingColorEnabled", name: "自定义 H1~H6 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 0, name: "H1 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 1, name: "H2 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 2, name: "H3 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 3, name: "H4 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 4, name: "H5 颜色" },
		{ kind: "colorArray", key: "headingColors", index: 5, name: "H6 颜色" },

		{ kind: "heading", name: "标题尾部虚线" },
		{
			kind: "toggle",
			key: "dashEnabled",
			name: "在标题后面画虚线",
			desc: "虚线一直延伸到右边距。H1 默认不画，用来拉开和下级标题的区别。",
		},
		{
			kind: "toggle",
			key: "dashHideOnActive",
			name: "编辑时当前行不画虚线",
			desc: "光标在标题行上时先不画，避免打字时文字跳动。",
		},
		{
			kind: "slider",
			key: "dashGapRatio",
			name: "虚线间距（相对线宽的倍数）",
			desc: "1 表示间隙和线一样长。",
			min: 0.2,
			max: 4,
			step: 0.1,
		},
		{ kind: "boolArray", key: "dashLevels", index: 1, name: "H2 画虚线" },
		{ kind: "boolArray", key: "dashLevels", index: 2, name: "H3 画虚线" },
		{ kind: "boolArray", key: "dashLevels", index: 3, name: "H4 画虚线" },
		{ kind: "boolArray", key: "dashLevels", index: 4, name: "H5 画虚线" },
		{ kind: "boolArray", key: "dashLevels", index: 5, name: "H6 画虚线" },
		{ kind: "colorArray", key: "dashColors", index: 1, name: "H2 虚线颜色" },
		{ kind: "colorArray", key: "dashColors", index: 2, name: "H3 虚线颜色" },
		{ kind: "colorArray", key: "dashColors", index: 3, name: "H4 虚线颜色" },
		{ kind: "colorArray", key: "dashColors", index: 4, name: "H5 虚线颜色" },
		{ kind: "colorArray", key: "dashColors", index: 5, name: "H6 虚线颜色" },
		{
			kind: "numberArray",
			key: "dashThickness",
			index: 1,
			name: "H2 虚线粗细（px）",
			min: 0.5,
			max: 8,
			step: 0.5,
		},
		{
			kind: "numberArray",
			key: "dashThickness",
			index: 2,
			name: "H3 虚线粗细（px）",
			min: 0.5,
			max: 8,
			step: 0.5,
		},
		{
			kind: "numberArray",
			key: "dashThickness",
			index: 3,
			name: "H4 虚线粗细（px）",
			min: 0.5,
			max: 8,
			step: 0.5,
		},
		{
			kind: "numberArray",
			key: "dashThickness",
			index: 4,
			name: "H5 虚线粗细（px）",
			min: 0.5,
			max: 8,
			step: 0.5,
		},
		{
			kind: "numberArray",
			key: "dashThickness",
			index: 5,
			name: "H6 虚线粗细（px）",
			min: 0.5,
			max: 8,
			step: 0.5,
		},

		{ kind: "heading", name: "文件标题" },
		{
			kind: "toggle",
			key: "inlineTitleEnabled",
			name: "自定义文件标题",
			desc: "笔记顶部那行大标题（文件名）。",
		},
		{
			kind: "toggle",
			key: "inlineTitleFollowH1",
			name: "颜色跟随 H1",
			desc: "关掉后可以用下面的颜色单独指定。",
		},
		{ kind: "color", key: "inlineTitleColor", name: "单独指定颜色" },
		{
			kind: "slider",
			key: "inlineTitleSize",
			name: "字号（em）",
			min: 0.8,
			max: 5,
			step: 0.05,
		},
		{ kind: "toggle", key: "inlineTitleBold", name: "加粗" },

		{ kind: "heading", name: "正文链接下划线" },
		{
			kind: "toggle",
			key: "linkUnderlineEnabled",
			name: "统一链接下划线",
			desc: "内部链接和外部链接用同一套细下划线，阅读模式和编辑模式都生效。",
		},
		{
			kind: "dropdown",
			key: "linkUnderlineStyle",
			name: "线型",
			options: [
				{ value: "dashed", label: "虚线" },
				{ value: "solid", label: "实线" },
				{ value: "dotted", label: "点线" },
				{ value: "wavy", label: "波浪线" },
			],
		},
		{
			kind: "slider",
			key: "linkUnderlineThickness",
			name: "粗细（px）",
			min: 0,
			max: 4,
			step: 0.1,
		},
		{
			kind: "slider",
			key: "linkUnderlineOffset",
			name: "与文字的间距（px）",
			min: 0,
			max: 10,
			step: 0.5,
		},

		{ kind: "heading", name: "标题里的链接下划线" },
		{
			kind: "toggle",
			key: "headingLinkEnabled",
			name: "标题内链接单独设置",
			desc: "标题里的链接通常需要更醒目，所以可以比正文更粗、改成实线。",
		},
		{
			kind: "dropdown",
			key: "headingLinkStyle",
			name: "线型",
			options: [
				{ value: "solid", label: "实线" },
				{ value: "dashed", label: "虚线" },
				{ value: "dotted", label: "点线" },
				{ value: "wavy", label: "波浪线" },
			],
		},
		{
			kind: "slider",
			key: "headingLinkThickness",
			name: "粗细（px）",
			min: 0,
			max: 4,
			step: 0.1,
		},
		{
			kind: "slider",
			key: "headingLinkOffset",
			name: "与文字的间距（px）",
			min: 0,
			max: 10,
			step: 0.5,
		},

		{ kind: "heading", name: "编辑时" },
		{
			kind: "toggle",
			key: "activeLinkHideEnabled",
			name: "光标所在行隐藏链接下划线",
			desc: "正在编辑的那一行不画下划线，看起来和普通文字一样。",
		},
	];
}

// -- callouts ------------------------------------------------------------

/**
 * Everything scoped to callouts.
 *
 * @returns The rows.
 */
function calloutRows(): Row[] {
	return [
		{ kind: "heading", name: "文字" },
		{
			kind: "toggle",
			key: "calloutTextEnabled",
			name: "Callout 内文字颜色",
			desc: "只作用于 Callout 内部，不影响正文。",
		},
		{ kind: "color", key: "calloutTextColor", name: "颜色" },

		{ kind: "heading", name: "强调样式" },
		{ kind: "toggle", key: "calloutEmphasisEnabled", name: "Callout 内单独设置强调" },
		{ kind: "color", key: "calloutItalicColor", name: "斜体颜色" },
		{ kind: "toggle", key: "calloutItalicUnslant", name: "斜体改用正体显示" },
		{ kind: "color", key: "calloutBoldColor", name: "加粗颜色" },
		{ kind: "color", key: "calloutStrikeColor", name: "删除线颜色" },

		{ kind: "heading", name: "紧凑与标题" },
		{
			kind: "toggle",
			key: "calloutCompactEnabled",
			name: "紧凑间距",
			desc: "收掉 Callout 的上下外边距、内边距、边框和阴影，一行一个也不占地方。",
		},
		{
			kind: "slider",
			key: "calloutCompactMargin",
			name: "上下外边距（em）",
			min: 0,
			max: 2,
			step: 0.05,
		},
		{
			kind: "slider",
			key: "calloutCompactPadding",
			name: "上下内边距（em）",
			min: 0,
			max: 2,
			step: 0.05,
		},
		{
			kind: "toggle",
			key: "calloutTitleEnabled",
			name: "标题样式",
			desc: "标题行去掉底色，字号压到和正文接近。",
		},
		{
			kind: "text",
			key: "calloutTitleSize",
			name: "标题字号",
			desc: "可以填 var(--h6-size, 0.875em) 这类主题变量或任意 CSS 长度。",
			placeholder: "var(--h6-size, 0.875em)",
		},

		{ kind: "heading", name: "缩放" },
		{
			kind: "toggle",
			key: "calloutZoomEnabled",
			name: "整体缩放",
			desc: "用 CSS zoom 把标题和正文分别缩小，比改字号更省事。",
		},
		{
			kind: "slider",
			key: "calloutZoomTitle",
			name: "标题缩放",
			min: 0.3,
			max: 2,
			step: 0.05,
		},
		{
			kind: "slider",
			key: "calloutZoomContent",
			name: "正文缩放",
			min: 0.3,
			max: 2,
			step: 0.05,
		},

		{ kind: "heading", name: "内部列表灰度" },
		{
			kind: "toggle",
			key: "calloutListColorEnabled",
			name: "Callout 内列表单独着色",
			desc: "阅读模式一二级用外侧色、三级以下用内侧色；编辑模式沿用原片段，所有层级统一用内侧色。",
		},
		{ kind: "color", key: "calloutListColorOuter", name: "外侧（一 / 二级）" },
		{ kind: "color", key: "calloutListColorInner", name: "内侧（三级及以下）" },

		{ kind: "heading", name: "内部行内代码" },
		{ kind: "toggle", key: "calloutCodeColorEnabled", name: "Callout 内行内代码颜色" },
		{ kind: "color", key: "calloutCodeColor", name: "颜色" },

		{ kind: "heading", name: "光标所在行" },
		{
			kind: "toggle",
			key: "calloutActiveStrikeEnabled",
			name: "光标所在行隐藏删除线",
			desc: "Callout 内正在编辑的那一行，去掉删除线并变浅。",
		},
		{ kind: "color", key: "calloutActiveColor", name: "颜色" },
	];
}

// -- code ----------------------------------------------------------------

/**
 * Code block background, sizes, and syntax colours.
 *
 * @returns The rows.
 */
function codeRows(): Row[] {
	return [
		{ kind: "heading", name: "代码块背景" },
		{
			kind: "toggle",
			key: "codeBackgroundEnabled",
			name: "自定义代码块背景色",
			desc: "改写 Obsidian 的 --code-background 变量，编辑模式生效。",
		},
		{ kind: "color", key: "codeBackground", name: "背景色" },
		{
			kind: "toggle",
			key: "codeBackgroundReading",
			name: "同时应用到阅读模式",
			desc: "原片段只改了编辑模式，阅读模式沿用主题默认。",
		},

		{ kind: "heading", name: "字号" },
		{
			kind: "toggle",
			key: "codeBlockFontSizeEnabled",
			name: "代码块字号",
			desc: "直接给代码块本身设字号；Callout 内部恢复继承，不叠加。",
		},
		{
			kind: "slider",
			key: "codeBlockFontSize",
			name: "代码块字号（em）",
			desc: "相对正文字号的倍数。Callout 内部恢复继承，不叠加。",
			min: 0.4,
			max: 1.6,
			step: 0.05,
		},

		{ kind: "heading", name: "语法高亮" },
		{
			kind: "toggle",
			key: "codeTokenEnabled",
			name: "自定义语法高亮颜色",
			desc: "只作用于编辑模式（CodeMirror）里的代码块。",
		},
		{ kind: "color", key: "codeTokenComment", name: "注释" },
		{ kind: "color", key: "codeTokenKeyword", name: "关键字" },
		{ kind: "color", key: "codeTokenString", name: "字符串" },
		{ kind: "color", key: "codeTokenBuiltin", name: "函数 / 内置" },
		{ kind: "color", key: "codeTokenVariable", name: "变量" },
	];
}

// -- interface -----------------------------------------------------------

/**
 * Ribbon, block ids, Canvas, and Kanban.
 *
 * @returns The rows.
 */
function uiRows(): Row[] {
	return [
		{ kind: "heading", name: "左侧功能区" },
		{ kind: "toggle", key: "ribbonWidthEnabled", name: "功能区宽度" },
		{
			kind: "slider",
			key: "ribbonWidth",
			name: "宽度（px）",
			min: 20,
			max: 80,
			step: 1,
		},
		{ kind: "toggle", key: "ribbonIconSizeEnabled", name: "图标大小" },
		{
			kind: "slider",
			key: "ribbonIconSize",
			name: "图标边长（px）",
			min: 10,
			max: 40,
			step: 1,
		},
		{
			kind: "toggle",
			key: "ribbonSpacingEnabled",
			name: "图标上下间距更紧凑",
			desc: "去掉容器间隙并压掉每个按钮的默认高度。",
		},
		{
			kind: "slider",
			key: "ribbonPaddingTop",
			name: "图标上内边距（px）",
			min: 0,
			max: 20,
			step: 1,
		},
		{
			kind: "slider",
			key: "ribbonPaddingBottom",
			name: "图标下内边距（px）",
			min: 0,
			max: 20,
			step: 1,
		},

		{ kind: "heading", name: "块 ID" },
		{
			kind: "toggle",
			key: "blockIdEnabled",
			name: "块 ID 变淡",
			desc: "`^block-id` 平时很不显眼，鼠标移上去才稍微清楚一点。",
		},
		{ kind: "color", key: "blockIdColor", name: "颜色" },
		{
			kind: "slider",
			key: "blockIdOpacity",
			name: "不透明度",
			min: 0,
			max: 1,
			step: 0.05,
		},
		{
			kind: "slider",
			key: "blockIdFontSize",
			name: "字号（em）",
			min: 0.5,
			max: 1.5,
			step: 0.05,
		},
		{ kind: "color", key: "blockIdHoverColor", name: "悬停时的颜色" },
		{
			kind: "slider",
			key: "blockIdHoverOpacity",
			name: "悬停时的不透明度",
			min: 0,
			max: 1,
			step: 0.05,
		},

		{ kind: "heading", name: "侧边栏" },
		{
			kind: "toggle",
			key: "hidePinIconEnabled",
			name: "隐藏已固定标签页的 pin 图标",
		},

		{ kind: "heading", name: "Canvas" },
		{
			kind: "toggle",
			key: "canvasHideMenuEnabled",
			name: "隐藏底部菜单栏",
			desc: "画布左下角那个「添加卡片 / 添加笔记」的浮动菜单。",
		},
		{
			kind: "toggle",
			key: "canvasHideEmbedTitleEnabled",
			name: "隐藏卡片内笔记的标题",
			desc: "画布节点里嵌入的笔记不再显示顶部标题行。",
		},

		{ kind: "heading", name: "Canvas 缩略图文件名" },
		{
			kind: "toggle",
			key: "canvasPlaceholderEnabled",
			name: "自定义缩略图文件名",
			desc:
				"卡片缩小到只显示文件名时那行字的字号与颜色。原片段里这一段是注释掉的" +
				"（注明已由 canvas-loom 接管），所以这里默认关闭：打开会改变外观，" +
				"若 canvas-loom 也开着同类设置，两者会叠加。",
		},
		{
			kind: "slider",
			key: "canvasPlaceholderSize",
			name: "字号（px）",
			desc: "Obsidian 自带的是 32px，原片段里写的是 55px。",
			min: 6,
			max: 200,
			step: 1,
		},
		{
			kind: "dropdown",
			key: "canvasPlaceholderColorMode",
			name: "文字颜色",
			desc:
				"「跟随卡片颜色」读的是 Obsidian 给节点设的 --canvas-color，" +
				"所以预设色、自定义色都能跟上；没设过颜色的卡片用它自己的中性默认值。",
			options: [
				{ value: "follow", label: "跟随卡片颜色" },
				{ value: "custom", label: "自定义颜色" },
				{ value: "inherit", label: "保持默认（不改）" },
			],
		},
		{ kind: "color", key: "canvasPlaceholderColor", name: "自定义文字颜色" },
		{
			kind: "dropdown",
			key: "canvasPlaceholderBgMode",
			name: "背景色",
			desc: "Obsidian 默认会铺一层卡片颜色的 10% 淡色底。",
			options: [
				{ value: "keep", label: "保持默认（不改）" },
				{ value: "follow", label: "跟随卡片颜色（淡色）" },
				{ value: "custom", label: "自定义颜色" },
			],
		},
		{
			kind: "slider",
			key: "canvasPlaceholderBgOpacity",
			name: "淡色底浓度（%）",
			desc: "仅在背景选「跟随卡片颜色（淡色）」时生效。",
			min: 0,
			max: 100,
			step: 1,
		},
		{ kind: "color", key: "canvasPlaceholderBgColor", name: "自定义背景色" },

		{ kind: "heading", name: "Kanban" },
		{
			kind: "toggle",
			key: "kanbanScaleEnabled",
			name: "看板整体缩放",
			desc: "把 Kanban 插件的看板整体缩小，一屏能多看几列。",
		},
		{
			kind: "slider",
			key: "kanbanScale",
			name: "缩放比例",
			min: 0.3,
			max: 1.5,
			step: 0.05,
		},
	];
}

// -- tab classes ---------------------------------------------------------

/** Overview: master switch, section gates, utilities. */
export class OverviewTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "总览");
	}
	protected rows(): Row[] {
		return overviewRows();
	}
}

/** Base text colour, active line, emphasis, inline code. */
export class TextTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "文字与强调");
	}
	protected rows(): Row[] {
		return textRows();
	}
}

/** List sizes, greyscale, the rule, markers, spacing. */
export class ListTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "列表");
	}
	protected rows(): Row[] {
		return listRows();
	}
}

/** Headings, dashed leaders, file title, links. */
export class HeadingTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "标题与链接");
	}
	protected rows(): Row[] {
		return headingRows();
	}
}

/** Everything scoped to callouts. */
export class CalloutTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "Callout");
	}
	protected rows(): Row[] {
		return calloutRows();
	}
}

/** Code block background, sizes, syntax colours. */
export class CodeTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "代码块");
	}
	protected rows(): Row[] {
		return codeRows();
	}
}

/** Ribbon, block ids, Canvas, Kanban. */
export class UiTab extends ToolkitTab {
	constructor(app: App, plugin: StyleToolkitPlugin) {
		super(app, plugin, "界面");
	}
	protected rows(): Row[] {
		return uiRows();
	}
}

/** Every tab, in the order they should appear. */
export const ALL_TABS: ReadonlyArray<
	new (app: App, plugin: StyleToolkitPlugin) => ToolkitTab
> = [
	OverviewTab,
	TextTab,
	ListTab,
	HeadingTab,
	CalloutTab,
	CodeTab,
	UiTab,
];
