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
import { buildCss } from "./css";
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

	async onload(): Promise<void> {
		await this.loadSettings();

		this.styleEl = document.createElement("style");
		this.styleEl.id = STYLE_EL_ID;
		document.head.appendChild(this.styleEl);
		this.applyStyles();

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
		this.styleEl.textContent = buildCss(this.settings);
	}

	/**
	 * Called by every settings row: repaint immediately, persist shortly after.
	 *
	 * The repaint is synchronous so dragging a slider updates the document live;
	 * only the disk write is debounced.
	 */
	touch(): void {
		this.applyStyles();
		if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			void this.saveSettings();
		}, SAVE_DEBOUNCE_MS);
	}

	/** Puts the generated CSS on the clipboard, for reuse as a snippet. */
	async copyCss(): Promise<void> {
		const css = buildCss(this.settings);
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
