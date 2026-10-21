import React, { useRef } from 'react';
import type { UserData } from '../../types/poster';
import { ARUNACHALAM_TEMPLATE_WIDTH, ARUNACHALAM_TEMPLATE_HEIGHT, ARUNACHALAM_PHOTO_AREA } from '../../canvas/imageRenderer';
import { ANNAPRASADAM_TEXT_POSITIONS } from '../../canvas/coordinates';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  type SupportedLanguage 
} from '../../i18n/annaprasadamTranslations';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onEditCrop?: () => void;
  lang?: SupportedLanguage;
}

export const AnnaprasadamPreview: React.FC<Props> = ({ 
  userData, 
  onEditCrop,
  lang = 'te'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.te;

  const fontFamily = lang === 'ta'
    ? '"Noto Sans Tamil", sans-serif'
    : lang === 'hi'
    ? '"Noto Sans Devanagari", sans-serif'
    : lang === 'en'
    ? '"Noto Sans", sans-serif'
    : '"Noto Sans Telugu", sans-serif';

  // Position offsets for the photo frame in percentage:
  // photoArea: { x: 48, y: 604, width: 362, height: 384 } on 1024 x 1536
  const photoLeft = `${(ARUNACHALAM_PHOTO_AREA.x / ARUNACHALAM_TEMPLATE_WIDTH) * 100}%`;
  const photoTop = `${(ARUNACHALAM_PHOTO_AREA.y / ARUNACHALAM_TEMPLATE_HEIGHT) * 100}%`;
  const photoWidth = `${(ARUNACHALAM_PHOTO_AREA.width / ARUNACHALAM_TEMPLATE_WIDTH) * 100}%`;
  const photoHeight = `${(ARUNACHALAM_PHOTO_AREA.height / ARUNACHALAM_TEMPLATE_HEIGHT) * 100}%`;

  const platesNum = parseInt(userData.plates || '1', 10) || 1;
  const poshakuluTitle = getPoshakuluTitleByLang(platesNum, lang);
  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : (lang === 'en' ? 'Sri ' : 'శ్రీ ');
  const suffix = t.nameSuffix ? ` ${t.nameSuffix}` : '';

  return (
    <div className="flex flex-col items-center">
      {/* Status Notice on top of Preview */}
      {userData.isPaid && (
        <div className="mb-3 w-full max-w-[420px] flex items-center justify-center">
          <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
            <span>✅</span>
            <span>{t.paymentSuccess}</span>
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className="relative w-full max-w-[420px] aspect-[1024/1536] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#ffca08]/40 bg-[#1c0802]"
        style={{ containerType: 'inline-size' }}
      >
        {/* User Cropped Photo */}
        {userData.photoUrl && (
          <div 
            className="absolute z-0 overflow-hidden"
            style={{
              left: photoLeft,
              top: photoTop,
              width: photoWidth,
              height: photoHeight,
            }}
          >
            <img 
              src={userData.photoUrl} 
              alt="User Upload"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Template Overlay */}
        <img 
          src="/assets/Arunachalam.png" 
          alt="Annaprasadam Template"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* 1. Dynamic Title inside Dark Green Pill Box */}
        <div 
          className="absolute z-20 text-white font-black drop-shadow-md flex items-center justify-center whitespace-nowrap"
          style={{ 
            top: `${ANNAPRASADAM_TEXT_POSITIONS.title.topPercent}%`, 
            left: `${ANNAPRASADAM_TEXT_POSITIONS.title.centerPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: 'clamp(14px, 4.4cqi, 36px)', 
            fontFamily,
            textShadow: '0 2px 4px rgba(0,0,0,0.6)'
          }}
        >
          {poshakuluTitle}
        </div>

        {/* 2. Line 1: Plates Count + localized line1Text */}
        <div 
          className="absolute z-20 text-[#6b1406] font-bold drop-shadow-sm flex items-center justify-center whitespace-nowrap"
          style={{ 
            top: `${ANNAPRASADAM_TEXT_POSITIONS.line1.topPercent}%`, 
            left: `${ANNAPRASADAM_TEXT_POSITIONS.line1.centerPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: 'clamp(12px, 3.8cqi, 32px)', 
            fontFamily
          }}
        >
          {`${platesNum} ${t.line1Text}`}
        </div>

        {/* 3. Line 2: localized line2Text */}
        <div 
          className="absolute z-20 text-[#6b1406] font-bold drop-shadow-sm flex items-center justify-center whitespace-nowrap"
          style={{ 
            top: `${ANNAPRASADAM_TEXT_POSITIONS.line2.topPercent}%`, 
            left: `${ANNAPRASADAM_TEXT_POSITIONS.line2.centerPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: 'clamp(10px, 3.2cqi, 26px)', 
            fontFamily
          }}
        >
          {t.line2Text}
        </div>

        {/* 4. Line 3: Dynamic Donor Name with prefix and suffix */}
        {userData.fullName && (
          <div 
            className="absolute z-20 text-[#6b1406] font-bold drop-shadow-sm flex items-center justify-center max-w-[55%]"
            style={{ 
              top: `${ANNAPRASADAM_TEXT_POSITIONS.line3.topPercent}%`, 
              left: `${ANNAPRASADAM_TEXT_POSITIONS.line3.centerPercent}%`,
              transform: 'translate(-50%, -50%)', 
              fontSize: 'clamp(11px, 3.8cqi, 32px)', 
              fontFamily,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center'
            }}
          >
            {`${prefix}${userData.fullName}${suffix}`}
          </div>
        )}

        {/* Edit Crop Button */}
        {userData.photoUrl && onEditCrop && (
          <button
            onClick={onEditCrop}
            className="absolute bottom-4 left-4 z-30 py-2 px-3 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all flex items-center gap-1.5 shadow-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {t.photoCropBtn || 'Crop Photo'}
          </button>
        )}
      </div>
    </div>
  );
};
