import React, { useRef, useState } from 'react';

export interface DeepotsavamData {
  fullName: string;
  phoneNumber?: string;
  location?: string;
  titlePrefix?: string;
  contributionFor?: 'self' | 'other';
  beneficiaryName?: string;
  beneficiaryTitle?: string;
  categoryTitle?: string;
  deepamCount?: string;
  displayFormat?: 'name_only' | 'name_location' | 'two_lines';
  photoUrl: string | null;
  rawMediaUrl?: string | null;
  customNamePosition?: {
    topPercent?: number;
    centerPercent?: number;
    fontSize?: number;
  };
}

interface Props {
  data: DeepotsavamData;
  setData: React.Dispatch<React.SetStateAction<DeepotsavamData>>;
  onEditCrop?: () => void;
}

export const DeepotsavamPreview: React.FC<Props> = ({
  data,
  setData,
  onEditCrop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);

  // Exact coordinates matching the template (1200 x 2100)
  // Photo frame bounds: x=394, y=1004, w=414, h=369
  const photoLeft = `${(394 / 1200) * 100}%`;
  const photoTop = `${(1004 / 2100) * 100}%`;
  const photoWidth = `${(414 / 1200) * 100}%`;
  const photoHeight = `${(369 / 2100) * 100}%`;

  // Name ribbon center: y = 1431.5 / 2100 = 68.17%, x = 600 / 1200 = 50.0%
  const defaultTopPercent = 68.17;
  const defaultCenterPercent = 50.0;
  const defaultFontSize = 38;

  const effectiveTopPercent = data.customNamePosition?.topPercent ?? defaultTopPercent;
  const effectiveCenterPercent = data.customNamePosition?.centerPercent ?? defaultCenterPercent;
  const effectiveFontSize = data.customNamePosition?.fontSize ?? defaultFontSize;

  const isOther = data.contributionFor === 'other' && Boolean(data.beneficiaryName?.trim());
  const activePrefix = isOther
    ? (data.beneficiaryTitle ? `${data.beneficiaryTitle} ` : 'శ్రీమతి ')
    : (data.titlePrefix ? `${data.titlePrefix} ` : 'శ్రీ ');
  const targetName = isOther ? data.beneficiaryName!.trim() : data.fullName.trim();
  const nameWithPrefix = targetName ? `${activePrefix}${targetName}` : '';
  const loc = data.location?.trim() || '';

  let primaryText = nameWithPrefix || 'శ్రీ దాత పేరు';
  let secondaryText = '';

  if (data.displayFormat === 'name_location' && loc) {
    primaryText = `${primaryText}, ${loc}`;
  } else if (data.displayFormat === 'two_lines' && loc) {
    secondaryText = loc;
  }

  const handleAdjust = (field: 'topPercent' | 'centerPercent' | 'fontSize', delta: number) => {
    setData(prev => {
      const currentTop = prev.customNamePosition?.topPercent ?? defaultTopPercent;
      const currentCenter = prev.customNamePosition?.centerPercent ?? defaultCenterPercent;
      const currentFont = prev.customNamePosition?.fontSize ?? defaultFontSize;

      let newTop = currentTop;
      let newCenter = currentCenter;
      let newFont = currentFont;

      if (field === 'topPercent') {
        newTop = parseFloat((currentTop + delta).toFixed(2));
      } else if (field === 'centerPercent') {
        newCenter = parseFloat((currentCenter + delta).toFixed(2));
      } else if (field === 'fontSize') {
        newFont = Math.max(18, Math.min(60, currentFont + delta));
      }

      return {
        ...prev,
        customNamePosition: {
          topPercent: newTop,
          centerPercent: newCenter,
          fontSize: newFont,
        }
      };
    });
  };

  const handleResetPosition = () => {
    setData(prev => ({
      ...prev,
      customNamePosition: undefined
    }));
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Visual Adjust Toolbar Button */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <span>🪔</span>
          <span>లైవ్ ఫ్లైయర్ ప్రివ్యూ (Live Preview)</span>
        </span>
        <button
          type="button"
          onClick={() => setShowAdjustPanel(prev => !prev)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
            showAdjustPanel
              ? 'bg-[#ffca08] text-[#381609]'
              : 'bg-[#240b03] hover:bg-[#8b3d0b] text-orange-200 border border-[#ffca08]/40'
          }`}
        >
          <span>⚙️ పేరు స్థానం సర్దుబాటు</span>
          <span className="text-[10px]">{showAdjustPanel ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Floating Micro Adjust Panel */}
      {showAdjustPanel && (
        <div className="w-full max-w-[440px] bg-[#240b03] border-2 border-[#ffca08]/60 p-3.5 rounded-2xl shadow-2xl mb-3 flex flex-col gap-2.5 animate-fadeIn z-30">
          <div className="flex items-center justify-between border-b border-[#8b3d0b]/70 pb-2">
            <span className="text-xs font-bold text-[#ffca08]">
              ✍️ పేరు పొజిషన్ & సైజ్ సర్దుబాటు (Name Ribbon Adjustments):
            </span>
            <button
              type="button"
              onClick={handleResetPosition}
              className="text-[11px] text-amber-300 hover:underline font-semibold"
            >
              🔄 రీసెట్ (Reset)
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Vertical (Up/Down) */}
            <div className="flex flex-col gap-1 items-center bg-[#1c0802] p-2 rounded-xl border border-[#8b3d0b]/40">
              <span className="text-[11px] text-orange-200/80 font-medium">పైకి / క్రిందికి (Y)</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust('topPercent', -0.2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjust('topPercent', 0.2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  ▼
                </button>
              </div>
              <span className="text-[10px] text-amber-300/80 font-mono">{effectiveTopPercent.toFixed(1)}%</span>
            </div>

            {/* Horizontal (Left/Right) */}
            <div className="flex flex-col gap-1 items-center bg-[#1c0802] p-2 rounded-xl border border-[#8b3d0b]/40">
              <span className="text-[11px] text-orange-200/80 font-medium">ఎడమ / కుడి (X)</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust('centerPercent', -0.2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjust('centerPercent', 0.2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  ▶
                </button>
              </div>
              <span className="text-[10px] text-amber-300/80 font-mono">{effectiveCenterPercent.toFixed(1)}%</span>
            </div>

            {/* Font Size */}
            <div className="flex flex-col gap-1 items-center bg-[#1c0802] p-2 rounded-xl border border-[#8b3d0b]/40">
              <span className="text-[11px] text-orange-200/80 font-medium">ఫాంట్ సైజ్ (Size)</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjust('fontSize', -2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjust('fontSize', 2)}
                  className="w-7 h-7 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-white font-bold text-xs transition-colors flex items-center justify-center border border-[#8b3d0b]"
                >
                  A+
                </button>
              </div>
              <span className="text-[10px] text-amber-300/80 font-mono">{effectiveFontSize}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Flyer Canvas Container (Maintains 1200 x 2100 Aspect Ratio) */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[440px] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 border-[#ffca08]/40 overflow-hidden bg-[#1c0802] select-none group"
        style={{ aspectRatio: '1200 / 2100' }}
      >
        {/* Layer 0: Contributor Photo (Behind the transparent cutout) */}
        <div 
          className="absolute z-0 overflow-hidden flex items-center justify-center bg-[#2b1007]"
          style={{
            left: photoLeft,
            top: photoTop,
            width: photoWidth,
            height: photoHeight,
          }}
        >
          {data.photoUrl ? (
            <img 
              src={data.photoUrl} 
              alt="Contributor Photo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#381609]/70 border border-dashed border-[#ffca08]/40 text-orange-200/60">
              <span className="text-2xl sm:text-3xl mb-1">📸</span>
              <span className="text-[11px] font-semibold text-amber-300/80 leading-tight">
                దాత ఫోటో ఇక్కడ కనిపిస్తుంది
              </span>
              <span className="text-[9px] text-orange-200/50 mt-0.5">
                (Photo Frame)
              </span>
            </div>
          )}

          {/* Quick Edit Crop overlay button */}
          {data.photoUrl && onEditCrop && (
            <button
              type="button"
              onClick={onEditCrop}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
            >
              <span>✂️ క్రాప్ సవరించండి</span>
            </button>
          )}
        </div>

        {/* Layer 1: Mahadeepotsavam Contributors Template Overlay */}
        <img 
          src="/assets/Mahadeepotsavam Contributors Template.png"
          alt="Mahadeepotsavam Contributors Template"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* Layer 2: Contributor Name inside the Golden Maroon Ribbon */}
        <div 
          className="absolute z-20 pointer-events-none text-center px-4 flex flex-col items-center justify-center leading-tight transition-all"
          style={{
            left: `${effectiveCenterPercent}%`,
            top: `${effectiveTopPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: '68%',
            maxHeight: '4.5%',
          }}
        >
          {secondaryText ? (
            <>
              <span 
                className="font-extrabold text-[#ffea79] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                style={{
                  fontSize: `clamp(11px, ${effectiveFontSize * 0.44}px, 22px)`,
                  fontFamily: '"Noto Sans Telugu", sans-serif',
                }}
              >
                {primaryText}
              </span>
              <span 
                className="font-bold text-white tracking-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-0.5"
                style={{
                  fontSize: `clamp(9px, ${(effectiveFontSize - 8) * 0.44}px, 17px)`,
                  fontFamily: '"Noto Sans Telugu", sans-serif',
                }}
              >
                {secondaryText}
              </span>
            </>
          ) : (
            <span 
              className="font-extrabold text-[#ffea79] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
              style={{
                fontSize: `clamp(12px, ${effectiveFontSize * 0.46}px, 26px)`,
                fontFamily: '"Noto Sans Telugu", sans-serif',
              }}
            >
              {primaryText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
