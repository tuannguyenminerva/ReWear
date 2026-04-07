import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Check, Loader2, Upload, Edit2, X } from 'lucide-react';
import { useWardrobe } from '../contexts/WardrobeContext';
import { Category, ClothingItem } from '../types';
import heic2any from 'heic2any';
import { detectionApi } from '../api/detection';
import { WardrobePickerModal } from '../components/WardrobePickerModal';

export const CameraView: React.FC = () => {
  const { wardrobe, addOutfit, addItem } = useWardrobe();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<ClothingItem[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogSuccess, setIsLogSuccess] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; category: Category; color: string }>(
    { name: '', category: 'Top', color: '' }
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logError, setLogError] = useState('');

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setPermissionError(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setPermissionError(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // ── Capture frame from live camera ─────────────────────────────────────────
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setUploadedFile(file);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setUploadedImage(url);
    }, 'image/jpeg', 0.85);
    runDetection(canvas.toDataURL('image/jpeg', 0.85));
  }, []);

  // ── Detection ────────────────────────────────────────────────────
  const [apiError, setApiError] = useState<string | null>(null);
  const [noDetectionMsg, setNoDetectionMsg] = useState(false);

  const runDetection = async (imageB64: string) => {
    setIsDetecting(true);
    setApiError(null);
    setNoDetectionMsg(false);
    try {
      const data = await detectionApi.detect(imageB64);
      if (data.detections?.length > 0) {
        setDetectedItems(data.detections as ClothingItem[]);
      } else {
        setDetectedItems([]);
        setNoDetectionMsg(true);
        setTimeout(() => setNoDetectionMsg(false), 3000);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to connect to detection server");
    } finally {
      setIsDetecting(false);
    }
  };

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    let file = e.target.files[0];

    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
      try {
        setIsDetecting(true);
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: "image/jpeg" });
      } catch (err) {
        console.error("HEIC conversion error:", err);
        setApiError("Could not convert HEIC format. Please try another image.");
        setIsDetecting(false);
        return;
      }
    }

    setUploadedFile(file);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setUploadedImage(url);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const MAX_DIM = 1080;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width *= ratio;
        height *= ratio;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        runDetection(canvas.toDataURL('image/jpeg', 0.85));
      }
    };
    img.src = url;
  };

  // ── Log outfit ──────────────────────────────────────────────────────────────
  const handleLogOutfit = async () => {
    if (detectedItems.length === 0) return;
    setIsLogging(true);
    setLogError('');
    try {
      const realItems = await Promise.all(
        detectedItems.map(async (item) => {
          if (item.id.startsWith('det-')) return await addItem(item);
          return item;
        })
      );
      await addOutfit(realItems, selectedDate, uploadedFile);
      setIsLogSuccess(true);
      setTimeout(() => handleRetry(), 3000);
    } catch (err: unknown) {
      setLogError(err instanceof Error ? err.message : 'Failed to log outfit');
    } finally {
      setIsLogging(false);
    }
  };

  const handleRetry = () => {
    setDetectedItems([]);
    setUploadedImage(null);
    setUploadedFile(null);
    setApiError(null);
    setLogError('');
    setIsLogSuccess(false);
    setEditingItemId(null);
  };

  // ── Item editing ────────────────────────────────────────────────────────────
  const startEditing = (item: ClothingItem) => {
    setEditingItemId(item.id);
    setEditForm({ name: item.name, category: item.category, color: item.color });
  };
  const saveEditing = (id: string) => {
    setDetectedItems(prev => prev.map(item => item.id === id ? { ...item, ...editForm } : item));
    setEditingItemId(null);
  };
  const createBlankItem = () => {
    const newItem: ClothingItem = {
      id: `det-manual-${Date.now()}`,
      name: 'New Item',
      category: 'Top',
      color: '',
      image: '',
      brand: '',
      addedDate: new Date().toISOString().split('T')[0],
      wearCount: 0,
      lastWorn: 'Never'
    };
    setDetectedItems(prev => [...prev, newItem]);
    startEditing(newItem);
    setIsModalOpen(false);
  };
  const removeItem = (id: string) => setDetectedItems(prev => prev.filter(item => item.id !== id));
  const addItemManually = (item: ClothingItem) => {
    if (!detectedItems.find(i => i.id === item.id)) setDetectedItems(prev => [...prev, item]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-stone-900">

      {/* LEFT: Camera Feed */}
      <div className="relative flex-grow h-full bg-black overflow-hidden flex items-center justify-center group">
        {permissionError && !uploadedImage ? (
          <div className="text-center p-8 bg-stone-800 rounded-2xl max-w-md mx-4">
            <Camera className="w-12 h-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Camera Access Required</h3>
            <p className="text-stone-400 mb-6">
              Enable camera access to use real-time detection, or upload a photo below.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={startCamera} className="px-6 py-3 bg-primary-500 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary-600 transition-all">
                Retry Access
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-stone-700 text-stone-300 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-stone-600 transition-all">
                Upload Photo Instead
              </button>
            </div>
          </div>
        ) : (
          <>
            {uploadedImage && (
              <div className="absolute inset-0 w-full h-full bg-stone-900 flex items-center justify-center z-20">
                <img src={uploadedImage} alt="Uploaded look" className="w-full h-full object-contain" />
                <button onClick={handleRetry} className="absolute top-8 right-8 p-3 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-all z-30" title="Return to camera">
                  <Camera size={20} />
                </button>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-90 scale-x-[-1]" />

            {/* Scanning Overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDetecting ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 border-[1px] border-white/20 m-8 rounded-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-full animate-pulse" />
            </div>
            {apiError && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-red-500/90 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm">
                {apiError}
              </div>
            )}
            {noDetectionMsg && !apiError && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-black/60 text-white/80 text-xs px-4 py-2 rounded-full backdrop-blur-sm">
                No clothing detected — try moving closer or adjusting lighting
              </div>
            )}

            {/* Bounding Box Labels */}
            {!isLogSuccess && detectedItems.map((item) => {
              const bboxX: number = (item as any).bbox_x ?? 50;
              const bboxY: number = (item as any).bbox_y ?? 50;
              const bboxW: number = (item as any).bbox_w ?? 0;
              const top = bboxY;
              const left = bboxX + bboxW / 2;
              return (
                <div key={item.id} className="absolute flex flex-col items-center transition-all duration-700 ease-out animate-in fade-in zoom-in-95"
                  style={{ top: `${top}%`, left: `${left}%`, width: '180px', transform: 'translateX(-50%)' }}>
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-2 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-stone-900 px-4 py-2 rounded-none shadow-sm min-w-[140px] text-center">
                      <p className="font-serif text-sm italic">{item.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">{item.category}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Bottom toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-800/80 backdrop-blur-md border border-stone-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-700 transition-all">
            <Upload size={14} /> Upload
          </button>
          {!uploadedImage && !permissionError && (
            <button onClick={captureFrame}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500/90 backdrop-blur-md border border-primary-400 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-all">
              <Camera size={14} /> Capture
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: Detection Panel */}
      <div className="w-[420px] flex-shrink-0 bg-[#fafaf9] border-l border-stone-200 flex flex-col h-full relative z-10 shadow-2xl">

        {/* Header */}
        <div className="p-8 pb-4 bg-[#fafaf9]">
          <h2 className="text-3xl font-serif italic text-stone-900">Daily Look</h2>
          <div className="flex items-center gap-2 mt-3 border-b border-stone-200 pb-2">
            <span className="text-xs font-bold tracking-widest uppercase text-stone-400">DATE</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-stone-600 font-serif focus:outline-none focus:text-primary-600 ml-auto text-right" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {detectedItems.length === 0 && !isLogSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-24 h-24 border border-stone-300 rounded-full flex items-center justify-center mb-6">
                <Camera size={32} className="text-stone-300" />
              </div>
              <p className="font-serif text-xl italic text-stone-400 mb-2">Capture your style</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest max-w-[200px] leading-relaxed">
                Stand in frame and hit Capture, or upload a photo
              </p>
              <button onClick={() => fileInputRef.current?.click()}
                className="mt-8 text-stone-800 text-xs font-bold uppercase tracking-widest border-b border-stone-800 pb-1 hover:text-primary-600 hover:border-primary-600 transition-colors">
                Upload from Gallery
              </button>
            </div>
          ) : isLogSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                <Check size={32} className="text-stone-800" />
              </div>
              <h3 className="text-3xl font-serif italic text-stone-900 mb-3">Logged.</h3>
              <p className="text-stone-500 font-serif italic">"Style is a way to say who you are without having to speak."</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Curated Items</span>
                {isDetecting && <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest animate-pulse">Detecting...</span>}
              </div>

              <div className="space-y-8">
                {detectedItems.map((item, idx) => (
                  <div key={item.id} className="group relative animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    <button onClick={() => removeItem(item.id)}
                      className="absolute -top-2 -right-2 z-20 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-primary-600 hover:border-primary-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      title="Remove item">
                      <X size={12} />
                    </button>
                    <div className="flex gap-5 items-start">
                      <div className="w-20 h-24 flex-shrink-0 overflow-hidden bg-stone-100 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        {editingItemId === item.id ? (
                          <div className="flex flex-col gap-2">
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full font-serif italic text-lg border-b border-primary-300 bg-transparent focus:outline-none focus:border-primary-500" autoFocus placeholder="Item Name"/>
                            <div className="flex gap-2">
                              <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value as Category})}
                                className="w-1/2 text-[10px] font-bold uppercase tracking-widest border-b border-primary-300 bg-transparent focus:outline-none focus:border-primary-500 pb-1 cursor-pointer">
                                {['Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <input type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                                className="w-1/2 text-[10px] font-bold uppercase tracking-widest border-b border-primary-300 bg-transparent focus:outline-none focus:border-primary-500 pb-1" placeholder="Color"/>
                            </div>
                            <button onClick={() => saveEditing(item.id)} className="text-primary-600 font-bold uppercase text-[10px] mt-2 text-left self-start flex items-center gap-1 hover:text-primary-800"><Check size={14} /> Save Details</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-xl text-stone-900 italic cursor-pointer hover:text-primary-600 transition-colors"
                                onClick={() => startEditing(item)}>
                                {item.name}
                              </h4>
                              <button onClick={() => startEditing(item)} className="text-stone-400 hover:text-primary-600 transition-colors p-1" title="Edit Details">
                                <Edit2 size={14} />
                              </button>
                            </div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{item.category}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-8">
                <button onClick={() => setIsModalOpen(true)}
                  className="flex-1 py-4 border border-primary-200 text-primary-600 text-[10px] font-bold uppercase tracking-widest hover:border-primary-600 hover:bg-primary-50 transition-all">
                  Browse Wardrobe
                </button>
                <button onClick={createBlankItem}
                  className="flex-1 py-4 bg-stone-100 border border-transparent text-stone-600 text-[10px] font-bold uppercase tracking-widest hover:border-stone-300 transition-all">
                  + New Item
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-[#fafaf9]">
          {logError && <p className="text-red-500 text-xs mb-3 text-center">{logError}</p>}
          <div className="flex gap-3">
            {(uploadedImage || detectedItems.length > 0) && !isLogSuccess && (
              <button disabled={isLogging} onClick={handleRetry}
                className="px-6 py-4 text-xs font-bold uppercase tracking-widest bg-stone-200 text-stone-600 hover:bg-stone-300 transition-all flex items-center justify-center">
                Retry
              </button>
            )}
            <button
              disabled={detectedItems.length === 0 || isLogSuccess || isLogging}
              onClick={handleLogOutfit}
              className={`
                flex-1 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2
                ${detectedItems.length > 0 && !isLogSuccess && !isLogging
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'}
              `}
            >
              {isLogging
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : isLogSuccess ? 'Saved to Journal' : 'Log Entry'
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
      `}</style>

      {isModalOpen && (
        <WardrobePickerModal
          wardrobe={wardrobe}
          onSelect={addItemManually}
          onCreateBlank={createBlankItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
