import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropHelper';
import type { CropArea } from '../../types/poster';
import type { SupportedLanguage } from '../../i18n/annaprasadamTranslations';

interface Props {
  mediaSrc: string;
  isVideo?: boolean;
  aspectRatio: number;
  lang?: SupportedLanguage;
  onComplete: (data: { croppedUrl?: string; cropArea: CropArea; cropPixels: CropArea }) => void;
  onCancel: () => void;
}

const CROPPER_LABELS: Record<
  string,
  {
    title: string;
    videoTitle: string;
    subtitle: string;
    close: string;
    zoom: string;
    cancel: string;
    apply: string;
    processing: string;
    error: string;
  }
> = {
  te: {
    title: 'ఫోటో క్రాప్ & ఫ్రేమ్',
    videoTitle: 'వీడియో క్రాప్ & ఫ్రేమ్',
    subtitle: 'ఫోటోను సరిగ్గా ఫ్రేమ్‌లో అమర్చడానికి డ్రాగ్ మరియు జూమ్ చేయండి',
    close: '✕ మూసివేయి',
    zoom: 'జూమ్',
    cancel: 'రద్దు చేయండి',
    apply: 'వర్తింపజేయండి',
    processing: 'ప్రాసెస్ అవుతోంది...',
    error: 'ఫోటో క్రాప్ చేయడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
  },
  en: {
    title: 'Crop & Frame Photo',
    videoTitle: 'Crop & Frame Video',
    subtitle: 'Drag and zoom to position photo perfectly inside frame',
    close: '✕ Close',
    zoom: 'Zoom',
    cancel: 'Cancel',
    apply: 'Apply Crop',
    processing: 'Processing...',
    error: 'Failed to crop photo. Please try again.'
  },
  ta: {
    title: 'புகைப்படத்தை செதுக்குங்கள்',
    videoTitle: 'வீடியோவை செதுக்குங்கள்',
    subtitle: 'புகைப்படத்தை சரியாக பொருத்த நகர்த்தி பெரிதாக்கவும் (Zoom)',
    close: '✕ மூடு',
    zoom: 'பெரிதாக்கு',
    cancel: 'ரத்து செய்',
    apply: 'உறுதிசெய் (Apply)',
    processing: 'செயலாக்குகிறது...',
    error: 'புகைப்படத்தை செதுக்குவதில் தோல்வி. மீண்டும் முயற்சிக்கவும்.'
  },
  hi: {
    title: 'फोटो क्रॉप व सेट करें',
    videoTitle: 'वीडियो क्रॉप व सेट करें',
    subtitle: 'फोटो को फ्रेम में सही बैठाने के लिए ड्रैग और ज़ूम करें',
    close: '✕ बंद करें',
    zoom: 'ज़ूम',
    cancel: 'रद्द करें',
    apply: 'लागू करें',
    processing: 'प्रोसेस हो रहा है...',
    error: 'फोटो क्रॉप करने में विफल। कृपया पुनः प्रयास करें।'
  },
  kn: {
    title: 'ಫೋಟೋ ಕ್ರಾಪ್ & ಹೊಂದಿಸಿ',
    videoTitle: 'ವೀಡಿಯೋ ಕ್ರಾಪ್ & ಹೊಂದಿಸಿ',
    subtitle: 'ಫೋಟೋವನ್ನು ಫ್ರೇಮ್‌ನಲ್ಲಿ ಸರಿಯಾಗಿ ಹೊಂದಿಸಲು ಡ್ರ್ಯಾಗ್ ಮತ್ತು ಜೂಮ್ ಮಾಡಿ',
    close: '✕ ಮುಚ್ಚಿ',
    zoom: 'ಜೂಮ್',
    cancel: 'ರದ್ದುಮಾಡಿ',
    apply: 'ಅನ್ವಯಿಸು',
    processing: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ...',
    error: 'ಫೋಟೋ ಕ್ರಾಪ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
  }
};

export const ImageCropper: React.FC<Props> = ({ 
  mediaSrc, 
  isVideo = false, 
  aspectRatio, 
  lang = 'te',
  onComplete, 
  onCancel 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<CropArea | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const labels = CROPPER_LABELS[lang] || CROPPER_LABELS.te;

  const fontFam = lang === 'ta'
    ? '"Noto Sans Tamil", sans-serif'
    : lang === 'hi'
    ? '"Noto Sans Devanagari", sans-serif'
    : lang === 'kn'
    ? '"Noto Sans Kannada", sans-serif'
    : lang === 'en'
    ? '"Noto Sans", sans-serif'
    : '"Noto Sans Telugu", sans-serif';

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
      alert(labels.error);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-black h-screen h-[100dvh] max-h-[100dvh] w-screen w-[100dvw] overflow-hidden select-none"
      style={{ fontFamily: fontFam }}
    >
      {/* Header */}
      <div className="shrink-0 bg-[#1c0802] py-2.5 sm:py-3.5 px-4 sm:px-6 border-b border-[#8b3d0b] flex items-center justify-between z-20">
        <div className="min-w-0 pr-2">
          <span className="text-[#ffca08] text-sm sm:text-lg font-bold flex items-center gap-2 truncate">
            {isVideo ? `🎥 ${labels.videoTitle}` : `🖼️ ${labels.title}`}
          </span>
          <p className="text-orange-200/70 text-[11px] sm:text-xs block truncate">
            {labels.subtitle}
          </p>
        </div>
        <button 
          type="button"
          onClick={onCancel}
          className="shrink-0 text-white/80 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors text-xs sm:text-sm font-semibold border border-white/10"
        >
          {labels.close}
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative flex-1 min-h-0 w-full bg-black overflow-hidden touch-none">
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
      
      {/* Controls Footer - Fixed & Always Visible on Mobile Viewports */}
      <div className="shrink-0 w-full bg-[#240b03] px-4 py-3 sm:p-5 pb-6 sm:pb-6 flex flex-col gap-2.5 sm:gap-4 items-center border-t border-[#8b3d0b] z-20 shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <div className="w-full max-w-md flex items-center gap-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#ffca08] h-2 rounded-lg cursor-pointer"
          />
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
        </div>
        
        <div className="w-full max-w-md flex gap-2.5 sm:gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 active:scale-95 transition-all text-xs sm:text-base text-center whitespace-nowrap"
          >
            {labels.cancel}
          </button>
          <button 
            type="button"
            onClick={handleApply}
            disabled={isCropping}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] font-extrabold active:scale-95 transition-all shadow-lg text-xs sm:text-base flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {isCropping ? (
              <span>{labels.processing}</span>
            ) : (
              <span>✓ {labels.apply}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
