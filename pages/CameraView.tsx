import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Check, Plus, Loader2, Upload, Calendar, Edit2, X, Search } from 'lucide-react';
import { useWardrobe } from '../WardrobeContext';
import { ClothingItem } from '../types';

export const CameraView: React.FC = () => {
  const { wardrobe, addOutfit } = useWardrobe();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<ClothingItem[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogSuccess, setIsLogSuccess] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // We keep both a preview URL and the raw File so we can upload it
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // ── Capture frame from live camera ─────────────────────────────────────────
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror to match the CSS mirror effect
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setUploadedFile(file);
      setUploadedImage(url);
      // Simulate detection on captured frame
      triggerDetection();
    }, 'image/jpeg', 0.85);
  }, []);

  // ── Detection simulation ────────────────────────────────────────────────────
  const triggerDetection = useCallback(() => {
    setIsDetecting(true);
    setTimeout(() => {
      const count = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
      setDetectedItems(shuffled.slice(0, count));
      setIsDetecting(false);
    }, 1500);
  }, [wardrobe]);

  // Auto-detect every 4 s while live camera is running (no uploaded image)
  useEffect(() => {
    if (permissionError || uploadedImage || isLogSuccess) return;
    const interval = setInterval(() => {
      if (editingItemId) return;
      triggerDetection();
    }, 4000);
    return () => clearInterval(interval);
  }, [permissionError, uploadedImage, isLogSuccess, editingItemId, triggerDetection]);

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadedFile(file);
    setUploadedImage(URL.createObjectURL(file));
    triggerDetection();
  };

  // ── Log outfit ──────────────────────────────────────────────────────────────
  const handleLogOutfit = async () => {
    if (detectedItems.length === 0) return;
    setIsLogging(true);
    setLogError('');
    try {
      await addOutfit(detectedItems, selectedDate, uploadedFile);
      setIsLogSuccess(true);
      setTimeout(() => {
        setDetectedItems([]);
        setUploadedImage(null);
        setUploadedFile(null);
        setIsLogSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      setLogError(err instanceof Error ? err.message : 'Failed to log outfit');
    } finally {
      setIsLogging(false);
    }
  };

  // ── Item editing ────────────────────────────────────────────────────────────
  const startEditing = (item: ClothingItem) => { setEditingItemId(item.id); setEditName(item.name); };
  const saveEditing = (id: string) => {
    setDetectedItems(prev => prev.map(item => item.id === id ? { ...item, name: editName } : item));
    setEditingItemId(null);
  };
  const removeItem = (id: string) => setDetectedItems(prev => prev.filter(item => item.id !== id));
  const addItemManually = (item: ClothingItem) => {
    if (!detectedItems.find(i => i.id === item.id)) setDetectedItems(prev => [...prev, item]);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const filteredWardrobe = wardrobe.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {uploadedImage ? (
              <div className="absolute inset-0 w-full h-full bg-stone-900 flex items-center justify-center">
                <img src={uploadedImage} alt="Uploaded look" className="w-full h-full object-contain" />
                <button
                  onClick={() => { setUploadedImage(null); setUploadedFile(null); }}
                  className="absolute top-8 right-8 p-3 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-all z-30"
                  title="Return to camera"
                >
                  <Camera size={20} />
                </button>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-90 scale-x-[-1]" />
            )}

            {/* Scanning Overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDetecting ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 border-[1px] border-white/20 m-8 rounded-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-full animate-pulse" />
            </div>

            {/* Bounding Box Labels */}
            {!isLogSuccess && detectedItems.map((item, idx) => {
              const top = 20 + (idx * 15);
              const left = 20 + (idx * 20);
              return (
                <div key={item.id} className="absolute flex flex-col items-center transition-all duration-700 ease-out animate-in fade-in zoom-in-95"
                  style={{ top: `${top}%`, left: `${left}%`, width: '180px' }}>
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

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Bottom toolbar: upload + capture */}
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-stone-600 font-serif focus:outline-none focus:text-primary-600 ml-auto text-right"
            />
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
                          <div className="flex items-center gap-2">
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full font-serif italic text-lg border-b border-primary-300 bg-transparent focus:outline-none focus:border-primary-500"
                              autoFocus />
                            <button onClick={() => saveEditing(item.id)} className="text-stone-800 hover:text-primary-600"><Check size={16} /></button>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-serif text-xl text-stone-900 italic cursor-pointer hover:text-primary-600 transition-colors"
                              onClick={() => startEditing(item)}>
                              {item.name}
                            </h4>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{item.category}</p>
                          </>
                        )}
                      </div>
                      {!editingItemId && (
                        <button onClick={() => startEditing(item)}
                          className="text-stone-300 hover:text-stone-800 transition-colors opacity-0 group-hover:opacity-100">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setIsModalOpen(true)}
                className="w-full py-4 border border-primary-200 text-primary-600 text-xs font-bold uppercase tracking-widest hover:border-primary-600 hover:bg-primary-50 transition-all mt-8">
                + Add Item Manually
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-[#fafaf9]">
          {logError && (
            <p className="text-red-500 text-xs mb-3 text-center">{logError}</p>
          )}
          <button
            disabled={detectedItems.length === 0 || isLogSuccess || isLogging}
            onClick={handleLogOutfit}
            className={`
              w-full py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all duration-500 flex items-center justify-center gap-2
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

      <style>{`
        @keyframes scan { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
      `}</style>

      {/* Manual Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif italic text-stone-900">Select from Wardrobe</h3>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">Manual Selection</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 bg-stone-50 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input type="text" placeholder="Search by name or category..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 focus:outline-none focus:border-primary-500 font-serif italic"
                  autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {filteredWardrobe.map((item) => (
                  <div key={item.id} onClick={() => addItemManually(item)} className="group cursor-pointer space-y-3">
                    <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-900 shadow-xl">Add to Look</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-serif text-sm italic text-stone-900 group-hover:text-primary-600 transition-colors truncate">{item.name}</h4>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mt-0.5">{item.category}</p>
                    </div>
                  </div>
                ))}
                {filteredWardrobe.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="font-serif italic text-stone-400">No items found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
