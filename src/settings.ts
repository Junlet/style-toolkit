/**
 * Settings for Style Toolkit.
 *
 * Every value in `DEFAULT_SETTINGS` is copied from the CSS snippet it replaces,
 * so installing the plugin reproduces the styling the snippets produced. Turning
 * any single feature off simply stops emitting its rules -- nothing is left
 * behind, because the whole stylesheet is regenerated from these values.
 *
 * The six `group*` switches and `masterEnabled` are gates: when one is off, the
 * generator emits nothing for that whole section, which is a faster way to get
 * back to a stock look than switching off a dozen individual rows.
 */

/** The plugin's persisted settings. */
export interface StyleToolkitSettings {
	/** Which settings shape this data was written with. */
	settingsVersion: number;

	// -- master switches (Overview tab) -----------------------------------
	masterEnabled: boolean;
	groupText: boolean;
	groupList: boolean;
	groupHeading: boolean;
	groupLink: boolean;
	groupCallout: boolean;
	groupCode: boolean;
	groupUi: boolean;

	// -- text and emphasis -------------------------------------------------
	textBaseEnabled: boolean;
	textBaseColor: string;

	activeLineEnabled: boolean;
	activeLineColor: string;
	activeLineList: boolean;
	activeLineParagraph: boolean;
	activeLineHeading: boolean;

	activeStrikeHideEnabled: boolean;
	activeStrikeColor: string;

	strikeHeadingGreyEnabled: boolean;
	strikeHeadingGreyColor: string;

	emphasisEnabled: boolean;
	emphasisItalicColor: string;
	emphasisItalicUnslant: boolean;
	emphasisBoldColor: string;
	emphasisStrikeColor: string;
	headingStrikeColor: string;

	inlineCodeEnabled: boolean;
	inlineCodeBackground: string;
	inlineCodeFollowLevel: boolean;
	inlineCodeEmColor: string;
	inlineCodeStrikeColor: string;
	inlineCodeStrongColor: string;

	// -- lists -------------------------------------------------------------
	listSizeEnabled: boolean;
	listSizeBase: number;
	listSizeStep: number;
	listSizeMin: number;

	listColorEnabled: boolean;
	listColor1: string;
	listColor2: string;
	listColor3: string;

	ulLineEnabled: boolean;
	ulLineColor: string;
	ulLineWidth: number;
	ulLinePaddingRead: number;
	ulLinePaddingEdit: number;

	ulMarkerHideEnabled: boolean;
	ulMarkerColorEnabled: boolean;
	ulMarkerColor: string;

	olRainbowEnabled: boolean;
	olRainbowColors: string[];

	nestedUlIndentEnabled: boolean;
	nestedUlIndent: number;

	// -- headings ----------------------------------------------------------
	headingColorEnabled: boolean;
	headingColors: string[];

	dashEnabled: boolean;
	dashLevels: boolean[];
	dashColors: string[];
	dashThickness: number[];
	dashGapRatio: number;

	inlineTitleEnabled: boolean;
	inlineTitleFollowH1: boolean;
	inlineTitleColor: string;
	inlineTitleSize: number;
	inlineTitleBold: boolean;

	// -- links -------------------------------------------------------------
	linkUnderlineEnabled: boolean;
	linkUnderlineStyle: string;
	linkUnderlineThickness: number;
	linkUnderlineOffset: number;

	headingLinkEnabled: boolean;
	headingLinkStyle: string;
	headingLinkThickness: number;
	headingLinkOffset: number;

	activeLinkHideEnabled: boolean;

	// -- callouts ----------------------------------------------------------
	calloutTextEnabled: boolean;
	calloutTextColor: string;

	calloutEmphasisEnabled: boolean;
	calloutItalicColor: string;
	calloutItalicUnslant: boolean;
	calloutBoldColor: string;
	calloutStrikeColor: string;

	calloutCompactEnabled: boolean;
	calloutCompactMargin: number;
	calloutCompactPadding: number;

	calloutTitleEnabled: boolean;
	calloutTitleSize: string;

	calloutZoomEnabled: boolean;
	calloutZoomTitle: number;
	calloutZoomContent: number;

	calloutListColorEnabled: boolean;
	calloutListColorOuter: string;
	calloutListColorInner: string;

	calloutCodeColorEnabled: boolean;
	calloutCodeColor: string;

	calloutActiveStrikeEnabled: boolean;
	calloutActiveColor: string;

	// -- code blocks -------------------------------------------------------
	codeBackgroundEnabled: boolean;
	codeBackground: string;
	codeBackgroundReading: boolean;

	codeBlockFontSizeEnabled: boolean;
	codeBlockFontSize: number;

	codeTokenEnabled: boolean;
	codeTokenComment: string;
	codeTokenKeyword: string;
	codeTokenString: string;
	codeTokenBuiltin: string;
	codeTokenVariable: string;

	// -- interface ---------------------------------------------------------
	ribbonWidthEnabled: boolean;
	ribbonWidth: number;

	ribbonIconSizeEnabled: boolean;
	ribbonIconSize: number;

	ribbonSpacingEnabled: boolean;
	ribbonPaddingTop: number;
	ribbonPaddingBottom: number;

	blockIdEnabled: boolean;
	blockIdColor: string;
	blockIdOpacity: number;
	blockIdFontSize: number;
	blockIdHoverColor: string;
	blockIdHoverOpacity: number;

	hidePinIconEnabled: boolean;

	canvasHideMenuEnabled: boolean;
	canvasHideEmbedTitleEnabled: boolean;

	/**
	 * Thumbnail file name on a minimised Canvas node.
	 *
	 * Off by default: the snippet this comes from was commented out, so turning
	 * it on is a visible change rather than a reproduction of the current look.
	 */
	canvasPlaceholderEnabled: boolean;
	canvasPlaceholderSize: number;
	/** `follow` | `custom` | `inherit` */
	canvasPlaceholderColorMode: string;
	canvasPlaceholderColor: string;
	/** `keep` | `follow` | `custom` */
	canvasPlaceholderBgMode: string;
	canvasPlaceholderBgOpacity: number;
	canvasPlaceholderBgColor: string;

	kanbanScaleEnabled: boolean;
	kanbanScale: number;
}

/** Bumped when the shape changes in a way that needs migrating. */
export const SETTINGS_VERSION = 1;

/**
 * Everything on, with the snippet values.
 *
 * `masterEnabled` and the six group gates are all true so the plugin looks like
 * the snippets did the moment it is installed.
 */
export const DEFAULT_SETTINGS: StyleToolkitSettings = {
	settingsVersion: SETTINGS_VERSION,

	masterEnabled: true,
	groupText: true,
	groupList: true,
	groupHeading: true,
	groupLink: true,
	groupCallout: true,
	groupCode: true,
	groupUi: true,

	// -- text ------------------------------------------------------------
	textBaseEnabled: true,
	textBaseColor: "#3f3f3f",

	activeLineEnabled: true,
	activeLineColor: "#000000",
	activeLineList: true,
	activeLineParagraph: true,
	activeLineHeading: true,

	activeStrikeHideEnabled: true,
	activeStrikeColor: "#000000",

	strikeHeadingGreyEnabled: true,
	strikeHeadingGreyColor: "#7f7f7f",

	emphasisEnabled: true,
	emphasisItalicColor: "#f79646",
	emphasisItalicUnslant: true,
	emphasisBoldColor: "#3f3f3f",
	emphasisStrikeColor: "#f2f2f2",
	headingStrikeColor: "#d8d8d8",

	inlineCodeEnabled: true,
	inlineCodeBackground: "#f2f2f2",
	inlineCodeFollowLevel: true,
	inlineCodeEmColor: "#f79646",
	inlineCodeStrikeColor: "#f2f2f2",
	inlineCodeStrongColor: "#595959",

	// -- lists -----------------------------------------------------------
	listSizeEnabled: true,
	listSizeBase: 0.95,
	listSizeStep: 0.05,
	listSizeMin: 0.85,

	listColorEnabled: true,
	listColor1: "#3f3f3f",
	listColor2: "#7f7f7f",
	listColor3: "#a5a5a5",

	ulLineEnabled: true,
	ulLineColor: "#9873f7",
	ulLineWidth: 2,
	ulLinePaddingRead: 0.7,
	ulLinePaddingEdit: 1.2,

	ulMarkerHideEnabled: true,
	ulMarkerColorEnabled: true,
	ulMarkerColor: "var(--text-normal)",

	olRainbowEnabled: true,
	olRainbowColors: ["#9bbb59", "#4bacc6", "#9370db", "#bfbfbf"],

	nestedUlIndentEnabled: true,
	nestedUlIndent: 1.5,

	// -- headings --------------------------------------------------------
	headingColorEnabled: true,
	headingColors: [
		"#c0504d",
		"#107c10",
		"#295e87",
		"#298285",
		"#40ba8d",
		"#006b3e",
	],

	dashEnabled: true,
	dashLevels: [false, true, true, true, true, true],
	dashColors: [
		"#c0504d",
		"#107c10",
		"#295e87",
		"#298285",
		"#40ba8d",
		"#d8d8d8",
	],
	dashThickness: [4, 4, 4, 3, 3, 2],
	dashGapRatio: 1,

	inlineTitleEnabled: true,
	inlineTitleFollowH1: true,
	inlineTitleColor: "#c0504d",
	inlineTitleSize: 2,
	inlineTitleBold: true,

	// -- links -----------------------------------------------------------
	linkUnderlineEnabled: true,
	linkUnderlineStyle: "dashed",
	linkUnderlineThickness: 0.5,
	linkUnderlineOffset: 2,

	headingLinkEnabled: true,
	headingLinkStyle: "solid",
	headingLinkThickness: 1,
	headingLinkOffset: 3,

	activeLinkHideEnabled: true,

	// -- callouts --------------------------------------------------------
	calloutTextEnabled: true,
	calloutTextColor: "#3f3f3f",

	calloutEmphasisEnabled: true,
	calloutItalicColor: "#f79646",
	calloutItalicUnslant: true,
	calloutBoldColor: "#3c3c3c",
	calloutStrikeColor: "#f2f2f2",

	calloutCompactEnabled: true,
	calloutCompactMargin: 0.2,
	calloutCompactPadding: 0.1,

	calloutTitleEnabled: true,
	calloutTitleSize: "var(--h6-size, 0.875em)",

	calloutZoomEnabled: true,
	calloutZoomTitle: 0.9,
	calloutZoomContent: 0.85,

	calloutListColorEnabled: true,
	calloutListColorOuter: "#7f7f7f",
	calloutListColorInner: "#3f3f3f",

	calloutCodeColorEnabled: true,
	calloutCodeColor: "#3f3f3f",

	calloutActiveStrikeEnabled: true,
	calloutActiveColor: "#bfbfbf",

	// -- code ------------------------------------------------------------
	codeBackgroundEnabled: true,
	codeBackground: "#f2f2f2",
	codeBackgroundReading: false,

	codeBlockFontSizeEnabled: true,
	codeBlockFontSize: 0.8,

	codeTokenEnabled: true,
	codeTokenComment: "#a5a5a5",
	codeTokenKeyword: "#0000ff",
	codeTokenString: "#a31515",
	codeTokenBuiltin: "#795e26",
	codeTokenVariable: "#7f7f7f",

	// -- interface -------------------------------------------------------
	ribbonWidthEnabled: true,
	ribbonWidth: 35,

	ribbonIconSizeEnabled: true,
	ribbonIconSize: 18,

	ribbonSpacingEnabled: true,
	ribbonPaddingTop: 5,
	ribbonPaddingBottom: 4,

	blockIdEnabled: true,
	blockIdColor: "#9ca3af",
	blockIdOpacity: 0.4,
	blockIdFontSize: 0.85,
	blockIdHoverColor: "#6b7280",
	blockIdHoverOpacity: 0.7,

	hidePinIconEnabled: true,

	canvasHideMenuEnabled: true,
	canvasHideEmbedTitleEnabled: true,

	canvasPlaceholderEnabled: false,
	canvasPlaceholderSize: 55,
	canvasPlaceholderColorMode: "follow",
	canvasPlaceholderColor: "#c0c0c0",
	canvasPlaceholderBgMode: "keep",
	canvasPlaceholderBgOpacity: 10,
	canvasPlaceholderBgColor: "#f2f2f2",

	kanbanScaleEnabled: true,
	kanbanScale: 0.8,
};

// -- validation ----------------------------------------------------------

/** `#rgb`, `#rrggbb`, `#rrggbbaa`, or any `var(--x)` / named colour. */
const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|var\(--[\w-]+\)|[a-z]+)$/i;

const LINK_DECORATIONS = ["dashed", "solid", "dotted", "wavy"];

/**
 * Whether a stored value can be used as a CSS colour.
 *
 * Deliberately permissive: `var(--text-normal)` and bare colour names are
 * allowed, because both appear in the original snippets.
 *
 * @param value - Raw value.
 * @returns True when it is safe to drop into a declaration.
 */
export function isCssColor(value: unknown): value is string {
	return typeof value === "string" && COLOR_PATTERN.test(value.trim());
}

/**
 * Reads a number, clamped and with a non-finite value rejected.
 *
 * @param value - Raw value.
 * @param fallback - Used when the value is unusable.
 * @param min - Lowest acceptable value.
 * @param max - Highest acceptable value.
 * @returns The clamped number.
 */
function number(
	value: unknown,
	fallback: number,
	min: number,
	max: number
): number {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

/**
 * Reads a colour, falling back when the value is unusable.
 *
 * @param value - Raw value.
 * @param fallback - Used when the value is unusable.
 * @returns The colour.
 */
function colour(value: unknown, fallback: string): string {
	return isCssColor(value) ? value.trim() : fallback;
}

/**
 * Reads a boolean.
 *
 * @param value - Raw value.
 * @param fallback - Used when the value is not a boolean.
 * @returns The boolean.
 */
function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

/**
 * Reads an array of colours of an exact length.
 *
 * @param value - Raw value.
 * @param fallback - Used for the whole array when it is unusable.
 * @returns A fresh array of the right length.
 */
function colourArray(value: unknown, fallback: string[]): string[] {
	const source = Array.isArray(value) ? value : [];
	return fallback.map((f, i) => colour(source[i], f));
}

/**
 * Reads an array of numbers of an exact length.
 *
 * @param value - Raw value.
 * @param fallback - Used for the whole array when it is unusable.
 * @param min - Lowest acceptable value.
 * @param max - Highest acceptable value.
 * @returns A fresh array of the right length.
 */
function numberArray(
	value: unknown,
	fallback: number[],
	min: number,
	max: number
): number[] {
	const source = Array.isArray(value) ? value : [];
	return fallback.map((f, i) => number(source[i], f, min, max));
}

/**
 * Reads an array of booleans of an exact length.
 *
 * @param value - Raw value.
 * @param fallback - Used for the whole array when it is unusable.
 * @returns A fresh array of the right length.
 */
function boolArray(value: unknown, fallback: boolean[]): boolean[] {
	const source = Array.isArray(value) ? value : [];
	return fallback.map((f, i) => bool(source[i], f));
}

/** Clamp range per numeric key, so a corrupted file cannot produce broken CSS. */
const NUMBER_RANGES: Record<string, [number, number]> = {
	listSizeBase: [0.5, 2],
	listSizeStep: [0, 0.3],
	listSizeMin: [0.4, 2],
	ulLineWidth: [0, 8],
	ulLinePaddingRead: [0, 4],
	ulLinePaddingEdit: [0, 4],
	nestedUlIndent: [0, 4],
	dashGapRatio: [0.2, 4],
	inlineTitleSize: [0.8, 5],
	linkUnderlineThickness: [0, 4],
	linkUnderlineOffset: [0, 10],
	headingLinkThickness: [0, 4],
	headingLinkOffset: [0, 10],
	calloutCompactMargin: [0, 2],
	calloutCompactPadding: [0, 2],
	calloutZoomTitle: [0.3, 2],
	calloutZoomContent: [0.3, 2],
	codeBlockFontSize: [0.4, 1.6],
	ribbonWidth: [20, 80],
	ribbonIconSize: [10, 40],
	ribbonPaddingTop: [0, 20],
	ribbonPaddingBottom: [0, 20],
	blockIdOpacity: [0, 1],
	blockIdFontSize: [0.5, 1.5],
	blockIdHoverOpacity: [0, 1],
	kanbanScale: [0.3, 1.5],
	canvasPlaceholderSize: [6, 200],
	canvasPlaceholderBgOpacity: [0, 100],
};

/** Allowed values for the placeholder text colour mode. */
export const PLACEHOLDER_COLOR_MODES = ["follow", "custom", "inherit"];

/** Allowed values for the placeholder background mode. */
export const PLACEHOLDER_BG_MODES = ["keep", "follow", "custom"];

/**
 * Merges stored data over the defaults, rejecting unusable values.
 *
 * @param stored - Raw value from `loadData()`.
 * @returns Complete, valid settings.
 */
export function normalizeSettings(
	stored: Partial<StyleToolkitSettings> | null
): StyleToolkitSettings {
	const raw = (stored ?? {}) as Record<string, unknown>;
	const out = Object.assign({}, DEFAULT_SETTINGS) as unknown as Record<
		string,
		unknown
	>;

	// Start from the stored value and fall back per key, so adding a key in a
	// later version cannot leave it undefined for an existing install.
	for (const key of Object.keys(DEFAULT_SETTINGS)) {
		const fallback = (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[
			key
		];
		if (!(key in raw)) continue;

		const value = raw[key];
		if (typeof fallback === "boolean") {
			out[key] = bool(value, fallback);
		} else if (typeof fallback === "number") {
			const range = NUMBER_RANGES[key] ?? [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
			out[key] = number(value, fallback, range[0], range[1]);
		} else if (typeof fallback === "string") {
			out[key] =
				key.toLowerCase().includes("color") ||
				key.startsWith("heading") ||
				key.startsWith("olRainbow")
					? isCssColor(value)
						? (value as string).trim()
						: fallback
					: typeof value === "string"
						? value
						: fallback;
		} else if (Array.isArray(fallback)) {
			if (fallback.every((v) => typeof v === "boolean")) {
				out[key] = boolArray(value, fallback as boolean[]);
			} else if (fallback.every((v) => typeof v === "number")) {
				out[key] = numberArray(value, fallback as number[], 0, 12);
			} else {
				out[key] = colourArray(value, fallback as string[]);
			}
		}
	}

	// Strings that are not colours but still need a whitelist.
	const linkStyles = LINK_DECORATIONS as string[];
	if (!linkStyles.includes(out.linkUnderlineStyle as string)) {
		out.linkUnderlineStyle = DEFAULT_SETTINGS.linkUnderlineStyle;
	}
	if (!linkStyles.includes(out.headingLinkStyle as string)) {
		out.headingLinkStyle = DEFAULT_SETTINGS.headingLinkStyle;
	}
	// These two read as colours to the generic pass above (their names contain
	// "color"), so they need checking against their own value sets.
	if (!PLACEHOLDER_COLOR_MODES.includes(out.canvasPlaceholderColorMode as string)) {
		out.canvasPlaceholderColorMode = DEFAULT_SETTINGS.canvasPlaceholderColorMode;
	}
	if (!PLACEHOLDER_BG_MODES.includes(out.canvasPlaceholderBgMode as string)) {
		out.canvasPlaceholderBgMode = DEFAULT_SETTINGS.canvasPlaceholderBgMode;
	}

	// The base size must stay above the floor, or every level clamps to the
	// same value and the staircase silently disappears.
	if ((out.listSizeBase as number) < (out.listSizeMin as number)) {
		out.listSizeMin = out.listSizeBase as number;
	}

	out.settingsVersion = SETTINGS_VERSION;
	return out as unknown as StyleToolkitSettings;
}
