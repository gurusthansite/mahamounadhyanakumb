import React, { useRef } from 'react';
import type { UserData } from '../../types/poster';
import { getAnnaprasadamPosterConfig } from '../../canvas/coordinates';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  getMahaMounaTitleByLang,
  getAnnaprasadamTemplate,
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
    : lang === 'kn'
    ? '"Noto Sans Kannada", sans-serif'
    : lang === 'en'
    ? '"Noto Sans", sans-serif'
    : '"Noto Sans Telugu", sans-serif';

  const isMahaMouna = userData.sevaCategory === 'mahamouna';
  const config = getAnnaprasadamPosterConfig(lang, isMahaMouna);

  const photoLeft = `${(config.photoArea.x / config.templateWidth) * 100}%`;
  const photoTop = `${(config.photoArea.y / config.templateHeight) * 100}%`;
  const photoWidth = `${(config.photoArea.width / config.templateWidth) * 100}%`;
  const photoHeight = `${(config.photoArea.height / config.templateHeight) * 100}%`;

  const platesNum = parseInt(userData.plates || '1', 10) || 1;
  const donationAmountNum = parseInt(userData.donationAmount || '1', 10) || 1;
  const poshakuluTitle = isMahaMouna
    ? getMahaMounaTitleByLang(donationAmountNum, lang)
    : getPoshakuluTitleByLang(platesNum, lang);
  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : (lang === 'en' ? 'Sri ' : 'శ్రీ ');
  const suffix = t.nameSuffix ? ` ${t.nameSuffix}` : '';

  const isOther = userData.contributionFor === 'other' && Boolean(userData.beneficiaryName?.trim());
  const activePrefix = isOther
    ? (userData.beneficiaryTitle ? `${userData.beneficiaryTitle} ` : (lang === 'en' ? 'Smt ' : 'శ్రీమతి '))
    : prefix;
  const activeName = isOther ? userData.beneficiaryName!.trim() : userData.fullName;

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
        className="relative w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#ffca08]/40 bg-[#1c0802]"
        style={{ 
          containerType: 'inline-size',
          aspectRatio: `${config.templateWidth} / ${config.templateHeight}`
        }}
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
          src={getAnnaprasadamTemplate(lang, isMahaMouna)} 
          alt={isMahaMouna ? "Maha Mouna Template" : "Annaprasadam Template"}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* 1. Top Banner: Poshakulu Title inside Dark Ornate Banner (Enlarged, no plates count) */}
        <div 
          className="absolute z-20 text-[#ffea79] font-black drop-shadow-md flex items-center justify-center text-center px-1.5 max-w-[55%] whitespace-nowrap"
          style={{ 
            top: `${config.title.topPercent}%`, 
            left: `${config.title.centerPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: lang === 'en' ? 'clamp(11px, 3.6cqi, 30px)' : 'clamp(12px, 4.2cqi, 36px)', 
            fontFamily,
            textShadow: '0 2px 6px rgba(0,0,0,0.85)'
          }}
        >
          <span className="truncate max-w-full">{poshakuluTitle}</span>
        </div>

        {/* 2. Bottom Banner: Donor Full Name inside Cream Parchment Banner */}
        <div 
          className="absolute z-20 text-[#591104] font-extrabold flex items-center justify-center text-center px-1.5 max-w-[62%] w-[62%]"
          style={{ 
            top: `${config.name.topPercent}%`, 
            left: `${config.name.centerPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: 'clamp(11px, 3.4cqi, 26px)', 
            fontFamily,
            lineHeight: 1.15
          }}
        >
          <span className="truncate max-w-full drop-shadow-sm">
            {activeName 
              ? `${activePrefix}${activeName}${suffix}`
              : `${activePrefix}${lang === 'ta' ? 'பெயர்' : lang === 'hi' ? 'नाम' : lang === 'kn' ? 'ಹೆಸರು' : lang === 'en' ? 'Name' : 'పేరు'}${suffix}`}
          </span>
        </div>

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
