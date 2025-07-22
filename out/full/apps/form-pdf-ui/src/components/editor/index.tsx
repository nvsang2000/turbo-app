import './style/index.css';
import React, {
	useEffect,
	useRef,
	useImperativeHandle,
	forwardRef,
} from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';

// lib tools
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Table from '@editorjs/table';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import InlineCode from '@editorjs/inline-code';
import CodeTool from '@editorjs/code';
import Warning from '@editorjs/warning';

// custom tools
import AlignText from './tools/AlignText';
import Underline from './tools/Underline';
import Variable from './tools/Variable';
import Signature from './tools/Signature';
import Layout from './tools/Layout';

// Shared types
export interface EditorHandle {
	save: () => Promise<OutputData | undefined>;
}

export type TuneOption = 'alignText';

export type InlineToolBarOption =
	| 'bold'
	| 'italic'
	| 'link'
	| 'underline'
	| 'variable'
	| 'signature'
	| 'layout';

export const TuneDefault = ['alignText'];

export const InlineToolBarDefault = ['bold', 'italic', 'link', 'underline'];

// Shared tools config
export const toolsConfig = {
	quote: Quote,
	delimiter: Delimiter,
	inlineCode: InlineCode,
	code: CodeTool,
	warning: Warning,
	// image: {
	// 	class: ImageTool,
	// 	config: {
	// 		endpoints: {
	// 			byFile: 'http://localhost:8008/uploadFile',
	// 			byUrl: 'http://localhost:8008/fetchUrl',
	// 		},
	// 	},
	// },
	alignText: AlignText as any,
	header: { class: Header as any, inlineToolbar: true },
	paragraph: { class: Paragraph as any, inlineToolbar: true },
	list: { class: List as any, inlineToolbar: true },
	table: { class: Table as any, inlineToolbar: true },
	underline: { class: Underline, inlineToolbar: true },
	variable: { class: Variable, inlineToolbar: true },
	signature: { class: Signature },
	layout: Layout,
};

export type FormEditorProps = {
	initialData?: OutputData;
	placeholder?: string;
	className?: string;
	tunes?: TuneOption[];
	toolBar?: string[] | InlineToolBarOption[] | boolean;
	onChange?: (data: OutputData) => void;
};

export const FormEditor = forwardRef<EditorHandle, FormEditorProps>(
	(
		{
			initialData,
			placeholder,
			className,
			tunes,
			toolBar = InlineToolBarDefault,
			onChange,
		},
		ref,
	) => {
		const editorRef = useRef<EditorJS | null>(null);
		const containerRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (editorRef.current || !containerRef.current) return;

			editorRef.current = new EditorJS({
				holder: containerRef.current,
				minHeight: 0,
				autofocus: true,
				placeholder,
				data: initialData,
				onChange: async () => {
					if (!editorRef.current) return;
					try {
						const data = await editorRef.current.save();
						onChange?.(data);
					} catch (error) {
						console.error(error);
						return undefined;
					}
				},
				tools: toolsConfig,
				tunes: tunes,
				inlineToolbar: toolBar,
			});
		}, [initialData, placeholder, tunes, toolBar, onChange]);

		useImperativeHandle(ref, () => ({
			save: async () => {
				if (!editorRef.current) return;
				try {
					return await editorRef.current.save();
				} catch {
					return undefined;
				}
			},
		}));

		return <div ref={containerRef} className={className} />;
	},
);

export interface ReadOnlyEditorProps {
	data: OutputData;
	className?: string;
}

export const ReadOnlyEditor: React.FC<ReadOnlyEditorProps> = ({
	data,
	className,
}) => {
	const editorRef = useRef<EditorJS | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const initialize = async () => {
			if (!containerRef.current) return;
			if (editorRef.current) {
				await editorRef.current.isReady;
				await editorRef.current.destroy();
				containerRef.current.innerHTML = '';
			}

			editorRef.current = new EditorJS({
				holder: containerRef.current,
				data,
				minHeight: 0,
				readOnly: false,
				onReady: async () => {
					if (editorRef.current) {
						await editorRef.current.readOnly.toggle(true);
					}
				},
				tools: toolsConfig,
				tunes: TuneDefault,
				inlineToolbar: InlineToolBarDefault,
			});
		};

		initialize();
	}, [data]);

	return <div ref={containerRef} className={className} />;
};
