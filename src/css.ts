/**
 * Turns settings into a stylesheet.
 *
 * Why generate CSS instead of shipping a static `styles.css`: switching a
 * feature off has to actually remove its rules. A static sheet can only be
 * overridden, which means fighting `!important` against itself and leaving dead
 * weight in the cascade. Here the whole sheet is rebuilt from the settings, so
 * "off" means "absent".
 *
 * Fidelity notes, where the original snippets were not self-consistent:
 *
 *   - The heading dashes used different thicknesses for H6 in reading view
 *     (1px) and Live Preview (2px). One value is used (2px).
 *   - The inline-code-behind-bold colour was `#7f7f7f` in editing and `#595959`
 *     in reading. One value is used (`#595959`, the reading one).
 *   - In callouts the list greyscale was applied in reading view but the
 *     editing rules flattened every level to the inner colour. That is
 *     reproduced as-is rather than "fixed".
 */

import type { StyleToolkitSettings } from "./settings";

/** A declaration value. Falsy entries are dropped. */
type Value = string | number | false | null | undefined;

/** A declaration block, in output order. */
type Decls = Record<string, Value>;

/**
 * Formats a number without floating-point noise.
 *
 * @param n - The number.
 * @returns A short decimal string.
 */
function num(n: number): string {
	return String(Math.round(n * 10000) / 10000);
}

/**
 * @param n - Pixels.
 * @returns A CSS length.
 */
function px(n: number): string {
	return `${num(n)}px`;
}

/**
 * @param n - Ems.
 * @returns A CSS length.
 */
function em(n: number): string {
	return `${num(n)}em`;
}

/**
 * Emits one rule.
 *
 * @param selector - Selector list.
 * @param decls - Declarations; falsy values are skipped.
 * @param important - Append `!important` to every declaration.
 * @returns The rule, or an empty string when nothing was declared.
 */
function rule(selector: string, decls: Decls, important = true): string {
	const lines: string[] = [];
	for (const prop of Object.keys(decls)) {
		const value = decls[prop];
		if (value === false || value === null || value === undefined || value === "") {
			continue;
		}
		lines.push(`\t${prop}: ${value}${important ? " !important" : ""};`);
	}
	if (lines.length === 0) return "";
	return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * Joins the non-empty parts with blank lines.
 *
 * @param parts - Rules and nested blocks.
 * @returns The joined stylesheet fragment.
 */
function join(parts: Array<string | false | null>): string {
	return parts.filter((p): p is string => Boolean(p && p.trim())).join("\n\n");
}

/**
 * Adds a section banner comment.
 *
 * @param title - Section name.
 * @param body - Section contents.
 * @returns The commented block, or an empty string when the body is empty.
 */
function section(title: string, body: string): string {
	if (!body.trim()) return "";
	const pad = "=".repeat(Math.max(4, 56 - title.length));
	return `/* ===== ${title} ${pad} */\n\n${body}`;
}

/** Live Preview's per-level list-line class. */
const CM_LIST = (level: number): string => `.HyperMD-list-line-${level}`;

/**
 * The same class, qualified to the Markdown editor.
 *
 * Used for the list size and colour staircase: without the qualifier those
 * `font-size` rules would also match anything else reusing Obsidian's
 * `HyperMD-list-line-*` class names outside an editor.
 */
const CM_EDITOR_LIST = (level: number): string =>
	`.markdown-source-view.mod-cm6 .HyperMD-list-line-${level}`;

/**
 * Reading-view selector for list items at a nesting depth.
 *
 * @param kind - `ul` or `ol`.
 * @param level - Nesting depth, 1-based.
 * @returns A descendant selector matching that depth.
 */
function readingList(kind: "ul" | "ol", level: number): string {
	const nest = new Array(level).fill(kind).join(" ");
	return `body .markdown-preview-view ${nest} > li`;
}

/**
 * Reading-view selector for a list marker at a nesting depth.
 *
 * @param kind - `ul` or `ol`.
 * @param level - Nesting depth, 1-based.
 * @returns A `::marker` selector.
 */
function readingMarker(kind: "ul" | "ol", level: number): string {
	const nest = new Array(level).fill(kind).join(" ");
	return `.markdown-preview-view.markdown-rendered ${nest} li::marker`;
}

/**
 * Reading-view selector for something inside a list item at a depth.
 *
 * Built by appending rather than by string replacement: a `replace("> li", …)`
 * turns `ul > li` into `ul > code`, which silently drops the list item from the
 * selector instead of nesting inside it.
 *
 * @param kind - `ul` or `ol`.
 * @param level - Nesting depth, 1-based.
 * @param inner - Selector for the element inside the `<li>`.
 * @returns A descendant selector.
 */
function readingListInner(
	kind: "ul" | "ol",
	level: number,
	inner: string
): string {
	return `${readingList(kind, level)} > ${inner}`;
}

/**
 * Selector for list items inside a callout.
 *
 * Scoped to `.callout` deliberately: these rules carry callout-only colours and
 * must not leak into the document's own lists.
 *
 * @param kind - `ul` or `ol`.
 * @param level - Nesting depth, 1-based.
 * @returns A descendant selector.
 */
function calloutList(kind: "ul" | "ol", level: number): string {
	const nest = new Array(level).fill(kind).join(" ");
	return `.callout ${nest} > li`;
}

/**
 * Every list selector inside a callout, for both list kinds.
 *
 * @param levels - Nesting depths to include.
 * @returns Deduplicated selectors, comma-joined.
 */
function calloutLists(levels: number[]): string {
	const out: string[] = [];
	for (const level of levels) {
		out.push(calloutList("ul", level), calloutList("ol", level));
	}
	return out.join(",\n");
}

/**
 * Builds the dashed leader drawn after a heading.
 *
 * @param color - Dash colour.
 * @param thickness - Dash length and line height, in pixels.
 * @param gapRatio - Gap between dashes as a multiple of `thickness`.
 * @returns A `repeating-linear-gradient` value.
 */
function dashGradient(
	color: string,
	thickness: number,
	gapRatio: number
): string {
	const len = num(thickness);
	const end = num(thickness + thickness * gapRatio);
	return (
		`repeating-linear-gradient(to right, ${color} 0px, ${color} ${len}px, ` +
		`transparent ${len}px, transparent ${end}px)`
	);
}

/** The six heading levels, as used by the array-valued settings. */
const LEVELS = [1, 2, 3, 4, 5, 6];

// -- sections ------------------------------------------------------------

/**
 * Base text colour, the active line, struck-through headings, emphasis, and
 * inline code.
 *
 * @param s - Settings.
 * @returns The section.
 */
function textSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.textBaseEnabled) {
		parts.push(
			rule("body", { color: s.textBaseColor }),
			rule(".markdown-preview-view,\n.markdown-source-view", {
				color: s.textBaseColor,
			}),
			rule(".cm-s-obsidian .cm-line", { color: s.textBaseColor })
		);
	}

	// A heading whose text is struck through goes grey. Emitted before the
	// active-line rules so that the line you are editing still wins on
	// specificity (`.cm-line.cm-active.HyperMD-header` beats
	// `.HyperMD-header:has(.cm-strikethrough)`).
	if (s.strikeHeadingGreyEnabled) {
		parts.push(
			rule(".HyperMD-header:has(.cm-strikethrough)", {
				color: s.strikeHeadingGreyColor,
			}),
			rule(".HyperMD-header:has(.cm-strikethrough) .cm-strikethrough", {
				color: "inherit",
				"text-decoration": "line-through",
			}),
			rule(".HyperMD-header:has(del)", { color: s.strikeHeadingGreyColor }),
			rule(".HyperMD-header:has(del) del", {
				color: "inherit",
				"text-decoration": "line-through",
			})
		);
	}

	if (s.activeLineEnabled) {
		const c = s.activeLineColor;
		const selectors: string[] = [];
		if (s.activeLineList) {
			selectors.push(".cm-line.cm-active.HyperMD-list-line");
		}
		if (s.activeLineParagraph) {
			selectors.push(
				".cm-line.cm-active:not(.HyperMD-header):not(.HyperMD-list-line)"
			);
		}
		if (s.activeLineHeading) {
			selectors.push(".cm-line.cm-active.HyperMD-header");
		}
		if (selectors.length > 0) {
			parts.push(rule(selectors.join(",\n"), { color: c }));
		}
	}

	if (s.activeStrikeHideEnabled) {
		const c = s.activeStrikeColor;
		const scope = ".cm-line.cm-active";
		parts.push(
			rule(`${scope} .cm-strikethrough,\n${scope} del`, {
				"text-decoration": "none",
				color: c,
			}),
			rule(`${scope} .cm-inline-code`, {
				"background-color": s.inlineCodeBackground,
			})
		);
	}

	if (s.emphasisEnabled) {
		parts.push(
			rule(".cm-em,\n.markdown-preview-view em", {
				color: s.emphasisItalicColor,
				"font-style": s.emphasisItalicUnslant ? "normal" : false,
			}),
			rule(".cm-strong,\n.markdown-preview-view strong", {
				color: s.emphasisBoldColor,
				"font-weight": "bold",
			}),
			rule(".markdown-preview-view strong em,\n.markdown-preview-view em strong,\n.cm-em.cm-strong", {
				color: s.emphasisItalicColor,
			}),
			rule(".cm-strikethrough,\n.markdown-preview-view del,\n.markdown-preview-view s", {
				color: s.emphasisStrikeColor,
				"text-decoration": "line-through",
			}),
			// Headings keep their line-through but take their own colour.
			rule(
				LEVELS.map((n) => `.markdown-preview-view h${n} del,\n.markdown-preview-view h${n} s`).join(",\n"),
				{ color: s.headingStrikeColor }
			),
			rule(".cm-s-obsidian .cm-header.cm-strikethrough", {
				color: s.headingStrikeColor,
			})
		);
	}

	if (s.inlineCodeEnabled) {
		parts.push(
			rule(".cm-inline-code", {
				"background-color": s.inlineCodeBackground,
			}),
			rule(".markdown-rendered :not(pre) > code", {
				"background-color": s.inlineCodeBackground,
			})
		);

		if (s.inlineCodeFollowLevel) {
			// Reuse the list greyscale so inline code reads as part of its level.
			const levels = [s.listColor1, s.listColor2, s.listColor3];
			const pick = (level: number): string =>
				levels[Math.min(level, 3) - 1];
			for (const level of LEVELS) {
				parts.push(
					rule(`${CM_LIST(level)} .cm-inline-code`, {
						color: pick(level),
					}),
					rule(readingListInner("ul", level, ":not(pre) > code"), {
						color: pick(level),
					}),
					rule(readingListInner("ol", level, ":not(pre) > code"), {
						color: pick(level),
					})
				);
			}
		}

		// Emphasis combinations override the level colour, matching the order
		// the original snippets relied on.
		parts.push(
			rule(".cm-em .cm-inline-code,\n.cm-inline-code.cm-em,\n.markdown-rendered em > code,\n.markdown-rendered code em", {
				color: s.inlineCodeEmColor,
			}),
			rule(".cm-strikethrough .cm-inline-code,\n.cm-inline-code.cm-strikethrough,\n.markdown-rendered del > code,\n.markdown-rendered code del", {
				color: s.inlineCodeStrikeColor,
			}),
			rule(".cm-strong .cm-inline-code,\n.cm-inline-code.cm-strong,\n.markdown-rendered strong > code,\n.markdown-rendered code strong", {
				color: s.inlineCodeStrongColor,
				"font-weight": "bold",
			}),
			rule(".cm-strong.cm-em .cm-inline-code,\n.cm-em.cm-strong .cm-inline-code,\n.cm-inline-code.cm-strong.cm-em,\n.markdown-rendered strong > em > code,\n.markdown-rendered em > strong > code", {
				color: s.inlineCodeEmColor,
				"font-weight": "bold",
			})
		);
	}

	return section("文字与强调 / Text & emphasis", join(parts));
}

/**
 * List sizes, greyscale, the unordered-list rule, markers, and spacing.
 *
 * @param s - Settings.
 * @returns The section.
 */
function listSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.listSizeEnabled) {
		const sizes = LEVELS.map((i) =>
			Math.max(s.listSizeBase - s.listSizeStep * (i - 1), s.listSizeMin)
		);
		LEVELS.forEach((level, i) => {
			const size = em(sizes[i]);
			parts.push(
				rule(
					`${readingList("ul", level)},\n${readingList("ol", level)}`,
					{ "font-size": size }
				),
				rule(CM_EDITOR_LIST(level), { "font-size": size })
			);
		});
	}

	if (s.listColorEnabled) {
		const colours = [s.listColor1, s.listColor2, s.listColor3];
		LEVELS.forEach((level, i) => {
			const c = colours[Math.min(i, 2)];
			parts.push(
				rule(
					`${readingList("ul", level)},\n${readingList("ol", level)}`,
					{ color: c }
				),
				rule(CM_EDITOR_LIST(level), { color: c })
			);
		});
	}

	if (s.ulLineEnabled) {
		parts.push(
			rule(".markdown-preview-view ul:not(ul ul)", {
				"border-left": `${px(s.ulLineWidth)} solid ${s.ulLineColor}`,
				"padding-left": em(s.ulLinePaddingRead),
			}),
			rule(
				".markdown-source-view.mod-cm6 .HyperMD-list-line:has(.cm-formatting-list-ul)",
				{
					"border-left": `${px(s.ulLineWidth)} solid ${s.ulLineColor}`,
					"margin-left": "0",
				}
			),
			rule(
				".markdown-source-view.mod-cm6 .HyperMD-list-line-1:has(.cm-formatting-list-ul)",
				{ "padding-left": em(s.ulLinePaddingEdit), "text-indent": "0" }
			)
		);
	}

	if (s.ulMarkerHideEnabled) {
		parts.push(
			// Reading view: drop the bullets entirely, the rule replaces them.
			rule(".markdown-preview-view ul > li", {
				"list-style": "none",
				"list-style-type": "none",
				"list-style-image": "none",
				margin: "0",
				padding: "0",
				"text-indent": "0",
			}),
			// Live Preview: hide the bullet on the line you are NOT editing,
			// and bring it back on the active line so it stays editable.
			rule(
				".markdown-source-view.mod-cm6 .HyperMD-list-line-1:has(.cm-formatting-list-ul):not(.cm-active) .cm-formatting-list-ul",
				{
					display: "inline-block",
					width: "0",
					overflow: "hidden",
					padding: "0",
					margin: "0",
					"font-size": "0",
					color: "transparent",
					"pointer-events": "none",
				}
			),
			rule(
				".markdown-source-view.mod-cm6 .HyperMD-list-line-1:has(.cm-formatting-list-ul).cm-active .cm-formatting-list-ul",
				{
					display: "inline-block",
					width: "auto",
					overflow: "visible",
					padding: "0 0.2em 0 0",
					margin: "0",
					"font-size": "inherit",
					color: "inherit",
					"pointer-events": "auto",
				}
			)
		);
	}

	if (s.olRainbowEnabled) {
		// Ordered markers take the rainbow, in reading view and in Live Preview.
		for (let i = 0; i < s.olRainbowColors.length; i++) {
			const level = i + 1;
			const c = s.olRainbowColors[i];
			parts.push(
				rule(readingMarker("ol", level), { color: c }),
				rule(`.cm-s-obsidian ${CM_LIST(level)} .cm-formatting-list`, {
					color: c,
				}),
				rule(`.cm-s-obsidian ${CM_LIST(level)} .cm-variable-2`, {
					color: c,
				})
			);
		}
	}

	if (s.ulMarkerColorEnabled) {
		// Emitted AFTER the ordered rules above: `.cm-formatting-list` also
		// matches unordered markers, so this is what keeps them neutral.
		for (let level = 1; level <= 4; level++) {
			parts.push(
				rule(readingMarker("ul", level), { color: s.ulMarkerColor }),
				rule(
					`.cm-s-obsidian ${CM_LIST(level)} .cm-formatting-list-ul`,
					{ color: s.ulMarkerColor }
				)
			);
		}
	}

	if (s.listSpacingEnabled) {
		parts.push(
			rule(
				".markdown-source-view.mod-cm6 .HyperMD-list-line:has(.cm-formatting-list-ul, .cm-formatting-list-ol)",
				{ "margin-top": em(s.listSpacingMarginTop) }
			)
		);
	}

	if (s.nestedUlIndentEnabled) {
		parts.push(
			rule(".markdown-preview-view ul ul", {
				"padding-left": em(s.nestedUlIndent),
			})
		);
	}

	return section("列表 / Lists", join(parts));
}

/**
 * Heading colours, the dashed leaders, and the file title.
 *
 * @param s - Settings.
 * @returns The section.
 */
function headingSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.headingColorEnabled) {
		LEVELS.forEach((level, i) => {
			parts.push(
				rule(
					`.cm-header-${level},\n.markdown-preview-view h${level}`,
					{ color: s.headingColors[i] }
				)
			);
		});
	}

	if (s.dashEnabled) {
		LEVELS.forEach((level, i) => {
			if (!s.dashLevels[i]) return;
			const color = s.dashColors[i];
			const thickness = s.dashThickness[i];
			const gradient = dashGradient(color, thickness, s.dashGapRatio);
			const after = {
				content: '""',
				flex: "1",
				height: px(thickness),
				"margin-left": px(12),
				"background-image": gradient,
			};

			parts.push(
				rule(`.markdown-preview-view h${level}`, {
					display: "flex",
					"align-items": "center",
					width: "100%",
				}),
				rule(`.markdown-preview-view h${level}::after`, after),
				rule(`.cm-line:has(.cm-header-${level})`, {
					display: "flex",
					"align-items": "center",
					width: "100%",
				}),
				rule(`.cm-line:has(.cm-header-${level}) > .cm-header-${level}`, {
					margin: "0",
					padding: "0",
					display: "inline",
				})
			);

			// In Live Preview the leader is hidden on the line being edited, so
			// the heading text does not jump while typing.
			const active = s.dashHideOnActive ? ":not(.cm-active)" : "";
			parts.push(
				rule(`.cm-line:has(.cm-header-${level})${active}::after`, after)
			);
		});
	}

	if (s.inlineTitleEnabled) {
		parts.push(
			rule(".inline-title", {
				color: s.inlineTitleFollowH1
					? s.headingColors[0]
					: s.inlineTitleColor,
				"font-size": em(s.inlineTitleSize),
				"font-weight": s.inlineTitleBold ? "bold" : false,
			})
		);
	}

	return section("标题 / Headings", join(parts));
}

/**
 * Link decorations in the body and inside headings.
 *
 * @param s - Settings.
 * @returns The section.
 */
function linkSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.linkUnderlineEnabled) {
		const shared = {
			"text-decoration": `underline ${s.linkUnderlineStyle}`,
			"text-decoration-thickness": px(s.linkUnderlineThickness),
			"text-underline-offset": px(s.linkUnderlineOffset),
			"border-bottom": "none",
			"background-image": "none",
		};
		parts.push(
			rule(
				".markdown-rendered a.internal-link,\n.markdown-rendered a.external-link,\n.markdown-rendered a",
				shared
			),
			rule(
				".cm-hmd-internal-link,\n.cm-hmd-internal-link .cm-underline,\n.cm-link,\n.cm-link .cm-underline,\n.cm-url",
				shared
			)
		);
	}

	if (s.headingLinkEnabled) {
		const shared = {
			"text-decoration": `underline ${s.headingLinkStyle}`,
			"text-decoration-thickness": px(s.headingLinkThickness),
			"text-underline-offset": px(s.headingLinkOffset),
			"border-bottom": "none",
		};
		parts.push(
			rule(
				LEVELS.map(
					(n) => `.markdown-rendered h${n} a.internal-link`
				).join(",\n"),
				shared
			),
			rule(
				LEVELS.map(
					(n) => `.HyperMD-header-${n} .cm-hmd-internal-link`
				).join(",\n"),
				shared
			)
		);
	}

	if (s.activeLinkHideEnabled) {
		parts.push(
			rule(
				".cm-active.cm-line .cm-hmd-internal-link,\n.cm-active.cm-line .cm-hmd-internal-link .cm-underline,\n.cm-active.cm-line .cm-link,\n.cm-active.cm-line .cm-link .cm-underline,\n.cm-active.cm-line .cm-url",
				{
					"text-decoration": "none",
					"border-bottom": "none",
					"background-image": "none",
				}
			)
		);
	}

	return section("链接 / Links", join(parts));
}

/**
 * Callout text, emphasis, compactness, zoom, list greyscale, inline code and
 * the active line.
 *
 * @param s - Settings.
 * @returns The section.
 */
function calloutSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.calloutTextEnabled) {
		parts.push(
			rule(".callout,\n.callout .callout-content", {
				color: s.calloutTextColor,
			})
		);
	}

	if (s.calloutEmphasisEnabled) {
		parts.push(
			rule(".callout .cm-strikethrough,\n.callout del,\n.callout s", {
				color: s.calloutStrikeColor,
				"text-decoration": "line-through",
			}),
			rule(".callout .cm-em,\n.callout em", {
				color: s.calloutItalicColor,
				"font-style": s.calloutItalicUnslant ? "normal" : false,
			}),
			rule(".callout .cm-strong,\n.callout strong", {
				color: s.calloutBoldColor,
				"font-weight": "bold",
			}),
			rule(".callout strong em,\n.callout em strong,\n.callout .cm-strong.cm-em", {
				color: s.calloutItalicColor,
			})
		);
	}

	if (s.calloutCompactEnabled) {
		const m = em(s.calloutCompactMargin);
		const p = em(s.calloutCompactPadding);
		parts.push(
			rule(".callout.is-collapsed", {
				"margin-top": m,
				"margin-bottom": m,
				"padding-top": p,
				"padding-bottom": p,
				"min-height": "0",
				"line-height": "1.2",
				border: "none",
				"box-shadow": "none",
			}),
			rule(".callout:not(.is-collapsed)", {
				"margin-top": m,
				"margin-bottom": m,
				"padding-top": p,
				"padding-bottom": p,
			}),
			rule(".callout:not(.is-collapsed) .callout-content", {
				"padding-top": "0.2em",
				"padding-bottom": "0.4em",
			})
		);
	}

	if (s.calloutTitleEnabled) {
		parts.push(
			rule(".callout.is-collapsed .callout-title,\n.callout:not(.is-collapsed) .callout-title", {
				"font-size": s.calloutTitleSize,
				padding: "0.1em 0.3em",
				"line-height": "1.2",
				background: "transparent",
			}),
			rule(".callout.is-collapsed .callout-title code,\n.callout:not(.is-collapsed) .callout-title code", {
				color: "#7f7f7f",
			})
		);
	}

	if (s.calloutZoomEnabled) {
		parts.push(
			rule(".callout .callout-title", { zoom: num(s.calloutZoomTitle) }),
			rule(".callout:not(.is-collapsed) .callout-content", {
				zoom: num(s.calloutZoomContent),
			})
		);
	}

	if (s.calloutListColorEnabled) {
		const outer = s.calloutListColorOuter;
		const inner = s.calloutListColorInner;
		// Reading view keeps a two-step greyscale.
		parts.push(rule(calloutLists([1, 2]), { color: outer }));
		parts.push(rule(calloutLists([3, 4, 5, 6]), { color: inner }));
		// Live Preview: the original flattened every level to the inner colour.
		parts.push(
			rule(
				LEVELS.map((n) => `.callout ${CM_LIST(n)}`).join(",\n"),
				{ color: inner }
			)
		);
	}

	if (s.calloutCodeColorEnabled) {
		parts.push(
			rule(
				LEVELS.map((n) => `.callout ${CM_LIST(n)} .cm-inline-code`).join(",\n"),
				{ color: s.calloutCodeColor }
			),
			rule(
				[1, 2, 3, 4, 5, 6]
					.flatMap((n) => [
						`${calloutList("ul", n)} > code`,
						`${calloutList("ol", n)} > code`,
					])
					.join(",\n"),
				{ color: s.calloutCodeColor }
			),
			rule(".callout code:not(li > code)", { color: s.calloutCodeColor }),
			// Emphasis still wins over the plain callout code colour.
			rule(".callout .cm-em .cm-inline-code,\n.callout .cm-inline-code.cm-em,\n.callout em > code,\n.callout code em", {
				color: s.calloutItalicColor,
			}),
			rule(".callout .cm-strikethrough .cm-inline-code,\n.callout .cm-inline-code.cm-strikethrough,\n.callout del > code,\n.callout code del", {
				color: s.calloutStrikeColor,
			}),
			rule(".callout .cm-strong .cm-inline-code,\n.callout .cm-inline-code.cm-strong,\n.callout strong > code,\n.callout code strong", {
				color: s.calloutCodeColor,
				"font-weight": "bold",
			})
		);
	}

	if (s.calloutActiveStrikeEnabled) {
		parts.push(
			rule(".callout .cm-line.cm-active .cm-strikethrough", {
				"text-decoration": "none",
				color: s.calloutActiveColor,
			}),
			rule(".callout .cm-line.cm-active", { color: s.calloutActiveColor }),
			rule(".callout .CodeMirror-activeline .cm-strikethrough", {
				"text-decoration": "none",
				color: s.calloutActiveColor,
			})
		);
	}

	return section("Callout", join(parts));
}

/**
 * Code block background, font sizes, and syntax colours.
 *
 * @param s - Settings.
 * @returns The section.
 */
function codeSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.codeBackgroundEnabled) {
		parts.push(
			rule(".cm-s-obsidian", { "--code-background": s.codeBackground })
		);
		if (s.codeBackgroundReading) {
			parts.push(
				rule(".markdown-rendered", { "--code-background": s.codeBackground })
			);
		}
	}

	if (s.codeBlockFontSizeEnabled) {
		const size = em(s.codeBlockFontSize);
		parts.push(
			rule(".markdown-preview-view pre code", { "font-size": size }),
			rule(".callout pre code", { "font-size": "inherit" }),
			rule(".cm-s-obsidian .HyperMD-codeblock", { "font-size": size }),
			rule(".callout .HyperMD-codeblock", { "font-size": "inherit" })
		);
	}

	if (s.codeSizeVarEnabled) {
		parts.push(rule("body", { "--code-size": em(s.codeSizeVar) }));
	}

	if (s.codeTokenEnabled) {
		parts.push(
			rule("span.cm-comment", { color: s.codeTokenComment }),
			rule("span.cm-keyword", { color: s.codeTokenKeyword }),
			rule("span.cm-string", { color: s.codeTokenString }),
			rule("span.cm-builtin", { color: s.codeTokenBuiltin }),
			rule("span.cm-variable", { color: s.codeTokenVariable })
		);
	}

	return section("代码块 / Code", join(parts));
}

/**
 * Ribbon, block ids, Canvas, and Kanban.
 *
 * @param s - Settings.
 * @returns The section.
 */
function uiSection(s: StyleToolkitSettings): string {
	const parts: Array<string | false> = [];

	if (s.ribbonWidthEnabled) {
		parts.push(rule("body", { "--ribbon-width": px(s.ribbonWidth) }));
	}

	if (s.ribbonIconSizeEnabled) {
		parts.push(
			rule(".side-dock-ribbon svg", {
				height: px(s.ribbonIconSize),
				width: px(s.ribbonIconSize),
			})
		);
	}

	if (s.ribbonSpacingEnabled) {
		parts.push(
			rule(".side-dock-ribbon", { gap: "0" }),
			rule(".side-dock-ribbon-action", {
				height: "auto",
				"min-height": "0",
				"padding-top": px(s.ribbonPaddingTop),
				"padding-bottom": px(s.ribbonPaddingBottom),
				"margin-top": "0",
				"margin-bottom": "0",
				"line-height": "1",
			}),
			rule(".side-dock-ribbon-action svg", { display: "block" })
		);
	}

	if (s.blockIdEnabled) {
		parts.push(
			rule(".cm-blockid", {
				color: s.blockIdColor,
				opacity: num(s.blockIdOpacity),
				"font-size": em(s.blockIdFontSize),
			}),
			rule(".cm-blockid:hover", {
				opacity: num(s.blockIdHoverOpacity),
				color: s.blockIdHoverColor,
			})
		);
	}

	if (s.hidePinIconEnabled) {
		parts.push(
			rule(".workspace-tab-header-status-icon.mod-pinned", {
				display: "none",
			})
		);
	}

	if (s.canvasHideMenuEnabled) {
		parts.push(rule(".canvas-card-menu", { display: "none" }));
	}

	if (s.canvasHideEmbedTitleEnabled) {
		parts.push(
			rule(".canvas-node .markdown-embed .embed-title,\n.canvas-node .markdown-preview-view .inline-title", {
				display: "none",
			})
		);
	}

	if (s.kanbanScaleEnabled) {
		// Scaling down leaves the original footprint filled by enlarging the
		// box by the inverse, so the board still scrolls edge to edge.
		parts.push(
			rule(".kanban-plugin", {
				transform: `scale(${num(s.kanbanScale)})`,
				"transform-origin": "top left",
				width: `calc(100% / ${num(s.kanbanScale)})`,
				height: `calc(100% / ${num(s.kanbanScale)})`,
				overflow: "auto",
			})
		);
	}

	return section("界面 / Interface", join(parts));
}

/**
 * Builds the complete stylesheet for a settings object.
 *
 * @param s - Settings.
 * @returns CSS text, ready to drop into a `<style>` element.
 */
export function buildCss(s: StyleToolkitSettings): string {
	if (!s.masterEnabled) {
		return "/* Style Toolkit: disabled */\n";
	}

	const blocks = [
		s.groupText && textSection(s),
		s.groupList && listSection(s),
		s.groupHeading && headingSection(s),
		s.groupLink && linkSection(s),
		s.groupCallout && calloutSection(s),
		s.groupCode && codeSection(s),
		s.groupUi && uiSection(s),
	].filter((b): b is string => Boolean(b && b.trim()));

	return (
		"/* Style Toolkit -- generated from your settings. Edits here are overwritten. */\n\n" +
		blocks.join("\n\n\n") +
		"\n"
	);
}
