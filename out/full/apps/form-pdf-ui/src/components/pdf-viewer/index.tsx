/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import '@react-pdf-viewer/core/lib/styles/index.css';
import './index.css';

import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

interface PdfViewerProps {
	pdfUrl: string;
	workerUrl?: string;
}

type SignatureCanvasRef = SignatureCanvas | null;

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, workerUrl }) => {
	const decodeBase64 = (dataUri: string): Uint8Array => {
		const base64 = dataUri.split(',')[1] || dataUri;
		const binary = atob(base64);
		const len = binary.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	};

	const DEFAULT_SIG_ID = '[sig_sj2l2jnf]';
	const containerRef = useRef<HTMLDivElement | null>(null);
	const sigCanvasRef = useRef<SignatureCanvasRef>(null);
	const [isSigned, setIsSigned] = useState(false);

	const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array>(() =>
		decodeBase64(pdfUrl),
	);
	const [fileData, setFileData] = useState<Uint8Array>(originalPdfBytes);

	const [pdfSrc, setPdfSrc] = useState<string>(() =>
		URL.createObjectURL(
			new Blob([originalPdfBytes as any], { type: 'application/pdf' }),
		),
	);

	useEffect(() => {
		const bytes = decodeBase64(pdfUrl) as any;
		setOriginalPdfBytes(bytes);
		setFileData(bytes);
		setPdfSrc((prev) => {
			URL.revokeObjectURL(prev);
			return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
		});
	}, [pdfUrl]);

	useEffect(() => {
		return () => URL.revokeObjectURL(pdfSrc);
	}, [pdfSrc]);

	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const handleSignClick = () => {
		setIsSigned(true);
		setModalOpen(true);
	};
	const handleClear = () => sigCanvasRef.current?.clear();

	const handleSave = async () => {
		if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
			alert('Please sign before saving');
			return;
		}
		const sigDataUrl = sigCanvasRef.current.toDataURL('image/png');

		try {
			const pdfDoc = await PDFDocument.load(originalPdfBytes);
			const pages = pdfDoc.getPages();
			const lastPage = pages[pages.length - 1] as any;

			const pngImage = await pdfDoc.embedPng(sigDataUrl);
			const { width: pdfWidth, height: pdfHeight } = lastPage.getSize();
			const sigW = 200;
			const sigH = (pngImage.height / pngImage.width) * sigW;

			let placed = false;
			const container = containerRef.current;
			if (container) {
				const pageEls = container.querySelectorAll('.rpv-core__page-layer');
				if (pageEls.length) {
					const lastEl = pageEls[pageEls.length - 1] as HTMLElement;
					const allSpans = lastEl.querySelectorAll('span');
					const markerSpan = Array.from(allSpans).find(
						(s) => s.textContent === DEFAULT_SIG_ID,
					);

					if (markerSpan) {
						const spanRect = markerSpan.getBoundingClientRect();
						const pageRect = lastEl.getBoundingClientRect();

						const cssX = spanRect.left - pageRect.left;
						const cssYFromTop = spanRect.top - pageRect.top;
						const xPdf = cssX * (pdfWidth / pageRect.width);
						const yPdf =
							(pageRect.height - cssYFromTop) * (pdfHeight / pageRect.height);

						lastPage.drawImage(pngImage, {
							x: xPdf,
							y: yPdf - 20,
							width: sigW,
							height: sigH,
						});
						placed = true;
					}
				}
			}

			const newBytes = await pdfDoc.save();
			const newUint8 = new Uint8Array(newBytes);
			setFileData(newUint8);
			setPdfSrc((prev) => {
				URL.revokeObjectURL(prev);
				return URL.createObjectURL(
					new Blob([newUint8], { type: 'application/pdf' }),
				);
			});

			setModalOpen(false);
		} catch (err) {
			alert('An error occurred while saving the signature. Please try again.');
		}
	};

	const pageNavigationPluginInstance = pageNavigationPlugin();
	const { jumpToPage } = pageNavigationPluginInstance;
	const handleDocumentLoad = (e: any) => {
		if (isSigned) {
			const lastIndex = e.doc.numPages - 1;
			jumpToPage(lastIndex);
		}
	};

	return (
		<div ref={containerRef} style={{ position: 'relative', height: '100vh' }}>
			<Worker
				workerUrl={
					workerUrl || 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'
				}
			>
				<Viewer
					fileUrl={pdfSrc}
					defaultScale={SpecialZoomLevel.PageFit}
					plugins={[pageNavigationPluginInstance]}
					onDocumentLoad={handleDocumentLoad}
				/>
			</Worker>

			<div className="absolute bottom-[60px] left-0 z-10 flex w-full justify-center space-x-4 py-2">
				<button
					onClick={handleSignClick}
					className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
				>
					Signature
				</button>

				{!modalOpen && (
					<a
						href={pdfSrc}
						download="example-document.pdf"
						className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700"
					>
						Download
					</a>
				)}
			</div>

			{modalOpen &&
				createPortal(
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							width: '100vw',
							height: '100vh',
							background: 'rgba(0,0,0,0.3)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 1000,
						}}
					>
						<div
							style={{
								background: '#fff',
								padding: 16,
								borderRadius: 8,
								boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
							}}
						>
							<SignatureCanvas
								ref={sigCanvasRef}
								canvasProps={{ width: 600, height: 400 }}
							/>
							<div className="signature-modal-footer">
								<button
									className="signature-btn signature-btn-save"
									onClick={handleSave}
								>
									Save
								</button>
								<button
									className="signature-btn signature-btn-clear"
									onClick={handleClear}
								>
									Clear
								</button>
								<button
									className="signature-btn signature-btn-cancel"
									onClick={() => setModalOpen(false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>,
					document.body!,
				)}
		</div>
	);
};

export default PdfViewer;
