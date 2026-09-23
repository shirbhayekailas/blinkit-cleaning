import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Download, 
  ZoomIn, 
  Image as ImageIcon,
  Columns,
  LayoutGrid,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  cleaning,
  onUpdatePhotos,
  initialView = 'grid'
}) {
  const [activeView, setActiveView] = useState(initialView); // 'grid' | 'slider'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'before' | 'during' | 'after'
  const [uploadCategory, setUploadCategory] = useState('after');
  
  // Slider selection indices
  const [selectedBeforeIdx, setSelectedBeforeIdx] = useState(0);
  const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView, isOpen]);

  if (!isOpen || !cleaning) return null;

  const photos = cleaning.photos || [];
  const beforePhotos = photos.filter(p => p.type === 'before');
  const afterPhotos = photos.filter(p => p.type === 'after');

  const filteredPhotos = filterType === 'all' 
    ? photos 
    : photos.filter(p => p.type === filterType);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newPhoto = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: uploadCategory,
          title: `${uploadCategory.toUpperCase()} - ${file.name.replace(/\.[^/.]+$/, "")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          url: uploadEvent.target.result
        };
        const updated = [...photos, newPhoto];
        onUpdatePhotos(cleaning.id, updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (photoId) => {
    if (!confirm('Are you sure you want to delete this photo proof?')) return;
    const updated = photos.filter(p => p.id !== photoId);
    onUpdatePhotos(cleaning.id, updated);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header with Title & View Switcher */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Cleaning Photo Proofs ({photos.length})
                </h3>
                {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Split View Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cleaning.storeCode} - {cleaning.storeName} ({cleaning.cleaningDate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Toggle: Grid vs Split Slider */}
            <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeView === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('slider')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeView === 'slider'
                    ? 'bg-blinkit-green text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>⚡ Split Slider</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View 1: INTERACTIVE BEFORE/AFTER SPLIT SLIDER */}
        {activeView === 'slider' ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Slider Component */}
            <BeforeAfterSlider
              beforePhoto={beforePhotos[selectedBeforeIdx]}
              afterPhoto={afterPhotos[selectedAfterIdx]}
              storeInfo={{
                storeName: cleaning.storeName,
                storeCode: cleaning.storeCode,
                date: cleaning.cleaningDate
              }}
            />

            {/* Thumbnail Selectors to choose which Before and After to compare */}
            {beforePhotos.length > 0 && afterPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* Select BEFORE Photo */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span>1. Select Before Photo ({beforePhotos.length})</span>
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {beforePhotos.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedBeforeIdx(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                          selectedBeforeIdx === idx
                            ? 'border-rose-600 shadow-md ring-2 ring-rose-600/30 scale-105'
                            : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt="Before" className="w-full h-full object-cover" />
                        {selectedBeforeIdx === idx && (
                          <div className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select AFTER Photo */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>2. Select After Photo ({afterPhotos.length})</span>
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {afterPhotos.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedAfterIdx(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                          selectedAfterIdx === idx
                            ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/30 scale-105'
                            : 'border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt="After" className="w-full h-full object-cover" />
                        {selectedAfterIdx === idx && (
                          <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          /* View 2: TRADITIONAL GRID GALLERY */
          <>
            {/* Toolbar & Filters */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5">
                {['all', 'before', 'during', 'after'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition ${
                      filterType === cat
                        ? cat === 'before'
                          ? 'bg-rose-600 text-white'
                          : cat === 'after'
                          ? 'bg-emerald-600 text-white'
                          : cat === 'during'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({cat === 'all' ? photos.length : photos.filter(p => p.type === cat).length})
                  </button>
                ))}
              </div>

              {/* Quick Upload Button */}
              <div className="flex items-center gap-2">
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="before">Before Cleaning</option>
                  <option value="during">In-Progress</option>
                  <option value="after">After Cleaning</option>
                </select>

                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blinkit-green hover:bg-blinkit-darkgreen text-white font-bold text-xs shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* Gallery Grid or Empty State */}
            <div className="p-6 overflow-y-auto flex-1">
              {filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col"
                    >
                      <div className="relative aspect-4/3 overflow-hidden cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                            className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white"
                            title="Zoom photo"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <a
                            href={photo.url}
                            download={`${cleaning.storeCode}_${photo.title}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white"
                            title="Download photo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                            title="Delete photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-slate-850 flex items-center justify-between text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                          photo.type === 'before' ? 'bg-rose-600' : photo.type === 'after' ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}>
                          {photo.type}
                        </span>
                        <span className="text-slate-400 font-medium truncate max-w-[100px]" title={photo.title}>
                          {photo.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    No photos found in this category
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload Before and After photos using the "Add Photos" button above.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Fullscreen Photo Zoom Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
              <div className="mt-3 text-center text-white text-sm">
                <span className={`px-2 py-0.5 rounded font-bold text-xs uppercase mr-2 ${
                  selectedPhoto.type === 'before' ? 'bg-rose-600' : selectedPhoto.type === 'after' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  {selectedPhoto.type}
                </span>
                <span className="font-semibold">{selectedPhoto.title}</span>
                {selectedPhoto.timestamp && (
                  <span className="text-white/60 ml-2">({selectedPhoto.timestamp})</span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
