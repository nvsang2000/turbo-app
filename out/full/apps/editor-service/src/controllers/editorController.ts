import { parseSafe } from '@/utils/helper';
import { renderHTML } from '@/utils/renderHTML';
import { t, type Static } from 'elysia';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';
import htmlToPdfmake from 'html-to-pdfmake';
import { JSDOM } from 'jsdom';
import { minify } from 'html-minifier';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { fromBase64 } from 'pdf2pic';
import { PDFDocument } from 'pdf-lib';
(pdfMake as any).addVirtualFileSystem(pdfFonts);

import { renderPDFMake } from '@/utils/renderPDFMake';

export const convertHTMLSchema = t.Object({
	content: t.String({ minLength: 1, error: 'Content must not be empty' }),
});

export const convertHtmlHandler = async ({
	body,
}: {
	body: Static<typeof convertHTMLSchema>;
}) => {
	const { content } = body;
	const parserContent = parseSafe(content);
	if (!parserContent) throw { status: 400, message: 'Cannot parse editor JSON' };

	try {
		const result = renderHTML(parserContent);
		if (!result) throw { status: 400, message: 'Unable to render HTML' };
		return {
			success: true,
			message: 'Successfully',
			data: result,
		};
	} catch (e) {
		throw {
			status: 500,
			message: 'Error server!',
			error: (e as Error).message,
		};
	}
};

export const convertPDFSchema = t.Object({
	content: t.String({ minLength: 1, error: 'Content must not be empty' }),
	width: t.Optional(
		t.Number({
			minimum: 100,
			error: 'Width must be greater than 100 mm',
		}),
	),
	height: t.Optional(
		t.Number({
			minimum: 100,
			error: 'Height must be greater than 100 mm',
		}),
	),
	margin: t.Optional(
		t.Number({
			minimum: 0,
			error: 'Margin must be a positive number',
		}),
	),
});

export const convertPdfHandler = async ({
	body,
}: {
	body: Static<typeof convertPDFSchema>;
}) => {
	const { height, width, margin } = body;

	const { data } = await convertHtmlHandler({ body });
	if (!data) throw { status: 400, message: 'Unable to render HTML' };

	try {
		const { window } = new JSDOM('');
		const minified = minify(data, { collapseWhitespace: true });
		const pdfContent = htmlToPdfmake(minified, { window, tableAutoSize: true });

		const docDefinition = {
			pageSize: height || width ? { width, height, unit: 'mm' } : 'A5',
			pageMargins: margin ? margin : [5, 5, 5, 5],
			content: pdfContent,
			defaultStyle: { font: 'Roboto', fontSize: 7 },
			styles: {
				tableHeader: {
					widths: ['*', 'auto', 100, '*'],
				},
			},
		} as TDocumentDefinitions;

		const buffer = await new Promise<Buffer>((resolve, reject) => {
			pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
				if (buffer) return resolve(buffer);
				reject(new Error('DPF buffer error'));
			});
		});

		return {
			success: true,
			message: 'Successfully',
			data: buffer.toString('base64'),
		};
	} catch (e) {
		throw {
			status: 500,
			message: 'Error server!',
			error: (e as Error).message,
		};
	}
};

export async function convertPdfToImgHandler({
	body,
}: {
	body: Static<typeof convertPDFSchema>;
}) {
	try {
		const { data: pdfBase64 } = await convertPdfHandler({ body });
		if (typeof pdfBase64 !== 'string') {
			throw { status: 400, message: 'Unable to render PDF' };
		}
		const pdfBuffer = Buffer.from(pdfBase64, 'base64');
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const page = pdfDoc.getPage(0);
		const { width: ptWidth, height: ptHeight } = page.getSize();

		const dpi = 300;
		const scale = dpi / 72;
		const pxWidth = Math.round(ptWidth * scale);
		const pxHeight = Math.round(ptHeight * scale);

		const converter = fromBase64(pdfBase64, {
			density: dpi,
			format: 'jpg',
			width: pxWidth,
			height: pxHeight,
		});

		const outputs = await converter.bulk(-1, {
			responseType: 'base64',
		});

		const result = outputs.map((o) => o.base64);

		return {
			success: true,
			message: 'Successfully',
			data: result,
		};
	} catch (e) {
		throw {
			status: 500,
			message: 'Error server!',
			error: (e as Error).message,
		};
	}
}

export const convertJsonToPdfMake = async ({
	body,
}: {
	body: Static<typeof convertHTMLSchema>;
}) => {
	const { content } = body;

	const parsed = parseSafe(content);
	if (!parsed) {
		throw { status: 400, message: 'Cannot parse editor JSON' };
	}

	try {
		const pdfContent = renderPDFMake(parsed);

		const docDefinition = {
			pageSize: 'A4' as any,
			pageMargins: [40, 60, 40, 60],
			defaultStyle: { font: 'Roboto', fontSize: 12 },
			content: pdfContent,
		} as TDocumentDefinitions;

		const buffer: Buffer = await new Promise((resolve, reject) => {
			pdfMake.createPdf(docDefinition).getBuffer((buf: Buffer) => {
				if (buf) resolve(buf);
				else reject(new Error('PDF buffer error'));
			});
		});

		const base64 = buffer.toString('base64');
		console.log('Successfully');

		return {
			success: true,
			message: 'Successfully created PDF',
			data: base64,
		};
	} catch (e) {
		console.log('error', e);
		throw {
			status: 500,
			message: 'Error generating PDF',
			error: (e as Error).message,
		};
	}
};
