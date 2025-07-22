import './index.css';
import type {
	BlockTool,
	BlockToolConstructorOptions,
	SanitizerConfig,
} from '@editorjs/editorjs';
import SignaturePad from 'signature_pad';

export interface SignatureImageData {
	url?: string;
	caption: string;
	withBorder: boolean;
	stretched: boolean;
	withBackground: boolean;
}

export default class SignatureAsImage implements BlockTool {
	static get toolbox() {
		return {
			title: 'Signature',
			icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M2 22l19.5-9L2 4v7l15.5 2L2 15z"/>
        </svg>`,
		};
	}

	static get isReadOnlySupported(): boolean {
		return true;
	}

	static get sanitize(): SanitizerConfig {
		return {
			url: false,
			caption: { html: true },
			withBorder: { type: 'boolean' },
			stretched: { type: 'boolean' },
			withBackground: { type: 'boolean' },
		};
	}

	private data: SignatureImageData;
	private wrapper!: HTMLElement;
	private modalOverlay?: HTMLDivElement;
	private pad?: SignaturePad;

	constructor({
		data,
	}: BlockToolConstructorOptions<Partial<SignatureImageData>>) {
		this.data = {
			url: data?.url,
			caption: data?.caption || '',
			withBorder: !!data?.withBorder,
			stretched: !!data?.stretched,
			withBackground: !!data?.withBackground,
		};
	}

	render(): HTMLElement {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('signature-image-block');
		this.redraw();
		return this.wrapper;
	}

	private redraw() {
		this.wrapper.innerHTML = '';
		if (this.data.url) {
			// Nếu đã có chữ ký, hiển thị ảnh + nút Edit
			const img = document.createElement('img');
			img.src = this.data.url;
			img.classList.add('signature-image');
			this.wrapper.appendChild(img);

			this.wrapper.appendChild(
				this.createButton('Edit Signature', 'btn-edit', () => this.openModal()),
			);
		} else {
			// Chưa có chữ ký, hiển thị nút Add
			this.wrapper.appendChild(
				this.createButton('Add Signature', 'btn-add', () => this.openModal()),
			);
		}
	}

	private openModal() {
		// 1. Tạo overlay
		this.modalOverlay = document.createElement('div');
		this.modalOverlay.classList.add('signature-modal-overlay');
		this.modalOverlay.innerHTML = `
  <div class="signature-modal">
    <canvas class="signature-modal-canvas"></canvas>
    <div class="signature-modal-controls">
      <button class="signature-btn btn-save">Save</button>
      <button class="signature-btn btn-clear">Clear</button>
      <button class="signature-btn btn-cancel">Cancel</button>
    </div>
  </div>
`;

		document.body.appendChild(this.modalOverlay);

		// 2. Khởi tạo SignaturePad
		const canvas = this.modalOverlay.querySelector<HTMLCanvasElement>(
			'.signature-modal-canvas',
		)!;
		canvas.width = 600;
		canvas.height = 400;
		this.pad = new SignaturePad(canvas);

		// Nếu đã có ảnh cũ, load lên
		if (this.data.url) {
			this.pad.fromDataURL(this.data.url);
		}

		// 3. Gắn sự kiện cho các nút
		this.modalOverlay
			.querySelector('.btn-save')!
			.addEventListener('click', () => this.onSave());
		this.modalOverlay
			.querySelector('.btn-clear')!
			.addEventListener('click', () => this.pad?.clear());
		this.modalOverlay
			.querySelector('.btn-cancel')!
			.addEventListener('click', () => this.onCancel());
	}

	private onSave() {
		if (this.pad && !this.pad.isEmpty()) {
			this.data.url = this.pad.toDataURL();
		} else {
			this.data.url = undefined;
		}
		this.closeModal();
		this.redraw();
	}

	private onCancel() {
		this.closeModal();
		this.redraw();
	}

	private closeModal() {
		if (this.pad) {
			this.pad.off(); // gỡ listener nội bộ
			this.pad = undefined;
		}
		if (this.modalOverlay) {
			this.modalOverlay.remove();
			this.modalOverlay = undefined;
		}
	}

	private createButton(
		text: string,
		className: string,
		onClick: () => void,
	): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = text;
		btn.classList.add('signature-btn', className);
		btn.addEventListener('click', onClick);
		return btn;
	}

	save(): SignatureImageData {
		return {
			url: this.data.url,
			caption: this.data.caption,
			withBorder: this.data.withBorder,
			stretched: this.data.stretched,
			withBackground: this.data.withBackground,
		};
	}

	validate(data: SignatureImageData): boolean {
		return data.url === undefined || typeof data.url === 'string';
	}
}
