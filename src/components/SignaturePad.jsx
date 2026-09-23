import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export default function SignaturePad({
  value,
  onChange,
  managerName = 'Store Manager'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Dark ink
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-indigo-500" />
          <span>Store Manager Digital Signature (Screen Par Sign Karein)</span>
        </span>
        {hasSignature && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[11px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Sign</span>
          </button>
        )}
      </div>

      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 touch-none cursor-crosshair bg-slate-50/50 dark:bg-slate-900"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
            <span className="text-xs font-semibold">
              Ungli ya Mouse se yahan Sign karein
            </span>
            <span className="text-[10px] text-slate-400/80">
              (Manager: {managerName})
            </span>
          </div>
        )}

        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none font-mono">
          Blinkit Dark Store Authorization Sign
        </div>
      </div>
    </div>
  );
}
