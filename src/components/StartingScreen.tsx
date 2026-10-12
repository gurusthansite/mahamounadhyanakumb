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
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden items-center justify-center pointer-events-none bg-gradient-to-b from-[#1c0802] via-[#240b03] to-[#381407] transition-opacity duration-1000 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Divine Golden Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[700px] max-h-[700px] bg-[#ffca08] opacity-20 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Content wrapper with smooth zoom-in animation */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-center w-full h-full p-4 transition-transform duration-[3000ms] ease-out ${
          isZooming ? 'scale-105' : 'scale-95'
        }`}
      >
        {/* Full-screen prominent Gurusthan Emblem Logo */}
        <div className="relative w-[92vw] max-w-[540px] md:max-w-[620px] max-h-[85vh] aspect-square flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#ffca08] opacity-25 blur-3xl"></div>
          <img 
            src="/assets/logo.png" 
            alt="Maha Mouna Dhyana Kumbh" 
            className="relative w-full h-full object-contain drop-shadow-[0_15px_50px_rgba(255,202,8,0.55)]"
          />
        </div>
      </div>
    </div>
  );
};


