import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Flashlight, 
  Image as ImageIcon,
  Building2,
  Search,
  ScanLine
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose, stores = [], onStoreScanned }) {
  const [cameraError, setCameraError] = useState(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scannedSuccessCode, setScannedSuccessCode] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const REGION_ID = 'blinkit-barcode-scanner-viewport';

  // Helper to parse store code from scanned raw text
  const parseStoreCode = (rawText) => {
    if (!rawText) return null;
    let text = String(rawText).trim();

    // 1. Format: BLINKIT_STORE:ES10 or BLINKIT:ES10
    const matchPrefix = text.match(/(?:BLINKIT_STORE|BLINKIT|STORE)\s*[:=\-_/]\s*([A-Za-z0-9\-]+)/i);
    if (matchPrefix && matchPrefix[1]) {
      return matchPrefix[1].toUpperCase();
    }

    // 2. URL Format: https://...?store=ES10 or .../store/ES10
    try {
      if (text.startsWith('http://') || text.startsWith('https://')) {
        const url = new URL(text);
        const storeParam = url.searchParams.get('store') || url.searchParams.get('code');
        if (storeParam) return storeParam.toUpperCase();
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          if (/^[A-Za-z0-9\-]+$/.test(lastPart)) return lastPart.toUpperCase();
        }
      }
    } catch {
      // not a url, proceed
    }

    // 3. Match against known stores in database
    const directMatch = stores.find(s => {
      if (!s || !s.storeCode) return false;
      const sCode = s.storeCode.trim().toUpperCase();
      const sClean = sCode.replace(/^BLK-/, '');
      const inputUpper = text.toUpperCase();
      const inputClean = inputUpper.replace(/^BLK-/, '');
      return sCode === inputUpper || sClean === inputClean;
    });

    if (directMatch) return directMatch.storeCode;

    // 4. Fallback to cleaned uppercase raw string if alphanumeric
    const cleaned = text.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
    return cleaned || text.toUpperCase();
  };

  // Handle successful detection
  const handleScanSuccess = (decodedText) => {
    const code = parseStoreCode(decodedText);
    if (!code) return;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch {}
    }

    setScannedSuccessCode(code);

    // Stop scanner and notify parent after brief visual confirmation
    setTimeout(() => {
      onStoreScanned(code);
      onClose();
    }, 700);
  };

  // Initialize and run Html5Qrcode
  useEffect(() => {
    if (!isOpen) {
      setScannedSuccessCode(null);
      setCameraError(null);
      return;
    }

    let isMounted = true;
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsScanningActive(false);

        // Wait a tick for DOM element to be rendered
        await new Promise(r => setTimeout(r, 150));
        if (!isMounted) return;

        const container = document.getElementById(REGION_ID);
        if (!container) return;

        html5QrCode = new Html5Qrcode(REGION_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.78);
            return { width: edgeSize, height: Math.floor(edgeSize * 0.75) };
          },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) handleScanSuccess(decodedText);
          },
          () => {
            // Frame error - scanning in progress, ignore
          }
        );

        if (isMounted) {
          setIsScanningActive(true);
          // Check torch capability
          try {
            const track = html5QrCode.getRunningTrackCameraCapabilities();
            if (track && track.torchFeature && track.torchFeature().isSupported()) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err) {
        console.warn('Camera scan start failed:', err);
        if (isMounted) {
          setIsScanningActive(false);
          setCameraError(
            'Camera permission denied or camera not accessible. Aap gallery se barcode image upload kar sakte hain ya niche store select kar sakte hain.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            try { html5QrCode.clear(); } catch {}
          }).catch(console.warn);
        } else {
          try { html5QrCode.clear(); } catch {}
        }
      }
      scannerRef.current = null;
    };
  }, [isOpen, facingMode]);

  // Toggle Torch / Flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  // Flip Camera Front / Back
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Scan from Uploaded Barcode / QR Image
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const tempScanner = new Html5Qrcode('temp-qr-file-processor', false);
      const decodedResult = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      setIsProcessingFile(false);
      handleScanSuccess(decodedResult);
    } catch (err) {
      setIsProcessingFile(false);
      alert('Is photo me barcode ya QR code detect nahi hua. Kripya clear photo select karein ya camera se direct scan karein.');
    }
  };

  const handleManualSelect = (code) => {
    if (!code) return;
    onStoreScanned(code);
    onClose();
  };

  // Filtered stores for manual fallback
  const filteredStores = stores.filter(s => {
    if (!manualSearch.trim()) return true;
    const q = manualSearch.toLowerCase();
    return (
      (s.storeCode && s.storeCode.toLowerCase().includes(q)) ||
      (s.storeName && s.storeName.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blinkit-green text-white flex items-center justify-center shadow-md">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Scan Store Barcode / QR</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Store gate par laga Barcode ya QR Code scan karein
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Scanner Viewport */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-blinkit-green shadow-lg">
          
          {/* Html5Qrcode Target Container */}
          <div id={REGION_ID} className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

          {/* Hidden container for file scan */}
          <div id="temp-qr-file-processor" className="hidden" />

          {/* Scanning Overlay Guideline */}
          {isScanningActive && !scannedSuccessCode && (
            <div className="absolute inset-8 border-2 border-dashed border-blinkit-yellow/90 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-blinkit-yellow bg-black/70 px-2 py-0.5 rounded-full">
                Aim at Store Barcode or QR
              </div>
              <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,1)] animate-bounce" />
              <div className="text-[10px] font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded-full">
                Auto-Detecting...
              </div>
            </div>
          )}

          {/* Scanned Success Confirmation Overlay */}
          {scannedSuccessCode && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 animate-fadeIn z-20">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="text-white font-extrabold text-lg">
                Store Scanned Successfully!
              </div>
              <div className="text-amber-300 font-mono font-black text-xl px-4 py-1.5 rounded-xl bg-black/50 border border-amber-400">
                {scannedSuccessCode}
              </div>
            </div>
          )}

          {/* Camera Permission / Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 p-5 text-center flex flex-col items-center justify-center space-y-3 text-slate-300 bg-slate-950/95 z-10">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="text-xs font-semibold text-slate-300 leading-relaxed max-w-xs">
                {cameraError}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Barcode Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Scanner Action Controls (Torch & Flip) */}
          {isScanningActive && (
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto z-10">
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md ${
                    isTorchOn 
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' 
                      : 'bg-black/70 text-white hover:bg-black/90'
                  }`}
                  title="Toggle Flashlight / Torch"
                >
                  <Flashlight className="w-4 h-4" />
                  <span className="text-[11px]">{isTorchOn ? 'Flash ON' : 'Flash'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold transition flex items-center gap-1 shadow-md ml-auto"
                title="Switch Front/Back Camera"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-[11px]">Flip Camera</span>
              </button>
            </div>
          )}

        </div>

        {/* Quick File / Photo Upload Barcode Scanner */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Barcode Photo Gallery se select karein:</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-600 shadow-2xs transition shrink-0"
          >
            {isProcessingFile ? 'Scanning...' : 'Browse Photo'}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Manual 1-Tap Fallback Dropdown */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Ya Store List se Select Karein:</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {filteredStores.length} Stores Available
            </span>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blinkit-green"
            >
              <option value="">-- Choose Dark Store from List --</option>
              {filteredStores.map((s) => (
                <option key={s.storeCode} value={s.storeCode}>
                  {s.storeCode} - {s.storeName} ({s.city || 'Hub'})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleManualSelect(selectedCode)}
              disabled={!selectedCode}
              className="px-4 py-2 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-black text-xs shadow-md disabled:opacity-40 transition shrink-0"
            >
              Check-In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
