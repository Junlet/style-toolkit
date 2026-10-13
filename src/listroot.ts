/**
 * Works out, for every line, what kind of list it ultimately belongs to.
 *
 * WHY THIS EXISTS
 * ---------------
 * In Live Preview each line is a flat sibling element, and Obsidian marks a line
 * only with its own depth (`HyperMD-list-line-1..6`) and its own marker class.
 * CSS therefore cannot answer "is the list this line belongs to rooted in a `ul`
 * or an `ol`?" -- the enclosing structure is not in the DOM at all.
 *
 * The styling rule needs exactly that answer: a vertical rule should run down the
 * side of a list whose outermost level is unordered, whatever its nested levels
 * are, and must not appear for a list whose outermost level is ordered. So the
 * structure is recovered from the document text here, and the editor layer turns
 * the result into a line decoration.
 *
 * This module is pure: no DOM, no CodeMirror, no Obsidian. That is deliberate --
 * it is the part with the actual logic in it, so it is the part worth testing.
 */

/** What a line's outermost list is, or null when the line is not in a list. */
export type ListRoot = "ul" | "ol" | null;

/**
 * Class the editor layer puts on every line whose outermost list is unordered.
 *
 * The stylesheet keys the vertical rule off this class rather than off the
 * line's own marker, which is the whole point: a nested ordered line inside an
 * unordered list still gets the rule, and a nested unordered line inside an
 * ordered list still does not.
 */
export const LIST_ROOT_CLASS = "style-toolkit-ul-root";

/** A list marker at the start of a line, after any blockquote markers. */
const LIST_MARKER = /^([ \t]*)([-*+]|\d+[.)])([ \t]+|$)/;

/** Leading `>` markers, as used inside blockquotes and callouts. */
const QUOTE_PREFIX = /^(?:[ \t]*>[ \t]?)*/;

/** Columns a tab counts for, matching Obsidian's default tab size. */
const TAB_WIDTH = 4;

/**
 * Measures leading whitespace in columns.
 *
 * @param text - Leading whitespace.
 * @returns Its width, with tabs expanded.
 */
function indentWidth(text: string): number {
	let width = 0;
	for (const ch of text) {
		width += ch === "\t" ? TAB_WIDTH : 1;
	}
	return width;
}

/** One open list item while scanning. */
interface OpenItem {
	/** Column where the item's marker starts. */
	indent: number;
	/** Column where the item's content starts; a line at or past it belongs in. */
	content: number;
	/** Marker kind. */
	type: "ul" | "ol";
}

/**
 * Recovers the outermost list type for each line.
 *
 * A small hand-rolled scan rather than a real Markdown parser: it only has to
 * agree with Obsidian about which list a line sits in, and it runs on every
 * document change, so it stays linear and allocation-light.
 *
 * @param lines - The document, split on newlines.
 * @returns One entry per line, in the same order.
 */
export function computeListRoots(lines: readonly string[]): ListRoot[] {
	const out: ListRoot[] = new Array(lines.length).fill(null);
	const stack: OpenItem[] = [];

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];

		// A blank line does not close anything, but it also gets no rule of its
		// own: a trailing blank line after a list would otherwise grow a stray
		// segment, and tight lists have no blank lines to span anyway.
		if (raw.trim() === "") continue;

		// Blockquote markers are transparent for this purpose; a list inside a
		// callout is still a list.
		const quote = QUOTE_PREFIX.exec(raw)?.[0] ?? "";
		const body = raw.slice(quote.length);
		const quoteDepth = (quote.match(/>/g) ?? []).length;

		const match = LIST_MARKER.exec(body);
		const lead = match ? match[1] : (/^[ \t]*/.exec(body)?.[0] ?? "");
		const indent = indentWidth(lead) + quoteDepth * TAB_WIDTH;

		if (match) {
			// Close every item this line cannot belong to.
			while (stack.length > 0 && stack[stack.length - 1].content > indent) {
				stack.pop();
			}
			const marker = match[2];
			stack.push({
				indent,
				content: indent + marker.length + Math.max(1, match[3].length),
				type: /^[-*+]$/.test(marker) ? "ul" : "ol",
			});
			out[i] = stack[0].type;
			continue;
		}

		// Not a marker: it continues the innermost open item if it is indented
		// far enough into it, otherwise it closes items until one still fits.
		while (stack.length > 0 && indent < stack[stack.length - 1].content) {
			stack.pop();
		}
		out[i] = stack.length > 0 ? stack[0].type : null;
	}

	return out;
}

/**
 * Splits a CodeMirror document into lines.
 *
 * @param text - The whole document.
 * @returns Its lines, without line terminators.
 */
export function splitLines(text: string): string[] {
	return text.split("\n");
}
