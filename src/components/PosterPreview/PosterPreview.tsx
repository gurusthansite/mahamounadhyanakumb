import React, { useState, useRef, useEffect } from 'react';
import type { UserData } from '../../types/poster';
import { POSTER_WIDTH, POSTER_HEIGHT, PHOTO_AREA } from '../../canvas/coordinates';
import { IMAGE_TEMPLATE_WIDTH, IMAGE_TEMPLATE_HEIGHT, IMAGE_PHOTO_AREA } from '../../canvas/imageRenderer';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

export const PosterPreview: React.FC<Props> = ({ userData, setUserData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });
  const [duration, setDuration] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const isImage = userData.templateType === 'image';
  const T_WIDTH = isImage ? IMAGE_TEMPLATE_WIDTH : POSTER_WIDTH;
  const T_HEIGHT = isImage ? IMAGE_TEMPLATE_HEIGHT : POSTER_HEIGHT;
  const T_AREA = isImage ? IMAGE_PHOTO_AREA : PHOTO_AREA;

  // Position offsets
  const videoLeft = `${(T_AREA.x / T_WIDTH) * 100}%`;
  const videoTop = `${(T_AREA.y / T_HEIGHT) * 100}%`;
  const videoWidth = `${(T_AREA.width / T_WIDTH) * 100}%`;
  const videoHeight = `${(T_AREA.height / T_HEIGHT) * 100}%`;
  const offsetX = userData.videoOffset?.x || 0;
  const offsetY = userData.videoOffset?.y || 0;

  // --- Dragging Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!userData.photoUrl || isImage) return;
    if ((e.target as HTMLElement).closest('.controls-overlay')) return;
    
    setIsDragging(true);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !userData.photoUrl) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = rect.width / T_WIDTH;
    const dx = (e.clientX - startDragPos.x) / scale;
    const dy = (e.clientY - startDragPos.y) / scale;
    
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setUserData(prev => ({
      ...prev,
      videoOffset: {
        x: (prev.videoOffset?.x || 0) + dx,
        y: (prev.videoOffset?.y || 0) + dy
      }
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // --- Playback & Trim Logic ---
  useEffect(() => {
    if (videoRef.current && !isImage) {
      if (isPlaying) videoRef.current.play().catch(e => console.warn(e));
      else videoRef.current.pause();
    }
  }, [isPlaying, userData.photoUrl, isImage]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || isImage) return;
    const endT = userData.videoEndTime || duration;
    const startT = userData.videoStartTime || 0;
    
    if (vid.currentTime >= endT && isPlaying) {
      vid.currentTime = startT;
    }
  };

  // --- Math for CSS ---
  let videoStyle: React.CSSProperties = { display: 'none' };
  if (isImage && userData.photoUrl) {
    videoStyle = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      objectFit: 'cover',
      pointerEvents: 'none'
    };
  } else if (videoDims.w > 0 && videoDims.h > 0) {
    const baseScale = Math.max(T_AREA.width / videoDims.w, T_AREA.height / videoDims.h);
    const userScale = userData.videoScale || 1.0;
    const finalScale = baseScale * userScale;

    const drawWidth = videoDims.w * finalScale;
    const drawHeight = videoDims.h * finalScale;
    const drawX = (T_AREA.width - drawWidth) / 2 + offsetX;
    const drawY = (T_AREA.height - drawHeight) / 2 + offsetY;

    videoStyle = {
      position: 'absolute',
      width: `${(drawWidth / T_AREA.width) * 100}%`,
      height: `${(drawHeight / T_AREA.height) * 100}%`,
      left: `${(drawX / T_AREA.width) * 100}%`,
      top: `${(drawY / T_AREA.height) * 100}%`,
      pointerEvents: 'none',
      objectFit: 'fill'
    };
  }

  return (
    <div className="bg-[#4a1c0b] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#8b3d0b] flex flex-col items-center lg:sticky lg:top-6">
      <h2 className="text-2xl font-bold text-[#ffca08] mb-4 w-full text-left flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Live Preview
      </h2>
      
      {/* Container */}
      <div 
        ref={containerRef}
        className={`relative w-full max-w-md mx-auto bg-[#240b03] rounded-xl overflow-hidden border-4 border-[#8b3d0b] shadow-2xl ${userData.photoUrl && !isImage ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''} group`}
        style={{ aspectRatio: `${T_WIDTH} / ${T_HEIGHT}`, touchAction: 'none', containerType: 'inline-size' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
                {userData.photoUrl && (
          <div 
            className="absolute bg-black"
            style={{
              left: videoLeft,
              top: videoTop,
              width: videoWidth,
              height: videoHeight,
              zIndex: 0,
              overflow: 'hidden'
            }}
          >
            {isImage ? (
              <img 
                src={userData.photoUrl}
                onLoad={(e) => setVideoDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                style={videoStyle}
              />
            ) : (
              <video 
                ref={videoRef}
                src={userData.photoUrl}
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => {
                  setVideoDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight });
                  setDuration(e.currentTarget.duration);
                }}
                style={videoStyle}
              />
            )}
          </div>
        )}

        {/* Template Overlay - Always visible! */}
        <img 
          src={isImage ? "/assets/image_template.png" : "/assets/template_3.png"} 
          alt="Template Overlay"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />
        
                                                        {/* Dynamic Text for Image Template */}
        {isImage && userData.fullName && (
          <div className="absolute z-50 w-full text-center text-[#8b3d0b] font-extrabold drop-shadow-md" style={{ top: '52.8%', left: 0, fontSize: 'clamp(14px, 4cqi, 32px)', fontFamily: '"Noto Sans Telugu", sans-serif' }}>
            {userData.fullName}
          </div>
        )}
        {isImage && userData.hours && (
          <div className="absolute z-50 text-[#b91c1c] font-bold drop-shadow-md" style={{ top: '61.7%', left: '38.0%', transform: 'translate(-50%, -50%)', fontSize: 'clamp(16px, 4.5cqi, 36px)', fontFamily: '"Noto Sans Telugu", sans-serif', textShadow: '0px 0px 4px white' }}>
            {userData.hours}
          </div>
        )}

        {/* Floating Controls Overlay - Only for video */}
        {!isImage && userData.photoUrl && (
            <div className="controls-overlay absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3">
              
              <div className="flex items-center justify-between">
                {!isImage && (
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-[#ffca08] text-black p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                  </button>
                )}
                
                <div className={`text-white text-xs font-medium px-3 py-1 bg-black/50 rounded-full border border-white/20 ${isImage ? 'mx-auto' : ''}`}>
                  Drag to pan
                </div>

                {!isImage && (
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/40 transition-colors"
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                  </button>
                )}
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur rounded-lg p-2 border border-white/10">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                <input 
                  type="range" 
                  min="1.0" 
                  max="3.0" 
                  step="0.05"
                  value={userData.videoScale || 1.0}
                  onChange={(e) => setUserData(prev => ({ ...prev, videoScale: parseFloat(e.target.value) }))}
                  className="flex-1 accent-[#ffca08] h-1"
                />
                <svg className="w-4 h-4 text-[#ffca08]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              </div>

              {/* Trim Controls */}
              {!isImage && duration > 0 && (
                <div className="flex flex-col gap-1 bg-black/50 backdrop-blur rounded-lg p-2 border border-white/10">
                  <div className="flex justify-between text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                    <span>Trim Start ({(userData.videoStartTime || 0).toFixed(1)}s)</span>
                    <span>Trim End ({(userData.videoEndTime || duration).toFixed(1)}s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range"
                      min="0"
                      max={duration}
                      step="0.1"
                      value={userData.videoStartTime || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const maxEnd = userData.videoEndTime || duration;
                        setUserData(prev => ({ ...prev, videoStartTime: Math.min(val, maxEnd - 0.5) }));
                        if (videoRef.current) videoRef.current.currentTime = Math.min(val, maxEnd - 0.5);
                      }}
                      className="flex-1 accent-green-400 h-1"
                    />
                    <input 
                      type="range"
                      min="0"
                      max={duration}
                      step="0.1"
                      value={userData.videoEndTime || duration}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const minStart = userData.videoStartTime || 0;
                        setUserData(prev => ({ ...prev, videoEndTime: Math.max(val, minStart + 0.5) }));
                      }}
                      className="flex-1 accent-red-400 h-1"
                    />
                  </div>
                </div>
              )}
              
            </div>
        )}
      </div>

      <div className="mt-6 text-sm font-medium text-orange-200 w-full text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ffca08] animate-pulse"></span>
        Hover preview for options
      </div>
    </div>
  );
};








