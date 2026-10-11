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
        {/* Gurusthan Logo */}
        <img 
          src="/assets/logo.jpeg" 
          alt="Gurusthan Logo" 
          className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6 drop-shadow-[0_0_25px_rgba(255,202,8,0.4)] rounded-2xl"
        />

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


