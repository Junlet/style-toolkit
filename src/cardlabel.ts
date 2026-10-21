/**
 * A file-name-style label for **text cards** on a Canvas.
 *
 * WHY THIS NEEDS JAVASCRIPT
 * -------------------------
 * When a Canvas node shrinks past its breakpoint, Obsidian detaches the node's
 * rendered content and attaches a `.canvas-node-placeholder` in its place. For
 * a node backed by a file, that placeholder is filled with the file name. A
 * text card has no file, so its placeholder only ever gets an align-left icon
 * (`canvas-icon-placeholder`) and no text -- nothing tells a shrunk card apart
 * from an empty one.
 *
 * The first line of the card is the closest thing a text card has to a file
 * name, but CSS cannot read an element's text, so the string has to be supplied
 * from here. This module writes it into the placeholder as a `.stk-card-label`
 * div; the generated stylesheet does the rest (size, colour, hiding the icon).
 *
 * WHERE THE TEXT COMES FROM
 * -------------------------
 * Not from the DOM. The content is *detached* exactly while the placeholder is
 * showing, so at the only moment the label is visible its text is no longer in
 * the document -- reading the DOM would only work after the card had been shown
 * at readable zoom, and would be blank for a canvas reopened already zoomed out.
 *
 * Instead the text is read from the Canvas node object, which keeps `text` for
 * as long as the drawing is open. Canvas has no public API, so the node map is
 * reached through `view.canvas.nodes` -- the same internal route every plugin
 * that touches Canvas uses -- with a structural fallback below in case the
 * property is renamed, and a silent no-op if neither works. Everything here is
 * strictly additive: if the lookup fails, nothing is written and Obsidian's own
 * appearance is untouched.
 */

import type { App } from "obsidian";
import {
	displayFileName,
	truncateText,
	type FileNameLabelOptions,
} from "./filenames";

/** Class on the label element this module inserts. */
export const LABEL_CLASS = "stk-card-label";

/**
 * Class put on the placeholder while it holds a label.
 *
 * The stylesheet keys the icon-hiding rule off this rather than `:has()`, so
 * only placeholders that actually got a label lose their icon -- an empty text
 * card keeps Obsidian's default look.
 */
export const LABEL_STATE_CLASS = "stk-has-card-label";

/** Coalesces bursts of DOM mutations into one scan. */
const SCAN_DEBOUNCE_MS = 120;

/** The parts of a Canvas node this module reads. All optional by design. */
interface CanvasNodeLike {
	text?: unknown;
	placeholderEl?: unknown;
	getData?: () => { type?: unknown; text?: unknown } | undefined;
}

/** The parts of a Canvas drawing this module reads. */
interface CanvasLike {
	nodes?: Map<string, CanvasNodeLike>;
}

/** What the labeller has been asked to do. */
export interface LabelOptions {
	/** Text-card labels, or `null` when that feature is off. */
	textCards: { maxChars: number } | null;
	/** File-name rewriting, or `null` when nothing would change. */
	fileNames: FileNameLabelOptions | null;
}

/** What was written into one file node's placeholder. */
interface FileNameState {
	/** The name Obsidian produced, before our edits. */
	original: string;
	/** What we last wrote back. */
	written: string;
}

/**
 * Reads a node's kind.
 *
 * @param node - Candidate Canvas node.
 * @returns The `type` from `getData()`, or `undefined` when unreadable.
 */
function nodeType(node: CanvasNodeLike): unknown {
	if (typeof node.getData !== "function") return undefined;
	try {
		return node.getData()?.type;
	} catch {
		return undefined;
	}
}

/**
 * Cuts the first line down to `maxChars` code points.
 *
 * Delegates to {@link truncateText} in `"chars"` mode, which counts code points
 * rather than UTF-16 units, so an emoji is kept or dropped whole. (Text cards
 * deliberately count characters, not widths: a card's first line is prose, and
 * "show 5 characters" is the unit a reader expects there. The file-name label
 * offers width counting instead, because names are mixed with extensions.)
 *
 * @param text - The already-extracted first line.
 * @param maxChars - Character limit; `0` or negative means "no limit".
 * @returns The text, shortened if a positive limit was given.
 */
function clip(text: string, maxChars: number): string {
	return truncateText(text, maxChars, "chars");
}

/**
 * Extracts the label text from a card's Markdown source.
 *
 * The first line that has anything on it wins, so a card that starts with a
 * blank line still gets a label. A leading ATX heading marker is dropped --
 * `# 项目计划` should read `项目计划`, since the `#` is syntax rather than
 * content -- while everything else is left exactly as typed.
 *
 * @param raw - The card's Markdown source.
 * @param maxChars - Optional character limit; `0` means "the whole first line".
 * @returns The label text, or `""` when the card has no text at all.
 */
export function firstLineOf(raw: string, maxChars = 0): string {
	for (const line of raw.split("\n")) {
		const collapsed = line.replace(/\s+/gu, " ").trim();
		const withoutMarker = collapsed.replace(/^#{1,6}[ \t]+/u, "").trim();
		if (withoutMarker.length > 0) return clip(withoutMarker, maxChars);
	}
	return "";
}

/**
 * Reads a node's label text, but only if it is a text card.
 *
 * @param node - Candidate Canvas node.
 * @param maxChars - Optional character limit; `0` means "the whole first line".
 * @returns The first line of the card, or `""` for any other node type.
 */
export function textCardLabel(node: CanvasNodeLike, maxChars = 0): string {
	let type: unknown;
	let text: unknown;
	let typeKnown = false;
	if (typeof node.getData === "function") {
		try {
			const data = node.getData();
			type = data?.type;
			text = data?.text;
			typeKnown = true;
		} catch {
			// A node mid-initialisation can throw. Fall back to the `text` field
			// below, which is only ever set on text cards.
		}
	}
	if (typeKnown) {
		if (type !== "text") return "";
	} else if (typeof node.text !== "string") {
		return "";
	}
	const source = typeof text === "string" ? text : node.text;
	return typeof source === "string"
		? firstLineOf(source, maxChars)
		: "";
}

/**
 * Narrows a value to something that looks like a live Canvas drawing.
 *
 * The test is deliberately structural rather than a class check: `Canvas` is
 * not exported anywhere, and a renamed property would otherwise leave this
 * feature permanently blank.
 *
 * @param value - Candidate object.
 * @returns True when the value carries a Canvas node map.
 */
function isCanvasLike(value: unknown): value is CanvasLike {
	if (!value || typeof value !== "object") return false;
	return (value as CanvasLike).nodes instanceof Map;
}

/**
 * Finds the Canvas drawing owned by a Canvas view.
 *
 * `view.canvas` is the documented-by-inspection name (Obsidian's `CanvasView`
 * constructor does `this.canvas = new Canvas(this)`). The fallback scan exists
 * because that name is internal and could change in any release; a scan for the
 * one own property holding a node map costs nothing and keeps the feature
 * working through such a rename.
 *
 * @param view - The view of a `canvas` leaf.
 * @returns The drawing, or `null` when this Obsidian build exposes neither.
 */
export function findCanvas(view: unknown): CanvasLike | null {
	if (!view || typeof view !== "object") return null;
	const direct = (view as { canvas?: unknown }).canvas;
	if (isCanvasLike(direct)) return direct;
	for (const value of Object.values(view as Record<string, unknown>)) {
		if (isCanvasLike(value)) return value;
	}
	return null;
}

/**
 * Keeps the labels on shrunk Canvas nodes in sync.
 *
 * Two jobs, both about the `.canvas-node-placeholder` Obsidian attaches when a
 * node shrinks past its breakpoint:
 *
 *   - **text cards** get a first-line label, which Obsidian never supplies;
 *   - **file nodes** keep Obsidian's own file name, but shortened and with the
 *     suffixes the user asked to hide removed.
 */
export class CardLabeler {
	/** Guards against two observers after a settings change. */
	private observer: MutationObserver | null = null;

	/** Pending debounced scan. */
	private scanTimer: number | null = null;

	/** Logged once, so a failed lookup does not spam the console. */
	private warned = false;

	/**
	 * What this pass has been asked to do.
	 *
	 * Held on the instance because the debounced observer callback has no access
	 * to the plugin's settings, and a scan without the current limits would put
	 * the untrimmed text back.
	 */
	private options: LabelOptions = { textCards: null, fileNames: null };

	/**
	 * For each file placeholder: the name Obsidian produced and what we wrote.
	 *
	 * Needed because we rewrite Obsidian's own text. Storing the original means
	 * moving a slider re-truncates the *full* name instead of chopping an
	 * already-chopped one, and turning the feature off can give the name back.
	 */
	private readonly fileStates = new WeakMap<HTMLElement, FileNameState>();

	constructor(private readonly app: App) {}

	/**
	 * Turns the feature on and applies the given options.
	 *
	 * Idempotent, so a settings slider can call it on every step.
	 *
	 * @param options - Which parts to apply and with what limits.
	 */
	start(options: LabelOptions): void {
		this.options = options;
		if (!this.observer) {
			this.observer = new MutationObserver(() => this.schedule());
			this.observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
		this.refresh();
	}

	/**
	 * Turns everything off and puts the DOM back the way Obsidian made it.
	 *
	 * Text-card labels are removed, file names are restored from the recorded
	 * originals, and the observer is disconnected so a disabled feature costs
	 * nothing.
	 */
	stop(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.clearTimer();
		for (const label of Array.from(
			document.querySelectorAll(`.${LABEL_CLASS}`)
		)) {
			const placeholder = label.parentElement;
			placeholder?.classList.remove(LABEL_STATE_CLASS);
			label.remove();
		}
		this.restoreFileNames();
		this.options = { textCards: null, fileNames: null };
	}

	/** Releases everything; called from the plugin's unload hook. */
	destroy(): void {
		this.stop();
	}

	/** Queues one scan, coalescing the mutations Obsidian generates in bursts. */
	private schedule(): void {
		this.clearTimer();
		this.scanTimer = window.setTimeout(() => {
			this.scanTimer = null;
			this.refresh();
		}, SCAN_DEBOUNCE_MS);
	}

	/** Cancels a pending scan. */
	private clearTimer(): void {
		if (this.scanTimer === null) return;
		window.clearTimeout(this.scanTimer);
		this.scanTimer = null;
	}

	/** Walks every open drawing and reconciles its labels. */
	refresh(): void {
		const leaves = this.app.workspace.getLeavesOfType("canvas");
		let found = false;
		for (const leaf of leaves) {
			const canvas = findCanvas(leaf.view);
			if (!canvas?.nodes) continue;
			found = true;
			for (const node of canvas.nodes.values()) {
				this.applyTo(node);
			}
		}
		if (!found && leaves.length > 0 && !this.warned) {
			this.warned = true;
			console.warn(
				"[style-toolkit] 无法读取 Canvas 节点，文本卡片标签未生效。" +
					"可能是 Obsidian 内部结构变化，请反馈。"
			);
		}
	}

	/**
	 * Reconciles one node's placeholder.
	 *
	 * Writing into a *detached* placeholder is fine and deliberate: Obsidian
	 * re-attaches the same element when the node shrinks again, so the label is
	 * already in place by then and no flicker is possible.
	 *
	 * @param node - The Canvas node to update.
	 */
	private applyTo(node: CanvasNodeLike): void {
		const placeholder = node.placeholderEl;
		if (!(placeholder instanceof HTMLElement)) return;

		// A file node's placeholder text belongs to Obsidian (file name, plus a
		// ` › heading` subpath). We only shorten or trim it. Every other kind --
		// text cards, and anything whose type could not be read -- goes through
		// the label path, which decides for itself whether there is anything to
		// show.
		if (nodeType(node) === "file") {
			this.applyFileName(placeholder);
			return;
		}
		this.applyTextCard(node, placeholder);
	}

	/**
	 * Owns the placeholder of a text card.
	 *
	 * @param node - The Canvas node.
	 * @param placeholder - Its placeholder element.
	 */
	private applyTextCard(node: CanvasNodeLike, placeholder: HTMLElement): void {
		const limits = this.options.textCards;
		const text = limits ? textCardLabel(node, limits.maxChars) : "";
		const existing = placeholder.querySelector(
			`:scope > .${LABEL_CLASS}`
		) as HTMLElement | null;

		if (text.length === 0) {
			// Not a text card, a card with nothing on its first line, or the
			// feature was just turned off: put the placeholder back exactly as
			// Obsidian made it.
			existing?.remove();
			placeholder.classList.remove(LABEL_STATE_CLASS);
			return;
		}

		const label = existing ?? createDiv({ cls: LABEL_CLASS });
		if (!existing) placeholder.appendChild(label);
		if (label.textContent !== text) label.textContent = text;
		placeholder.classList.add(LABEL_STATE_CLASS);
	}

	/**
	 * Shortens or trims the file name Obsidian wrote into a placeholder.
	 *
	 * The text is only replaced, never rebuilt: keeping Obsidian's own string as
	 * the input means the ` › heading` subpath, the missing-file message and any
	 * future wording keep working. Placeholders holding element children are
	 * left alone, so this can never eat markup it did not create.
	 *
	 * @param placeholder - The placeholder element.
	 */
	private applyFileName(placeholder: HTMLElement): void {
		if (placeholder.children.length > 0) return;

		const current = placeholder.textContent ?? "";
		const previous = this.fileStates.get(placeholder);
		// Anything other than what we last wrote came from Obsidian (a rename, a
		// re-render), so it becomes the new original.
		const original =
			previous && current === previous.written ? previous.original : current;

		const options = this.options.fileNames;
		if (!options) {
			if (previous && current === previous.written) {
				placeholder.textContent = previous.original;
			}
			this.fileStates.delete(placeholder);
			return;
		}

		if (original.trim().length === 0) {
			this.fileStates.delete(placeholder);
			return;
		}

		const display = displayFileName(original, options);
		if (current !== display) placeholder.textContent = display;
		this.fileStates.set(placeholder, { original, written: display });
	}

	/** Gives every rewritten file name its original text back. */
	private restoreFileNames(): void {
		for (const leaf of this.app.workspace.getLeavesOfType("canvas")) {
			const canvas = findCanvas(leaf.view);
			if (!canvas?.nodes) continue;
			for (const node of canvas.nodes.values()) {
				const placeholder = node.placeholderEl;
				if (!(placeholder instanceof HTMLElement)) continue;
				const state = this.fileStates.get(placeholder);
				if (!state) continue;
				if ((placeholder.textContent ?? "") === state.written) {
					placeholder.textContent = state.original;
				}
				this.fileStates.delete(placeholder);
			}
		}
	}
}
