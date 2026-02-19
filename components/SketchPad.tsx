
import React, { useRef, useState, useEffect } from 'react';

interface Props {
    onAnalyze: (imageData: string) => void;
    isAnalyzing: boolean;
    onClose?: () => void;
}

const SketchPad: React.FC<Props> = ({ onAnalyze, isAnalyzing, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = 800;
        canvas.height = 400;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineCap = "round";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height); // White background

        contextRef.current = ctx;
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault();
        const { offsetX, offsetY } = getCoordinates(e);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current?.closePath();
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if ('touches' in e) e.preventDefault();
        const { offsetX, offsetY } = getCoordinates(e);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (canvas && ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleAnalyze = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const imageData = canvas.toDataURL("image/png");
            onAnalyze(imageData);
        }
    };

    return (
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center w-full">
            <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-slate-800">Draw Your Automaton</h3>
                <p className="text-sm text-slate-500">Draw states (circles) and transitions (arrows). Click analyze to convert.</p>
            </div>

            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={finishDrawing}
                onTouchMove={draw}
                className="border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair bg-white w-full h-[400px] md:h-[500px] touch-none shadow-inner"
            />

            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                    >
                        <i className="fas fa-times mr-2"></i>Close
                    </button>
                )}
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <i className="fas fa-eraser mr-2"></i>Clear
                </button>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isAnalyzing ? (
                        <><i className="fas fa-spinner fa-spin"></i> Analyzing...</>
                    ) : (
                        <><i className="fas fa-magic"></i> Analyze Sketch</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SketchPad;
