import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropHelper';
import type { CropArea } from '../../types/poster';

interface Props {
  mediaSrc: string;
  isVideo?: boolean;
  aspectRatio: number;
  onComplete: (data: { croppedUrl?: string; cropArea: CropArea; cropPixels: CropArea }) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<Props> = ({ mediaSrc, isVideo = false, aspectRatio, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<CropArea | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPercent(croppedArea);
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels || !croppedAreaPercent) return;
    setIsCropping(true);
    try {
      if (isVideo) {
        onComplete({
          cropArea: croppedAreaPercent,
          cropPixels: croppedAreaPixels
        });
      } else {
        const croppedUrl = await getCroppedImg(mediaSrc, croppedAreaPixels);
        onComplete({
          croppedUrl,
          cropArea: croppedAreaPercent,
          cropPixels: croppedAreaPixels
        });
      }
    } catch (e) {
      console.error(e);
      alert(isVideo ? "Failed to crop video" : "Failed to crop image");
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header */}
      <div className="bg-[#1c0802] py-3.5 px-6 border-b border-[#8b3d0b] flex items-center justify-between z-10">
        <div>
          <span className="text-[#ffca08] text-base sm:text-lg font-bold flex items-center gap-2">
            {isVideo ? '🎥 Crop & Frame Video' : '🖼️ Crop & Frame Photo'}
          </span>
          <p className="text-orange-200/60 text-xs hidden sm:block">
            Drag and zoom to position perfectly inside the placeholder frame
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold"
        >
          ✕ Close
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative flex-1 bg-black">
        <Cropper
          image={!isVideo ? mediaSrc : undefined}
          video={isVideo ? mediaSrc : undefined}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape="rect"
          showGrid={true}
        />
      </div>
      
      {/* Controls Footer */}
      <div className="bg-[#240b03] p-5 pb-8 sm:pb-6 flex flex-col gap-4 items-center border-t border-[#8b3d0b] z-10">
        <div className="w-full max-w-md flex items-center gap-4">
          <svg className="w-5 h-5 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#ffca08] h-2 rounded-lg cursor-pointer"
          />
          <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
        </div>
        
        <div className="w-full max-w-md flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleApply}
            disabled={isCropping}
            className="flex-1 py-3 px-4 rounded-xl bg-[#ffca08] hover:bg-[#ffd943] text-black font-extrabold transition-all shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isCropping ? (
              <span>Processing...</span>
            ) : (
              <span>✓ Apply Crop</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
