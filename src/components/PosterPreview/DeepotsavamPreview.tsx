import React, { useRef } from 'react';

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

  // Exact coordinates matching the template (1200 x 2100)
  // Photo frame bounds: x=394, y=1004, w=415, h=346
  const photoLeft = `${(394 / 1200) * 100}%`;
  const photoTop = `${(1004 / 2100) * 100}%`;
  const photoWidth = `${(415 / 1200) * 100}%`;
  const photoHeight = `${(346 / 2100) * 100}%`;

  // Name ribbon center: y = 1417.5 / 2100 = 67.5%, x = 600 / 1200 = 50.0%
  const defaultTopPercent = 67.5;
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
  if (loc) {
    primaryText = `${primaryText}, ${loc}`;
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

  const handleSetDirect = (field: 'topPercent' | 'centerPercent' | 'fontSize', val: number) => {
    setData(prev => ({
      ...prev,
      customNamePosition: {
        topPercent: prev.customNamePosition?.topPercent ?? defaultTopPercent,
        centerPercent: prev.customNamePosition?.centerPercent ?? defaultCenterPercent,
        fontSize: prev.customNamePosition?.fontSize ?? defaultFontSize,
        [field]: val,
      }
    }));
  };

  const handleResetPosition = () => {
    setData(prev => ({
      ...prev,
      customNamePosition: undefined
    }));
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Live Preview Header */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-2.5 px-1">
        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <span>🪔</span>
          <span>లైవ్ ఫ్లైయర్ ప్రివ్యూ (Live Preview)</span>
        </span>
      </div>

      {/* Main Flyer Canvas Container (Maintains 1200 x 2100 Aspect Ratio) */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[440px] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-2 border-[#ffca08]/40 overflow-hidden bg-[#1c0802] select-none group"
        style={{ aspectRatio: '1200 / 2100', containerType: 'inline-size' }}
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
          className="absolute z-20 pointer-events-none text-center px-2 flex items-center justify-center leading-tight transition-all"
          style={{
            left: `${effectiveCenterPercent}%`,
            top: `${effectiveTopPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: '60%',
            maxHeight: '4.5%',
          }}
        >
          <span 
            className="font-extrabold text-[#ffea79] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            style={{
              fontSize: `${(effectiveFontSize / 12).toFixed(3)}cqi`,
              fontFamily: '"Noto Sans Telugu", "Noto Sans", sans-serif',
              fontWeight: 800,
            }}
          >
            {primaryText}
          </span>
        </div>
      </div>

      {/* Manual Position & Font Adjustments Panel (Permanently open right after the flyer) */}
      <div className="w-full max-w-[440px] mt-3.5 p-4 bg-[#240b03] rounded-2xl border border-[#ffca08]/40 shadow-xl flex flex-col gap-3.5 text-xs text-orange-100">
        <div className="flex items-center justify-between border-b border-[#8b3d0b]/80 pb-2">
          <span className="font-bold text-[#ffca08] text-xs flex items-center gap-1.5">
            <span>✍️</span>
            <span>పేరు & ఫాంట్ సర్దుబాటు (Name & Font Adjustments):</span>
          </span>
          <button
            type="button"
            onClick={handleResetPosition}
            className="text-[11px] px-2.5 py-0.5 rounded bg-red-950/70 hover:bg-red-900 border border-red-700/50 text-red-200 font-semibold transition-colors"
            title="Reset to default position and size"
          >
            ↺ Reset
          </button>
        </div>

        {/* Height / Vertical (Y) Adjust */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-orange-200 font-medium">Height / Vertical (Y):</span>
            <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
              {effectiveTopPercent.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjust('topPercent', -0.2)}
              className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
              title="Move Up"
            >
              ▲ Up (-0.2%)
            </button>
            <input
              type="range"
              min="60.0"
              max="76.0"
              step="0.1"
              value={effectiveTopPercent}
              onChange={(e) => handleSetDirect('topPercent', parseFloat(e.target.value))}
              className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleAdjust('topPercent', 0.2)}
              className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
              title="Move Down"
            >
              ▼ Down (+0.2%)
            </button>
          </div>
        </div>

        {/* Horizontal Center (X) Adjust */}
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
              onClick={() => handleAdjust('centerPercent', -0.2)}
              className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
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
              onChange={(e) => handleSetDirect('centerPercent', parseFloat(e.target.value))}
              className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleAdjust('centerPercent', 0.2)}
              className="px-2.5 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
              title="Move Right"
            >
              ► Right (+0.2%)
            </button>
          </div>
        </div>

        {/* Font Size Adjust */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-orange-200 font-medium">Font Size (సైజ్):</span>
            <span className="font-mono text-[#ffca08] bg-[#1a0802] px-1.5 py-0.5 rounded border border-[#8b3d0b]/40">
              {effectiveFontSize}px
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjust('fontSize', -1)}
              className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
              title="Smaller"
            >
              A-
            </button>
            <input
              type="range"
              min="20"
              max="55"
              step="1"
              value={effectiveFontSize}
              onChange={(e) => handleSetDirect('fontSize', parseInt(e.target.value, 10))}
              className="flex-1 accent-[#ffca08] h-1.5 bg-[#1a0802] rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleAdjust('fontSize', 1)}
              className="px-3 py-1 bg-[#4a1c0b] hover:bg-[#6b280f] rounded-lg border border-[#8b3d0b] text-white font-bold transition-colors"
              title="Larger"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
