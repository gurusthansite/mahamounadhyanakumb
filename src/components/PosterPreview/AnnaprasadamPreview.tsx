import React, { useRef, useState } from 'react';
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
  setUserData,
  onEditCrop,
  lang = 'te'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [activeAdjustTab, setActiveAdjustTab] = useState<'name' | 'title'>('name');
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
  const poshakuluTitle = userData.customTitle?.trim()
    ? userData.customTitle.trim()
    : (isMahaMouna
        ? getMahaMounaTitleByLang(donationAmountNum, lang)
        : getPoshakuluTitleByLang(platesNum, lang));

  const defaultPrefixByLang: Record<SupportedLanguage, string> = {
    ta: 'ஸ்ரீ ',
    hi: 'श्री ',
    kn: 'ಶ್ರೀ ',
    en: 'Sri ',
    te: 'శ్రీ ',
  };
  const defaultSmtByLang: Record<SupportedLanguage, string> = {
    ta: 'ஸ்ரீமதி ',
    hi: 'श्रीमती ',
    kn: 'ಶ್ರೀಮತಿ ',
    en: 'Smt ',
    te: 'శ్రీమతి ',
  };

  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : defaultPrefixByLang[lang];
  const suffix = t.nameSuffix ? ` ${t.nameSuffix}` : '';

  const isOther = userData.contributionFor === 'other' && Boolean(userData.beneficiaryName?.trim());
  const activePrefix = isOther
    ? (userData.beneficiaryTitle ? `${userData.beneficiaryTitle} ` : defaultSmtByLang[lang])
    : prefix;
  const activeName = isOther ? userData.beneficiaryName!.trim() : userData.fullName;

  // Effective coordinates for Name & Title (Config defaults + user manual overrides)
  const defaultTitleFontSize = lang === 'en' ? 34 : 38;
  const effectiveTitleTopPercent = userData.customTitlePosition?.topPercent ?? config.title.topPercent;
  const effectiveTitleCenterPercent = userData.customTitlePosition?.centerPercent ?? config.title.centerPercent;
  const effectiveTitleFontSize = userData.customTitlePosition?.fontSize ?? defaultTitleFontSize;

  const effectiveTopPercent = userData.customNamePosition?.topPercent ?? config.name.topPercent;
  const effectiveCenterPercent = userData.customNamePosition?.centerPercent ?? config.name.centerPercent;
  const effectiveFontSize = userData.customNamePosition?.fontSize ?? 34;

  const handleAdjust = (
    target: 'name' | 'title',
    field: 'topPercent' | 'centerPercent' | 'fontSize',
    delta: number
  ) => {
    setUserData(prev => {
      if (target === 'name') {
        const currentTop = prev.customNamePosition?.topPercent ?? config.name.topPercent;
        const currentCenter = prev.customNamePosition?.centerPercent ?? config.name.centerPercent;
        const currentFont = prev.customNamePosition?.fontSize ?? 34;

        let newTop = currentTop;
        let newCenter = currentCenter;
        let newFont = currentFont;

        if (field === 'topPercent') {
          newTop = parseFloat((currentTop + delta).toFixed(2));
        } else if (field === 'centerPercent') {
          newCenter = parseFloat((currentCenter + delta).toFixed(2));
        } else if (field === 'fontSize') {
          newFont = Math.max(16, Math.min(50, currentFont + delta));
        }

        return {
          ...prev,
          customNamePosition: {
            topPercent: newTop,
            centerPercent: newCenter,
            fontSize: newFont,
          }
        };
      } else {
        const currentTop = prev.customTitlePosition?.topPercent ?? config.title.topPercent;
        const currentCenter = prev.customTitlePosition?.centerPercent ?? config.title.centerPercent;
        const currentFont = prev.customTitlePosition?.fontSize ?? defaultTitleFontSize;

        let newTop = currentTop;
        let newCenter = currentCenter;
        let newFont = currentFont;

        if (field === 'topPercent') {
          newTop = parseFloat((currentTop + delta).toFixed(2));
        } else if (field === 'centerPercent') {
          newCenter = parseFloat((currentCenter + delta).toFixed(2));
        } else if (field === 'fontSize') {
          newFont = Math.max(18, Math.min(55, currentFont + delta));
        }

        return {
          ...prev,
          customTitlePosition: {
            topPercent: newTop,
            centerPercent: newCenter,
            fontSize: newFont,
          }
        };
      }
    });
  };

  const handleSetDirect = (
    target: 'name' | 'title',
    field: 'topPercent' | 'centerPercent' | 'fontSize',
    value: number
  ) => {
    setUserData(prev => {
      if (target === 'name') {
        return {
          ...prev,
          customNamePosition: {
            topPercent: field === 'topPercent' ? value : (prev.customNamePosition?.topPercent ?? config.name.topPercent),
            centerPercent: field === 'centerPercent' ? value : (prev.customNamePosition?.centerPercent ?? config.name.centerPercent),
            fontSize: field === 'fontSize' ? value : (prev.customNamePosition?.fontSize ?? 34),
          }
        };
      } else {
        return {
          ...prev,
          customTitlePosition: {
            topPercent: field === 'topPercent' ? value : (prev.customTitlePosition?.topPercent ?? config.title.topPercent),
            centerPercent: field === 'centerPercent' ? value : (prev.customTitlePosition?.centerPercent ?? config.title.centerPercent),
            fontSize: field === 'fontSize' ? value : (prev.customTitlePosition?.fontSize ?? defaultTitleFontSize),
          }
        };
      }
    });
  };

  const handleReset = (target?: 'name' | 'title') => {
    setUserData(prev => {
      const next = { ...prev };
      if (!target || target === 'name') {
        delete next.customNamePosition;
      }
      if (!target || target === 'title') {
        delete next.customTitlePosition;
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center w-full">
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
          className="absolute z-20 text-[#ffea79] font-black drop-shadow-md flex items-center justify-center text-center px-1.5 max-w-[58%] whitespace-nowrap"
          style={{ 
            top: `${effectiveTitleTopPercent}%`, 
            left: `${effectiveTitleCenterPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: `clamp(${Math.round(effectiveTitleFontSize * 0.35)}px, ${(effectiveTitleFontSize / 10).toFixed(1)}cqi, ${effectiveTitleFontSize}px)`, 
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
            top: `${effectiveTopPercent}%`, 
            left: `${effectiveCenterPercent}%`,
            transform: 'translate(-50%, -50%)', 
            fontSize: `clamp(${Math.round(effectiveFontSize * 0.35)}px, ${(effectiveFontSize / 10).toFixed(1)}cqi, ${effectiveFontSize}px)`, 
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

      {/* Manual Name & Title Coordinates Adjuster Toggle & Card */}
      <div className="w-full max-w-[420px] mt-3">
        <button
          type="button"
          onClick={() => setShowAdjustPanel(prev => !prev)}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#4a1c0b]/80 hover:bg-[#4a1c0b] text-[#ffca08] border border-[#8b3d0b] text-xs font-semibold flex items-center justify-between transition-all shadow-md"
        >
          <span className="flex items-center gap-1.5">
            <span>⚙️</span>
            <span>Manual Position & Coordinates (Name & Title)</span>
          </span>
          <span className="text-[11px] bg-[#240b03] px-2 py-0.5 rounded text-orange-200">
            {showAdjustPanel ? 'Hide ▲' : 'Adjust ▼'}
          </span>
        </button>

        {showAdjustPanel && (
          <div className="mt-2 p-3.5 bg-[#2d0e04] rounded-2xl border border-[#ffca08]/30 shadow-xl flex flex-col gap-3 text-xs text-orange-100 animate-fadeIn">
            {/* Tabs for Name vs Title selection */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a0802] rounded-xl border border-[#8b3d0b]/40">
              <button
                type="button"
                onClick={() => setActiveAdjustTab('name')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeAdjustTab === 'name'
                    ? 'bg-[#ffca08] text-[#3d1400] shadow'
                    : 'text-orange-200/80 hover:text-white'
                }`}
              >
                <span>👤</span>
                <span>Donor Name</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAdjustTab('title')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeAdjustTab === 'title'
                    ? 'bg-[#ffca08] text-[#3d1400] shadow'
                    : 'text-orange-200/80 hover:text-white'
                }`}
              >
                <span>👑</span>
                <span>Title Banner</span>
              </button>
            </div>

            {/* Sub-header with Reset button */}
            <div className="flex items-center justify-between border-b border-[#8b3d0b]/40 pb-2">
              <span className="font-bold text-[#ffca08]">
                {activeAdjustTab === 'name' ? 'Name Placement' : 'Title Placement'} (Real-time Preview & Download)
              </span>
              <button
                type="button"
                onClick={() => handleReset(activeAdjustTab)}
                className="text-[11px] px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 transition-colors"
              >
                ↺ Reset {activeAdjustTab === 'name' ? 'Name' : 'Title'}
              </button>
            </div>

            {activeAdjustTab === 'name' ? (
              <>
                {/* Vertical (Y) Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Vertical Position (Y):</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveTopPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'topPercent', -0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Up"
                    >
                      ▲ Up (-0.2%)
                    </button>
                    <input
                      type="range"
                      min="70.0"
                      max="85.0"
                      step="0.1"
                      value={effectiveTopPercent}
                      onChange={(e) => handleSetDirect('name', 'topPercent', parseFloat(e.target.value))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'topPercent', 0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Down"
                    >
                      ▼ Down (+0.2%)
                    </button>
                  </div>
                </div>

                {/* Horizontal (X) Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Horizontal Center (X):</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveCenterPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'centerPercent', -0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Left"
                    >
                      ◄ Left (-0.2%)
                    </button>
                    <input
                      type="range"
                      min="40.0"
                      max="60.0"
                      step="0.1"
                      value={effectiveCenterPercent}
                      onChange={(e) => handleSetDirect('name', 'centerPercent', parseFloat(e.target.value))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'centerPercent', 0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Right"
                    >
                      ► Right (+0.2%)
                    </button>
                  </div>
                </div>

                {/* Font Size Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Font Size:</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveFontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'fontSize', -1)}
                      className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Smaller"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="20"
                      max="48"
                      step="1"
                      value={effectiveFontSize}
                      onChange={(e) => handleSetDirect('name', 'fontSize', parseInt(e.target.value, 10))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('name', 'fontSize', 1)}
                      className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Larger"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Title Vertical (Y) Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Vertical Position (Y):</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveTitleTopPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'topPercent', -0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Up"
                    >
                      ▲ Up (-0.2%)
                    </button>
                    <input
                      type="range"
                      min="35.0"
                      max="55.0"
                      step="0.1"
                      value={effectiveTitleTopPercent}
                      onChange={(e) => handleSetDirect('title', 'topPercent', parseFloat(e.target.value))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'topPercent', 0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Down"
                    >
                      ▼ Down (+0.2%)
                    </button>
                  </div>
                </div>

                {/* Title Horizontal (X) Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Horizontal Center (X):</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveTitleCenterPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'centerPercent', -0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Left"
                    >
                      ◄ Left (-0.2%)
                    </button>
                    <input
                      type="range"
                      min="40.0"
                      max="60.0"
                      step="0.1"
                      value={effectiveTitleCenterPercent}
                      onChange={(e) => handleSetDirect('title', 'centerPercent', parseFloat(e.target.value))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'centerPercent', 0.2)}
                      className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Move Right"
                    >
                      ► Right (+0.2%)
                    </button>
                  </div>
                </div>

                {/* Title Font Size Adjust */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-orange-200 font-medium">Font Size:</span>
                    <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
                      {effectiveTitleFontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'fontSize', -1)}
                      className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Smaller"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="20"
                      max="55"
                      step="1"
                      value={effectiveTitleFontSize}
                      onChange={(e) => handleSetDirect('title', 'fontSize', parseInt(e.target.value, 10))}
                      className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust('title', 'fontSize', 1)}
                      className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold"
                      title="Larger"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
