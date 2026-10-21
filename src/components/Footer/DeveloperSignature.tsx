import React, { useState, useRef, useEffect } from 'react';

export const DeveloperSignature: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative text-center mt-8 mb-3 z-30">
      {/* Small text trigger */}
      <div className="inline-flex items-center justify-center gap-1.5 text-xs text-orange-200/70">
        <span>Designed &amp; Developed by</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="developer-animated-text cursor-pointer hover:opacity-100 bg-transparent border-0 p-0 text-left font-bold"
          title="Click to view contact numbers"
        >
          Sripada Sai ram lohith
        </button>
      </div>

      {/* Small Popup Bubble (positioned right above the text) */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#2a0e05] border border-[#ffca08]/60 rounded-2xl p-3 shadow-2xl z-50 text-orange-100 text-center animate-fadeIn backdrop-blur-md"
        >
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#ffca08]/60"></div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-7 border-transparent border-t-[#2a0e05]"></div>

          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#8b3d0b]/80">
            <span className="text-xs font-bold text-[#ffca08] flex items-center gap-1">
              👨‍💻 Sripada Sai ram lohith
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-orange-300 hover:text-white text-base leading-none p-0.5 cursor-pointer"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Number 1 */}
            <div className="flex items-center justify-between bg-[#190601] px-2.5 py-1.5 rounded-xl border border-[#8b3d0b]/60">
              <span className="text-xs font-mono font-bold text-white">+91 83744 46877</span>
              <div className="flex items-center gap-1">
                <a
                  href="tel:8374446877"
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                  title="Call"
                >
                  📞 Call
                </a>
                <a
                  href="https://wa.me/918374446877?text=Hi%20Sai%20Ram%20Lohith,%20contacting%20regarding%20Maha%20Mouna%20Dhyana%20Kumbh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold"
                  title="WhatsApp"
                >
                  💬 Chat
                </a>
              </div>
            </div>

            {/* Number 2 */}
            <div className="flex items-center justify-between bg-[#190601] px-2.5 py-1.5 rounded-xl border border-[#8b3d0b]/60">
              <span className="text-xs font-mono font-bold text-white">+91 63018 65010</span>
              <div className="flex items-center gap-1">
                <a
                  href="tel:6301865010"
                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                  title="Call"
                >
                  📞 Call
                </a>
                <a
                  href="https://wa.me/916301865010?text=Hi%20Sai%20Ram%20Lohith,%20contacting%20regarding%20Maha%20Mouna%20Dhyana%20Kumbh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold"
                  title="WhatsApp"
                >
                  💬 Chat
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
