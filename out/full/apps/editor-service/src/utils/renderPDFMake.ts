function parseInlineStyles(
	html: string,
): Array<{ text: string; bold?: boolean; italics?: boolean }> {
	const result: Array<{ text: string; bold?: boolean; italics?: boolean }> = [];

	const tagRe = /<\/?b>|<\/?i>/gi;
	let cursor = 0;
	let bold = false;
	let italics = false;
	let match: RegExpExecArray | null;

	while ((match = tagRe.exec(html))) {
		const idx = match.index;
		if (idx > cursor) {
			const text = html.slice(cursor, idx);
			result.push({
				text,
				...(bold && { bold: true }),
				...(italics && { italics: true }),
			});
		}

		const tag = match[0].toLowerCase();
		if (tag === '<b>') bold = true;
		else if (tag === '</b>') bold = false;
		else if (tag === '<i>') italics = true;
		else if (tag === '</i>') italics = false;

		cursor = tagRe.lastIndex;
	}

	if (cursor < html.length) {
		const text = html.slice(cursor);
		result.push({
			text,
			...(bold && { bold: true }),
			...(italics && { italics: true }),
		});
	}

	return result;
}

export function renderPDFMake(data: any) {
	const content: any[] = [];

	data.blocks.forEach((block: any) => {
		const { type, data: blkData, tunes } = block;
		const alignment = tunes?.alignText?.alignment || 'left';

		switch (type) {
			case 'header': {
				let fontSize = 16;
				switch (blkData.level) {
					case 1:
						fontSize = 22;
						break;
					case 2:
						fontSize = 20;
						break;
					case 3:
						fontSize = 18;
						break;
					case 4:
						fontSize = 16;
						break;
					case 5:
						fontSize = 14;
						break;
				}
				content.push({
					text: parseInlineStyles(blkData.text),
					fontSize,
					margin: [0, 5],
					alignment,
				});
				break;
			}

			case 'paragraph': {
				content.push({
					text: parseInlineStyles(blkData.text),
					margin: [0, 2],
					alignment,
				});
				break;
			}

			case 'signature': {
				const img = blkData.url || blkData.image;
				if (img?.startsWith('data:image')) {
					content.push({
						image: img,
						width: 150,
						margin: [0, 5],
						alignment,
					});
				}
				break;
			}

			case 'layout': {
				const cols = blkData.columns.map((col: any) => ({
					stack: col.blocks.map((inner: any) => {
						const innerAlign = inner.tunes?.alignText?.alignment || 'left';
						const innerData = inner.data || {};

						switch (inner.type) {
							case 'header':
								return {
									text: parseInlineStyles(innerData.text),
									bold: true,
									margin: [0, 5],
									alignment: innerAlign,
								};

							case 'paragraph':
								return {
									text: parseInlineStyles(innerData.text),
									margin: [0, 2],
									alignment: innerAlign,
								};

							case 'signature': {
								const { stretched = false, url, image } = innerData;
								const img = url || image;
								const w = stretched ? 400 : 200;

								if (img?.startsWith('data:image')) {
									return {
										image: img,
										width: w,
										margin: [0, 5],
										alignment: innerAlign,
									};
								}
								return {
									stack: [
										{
											text: '[sig_sj2l2jnf]',
											fontSize: 14,
											color: 'white',
											margin: [0, 100, 0, 0],
											alignment: innerAlign,
										},
									],
									margin: [0, 10],
									alignment: innerAlign,
								};
							}

							default:
								return '';
						}
					}),
				}));

				content.push({
					columns: cols,
					columnGap: 20,
					margin: [0, 10],
				});
				break;
			}
		}
	});

	return content;
}
