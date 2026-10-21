/**
 * Text shaping for the labels drawn on shrunk Canvas nodes.
 *
 * Kept separate from `cardlabel.ts` so the counting rules -- the part that is
 * easy to get subtly wrong and easy to test without Obsidian -- can be checked
 * on their own.
 *
 * WHY WIDTH AND NOT JUST CHARACTER COUNT
 * --------------------------------------
 * A CJK character occupies roughly twice the width of a Latin one, so "limit
 * to 10 characters" produces wildly different labels: ten Latin characters fill
 * a card that five Chinese characters already fill. Counting **half-width
 * units** (CJK and other wide code points = 2, everything else = 1) makes the
 * limit mean a visual width rather than a raw length, which is what makes a row
 * of shrunk cards look even. A plain character count is still offered, because
 * for pure-CJK names it is the more intuitive unit.
 */

/**
 * Whether a code point occupies a full-width (double) cell.
 *
 * An approximation of Unicode's East Asian Width property ("W" and "F"): the
 * ranges that actually show up in note and drawing names -- CJK ideographs and
 * punctuation, kana, Hangul, full-width forms, the CJK extension planes, and
 * emoji -- without dragging in a full width table.
 *
 * @param codePoint - The code point to classify.
 * @returns True when the character is double-width.
 */
export function isWideCodePoint(codePoint: number): boolean {
	if (codePoint >= 0x1100 && codePoint <= 0x115f) return true; // Hangul Jamo
	if (codePoint >= 0x2e80 && codePoint <= 0x303e) return true; // CJK radicals, symbols, punctuation
	if (codePoint >= 0x3041 && codePoint <= 0x33ff) return true; // kana, Bopomofo, CJK compatibility
	if (codePoint >= 0x3400 && codePoint <= 0x4dbf) return true; // CJK extension A
	if (codePoint >= 0x4e00 && codePoint <= 0x9fff) return true; // CJK unified ideographs
	if (codePoint >= 0xa000 && codePoint <= 0xa4cf) return true; // Yi
	if (codePoint >= 0xa960 && codePoint <= 0xa97f) return true; // Hangul Jamo extended A
	if (codePoint >= 0xac00 && codePoint <= 0xd7a3) return true; // Hangul syllables
	if (codePoint >= 0xf900 && codePoint <= 0xfaff) return true; // CJK compatibility ideographs
	if (codePoint >= 0xfe10 && codePoint <= 0xfe19) return true; // vertical forms
	if (codePoint >= 0xfe30 && codePoint <= 0xfe6f) return true; // CJK compatibility forms
	if (codePoint >= 0xff00 && codePoint <= 0xff60) return true; // full-width forms
	if (codePoint >= 0xffe0 && codePoint <= 0xffe6) return true; // full-width signs
	if (codePoint >= 0x1f300 && codePoint <= 0x1f64f) return true; // emoji (pictographs, emoticons)
	if (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) return true; // transport emoji
	if (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) return true; // supplemental emoji
	if (codePoint >= 0x20000 && codePoint <= 0x3fffd) return true; // CJK extensions B and beyond
	return false;
}

/**
 * Width of one code point in half-width units.
 *
 * @param codePoint - The code point to measure.
 * @returns 2 for a full-width character, 1 otherwise.
 */
export function charWidth(codePoint: number): number {
	return isWideCodePoint(codePoint) ? 2 : 1;
}

/** Allowed values for the counting rule. */
export const COUNT_MODES = ["width", "chars"];

/**
 * Shortens text so it fits a width or character budget.
 *
 * Iterates code points, never UTF-16 units, so an emoji is kept or dropped
 * whole instead of being cut into half a surrogate pair.
 *
 * At least one character is always kept, even when a single character is wider
 * than the whole budget: a limit of 1 should show the first character, not
 * blank the label.
 *
 * No ellipsis is appended -- it would consume part of the budget the caller
 * asked for. The label's own `overflow: hidden` handles anything still too
 * wide to render.
 *
 * @param text - Text to shorten.
 * @param limit - Budget in the chosen unit; `0` or negative means "no limit".
 * @param countMode - `"chars"` to count code points; anything else counts
 *   half-width units (`"width"`).
 * @returns The text, shortened if it exceeded the budget.
 */
export function truncateText(
	text: string,
	limit: number,
	countMode: string
): string {
	if (!(limit > 0)) return text;
	const characters = Array.from(text);
	if (countMode === "chars") {
		return characters.length <= limit
			? text
			: characters.slice(0, limit).join("");
	}

	let width = 0;
	let kept = 0;
	for (const character of characters) {
		const step = charWidth(character.codePointAt(0) ?? 0);
		if (kept > 0 && width + step > limit) break;
		width += step;
		kept += 1;
	}
	return kept === characters.length ? text : characters.slice(0, kept).join("");
}

/**
 * Parses the user's suffix list.
 *
 * Commas and whitespace both separate entries, so `.excalidraw.md, .excalidraw`
 * and `.excalidraw.md .excalidraw` mean the same thing. Matching is
 * case-insensitive, so entries are folded here once.
 *
 * @param raw - Whatever the user typed.
 * @returns Lower-cased, de-duplicated, non-empty entries.
 */
export function parseSuffixList(raw: string): string[] {
	const seen = new Set<string>();
	for (const part of raw.split(/[,\s]+/u)) {
		const entry = part.trim().toLowerCase();
		if (entry.length > 0) seen.add(entry);
	}
	return [...seen];
}

/**
 * Removes matching suffixes from the end of a name, repeatedly.
 *
 * Repeats so a name carrying several of them is fully cleaned:
 * `图.excalidraw.excalidraw` loses both. A suffix that would consume the whole
 * name is left alone -- better to show `.excalidraw` than a blank label.
 *
 * Only the **end** is touched: the request is about extensions, and trimming
 * matching text out of the middle of a name would mangle real titles.
 *
 * @param name - Display name, as Obsidian produced it.
 * @param suffixes - Lower-cased entries from {@link parseSuffixList}.
 * @returns The name without trailing suffixes.
 */
export function stripSuffixes(name: string, suffixes: string[]): string {
	if (suffixes.length === 0) return name;
	let result = name;
	for (;;) {
		const lower = result.toLowerCase();
		const match = suffixes.find(
			(suffix) => lower.endsWith(suffix) && lower.length > suffix.length
		);
		if (!match) return result;
		result = result.slice(0, result.length - match.length);
	}
}

/** How a file name is turned into a label. */
export interface FileNameLabelOptions {
	/** Width or character budget; `0` means unlimited. */
	maxWidth: number;
	/** `"width"` or `"chars"`; see {@link truncateText}. */
	countMode: string;
	/** Suffixes to hide, already parsed by {@link parseSuffixList}. */
	suffixes: string[];
}

/**
 * Turns an Obsidian-provided file name into what the placeholder should show.
 *
 * Suffixes are removed before the length budget is applied, so the budget is
 * never spent on a suffix the user asked to hide.
 *
 * @param name - The name Obsidian put in the placeholder.
 * @param options - The current settings.
 * @returns The text to display.
 */
export function displayFileName(
	name: string,
	options: FileNameLabelOptions
): string {
	return truncateText(
		stripSuffixes(name, options.suffixes),
		options.maxWidth,
		options.countMode
	);
}

// -- text-card labels ------------------------------------------------------

/**
 * Which Markdown syntax to strip from a text card's first line.
 *
 * A card holds Markdown, but the label sits where a file name would, so syntax
 * that Markdown *renders* as formatting reads as garbage there: a card starting
 * with a list item and bold text would be labelled `* **初代` instead of `初代`.
 */
export interface LabelFilters {
	/** Heading, list, quote and task markers, plus emphasis/code runs. */
	markdown: boolean;
	/** Link and embed syntax, keeping the text that would have been visible. */
	links: boolean;
	/** `#tag` references. */
	tags: boolean;
}

/** Everything needed to turn a card's source into label text. */
export interface TextLabelOptions {
	/** Budget; `0` means "no limit". */
	maxChars: number;
	/** `"width"` or `"chars"`; see {@link truncateText}. */
	countMode: string;
	/** Which syntax to strip; see {@link LabelFilters}. */
	filters: LabelFilters;
}

/**
 * Leading block markers: blockquote, heading, bullet, ordered list, task box.
 *
 * Applied repeatedly from the start, so a card written as `> - # 标题` loses the
 * whole prefix rather than just the first marker.
 */
const BLOCK_MARKERS =
	/^(?:>[ \t]*|#{1,6}[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+|\[[ xX]\](?:[ \t]+|$))+/u;

/**
 * Removes Markdown emphasis, code, strikethrough and highlight runs.
 *
 * A run is dropped unless it sits **between two non-space characters**, which
 * is how ordinary text uses those characters: `2*3` and `snake_case` keep their
 * `*` and `_`, while `**初代**`, `~~删掉~~`, `==高亮==` and `` `code` `` lose
 * their delimiters.
 *
 * @param text - A single line.
 * @returns The line without marker runs.
 */
export function stripEmphasisRuns(text: string): string {
	return text.replace(
		/[*_~=`]+/gu,
		(match: string, offset: number, whole: string) => {
			const before = offset > 0 ? whole[offset - 1] : " ";
			const after = whole[offset + match.length] ?? " ";
			const insideWord = !/\s/u.test(before) && !/\s/u.test(after);
			return insideWord ? match : "";
		}
	);
}

/**
 * Removes leading block markers.
 *
 * @param text - A single line.
 * @returns The line without its block prefix.
 */
export function stripBlockMarkers(text: string): string {
	return text.replace(BLOCK_MARKERS, "").trim();
}

/**
 * Removes link syntax, keeping the text a reader would have seen.
 *
 * - `[[笔记]]` → `笔记`, `[[笔记|别名]]` → `别名`, `[[笔记#标题]]` → `笔记`
 * - `[文字](https://…)` → `文字`
 * - `![[图片.png]]` and `![](url)` → removed: an embed's file name is noise in
 *   a one-line label, and its alias (if any) is kept instead.
 *
 * @param text - A single line.
 * @returns The line with link syntax resolved to plain text.
 */
export function stripLinkSyntax(text: string): string {
	return (
		text
			.replace(
				/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu,
				(_match, _target: string, alias?: string) => alias ?? ""
			)
			.replace(
				/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gu,
				(_match, target: string, alias?: string) =>
					alias ?? target.split("#")[0]
			)
			.replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1")
	);
}

/**
 * Removes `#tag` references.
 *
 * Only a `#` that follows the start of the line or whitespace counts as a tag,
 * so `C#` and `#1` mid-word survive.
 *
 * @param text - A single line.
 * @returns The line without tags.
 */
export function stripTagSyntax(text: string): string {
	return text.replace(/(^|\s)#[^\s#]+/gu, "$1");
}

/**
 * Turns one source line into label text.
 *
 * Order matters: block markers go first so a bullet cannot confuse link
 * parsing, then links (before emphasis, because a URL may contain `_` or `*`),
 * then emphasis runs, then tags. Whitespace is collapsed again at the end
 * because removing syntax leaves gaps behind.
 *
 * @param line - One line of the card's Markdown source.
 * @param filters - Which syntax to strip.
 * @returns The cleaned line, possibly empty.
 */
export function cleanLabelLine(line: string, filters: LabelFilters): string {
	let text = line.replace(/\s+/gu, " ").trim();
	if (text.length === 0) return "";
	if (filters.markdown) text = stripBlockMarkers(text);
	if (filters.links) text = stripLinkSyntax(text);
	if (filters.markdown) text = stripEmphasisRuns(text);
	if (filters.tags) text = stripTagSyntax(text);
	return text.replace(/\s+/gu, " ").trim();
}

/**
 * Picks the label text out of a text card's Markdown source.
 *
 * The first line that still has content **after** cleaning wins, so a card that
 * opens with a blank line or with a line that was nothing but markers still
 * gets a useful label instead of an empty one.
 *
 * @param raw - The card's Markdown source.
 * @param options - Budget, counting rule and filters.
 * @returns The label text, or `""` when nothing survives the filters.
 */
export function firstLineOf(raw: string, options: TextLabelOptions): string {
	for (const line of raw.split("\n")) {
		const cleaned = cleanLabelLine(line, options.filters);
		if (cleaned.length > 0) {
			return truncateText(cleaned, options.maxChars, options.countMode);
		}
	}
	return "";
}

