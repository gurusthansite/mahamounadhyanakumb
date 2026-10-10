import { useState, useEffect } from 'react';

export const StartingScreen = () => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    // Start a subtle zoom effect immediately
    setIsZooming(true);

    // Fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Completely remove from DOM after fade completes
    const hideTimer = setTimeout(() => {
      setIsHidden(true);
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (isHidden) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden items-center justify-center pointer-events-none bg-gradient-to-b from-[#240b03] to-[#4a1c0b] transition-opacity duration-1000 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ffca08] opacity-10 rounded-full blur-3xl"></div>
      
      {/* Content wrapper with zoom-in animation */}
      <div 
        className={`relative z-10 flex flex-col items-center transition-transform duration-[3000ms] ease-out ${
          isZooming ? 'scale-110' : 'scale-100'
        }`}
      >
        {/* Lotus icon placeholder (could use SVG) */}
        <svg className="w-16 h-16 text-[#ffca08] mb-6 drop-shadow-[0_0_15px_rgba(255,202,8,0.5)]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 22s-3.5-3.5-3.5-7c0-2 1-4 3.5-6 2.5 2 3.5 4 3.5 6 0 3.5-3.5 7-3.5 7zm0-13c-3-2-6-4.5-6-8 0 0 1.5.5 3 2.5C10.5 5.5 12 8 12 9zm0 0c3-2 6-4.5 6-8 0 0-1.5.5-3 2.5C13.5 5.5 12 8 12 9zM6 15c-3.5 0-6-1.5-6-4 0 0 2.5 1 5 1.5 2.5.5 4.5 2.5 4.5 2.5-.5.5-2.5 1-3.5 0zm12 0c3.5 0 6-1.5 6-4 0 0-2.5 1-5 1.5-2.5.5-4.5 2.5-4.5 2.5.5.5 2.5 1 3.5 0z" />
        </svg>

                <h1 className="font-['Noto_Sans_Telugu'] text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ffca08] to-[#fef08a] leading-tight text-center drop-shadow-2xl px-4">
          మహా మౌన ధ్యాన కుంభ్
        </h1>
        <p className="mt-4 font-['Poppins'] text-lg md:text-xl text-orange-200/80 tracking-[0.2em] uppercase font-light">
          A Movement of Mouna
        </p>
      </div>
    </div>
  );
};


