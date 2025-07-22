import React, {
	useRef,
	useEffect,
	useImperativeHandle,
	forwardRef,
} from 'react';
import SignaturePad from 'signature_pad';

export type SignaturePadRef = {
	clear: () => void;
	save: () => string | null;
};

export type CanvasProps = {
	width?: number;
	height?: number;
	className?: string;
};

const SignatureCanvas = forwardRef<SignaturePadRef, CanvasProps>(
	({ width = 400, height = 200, className }, ref) => {
		const canvasRef = useRef<HTMLCanvasElement>(null);
		const padRef = useRef<SignaturePad | null>(null);

		useEffect(() => {
			const canvas = canvasRef.current;
			if (canvas) {
				padRef.current = new SignaturePad(canvas);
			}
		}, []);

		useImperativeHandle(ref, () => ({
			clear() {
				padRef.current?.clear();
			},
			save() {
				if (padRef && padRef?.current?.isEmpty()) return null;
				return padRef.current?.toDataURL() ?? null;
			},
		}));

		return (
			<div className="w-full max-w-md p-4">
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					className={`border border-gray-400 ${className}`}
				/>
			</div>
		);
	},
);

export default SignatureCanvas;
