import React, { useEffect, useRef, useState } from 'react';
import type { UserData } from '../../types/poster';
import { generateReceipt, renderReceiptToCanvas } from '../../canvas/receiptRenderer';

interface ReceiptPreviewProps {
  userData: UserData;
  onBackToPoster?: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ userData, onBackToPoster }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const plates = parseInt(userData.plates || '1', 10) || 1;
  const amount = plates * 51;

  useEffect(() => {
    let isCancelled = false;
    const render = async () => {
      if (!canvasRef.current) return;
      try {
        setRenderError(null);
        await renderReceiptToCanvas(canvasRef.current, userData);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to render receipt canvas:", err);
          setRenderError(err.message || "Failed to render receipt");
        }
      }
    };
    render();
    return () => {
      isCancelled = true;
    };
  }, [userData]);

  const handleDownloadReceipt = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateReceipt(userData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (userData.fullName || 'devotee').replace(/\s+/g, '-').toLowerCase();
      a.download = `receipt-${cleanName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('రశీదు డౌన్‌లోడ్ చేయడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareReceipt = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateReceipt(userData);
      const cleanName = (userData.fullName || 'devotee').replace(/\s+/g, '-').toLowerCase();
      const filename = `receipt-${cleanName}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const shareText = `మహా మౌన ధ్యాన కుంభ్ - అరుణాచలం\nఅన్నప్రసాద వితరణ సేవ అధికారిక విరాళ రశీదు\n\nదాత: ${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}\nమొత్తం: ₹${amount.toLocaleString('en-IN')}/- (${plates} ప్లేట్స్)\nచెల్లింపు ID: ${userData.paymentId || 'N/A'}\n\nసంస్థ: వసుధైక ఫౌండేషన్ (80G అర్హత)`;

      let shared = false;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Donation Receipt - Annaprasadam Seva',
            text: shareText,
          });
          shared = true;
        } catch (shareErr) {
          if (shareErr instanceof Error && shareErr.name !== 'AbortError') {
            console.warn('Native share failed:', shareErr);
          } else {
            shared = true;
          }
        }
      }

      if (!shared) {
        // Fallback: download receipt and open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('రశీదు మీ ఫోన్‌లో సేవ్ అయ్యింది. వాట్సాప్ తెరుచుకుంటుంది...');
        setTimeout(() => {
          window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
        }, 800);
      }
    } catch (err) {
      console.error(err);
      alert('రశీదు షేర్ చేయడంలో సమస్య ఏర్పడింది.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Receipt Badge Header */}
      <div className="w-full flex items-center justify-between mb-3 bg-[#240b03] p-3 rounded-xl border border-[#ffca08]/40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#ffca08] font-['Noto_Sans_Telugu']">
              అధికారిక విరాళ రశీదు (Official Receipt)
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium">
              ✓ పేమెంట్ పూర్తయింది • 80G Tax Benefit
            </p>
          </div>
        </div>

        {onBackToPoster && (
          <button
            type="button"
            onClick={onBackToPoster}
            className="text-xs font-bold text-orange-200 hover:text-white bg-[#8b3d0b]/40 hover:bg-[#8b3d0b] px-3 py-1.5 rounded-lg border border-[#8b3d0b] transition-all"
          >
            ← పోస్టర్ చూడండి
          </button>
        )}
      </div>

      {/* Canvas Wrapper */}
      <div className="relative w-full aspect-[1280/853] bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-[#ffca08]">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block bg-white"
        />

        {renderError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-rose-400 font-bold mb-2">రశీదు లోడ్ చేయడంలో సమస్య వచ్చింది</p>
            <p className="text-xs text-orange-200">{renderError}</p>
          </div>
        )}
      </div>

      {/* Summary Chips */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">దాత పేరు (Donor)</span>
          <span className="font-bold text-white truncate block">
            {userData.titlePrefix ? userData.titlePrefix + ' ' : ''}{userData.fullName || '—'}
          </span>
        </div>
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">మొత్తం (Amount)</span>
          <span className="font-bold text-[#ffca08] block">
            ₹{amount.toLocaleString('en-IN')}/- ({plates} {plates === 1 ? 'Plate' : 'Plates'})
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">Payment ID</span>
          <span className="font-mono text-emerald-400 text-[11px] truncate block">
            {userData.paymentId || 'N/A'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          onClick={handleDownloadReceipt}
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-bold rounded-xl shadow-lg border border-[#ffca08]/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <span className="text-lg">📥</span>
          <span>రశీదు డౌన్‌లోడ్ (Download)</span>
        </button>

        <button
          type="button"
          onClick={handleShareReceipt}
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f776a] text-white font-bold rounded-xl shadow-lg border border-emerald-300/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <span className="text-lg">💬</span>
          <span>రశీదు వాట్సాప్ షేర్ (Share)</span>
        </button>
      </div>

      <p className="text-[11px] text-center text-orange-200/60 mt-3">
        * ఈ విరాళం వసుధైక ఫౌండేషన్ ఆధ్వర్యంలో 80G ఆదాయపు పన్ను మినహాయింపునకు అర్హత కలిగి ఉంది.
      </p>
    </div>
  );
};
