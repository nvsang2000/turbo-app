type Alignment = 'left' | 'center' | 'right';

interface TuneData {
	alignment: Alignment;
}

interface TuneConstructorParams {
	api: any;
	data: Partial<TuneData>;
	block: {
		holder: HTMLElement;
		input: HTMLElement;
	};
}

export default class AlignText {
	static get isTune() {
		return true;
	}
	static get tuneName() {
		return 'alignText';
	}

	private api: any;
	private data: TuneData;
	private wrapperElement?: HTMLElement;

	private icons: Record<Alignment, string> = {
		left: `
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 6h18M3 12h12M3 18h18"/>
      </svg>`,
		center: `
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 6h12M3 12h18M6 18h12"/>
      </svg>`,
		right: `
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 6h18M12 12h12M6 18h18"/>
      </svg>`,
	};

	constructor({ api, data }: TuneConstructorParams) {
		this.api = api;
		this.data = { alignment: data?.alignment || 'left' };
	}

	render(): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add(this.api.styles.settings, 'flex', 'w-full');

		(['left', 'center', 'right'] as Alignment[]).forEach((align) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.innerHTML = this.icons[align];
			btn.setAttribute('aria-label', align);

			btn.classList.add(
				this.api.styles.settingsButton,
				'flex-1',
				'flex',
				'justify-center',
				'p-[10px]',
			);

			if (this.data.alignment === align) {
				btn.classList.add(this.api.styles.settingsButtonActive);
			}

			btn.addEventListener('click', () => {
				this.data.alignment = align;
				this.applyTune(this.data);
				this.updateButtonsUI(wrapper);
			});

			wrapper.appendChild(btn);
		});

		return wrapper;
	}

	wrap(blockContent: HTMLElement): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.classList.add(`text-${this.data.alignment}`);
		wrapper.appendChild(blockContent);
		this.wrapperElement = wrapper;
		return wrapper;
	}

	save(): TuneData {
		return this.data;
	}

	applyTune(data: TuneData) {
		this.data = data;
		if (!this.wrapperElement) return;

		this.wrapperElement.classList.remove(
			'text-left',
			'text-center',
			'text-right',
		);
		this.wrapperElement.classList.add(`text-${this.data.alignment}`);
	}

	private updateButtonsUI(wrapper: HTMLElement) {
		Array.from(wrapper.children).forEach((child, idx) => {
			const btn = child as HTMLElement;
			const align = (['left', 'center', 'right'] as Alignment[])[idx];
			const isActive = this.data.alignment === align;

			btn.classList.toggle(this.api.styles.settingsButtonActive, isActive);
		});
	}
}
