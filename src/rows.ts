/**
 * A tiny declarative layer over Obsidian's `Setting`.
 *
 * There are well over a hundred rows across the tabs. Written out longhand that
 * is a lot of near-identical code, and a typo in a key name would silently write
 * to a property nobody reads. Instead each row is a plain object whose `key` is
 * constrained to the settings interface, so the compiler rejects a toggle that
 * points at a string, a slider that points at a boolean, or a key that does not
 * exist.
 */

import { Setting } from "obsidian";
import type { StyleToolkitSettings } from "./settings";

/** Keys whose value is a boolean. */
export type BoolKey = {
	[K in keyof StyleToolkitSettings]: StyleToolkitSettings[K] extends boolean
		? K
		: never;
}[keyof StyleToolkitSettings];

/** Keys whose value is a number. */
export type NumKey = {
	[K in keyof StyleToolkitSettings]: StyleToolkitSettings[K] extends number
		? K
		: never;
}[keyof StyleToolkitSettings];

/** Keys whose value is a string. */
export type StrKey = {
	[K in keyof StyleToolkitSettings]: StyleToolkitSettings[K] extends string
		? K
		: never;
}[keyof StyleToolkitSettings];

/** Keys whose value is an array. */
export type ArrKey = {
	[K in keyof StyleToolkitSettings]: StyleToolkitSettings[K] extends unknown[]
		? K
		: never;
}[keyof StyleToolkitSettings];

/** What a row needs from the plugin. */
export interface SettingHost {
	settings: StyleToolkitSettings;
	/** Re-renders the injected stylesheet and schedules a save. */
	touch(): void;
	/** Writes the generated CSS to the clipboard. */
	copyCss(): void;
	/** Restores every value to its shipped default. */
	resetAll(): void;
}

/** One row in a settings tab. */
export type Row =
	| { kind: "heading"; name: string; desc?: string }
	| { kind: "note"; text: string }
	| { kind: "toggle"; key: BoolKey; name: string; desc?: string }
	| { kind: "color"; key: StrKey; name: string; desc?: string }
	| { kind: "text"; key: StrKey; name: string; desc?: string; placeholder?: string }
	| {
			kind: "dropdown";
			key: StrKey;
			name: string;
			desc?: string;
			options: Array<{ value: string; label: string }>;
	  }
	| {
			kind: "slider";
			key: NumKey;
			name: string;
			desc?: string;
			min: number;
			max: number;
			step: number;
	  }
	| {
			kind: "button";
			name: string;
			desc?: string;
			label: string;
			onClick: (host: SettingHost) => void;
	  }
	| {
			kind: "colorArray";
			key: ArrKey;
			index: number;
			name: string;
			desc?: string;
	  }
	| {
			kind: "numberArray";
			key: ArrKey;
			index: number;
			name: string;
			desc?: string;
			min: number;
			max: number;
			step: number;
	  }
	| {
			kind: "boolArray";
			key: ArrKey;
			index: number;
			name: string;
			desc?: string;
	  };

/** Setting types are generic over their value; these keep the reads honest. */
type Mutable = Record<string, unknown>;

/**
 * Reads a boolean setting.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @returns Its value.
 */
function readBool(host: SettingHost, key: BoolKey): boolean {
	return host.settings[key];
}

/**
 * Writes a boolean and refreshes the stylesheet.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @param value - New value.
 */
function writeBool(host: SettingHost, key: BoolKey, value: boolean): void {
	(host.settings as unknown as Mutable)[key] = value;
	host.touch();
}

/**
 * Reads a string setting.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @returns Its value.
 */
function readString(host: SettingHost, key: StrKey): string {
	return host.settings[key];
}

/**
 * Writes a string and refreshes the stylesheet.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @param value - New value.
 */
function writeString(host: SettingHost, key: StrKey, value: string): void {
	(host.settings as unknown as Mutable)[key] = value;
	host.touch();
}

/**
 * Reads a numeric setting.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @returns Its value.
 */
function readNumber(host: SettingHost, key: NumKey): number {
	return host.settings[key];
}

/**
 * Writes a number and refreshes the stylesheet.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @param value - New value.
 */
function writeNumber(host: SettingHost, key: NumKey, value: number): void {
	(host.settings as unknown as Mutable)[key] = value;
	host.touch();
}

/**
 * Reads one entry of an array setting.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @param index - Entry index.
 * @returns The entry.
 */
function readItem(host: SettingHost, key: ArrKey, index: number): unknown {
	return (host.settings[key] as unknown as unknown[])[index];
}

/**
 * Writes one entry of an array setting and refreshes the stylesheet.
 *
 * @param host - The owning plugin.
 * @param key - Which setting.
 * @param index - Entry index.
 * @param value - New value.
 */
function writeItem(
	host: SettingHost,
	key: ArrKey,
	index: number,
	value: unknown
): void {
	const list = host.settings[key] as unknown as unknown[];
	list[index] = value;
	host.touch();
}

/**
 * Renders a list of rows into a settings container.
 *
 * @param container - Element to append to.
 * @param rows - Rows to render, in order.
 * @param host - The owning plugin.
 */
export function renderRows(
	container: HTMLElement,
	rows: Row[],
	host: SettingHost
): void {
	for (const row of rows) {
		switch (row.kind) {
			case "heading":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.setHeading();
				break;

			case "note":
				container.createDiv({ cls: "style-toolkit-note", text: row.text });
				break;

			case "toggle":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addToggle((toggle) =>
						toggle
							.setValue(readBool(host, row.key))
							.onChange((value) => writeBool(host, row.key, value))
					);
				break;

			case "color":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addColorPicker((picker) =>
						picker
							.setValue(readString(host, row.key))
							.onChange((value) => writeString(host, row.key, value))
					);
				break;

			case "text":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addText((text) => {
						text.setPlaceholder(row.placeholder ?? "").setValue(
							readString(host, row.key)
						);
						text.onChange((value) => writeString(host, row.key, value));
					});
				break;

			case "dropdown":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addDropdown((dropdown) => {
						for (const option of row.options) {
							dropdown.addOption(option.value, option.label);
						}
						dropdown
							.setValue(readString(host, row.key))
							.onChange((value) => writeString(host, row.key, value));
					});
				break;

			case "slider":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addSlider((slider) =>
						slider
							.setLimits(row.min, row.max, row.step)
							.setValue(readNumber(host, row.key))
							.setDynamicTooltip()
							.onChange((value) => writeNumber(host, row.key, value))
					);
				break;

			case "button":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addButton((button) =>
						button.setButtonText(row.label).onClick(() => row.onClick(host))
					);
				break;

			case "colorArray":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addColorPicker((picker) =>
						picker
							.setValue(String(readItem(host, row.key, row.index)))
							.onChange((value) =>
								writeItem(host, row.key, row.index, value)
							)
					);
				break;

			case "numberArray":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addSlider((slider) =>
						slider
							.setLimits(row.min, row.max, row.step)
							.setValue(Number(readItem(host, row.key, row.index)))
							.setDynamicTooltip()
							.onChange((value) =>
								writeItem(host, row.key, row.index, value)
							)
					);
				break;

			case "boolArray":
				new Setting(container)
					.setName(row.name)
					.setDesc(row.desc ?? "")
					.addToggle((toggle) =>
						toggle
							.setValue(Boolean(readItem(host, row.key, row.index)))
							.onChange((value) =>
								writeItem(host, row.key, row.index, value)
							)
					);
				break;
		}
	}
}

/**
 * Builds one row per heading level, for the array-valued settings.
 *
 * @param levels - Level numbers, 1-based.
 * @param make - Builds a row for a level; the index is 0-based.
 * @returns The rows, in level order.
 */
export function perLevel(
	levels: number[],
	make: (level: number, index: number) => Row
): Row[] {
	return levels.map((level, index) => make(level, index));
}
