import React, { useRef, useState } from 'react';
import {
	FormEditor,
	InlineToolBarDefault,
	type EditorHandle,
} from '@/components/editor';
import { Button } from '@repo/ui/button';
import axios from 'axios';
import { DATA } from '@/constant';
import PdfSignerLastPageDynamic from '@/components/pdf-viewer';
import { API_URL } from '@/config';

export default function EditorPage() {
	const editorRef = useRef<EditorHandle>(null);
	const [pdfBase64, setPdfBase64] = useState<string>('');

	const handleGeneratePdf = async () => {
		try {
			const data = await editorRef.current?.save();
			console.log(data);
			const payload = {
				width: 600,
				height: 900,
				margin: 10,
				content: JSON.stringify(data),
			};

			const url = `${API_URL}/editor/convert/jsontopdf`;
			const res = await axios.post(url, payload, {
				headers: { 'Content-Type': 'application/json' },
			});
			const rawField = (res.data as any).pdfBase64 ?? (res.data as any).data;
			if (!rawField || typeof rawField !== 'string') {
				console.error('Response does not contain Base64 PDF string:', res.data);
				return;
			}

			const commaIndex = rawField.indexOf(',');
			const base64Data =
				commaIndex > -1 ? rawField.slice(commaIndex + 1) : rawField;

			const base64PDF = `data:application/pdf;base64,${base64Data}`;
			setPdfBase64(base64PDF);
		} catch (err: any) {
			console.error('Lỗi khi generate PDF:', err);
			if (axios.isCancel(err)) return;
		}
	};

	return (
		<div className="container mx-auto p-5">
			<div>
				{pdfBase64 ? (
					<PdfSignerLastPageDynamic pdfUrl={pdfBase64} />
				) : (
					<p className="text-center">Not fund PDF!</p>
				)}
			</div>
			<div className="mt-[40px] flex justify-center">
				<Button onClick={handleGeneratePdf}>Generate PDF</Button>
			</div>
			<div className="pt-[60px] pb-[60px]">
				<FormEditor
					className="w-full"
					tunes={['alignText']}
					toolBar={[...InlineToolBarDefault, 'variable']}
					ref={editorRef}
					initialData={DATA}
					onChange={() => {}}
				/>
			</div>
		</div>
	);
}
