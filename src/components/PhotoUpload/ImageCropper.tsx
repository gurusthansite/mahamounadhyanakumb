import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropHelper';

interface Props {
  imageSrc: string;
  aspectRatio: number;
  onComplete: (croppedUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<Props> = ({ imageSrc, aspectRatio, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedUrl);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image");
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          cropShape="rect"
          showGrid={false}
        />
      </div>
      
      <div className="bg-[#240b03] p-6 pb-12 flex flex-col gap-6 items-center border-t border-[#8b3d0b]">
        <div className="w-full max-w-md flex items-center gap-4">
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#ffca08]"
          />
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
        </div>
        
        <div className="w-full max-w-md flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={isCropping}
            className="flex-1 py-3 px-4 rounded-xl bg-[#ffca08] text-black font-bold hover:bg-white transition-colors"
          >
            {isCropping ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
};

