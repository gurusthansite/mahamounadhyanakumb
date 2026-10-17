import React, { useRef } from 'react';
import type { UserData } from '../../types/poster';
import { ARUNACHALAM_TEMPLATE_WIDTH, ARUNACHALAM_TEMPLATE_HEIGHT, ARUNACHALAM_PHOTO_AREA } from '../../canvas/imageRenderer';
import { ANNAPRASADAM_TEXT_POSITIONS } from '../../canvas/coordinates';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onEditCrop?: () => void;
}

export const AnnaprasadamPreview: React.FC<Props> = ({ userData, onEditCrop }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Position offsets for the photo frame in percentage:
  // photoArea: { x: 83, y: 618, width: 366, height: 476 } on 1024 x 1536
  const photoLeft = `${(ARUNACHALAM_PHOTO_AREA.x / ARUNACHALAM_TEMPLATE_WIDTH) * 100}%`;
  const photoTop = `${(ARUNACHALAM_PHOTO_AREA.y / ARUNACHALAM_TEMPLATE_HEIGHT) * 100}%`;
  const photoWidth = `${(ARUNACHALAM_PHOTO_AREA.width / ARUNACHALAM_TEMPLATE_WIDTH) * 100}%`;
  const photoHeight = `${(ARUNACHALAM_PHOTO_AREA.height / ARUNACHALAM_TEMPLATE_HEIGHT) * 100}%`;

  return (
    <div className="flex flex-col items-center">
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

        {/* Dynamic Plates Count inside Green Box */}
        {userData.plates && (
          <div 
            className="absolute z-20 text-[#ffeb3b] font-black drop-shadow-md tracking-tight flex items-center justify-center whitespace-nowrap"
            style={{ 
              top: `${ANNAPRASADAM_TEXT_POSITIONS.plates.topPercent}%`, 
              left: `${ANNAPRASADAM_TEXT_POSITIONS.plates.centerPercent}%`,
              transform: 'translate(-50%, -50%)', 
              fontSize: 'clamp(14px, 4.2cqi, 36px)', 
              fontFamily: '"Noto Sans Telugu", sans-serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)'
            }}
          >
            <span>{userData.plates}</span>
            <span className="text-white ml-2 text-[0.85em] font-bold">ప్లేట్స్ అన్నప్రసాదం</span>
          </div>
        )}

        {/* Dynamic Donor Name with [గారికి] automatically added */}
        {userData.fullName && (
          <div 
            className="absolute z-20 text-[#1e3a1e] font-extrabold drop-shadow-sm flex items-center justify-end max-w-[55%]"
            style={{ 
              top: `${ANNAPRASADAM_TEXT_POSITIONS.name.topPercent}%`, 
              right: `${ANNAPRASADAM_TEXT_POSITIONS.name.rightPercent}%`,
              transform: 'translateY(-50%)', 
              fontSize: 'clamp(12px, 3.6cqi, 30px)', 
              fontFamily: '"Noto Sans Telugu", sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {`${userData.titlePrefix ? userData.titlePrefix + ' ' : 'శ్రీ '}${userData.fullName} గారికి`}
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
            Crop Photo
          </button>
        )}
      </div>
    </div>
  );
};
