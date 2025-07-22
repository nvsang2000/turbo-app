import './index.css';
import EditorJS, {
	type BlockTool,
	type API,
	type BlockToolConstructorOptions,
	type OutputBlockData,
} from '@editorjs/editorjs';

import Paragraph from '@editorjs/paragraph';
import Header from '@editorjs/header';

// Custom tools
import Underline from '../Underline';
import Variable from '../Variable';
import Signature from '../Signature';
import debounce from 'lodash/debounce';
/** Interface cho dữ liệu Column */
interface ColumnData {
	blocks: OutputBlockData<string, any>[];
}

/** Các tool dùng cho nested editor */
const nestedTools = {
	header: { class: Header as any, inlineToolbar: true },
	paragraph: { class: Paragraph as any, inlineToolbar: true },
	underline: { class: Underline, inlineToolbar: true },
	variable: { class: Variable, inlineToolbar: true },
	signature: { class: Signature },
} as const;

export default class Layout implements BlockTool {
	static get toolbox() {
		return {
			title: 'Layout',
			icon: `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 4h7v16H4zM13 4h7v16h-7z"/></svg>`,
		};
	}

	static get isReadOnlySupported(): boolean {
		return true;
	}

	private api: API;
	private data: { columns: ColumnData[] };
	private container: HTMLDivElement;

	constructor({
		api,
		data,
	}: BlockToolConstructorOptions<{
		columns?: any;
		blocks?: OutputBlockData<string, any>[];
	}>) {
		this.api = api;

		const rawBlocks = Array.isArray((data as any).blocks)
			? (data as any).blocks
			: [];
		const rawColumns = Array.isArray((data as any).columns)
			? (data as any).columns
			: [];

		if (rawColumns.length) {
			this.data = {
				columns: rawColumns.map((c) => ({
					blocks: Array.isArray(c.blocks) ? c.blocks : [],
				})),
			};
		} else if (rawBlocks.length) {
			this.data = { columns: [{ blocks: rawBlocks }] };
		} else {
			this.data = { columns: [{ blocks: [] }, { blocks: [] }] };
		}

		this.container = document.createElement('div');
		this.container.classList.add('layout-grid');
	}

	render(): HTMLElement {
		this.container.innerHTML = '';

		this.data.columns.forEach((col, idx) => {
			const colEl = document.createElement('div');
			colEl.className = 'layout-col';
			colEl.style.position = 'relative';

			if (col.blocks.length === 0) {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.textContent = 'Add Content';
				btn.classList.add('col-content-btn');
				btn.addEventListener('click', () => this.openNestedEditor(idx));
				colEl.appendChild(btn);
			} else {
				const holder = document.createElement('div');
				// thêm lớp duy nhất theo idx để scope CSS
				const scopeClass = `col-preview-scope-${idx}`;
				holder.className = `col-preview-holder ${scopeClass}`;
				colEl.appendChild(holder);

				const previewEditor = new EditorJS({
					holder,
					readOnly: false, // vẫn cần false để signature tool hoạt động
					minHeight: 0,
					tools: nestedTools,
					data: {
						blocks: col.blocks,
						version: EditorJS.version,
					},

					onReady: () => {
						// Style chỉ ảnh hưởng tới holder có đúng scopeClass
						const style = document.createElement('style');
						style.textContent = `
							/* Ẩn toolbar/popover chỉ trong scope này */
							.${scopeClass} .ce-toolbar,
							.${scopeClass} .ce-popover,
							.${scopeClass} .ce-settings,
							.${scopeClass} .ce-inline-toolbox {
							display: none !important;
							}
						`;
						document.head.appendChild(style);
					},

					onChange: debounce(async () => {
						const output = await previewEditor.save();
						if (this.data.columns[idx]) {
							this.data.columns[idx].blocks = output.blocks;
						}
					}, 500),
				});

				const editOverlay = document.createElement('button');
				editOverlay.type = 'button';
				editOverlay.className = 'col-edit-overlay';
				editOverlay.innerHTML = '✏️';
				editOverlay.addEventListener('click', () => this.openNestedEditor(idx));
				colEl.appendChild(editOverlay);
			}

			this.container.appendChild(colEl);
		});

		return this.container;
	}

	private openNestedEditor(columnIndex: number): void {
		const column = this.data.columns[columnIndex];
		if (!column) {
			console.error(`Invalid columnIndex ${columnIndex}`);
			return;
		}

		const overlay = document.createElement('div');
		overlay.classList.add('editor-popup-overlay');
		overlay.innerHTML = `
			<div class="editor-popup">
				<div class="popup-editor-holder"></div>
				<div class="popup-actions">
				<button type="button" class="popup-cancel">Cancel</button>
				<button type="button" class="popup-save">Save</button>
				</div>
			</div>
			`;
		document.body.appendChild(overlay);

		const holder = overlay.querySelector<HTMLDivElement>('.popup-editor-holder')!;
		const nested = new EditorJS({
			holder,
			tools: nestedTools,
			autofocus: true,
			data: {
				blocks: column.blocks,
				version: EditorJS.version,
			},
		});

		overlay.querySelector('.popup-cancel')!.addEventListener('click', () => {
			nested.destroy();
			overlay.remove();
		});

		overlay.querySelector('.popup-save')!.addEventListener('click', async () => {
			const output = await nested.save();
			nested.destroy();
			overlay.remove();
			column.blocks = output.blocks;
			this.render();
		});
	}

	/** Lưu data thành cấu trúc { time, columns, version } */
	public save(): { time: number; columns: ColumnData[]; version: string } {
		return {
			time: Date.now(),
			columns: this.data.columns,
			version: EditorJS.version,
		};
	}

	/** Validate data trước khi load lại */
	public validate(savedData: any): boolean {
		return (
			typeof savedData?.time === 'number' &&
			Array.isArray(savedData.columns) &&
			savedData.columns.every(
				(c: any) => typeof c === 'object' && Array.isArray(c.blocks),
			) &&
			typeof savedData.version === 'string'
		);
	}
}
