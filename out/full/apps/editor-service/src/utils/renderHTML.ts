export type Alignment = 'left' | 'center' | 'right';

export interface BlockData {
	id: string;
	data: any;
	type: string;
	tunes?: {
		alignText: {
			alignment: Alignment;
		};
	};
}

const sanitize = (raw: string): string => {
	const entityMap: any = {
		'&nbsp;': ' ',
		'&#160;': ' ',
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
		'&ndash;': '–',
		'&mdash;': '—',
		'&lsquo;': '‘',
		'&rsquo;': '’',
		'&ldquo;': '“',
		'&rdquo;': '”',
		'&hellip;': '…',
		'&copy;': '©',
		'&reg;': '®',
		'&trade;': '™',
		'&bull;': '•',
		'&middot;': '·',
	};

	return raw
		.replace(
			/&nbsp;|&#160;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&ndash;|&mdash;|&lsquo;|&rsquo;|&ldquo;|&rdquo;|&hellip;|&copy;|&reg;|&trade;|&bull;|&middot;/g,
			(match) => entityMap[match],
		)
		.replace(/;/g, '')
		.trim();
};

const getAlignmentStyle = (alignment?: Alignment): string =>
	alignment ? `text-align: ${alignment};` : '';

const renderHeader = (data: any, alignment?: Alignment): string => {
	const level = data?.level || 2;
	const text = sanitize(data?.text) || '';
	const style = [
		'font-weight: bold;',
		'margin: 1rem 0;',
		getAlignmentStyle(alignment),
	]
		.filter(Boolean)
		.join(' ');

	return `<h${level} style="${style}">${text}</h${level}>`;
};

const renderParagraph = (data: any, alignment?: Alignment): string => {
	const text = sanitize(data?.text) || '';
	const style = [getAlignmentStyle(alignment)].filter(Boolean).join(' ');
	return `<p style="${style}">${text}</p>`;
};

const renderList = (data: any, alignment?: Alignment): string => {
	if (!Array.isArray(data?.items)) return '';
	const tag = data.style === 'unordered' ? 'ul' : 'ol';
	const listStyle =
		tag === 'ul' ? 'list-style-type: disc;' : 'list-style-type: decimal;';
	const items = data.items
		.map(
			(it: string) =>
				`<li style="margin-left: 1.25rem; margin-bottom: 0.25rem;">${it}</li>`,
		)
		.join('');
	const style = [`margin: 0.5rem 0;`, getAlignmentStyle(alignment)]
		.filter(Boolean)
		.join(' ');

	return `<${tag} style="${listStyle} ${style}">${items}</${tag}>`;
};

const renderImage = (data: any, alignment?: Alignment): string => {
	const url = data?.file?.url || data?.url || '';
	const caption = data?.caption || '';
	if (!url) return '';

	const figStyle = [`margin: 1rem 0;`, getAlignmentStyle(alignment)]
		.filter(Boolean)
		.join(' ');
	const imgStyle =
		'display: block; margin: 0 auto; max-width: 100%; border-radius: 0.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
	const figcapStyle =
		'text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;';

	return `
    <figure style="${figStyle}">
      <img src="${url}" alt="${caption}" style="${imgStyle}" />
      <figcaption style="${figcapStyle}">${caption}</figcaption>
    </figure>`;
};

const renderQuote = (data: any, alignment?: Alignment): string => {
	const text = data?.text || '';
	const caption = data?.caption || '';
	const blockStyle = [
		'border-left: 4px solid #3b82f6;',
		'padding-left: 1rem;',
		'font-style: italic;',
		'color: #4b5563;',
		'margin: 1rem 0;',
		getAlignmentStyle(alignment),
	]
		.filter(Boolean)
		.join(' ');
	const citeStyle =
		'display: block; margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;';

	return `
    <blockquote style="${blockStyle}">
      <p>${text}</p>
      <cite style="${citeStyle}">— ${caption}</cite>
    </blockquote>`;
};

const renderCode = (data: any, alignment?: Alignment): string => {
	const code = data?.code || '';
	const preStyle = [
		'background-color: #1f2937;',
		'color: #ffffff;',
		'font-size: 0.875rem;',
		'padding: 1rem;',
		'border-radius: 0.25rem;',
		'margin: 1rem 0;',
		'overflow-x: auto;',
		getAlignmentStyle(alignment),
	]
		.filter(Boolean)
		.join(' ');

	return `<pre style="${preStyle}"><code>${code}</code></pre>`;
};

const renderDelimiter = (alignment?: Alignment): string => {
	const style = [
		`margin: 1.5rem 0;`,
		'border: none;',
		'border-top: 1px solid #e8e8eb;',
		getAlignmentStyle(alignment),
	]
		.filter(Boolean)
		.join(' ');

	return `<hr style="${style}" />`;
};

const renderChecklist = (data: any, alignment?: Alignment): string => {
	if (!Array.isArray(data?.items)) return '';
	const items = data.items
		.map((item: any) => {
			const checkbox = `<input type="checkbox" ${item.checked ? 'checked' : ''} disabled style="margin-right: 0.5rem;"/>`;
			return `<li style="display: flex; align-items: center; margin-bottom: 0.25rem;">${checkbox}<span>${item.text}</span></li>`;
		})
		.join('');
	const style = [`margin: 0.75rem 0;`, getAlignmentStyle(alignment)]
		.filter(Boolean)
		.join(' ');

	return `<ul style="${style}">${items}</ul>`;
};

const renderTable = (data: any, alignment?: Alignment): string => {
	if (!Array.isArray(data?.content)) return '';
	const rows = data.content
		.map((row: string[]) => {
			const cols = row
				.map((cell) => {
					return `<td style="padding: 0.5rem 1rem; border: 1px solid #e8e8eb">${sanitize(cell)}</td>`;
				})
				.join('');
			return `<tr>${cols}</tr>`;
		})
		.join('');
	const wrapperStyle = [
		`overflow-x: auto;`,
		'margin: 1rem 0;',
		getAlignmentStyle(alignment),
	]
		.filter(Boolean)
		.join(' ');
	const tableStyle =
		'width: 100%; table-layout:fixed; border-collapse: collapse; text-align: left;';

	return `
    <div style="${wrapperStyle}">
      <table style="${tableStyle}">${rows}</table>
    </div>`;
};

const renderEmbed = (data: any, alignment?: Alignment): string => {
	const url = data?.embed || '';
	const service = data?.service || '';
	const width = data?.width || 580;
	const height = data?.height || 320;
	if (!url || !service) return '';
	const wrapperStyle = [`margin: 1rem 0;`, getAlignmentStyle(alignment)]
		.filter(Boolean)
		.join(' ');
	const iframeStyle = `display: block; margin: 0 auto; max-width: 100%; aspect-ratio: ${width}/${height}; border-radius: 0.25rem;`;

	if (['youtube', 'vimeo'].includes(service)) {
		return `<div style="${wrapperStyle}"><iframe src="${url}" width="${width}" height="${height}" style="${iframeStyle}" frameborder="0" allowfullscreen></iframe></div>`;
	}

	const noticeStyle =
		'background-color: #fef3c7; color: #92400e; padding: 0.5rem; border-radius: 0.25rem;';
	return `<div style="${wrapperStyle} ${noticeStyle}">[Unsupported embed: ${service}]</div>`;
};

const renderMap: Record<string, (data: any, alignment?: Alignment) => string> =
	{
		header: renderHeader,
		paragraph: renderParagraph,
		list: renderList,
		image: renderImage,
		quote: renderQuote,
		code: renderCode,
		delimiter: () => renderDelimiter(),
		checklist: renderChecklist,
		table: renderTable,
		embed: renderEmbed,
	};

export const renderHTML = (editorData: any) => {
	if (!editorData || !Array.isArray(editorData.blocks)) return undefined;

	return editorData.blocks
		.map((block) => {
			const renderer = renderMap[block.type];
			const alignment = block.tunes?.alignText?.alignment;
			if (!renderer) {
				const style = getAlignmentStyle(alignment);
				return `<div style="color: #dc2626; ${style}">[Unsupported block: ${block.type}]</div>`;
			}
			return renderer(block.data, alignment);
		})
		.join('\n');
};

export const renderHTMLDocument = (content: any): string => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>
  body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 0; padding: 1rem; }
</style>
</head>
<body>
${content}
</body>
</html>`;
};
