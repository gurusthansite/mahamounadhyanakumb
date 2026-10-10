import React from 'react';

interface Props {
  onDownload: () => void;
  onShare: () => void;
  isGenerating?: boolean;
}

export const ActionButtons: React.FC<Props> = ({ onDownload, onShare, isGenerating = false }) => {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <button 
        className="group bg-[#ffca08] hover:bg-[#e5b607] disabled:bg-[#ffca08]/50 disabled:cursor-not-allowed text-[#381609] font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full text-lg flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,202,8,0.3)] active:translate-y-0"
        onClick={onDownload}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-6 w-6 text-[#381609]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download Poster
          </>
        )}
      </button>

      <button 
        className="group bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full text-lg flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(34,197,94,0.3)] active:translate-y-0"
        onClick={onShare}
        disabled={isGenerating}
      >
        <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Share to WhatsApp
      </button>
    </div>
  );
};
