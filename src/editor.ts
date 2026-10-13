/**
 * Installs the Live Preview half of the list-rule feature.
 *
 * `computeListRoots` answers "what kind of list does this line ultimately belong
 * to"; this module turns that answer into a CodeMirror line decoration so the
 * stylesheet can key off a class.
 *
 * ABOUT THE IMPORT
 * ----------------
 * The CodeMirror modules are pulled in with a guarded `require` rather than a
 * top-level import, for two reasons:
 *
 *   - they must be Obsidian's own instances. Obsidian publishes them to plugins
 *     through its module registry, and CodeMirror refuses decorations built from
 *     a second copy of `@codemirror/state` ("multiple instances ... breaking
 *     instanceof checks"). Bundling our own copy would therefore fail at
 *     runtime, which is exactly what `--packages=external` prevents.
 *   - if the registry ever changes, a top-level import would take the whole
 *     plugin down. Inside the try/catch, the feature degrades to the older
 *     marker-based rule instead and everything else keeps working.
 */

import { LIST_ROOT_CLASS, computeListRoots, splitLines, type ListRoot } from "./listroot";

/** A CodeMirror line, as much of it as is used here. */
interface CmLine {
	from: number;
	to: number;
	number: number;
}

/** A CodeMirror document. */
interface CmDoc {
	toString(): string;
	lineAt(position: number): CmLine;
}

/** A CodeMirror viewport. */
interface CmViewport {
	from: number;
	to: number;
}

/** A CodeMirror view, narrowed to what is used here. */
interface CmView {
	state: { doc: CmDoc };
	viewport: CmViewport;
}

/** The argument CodeMirror passes to a view plugin's `update`. */
interface CmUpdate {
	docChanged: boolean;
	viewportChanged: boolean;
	view: CmView;
}

/** Accumulates decorations in document order. */
interface CmBuilder {
	add(from: number, to: number, value: unknown): void;
	finish(): unknown;
}

/** The constructors taken from Obsidian's CodeMirror instances. */
interface CmApi {
	ViewPlugin: {
		fromClass(
			cls: new (view: CmView) => unknown,
			spec: { decorations: (instance: never) => unknown }
		): unknown;
	};
	Decoration: {
		line(spec: { class: string }): unknown;
	};
	RangeSetBuilder: new () => CmBuilder;
}

/**
 * Reads Obsidian's CodeMirror constructors out of its plugin module registry.
 *
 * @returns The constructors, or null when they are not available.
 */
function loadCodeMirror(): CmApi | null {
	try {
		const view = require("@codemirror/view") as Partial<CmApi> | undefined;
		const state = require("@codemirror/state") as
			| { RangeSetBuilder?: CmApi["RangeSetBuilder"] }
			| undefined;
		if (!view?.ViewPlugin || !view?.Decoration || !state?.RangeSetBuilder) {
			return null;
		}
		return {
			ViewPlugin: view.ViewPlugin,
			Decoration: view.Decoration,
			RangeSetBuilder: state.RangeSetBuilder,
		};
	} catch (error) {
		console.error(
			"[style-toolkit] CodeMirror 接口不可用，列表竖线退回按符号判断。",
			error
		);
		return null;
	}
}

/**
 * Builds the editor extension that marks lines by their outermost list kind.
 *
 * @returns The extension, or null when CodeMirror is unavailable.
 */
export function createListRootExtension(): unknown | null {
	const cm = loadCodeMirror();
	if (!cm) return null;

	const { ViewPlugin, Decoration, RangeSetBuilder } = cm;

	class ListRootDecorator {
		decorations: unknown = null;

		/** The document the analysis was computed from, for caching. */
		private analysed: CmDoc | null = null;

		/** One entry per line of `analysed`. */
		private roots: ListRoot[] = [];

		constructor(view: CmView) {
			this.rebuild(view);
		}

		update(update: CmUpdate): void {
			if (update.docChanged || update.viewportChanged) {
				this.rebuild(update.view);
			}
		}

		/**
		 * Recomputes the analysis when the text changed, then decorates the
		 * lines currently on screen.
		 *
		 * @param view - The editor view.
		 */
		private rebuild(view: CmView): void {
			const doc = view.state.doc;
			if (doc !== this.analysed) {
				this.analysed = doc;
				this.roots = computeListRoots(splitLines(doc.toString()));
			}

			const builder = new RangeSetBuilder();
			for (let pos = view.viewport.from; pos <= view.viewport.to; ) {
				const line = doc.lineAt(pos);
				if (this.roots[line.number - 1] === "ul") {
					builder.add(
						line.from,
						line.from,
						Decoration.line({ class: LIST_ROOT_CLASS })
					);
				}
				pos = line.to + 1;
			}
			this.decorations = builder.finish();
		}
	}

	return ViewPlugin.fromClass(
		ListRootDecorator as unknown as new (view: CmView) => unknown,
		{
			decorations: (instance: never) =>
				(instance as unknown as ListRootDecorator).decorations,
		}
	);
}
