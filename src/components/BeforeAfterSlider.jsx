import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight, Download, Share2, Sparkles, AlertCircle } from 'lucide-react';

export default function BeforeAfterSlider({
  beforePhoto,
  afterPhoto,
  storeInfo = {}
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef(null);

  const handlePositionChange = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      handlePositionChange(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !e.touches[0]) return;
      handlePositionChange(e.touches[0].clientX);
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handlePositionChange]);

  const handleContainerClick = (e) => {
    handlePositionChange(e.clientX);
  };

  // 1-Click WhatsApp Composite Card Generator
  const handleExportComparisonCard = async () => {
    if (!beforePhoto?.url || !afterPhoto?.url) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1200;
      const height = 750;
      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Top Brand Header (90px)
      ctx.fillStyle = '#0c831f';
      ctx.fillRect(0, 0, width, 90);

      // Yellow accent bar
      ctx.fillStyle = '#f8cb46';
      ctx.fillRect(0, 86, width, 4);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('BLINKIT DARK STORE DEEP CLEANING VERIFICATION', 40, 42);

      ctx.fillStyle = '#f8cb46';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(
        `${storeInfo.storeName || 'Dark Store'} (${storeInfo.storeCode || 'BLK'}) • Date: ${storeInfo.date || 'Today'}`,
        40,
        72
      );

      // Load Images
      const loadImage = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };

      const [imgBefore, imgAfter] = await Promise.all([
        loadImage(beforePhoto.url),
        loadImage(afterPhoto.url)
      ]);

      const photoY = 105;
      const photoHeight = 560;
      const photoWidth = 565;

      // Draw Before Photo (Left)
      ctx.drawImage(imgBefore, 25, photoY, photoWidth, photoHeight);

      // Draw After Photo (Right)
      ctx.drawImage(imgAfter, 610, photoY, photoWidth, photoHeight);

      // Left Label: BEFORE
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(25, photoY, 200, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('🔴 BEFORE CLEANING', 40, photoY + 28);

      // Right Label: AFTER
      ctx.fillStyle = '#0c831f';
      ctx.fillRect(610, photoY, 200, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('🟢 AFTER DEEP CLEAN', 625, photoY + 28);

      // Footer Bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 680, width, 70);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(
        'Verified by Site Supervisor • 100% Sanitized & Floor Scrubbed • Handover Complete',
        40,
        720
      );

      ctx.fillStyle = '#f8cb46';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('BLINKIT VENDOR OPERATIONS', width - 260, 720);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      link.download = `Blinkit_${storeInfo.storeCode || 'Store'}_Before_After_Proof.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export comparison error:', err);
      alert('Unable to export composite card: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!beforePhoto || !afterPhoto) {
    return (
      <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Comparison requires at least 1 Before and 1 After photo
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please upload both Before and After photos to activate the interactive split slider.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Interactive Slider Container */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative w-full aspect-16/10 sm:aspect-16/9 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-300 dark:border-slate-700 select-none cursor-ew-resize group bg-black"
      >
        {/* AFTER Image (Full Background) */}
        <img
          src={afterPhoto.url}
          alt={afterPhoto.title || 'After'}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* BEFORE Image (Clipped Left Layer) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforePhoto.url}
            alt={beforePhoto.title || 'Before'}
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: '100%'
            }}
          />
        </div>

        {/* Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] cursor-ew-resize z-20"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Draggable Circular Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl border-2 border-blinkit-green flex items-center justify-center transform active:scale-110 hover:scale-105 transition cursor-grab active:cursor-grabbing"
          >
            <ChevronsLeftRight className="w-5 h-5 text-blinkit-green" />
          </div>
        </div>

        {/* BEFORE Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600/90 text-white backdrop-blur-sm shadow-md border border-rose-400/40">
            🔴 BEFORE CLEANING
          </span>
          {beforePhoto.timestamp && (
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
              {beforePhoto.timestamp}
            </span>
          )}
        </div>

        {/* AFTER Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blinkit-green/90 text-white backdrop-blur-sm shadow-md border border-emerald-400/40">
            🟢 AFTER DEEP CLEAN
          </span>
          {afterPhoto.timestamp && (
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
              {afterPhoto.timestamp}
            </span>
          )}
        </div>

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-80 group-hover:opacity-100 transition">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/70 text-white backdrop-blur-sm border border-white/20">
            ↔️ Drag or Click anywhere to slide Before &amp; After
          </span>
        </div>
      </div>

      {/* Controls Bar: Preset Positions & WhatsApp Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        
        {/* Preset Percentage Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
            Presets:
          </span>
          {[
            { label: 'Before Only', val: 100 },
            { label: '75%', val: 75 },
            { label: '50% Split', val: 50 },
            { label: '25%', val: 25 },
            { label: 'After Only', val: 0 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setSliderPos(preset.val)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                Math.abs(sliderPos - preset.val) < 2
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* WhatsApp Comparison Card Download Button */}
        <button
          onClick={handleExportComparisonCard}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition transform active:scale-95 disabled:opacity-50"
          title="Download Side-by-Side Comparison Card for WhatsApp"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Card...' : 'Export for WhatsApp'}</span>
        </button>

      </div>

    </div>
  );
}
