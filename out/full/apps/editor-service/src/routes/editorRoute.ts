import { Elysia } from 'elysia';
import {
	convertPDFSchema,
	convertHtmlHandler,
	convertPdfHandler,
	convertHTMLSchema,
	convertPdfToImgHandler,
	convertJsonToPdfMake,
} from '@/controllers/editorController';

export const editorRouter = new Elysia();

editorRouter.post('/convert/html', convertHtmlHandler, {
	body: convertHTMLSchema,
});

editorRouter.post('/convert/pdf', convertPdfHandler, {
	body: convertPDFSchema,
});

editorRouter.post('/convert/img', convertPdfToImgHandler, {
	body: convertPDFSchema,
});

editorRouter.post('/convert/jsontopdf', convertJsonToPdfMake, {
	body: convertPDFSchema,
});
