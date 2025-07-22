type VariableMap = Record<string, string | any>;
type EditorBlock = {
	id: string;
	type: string;
	data: any;
	tunes?: any;
};
type EditorData = {
	time: number;
	version: string;
	blocks: EditorBlock[];
};

const TAG_REGEX =
	/<tag\b(?=[^>]*\bclass=["']cdx-variable["'])[^>]*>([\s\S]*?)<\/tag>/gi;

function extractVariables(text: string): string[] {
	const matches = [...text.matchAll(TAG_REGEX)];
	return matches.map((m: any) => m[1].trim());
}

function replaceTextWithArray(
	text: string,
	variables: VariableMap,
	index: number,
): string {
	return text.replace(TAG_REGEX, (fullMatch, innerHtml) => {
		if (/<\/?[a-z][\s\S]*?>/i.test(innerHtml)) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(innerHtml, 'text/html');
			const tag = doc.body.firstElementChild;

			if (tag && tag.textContent) {
				const key = tag.textContent.trim();
				const value = Array.isArray(variables[key])
					? variables[key][index]
					: variables[key];

				if (value !== undefined && value !== null) {
					tag.textContent = value;
					return tag.outerHTML;
				}

				return fullMatch;
			}
		}

		const key = innerHtml.trim();
		if (Array.isArray(variables[key])) {
			return variables[key][index] ?? fullMatch;
		}
		return variables[key] ?? fullMatch;
	});
}

function decodeHTMLEntities(text: string): string {
	const textarea = document.createElement('textarea');
	textarea.innerHTML = text;
	return textarea.value;
}

function replaceInText(text: string, variables: VariableMap): string {
	return text.replace(TAG_REGEX, (fullMatch, innerHtml) => {
		if (/<\/?[a-z][\s\S]*?>/i.test(innerHtml)) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(innerHtml, 'text/html');
			const tag = doc.body.firstElementChild;

			if (tag && tag.textContent) {
				const key = decodeHTMLEntities(tag.textContent || '').trim();

				const value = variables[key];

				if (value !== undefined && value !== null) {
					tag.textContent = value;
					return tag.outerHTML;
				}

				return fullMatch;
			}
		}

		const key = innerHtml.trim();
		return variables[key] ?? fullMatch;
	});
}

export function replaceVariables(
	editorData: EditorData,
	variables: VariableMap,
): EditorData {
	const newBlocks: EditorBlock[] = editorData.blocks.map((block) => {
		const cloned: EditorBlock = {
			...block,
			data: Array.isArray(block.data) ? [...block.data] : { ...block.data },
		};

		if (
			block.type === 'table' &&
			Array.isArray(block.data.content) &&
			block.data.content.every(
				(row) =>
					Array.isArray(row) && row.every((cell) => typeof cell === 'string'),
			)
		) {
			const allVars = block.data.content.flatMap((row) =>
				row.flatMap((cell) => extractVariables(cell)),
			);

			const arrayVars = Array.from(
				new Set(allVars.filter((key) => Array.isArray(variables[key]))),
			);

			if (arrayVars.length > 0) {
				const newContent: string[][] = [];

				for (const row of block.data.content) {
					const rowVars = row.flatMap((cell) => extractVariables(cell));
					const hasArrayVar = rowVars.some((v) => arrayVars.includes(v));

					if (hasArrayVar) {
						const longestLength = Math.max(
							...arrayVars.map((key: any) => variables[key].length),
						);
						for (let i = 0; i < longestLength; i++) {
							const newRow = row.map((cell) =>
								replaceTextWithArray(cell, variables, i),
							);
							newContent.push(newRow);
						}
					} else {
						const staticRow = row.map((cell) => replaceInText(cell, variables));
						newContent.push(staticRow);
					}
				}

				cloned.data.content = newContent;
				return cloned;
			} else {
				cloned.data.content = block.data.content.map((row) =>
					row.map((cell) => replaceInText(cell, variables)),
				);
				return cloned;
			}
		}

		for (const key in cloned.data) {
			const value = cloned.data[key];

			if (typeof value === 'string') {
				cloned.data[key] = replaceInText(value, variables);
			}

			if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
				cloned.data[key] = value.map((v) => replaceInText(v, variables));
			}
		}

		return cloned;
	});

	return {
		...editorData,
		blocks: newBlocks,
	};
}

export const initialData = {
	time: 1748485324880,
	blocks: [
		{
			id: 'dNGMhVZNUI',
			type: 'paragraph',
			data: {
				text:
					'<b><tag class="cdx-variable">Ten_Cua_Hang</tag>&nbsp;&nbsp;</b>| ĐT: +84987090298',
			},
			tunes: {
				alignText: {
					alignment: 'center',
				},
			},
		},
		{
			id: 'lfaLIk6WE7',
			type: 'paragraph',
			data: {
				text: '<b>PHIẾU TÍNH TIỀN</b>',
			},
			tunes: {
				alignText: {
					alignment: 'left',
				},
			},
		},
		{
			id: '1upShgVUu3',
			type: 'paragraph',
			data: {
				text:
					'<b><tag class="cdx-variable">Ten_Phong_Ban</tag></b>&nbsp; &nbsp;|&nbsp; <b><tag class="cdx-variable">Ma_Don_Hang</tag></b>',
			},
			tunes: {
				alignText: {
					alignment: 'left',
				},
			},
		},
		{
			id: 'LARoqEaQQq',
			type: 'table',
			data: {
				withHeadings: false,
				stretched: false,
				content: [
					['<b>Tên hàng</b>', '<b>Đ.Giá</b>', '<b>Thành tiền</b>'],
					[
						'<tag class="cdx-variable">Ten_Hang_Hoa</tag>',
						'<tag class="cdx-variable">Don_Gia</tag>&nbsp; X&nbsp; <tag class="cdx-variable"><b><i>So_Luong</i></b></tag>',
						'<tag class="cdx-variable">Thanh_Tien</tag>',
					],
					['<b>Tổng tiền hàng:</b>', '', '<b>163,000</b>'],
					['<b>Chiết khấu:</b>', '', '<b>100,000</b>'],
					['<b>Tổng Cộng:</b>', '', '<b>70,000</b>'],
				],
			},
			tunes: {
				alignText: {
					alignment: 'left',
				},
			},
		},
		{
			id: 'L7PaSNVUJh',
			type: 'paragraph',
			data: {
				text: 'Cảm ơn quý khách và hẹn gặp lại !!!',
			},
			tunes: {
				alignText: {
					alignment: 'right',
				},
			},
		},
	],
	version: '2.31.0-rc.7',
};
