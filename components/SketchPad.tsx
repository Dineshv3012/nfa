
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

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // Save current drawing
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

            // Update logical resolution
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 4;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Restore drawing
            if (tempCtx) {
                ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr, 0, 0, rect.width, rect.height);
            }
            contextRef.current = ctx;
        };

        const timeoutId = setTimeout(updateCanvasSize, 50);
        window.addEventListener('resize', updateCanvasSize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;

        if ('touches' in e) {
            const touch = (e as React.TouchEvent).touches[0] || (e as React.TouchEvent).changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            // Only prevent default if it's a touch event to allow scrolling outside canvas
            if (e.cancelable) e.preventDefault();
        }
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
        if ('touches' in e && e.cancelable) e.preventDefault();
        const { offsetX, offsetY } = getCoordinates(e);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (canvas && ctx) {
            const rect = canvas.getBoundingClientRect();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'automaton-sketch.png';
            link.href = canvas.toDataURL("image/png");
            link.click();
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
        <div className="bg-white p-3 md:p-6 rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center w-full max-w-full overflow-hidden">
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

            <div className="flex flex-wrap gap-3 mt-6 justify-center w-full">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-200 shadow-sm grow md:grow-0"
                        title="Close Overlay"
                    >
                        <i className="fas fa-times mr-2"></i>Close
                    </button>
                )}
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all border border-slate-200 shadow-sm grow md:grow-0"
                    title="Clear Canvas"
                >
                    <i className="fas fa-eraser mr-2"></i>Clear
                </button>
                <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 shadow-sm grow md:grow-0"
                    title="Download Drawing"
                >
                    <i className="fas fa-download mr-2"></i>Save
                </button>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-8 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 grow md:grow-0"
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
