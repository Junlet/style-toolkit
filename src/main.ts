/**
 * Style Toolkit
 * =============
 *
 * Reimplements a set of hand-written CSS snippets as settings.
 *
 * HOW THE STYLING REACHES THE APP
 * -------------------------------
 * The plugin owns one `<style id="style-toolkit-styles">` element appended to
 * `document.head`, and rewrites its contents whenever a setting changes. It is
 * appended last, so with equal specificity it also wins the cascade against
 * Obsidian's own sheet.
 *
 * Generating the CSS -- rather than shipping a static `styles.css` -- is what
 * makes the toggles honest. A static sheet can only be overridden, which means
 * every "off" has to be expressed as another `!important` rule fighting the
 * first one, and the file cannot express "this feature is disabled" at all.
 *
 * The stylesheet is applied on load and torn down on unload, so disabling the
 * plugin leaves no residue.
 */

import { Notice, Plugin } from "obsidian";
import { CardLabeler } from "./cardlabel";
import { buildCss, type BuildOptions } from "./css";
import { parseSuffixList } from "./filenames";
import { createListRootExtension } from "./editor";
import type { SettingHost } from "./rows";
import {
	DEFAULT_SETTINGS,
	normalizeSettings,
	type StyleToolkitSettings,
} from "./settings";
import { ALL_TABS, type ToolkitTab } from "./tabs";

/** `id` of the injected stylesheet, so it can be found and cleaned up. */
const STYLE_EL_ID = "style-toolkit-styles";

/**
 * How long to wait before writing settings to disk.
 *
 * Sliders fire on every step of a drag; without this each pixel would be a
 * separate `saveData()`.
 */
const SAVE_DEBOUNCE_MS = 300;

/** Padding so the log prefix lines up with the other plugins in this vault. */
const LOG = "[style-toolkit] ";

export default class StyleToolkitPlugin extends Plugin implements SettingHost {
	settings: StyleToolkitSettings = DEFAULT_SETTINGS;

	/** The injected stylesheet. Null until `onload`, and after unload. */
	private styleEl: HTMLStyleElement | null = null;

	/** Pending debounced save. */
	private saveTimer: number | null = null;

	/** Registered tabs, so a reset can put the controls back to their defaults. */
	private readonly tabs: ToolkitTab[] = [];

	/**
	 * Writes first-line labels into shrink-to-a-icon Canvas text cards.
	 *
	 * Not a stylesheet concern: Obsidian's placeholder for a text card carries
	 * only an icon, so the text has to be put there from code. Created on load,
	 * started only while its setting is on.
	 */
	private cardLabeler: CardLabeler | null = null;

	/**
	 * Whether the Live Preview line decorations could be installed.
	 *
	 * The stylesheet has to know: with them the list rule keys off a class the
	 * editor puts on whole list blocks, without them it falls back to the line's
	 * own marker, which cannot see through a nested list of the other kind.
	 */
	private listRootReady = false;

	/** How the stylesheet should be built for this host. */
	private get buildOptions(): BuildOptions {
		return { listRootClass: this.listRootReady };
	}

	async onload(): Promise<void> {
		await this.loadSettings();

		// Before the stylesheet, because the stylesheet depends on it.
		const listRoot = createListRootExtension();
		if (listRoot) {
			this.listRootReady = true;
			// The cast is because `Extension` is declared in @codemirror/state,
			// which this package deliberately does not depend on: the extension
			// is built at runtime from Obsidian's own CodeMirror instance, so
			// that its `instanceof` checks keep working.
			this.registerEditorExtension(listRoot as never);
		}

		this.styleEl = document.createElement("style");
		this.styleEl.id = STYLE_EL_ID;
		document.head.appendChild(this.styleEl);
		this.applyStyles();

		this.cardLabeler = new CardLabeler(this.app);
		this.register(() => this.cardLabeler?.destroy());
		// Opening a canvas does not always produce a mutation inside the DOM this
		// labeller watches, so the layout change is what reliably triggers the
		// first scan for a freshly opened drawing.
		this.registerEvent(
			this.app.workspace.on("layout-change", () => this.syncCardLabels())
		);
		this.syncCardLabels();

		for (const Tab of ALL_TABS) {
			const tab = new Tab(this.app, this);
			this.tabs.push(tab);
			this.addSettingTab(tab);
		}

		this.register(() => {
			if (this.saveTimer !== null) {
				window.clearTimeout(this.saveTimer);
				this.saveTimer = null;
			}
			this.styleEl?.remove();
			this.styleEl = null;
		});

		console.log(LOG + "已加载");
	}

	// -- styling -----------------------------------------------------------

	/** Rewrites the injected stylesheet from the current settings. */
	private applyStyles(): void {
		if (!this.styleEl) return;
		this.styleEl.textContent = buildCss(this.settings, this.buildOptions);
	}

	/**
	 * Matches the Canvas text-card labeller to the current setting.
	 *
	 * Called on load, on every settings change and on layout changes, so
	 * flipping the toggle adds or removes the labels immediately instead of
	 * waiting for the next drawing to be opened.
	 */
	private syncCardLabels(): void {
		if (!this.cardLabeler) return;

		const textCards = this.settings.canvasTextCardLabelEnabled
			? {
					maxChars: this.settings.canvasTextCardLabelMaxChars,
					countMode: this.settings.canvasTextCardLabelCountMode,
					filters: {
						markdown: this.settings.canvasTextCardStripMarkdown,
						links: this.settings.canvasTextCardStripLinks,
						tags: this.settings.canvasTextCardStripTags,
					},
				}
			: null;

		const suffixes = parseSuffixList(
			this.settings.canvasPlaceholderStripSuffixes
		);
		const fileNames =
			suffixes.length > 0 || this.settings.canvasPlaceholderMaxWidth > 0
				? {
						maxWidth: this.settings.canvasPlaceholderMaxWidth,
						countMode: this.settings.canvasPlaceholderCountMode,
						suffixes,
					}
				: null;

		if (!textCards && !fileNames) {
			this.cardLabeler.stop();
			return;
		}
		this.cardLabeler.start({ textCards, fileNames });
	}

	/**
	 * Called by every settings row: repaint immediately, persist shortly after.
	 *
	 * The repaint is synchronous so dragging a slider updates the document live;
	 * only the disk write is debounced.
	 */
	touch(): void {
		this.applyStyles();
		this.syncCardLabels();
		if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			void this.saveSettings();
		}, SAVE_DEBOUNCE_MS);
	}

	/** Puts the generated CSS on the clipboard, for reuse as a snippet. */
	async copyCss(): Promise<void> {
		const css = buildCss(this.settings, this.buildOptions);
		try {
			await navigator.clipboard.writeText(css);
			new Notice(`已复制生成的 CSS（${css.length} 个字符）。`);
		} catch (error) {
			console.error(LOG + "复制到剪贴板失败", error);
			new Notice("复制失败，详情见控制台。");
		}
	}

	/** Restores every value to its shipped default and repaints the tabs. */
	async resetAll(): Promise<void> {
		this.settings = normalizeSettings(null);
		this.applyStyles();
		this.syncCardLabels();
		await this.saveSettings();
		for (const tab of this.tabs) {
			tab.display();
		}
		new Notice("已恢复默认设置。");
	}

	// -- persistence -------------------------------------------------------

	/** Loads persisted settings, falling back to defaults. */
	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	/** Persists the current settings immediately. */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
