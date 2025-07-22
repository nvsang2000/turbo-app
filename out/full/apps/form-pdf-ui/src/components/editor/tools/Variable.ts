/**
 * Build styles
 */
import '../style/index.css';
import type {
	API,
	InlineTool,
	SanitizerConfig,
	InlineToolConstructorOptions,
} from '@editorjs/editorjs';

/**
 * Underline Tool for the Editor.js
 *
 * Allows to wrap inline fragment and style it somehow.
 */
export default class Variable implements InlineTool {
	/**
	 * Class name for term-tag
	 *
	 * @type {string}
	 */
	static get CSS(): string {
		return 'cdx-variable';
	}

	/**
	 * Toolbar Button
	 *
	 * @type {HTMLButtonElement}
	 */
	private button: HTMLButtonElement | undefined;

	/**
	 * Tag represented the term
	 *
	 * @type {string}
	 */
	private tag: string = 'TAG'; //Thay đổi tên thẻ

	/**
	 * API InlineToolConstructorOptions
	 *
	 * @type {API}
	 */
	private api: API;

	/**
	 * CSS classes
	 *
	 * @type {object}
	 */
	private iconClasses: { base: string; active: string };

	/**
	 * @param options InlineToolConstructorOptions
	 */
	public constructor(options: InlineToolConstructorOptions) {
		this.api = options.api;

		/**
		 * CSS classes
		 */
		this.iconClasses = {
			base: this.api.styles.inlineToolButton,
			active: this.api.styles.inlineToolButtonActive,
		};
	}

	/**
	 * Specifies Tool as Inline Toolbar Tool
	 *
	 * @returns {boolean}
	 */
	public static isInline = true;

	/**
	 * Create button element for Toolbar
	 *
	 * @returns {HTMLElement}
	 */
	public render(): HTMLElement {
		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.classList.add(this.iconClasses.base);
		this.button.innerHTML = this.toolboxIcon;

		return this.button;
	}

	/**
	 * Wrap/Unwrap selected fragment
	 *
	 * @param {Range} range - selected fragment
	 */
	public surround(range: Range): void {
		if (!range) {
			return;
		}

		const termWrapper = this.api.selection.findParentTag(this.tag, Variable.CSS);

		/**
		 * If start or end of selection is in the highlighted block
		 */
		if (termWrapper) {
			this.unwrap(termWrapper);
		} else {
			this.wrap(range);
		}
	}

	/**
	 * Wrap selection with term-tag
	 *
	 * @param {Range} range - selected fragment
	 */
	public wrap(range: Range) {
		/**
		 * Create a wrapper for highlighting
		 */
		const tag = document.createElement(this.tag);

		tag.classList.add(Variable.CSS);

		/**
		 * SurroundContent throws an error if the Range splits a non-Text node with only one of its boundary points
		 *
		 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents}
		 *
		 * // range.surroundContents(span);
		 */
		tag.appendChild(range.extractContents());
		range.insertNode(tag);

		/**
		 * Expand (add) selection to highlighted block
		 */
		this.api.selection.expandToTag(tag);
	}

	/**
	 * Unwrap term-tag
	 *
	 * @param {HTMLElement} termWrapper - term wrapper tag
	 */
	public unwrap(termWrapper: HTMLElement): void {
		/**
		 * Expand selection to all term-tag
		 */
		this.api.selection.expandToTag(termWrapper);

		const sel = window.getSelection();
		if (!sel) {
			return;
		}
		const range = sel.getRangeAt(0);
		if (!range) {
			return;
		}

		const unwrappedContent = range.extractContents();
		if (!unwrappedContent) {
			return;
		}

		/**
		 * Remove empty term-tag
		 */
		termWrapper.parentNode?.removeChild(termWrapper);

		/**
		 * Insert extracted content
		 */
		range.insertNode(unwrappedContent);

		/**
		 * Restore selection
		 */
		sel.removeAllRanges();
		sel.addRange(range);
	}

	/**
	 * Check and change Term's state for current selection
	 */
	public checkState(): boolean {
		const termTag = this.api.selection.findParentTag(this.tag, Variable.CSS);

		this.button?.classList.toggle(this.iconClasses.active, !!termTag);

		return !!termTag;
	}

	/**
	 * Get Tool icon's SVG,  //Thay đổi icon trên inline toolbar
	 *
	 * @returns {string}
	 */
	public get toolboxIcon(): string {
		return `<?xml version="1.0" ?><svg height="32" id="icon" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1 { fill: none; } </style></defs><path d="M26,28H22V26h4V6H22V4h4a2.0021,2.0021,0,0,1,2,2V26A2.0021,2.0021,0,0,1,26,28Z"/><polygon points="20 11 18 11 16 14.897 14 11 12 11 14.905 16 12 21 14 21 16 17.201 18 21 20 21 17.098 16 20 11"/><path d="M10,28H6a2.0021,2.0021,0,0,1-2-2V6A2.0021,2.0021,0,0,1,6,4h4V6H6V26h4Z"/><rect class="cls-1" data-name="&lt;Transparent Rectangle&gt;" height="32" id="_Transparent_Rectangle_" width="32"/></svg>`;
	}
	/**
	 * Sanitizer rule
	 *
	 * @returns {{tag: {class: string}}}
	 */
	public static get sanitize(): SanitizerConfig {
		return {
			tag: {
				class: Variable.CSS,
			},
		};
	}
}
