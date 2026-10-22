import React, { useEffect, useRef, useState } from 'react';
import type { UserData } from '../../types/poster';
import { 
  generateReceipt, 
  renderReceiptToCanvas, 
  numToWords,
  type ReceiptCustomData, 
  type ReceiptOffsets 
} from '../../canvas/receiptRenderer';

interface ReceiptPreviewProps {
  userData: UserData;
  onBackToPoster?: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ userData, onBackToPoster }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showManualEditor, setShowManualEditor] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'data' | 'offsets'>('data');

  // Calculate initial defaults
  const now = new Date();
  const initDay = String(now.getDate()).padStart(2, '0');
  const initMonth = String(now.getMonth() + 1).padStart(2, '0');
  const initYear = String(now.getFullYear());
  const isMahaMouna = userData.sevaCategory === 'mahamouna';
  const initPlates = parseInt(userData.plates || '1', 10) || 1;
  const donationAmountNum = parseInt(userData.donationAmount || '0', 10) || 0;
  const initAmount = isMahaMouna ? (donationAmountNum > 0 ? donationAmountNum : 1) : initPlates * 1;
  const initReceiptNo =
    userData.receiptNo ||
    `MK-${initDay}${initMonth}-${(userData.paymentId || '108').slice(-4).toUpperCase()}`;
  const prefix = userData.titlePrefix ? `${userData.titlePrefix} ` : '';
  const initDonorName = `${prefix}${userData.fullName || 'Devotee'}`.trim();
  const initPhone = userData.phoneNumber ? `+91 ${userData.phoneNumber.replace(/\D/g, '')}` : '';

  const initAmountWords = isMahaMouna
    ? `${numToWords(initAmount)} Rupees Only`
    : `${numToWords(initAmount)} (${initPlates} ${initPlates === 1 ? 'Plate' : 'Plates'})`;

  const initSevaDescription = isMahaMouna
    ? `Maha Mouna Dhyana Kumbh - Arunachalam`
    : `Arunachalam Seva (${initPlates} Plates${userData.plateNumber ? ` • Plate #${userData.plateNumber}` : ''})`;

  // Local state for full manual control
  const [customData, setCustomData] = useState<ReceiptCustomData>({
    receiptNo: initReceiptNo,
    day: initDay,
    month: initMonth,
    year: initYear,
    donorName: initDonorName,
    dob: userData.dob || '',
    plateNumber: userData.plateNumber || '',
    location: userData.location || '',
    phoneNumber: initPhone,
    plates: isMahaMouna ? 0 : initPlates,
    amount: initAmount,
    amountWords: initAmountWords,
    paymentRef: userData.paymentId ? `Online / ${userData.paymentId}` : 'Online Payment',
    sevaDescription: initSevaDescription,
    offsets: {}
  });

  // Re-render canvas whenever customData or userData changes
  useEffect(() => {
    let isCancelled = false;
    const render = async () => {
      if (!canvasRef.current) return;
      try {
        setRenderError(null);
        await renderReceiptToCanvas(canvasRef.current, userData, customData);
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
  }, [userData, customData]);

  // Handle data updates
  const handleDataChange = (field: keyof ReceiptCustomData, value: any) => {
    setCustomData(prev => {
      const updated = { ...prev, [field]: value };
      // If plates changed, automatically sync amount and words if desired
      if (field === 'plates') {
        const p = parseInt(value, 10) || 1;
        const amt = p * 1;
        updated.amount = amt;
        updated.amountWords = `${numToWords(amt)} (${p} ${p === 1 ? 'Plate' : 'Plates'})`;
        updated.sevaDescription = `Arunachalam Seva (${p} Plates)`;
      } else if (field === 'amount') {
        const a = parseInt(value, 10) || 0;
        updated.amountWords = `${numToWords(a)} (${updated.plates || 1} Plates)`;
      }
      return updated;
    });
  };

  // Handle position nudging (X, Y offset changes)
  const nudgeOffset = (field: keyof ReceiptOffsets, dx: number, dy: number) => {
    setCustomData(prev => {
      const curr = prev.offsets?.[field] || { x: 0, y: 0 };
      return {
        ...prev,
        offsets: {
          ...prev.offsets,
          [field]: {
            x: curr.x + dx,
            y: curr.y + dy
          }
        }
      };
    });
  };

  const resetOffsets = () => {
    setCustomData(prev => ({
      ...prev,
      offsets: {}
    }));
  };

  const handleDownloadReceipt = async () => {
    try {
      setIsGenerating(true);
      const blob = await generateReceipt(userData, customData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (customData.donorName || 'devotee').replace(/\s+/g, '-').toLowerCase();
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
      const blob = await generateReceipt(userData, customData);
      const cleanName = (customData.donorName || 'devotee').replace(/\s+/g, '-').toLowerCase();
      const filename = `receipt-${cleanName}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const shareText = `మహా మౌన ధ్యాన కుంభ్ - అరుణాచలం\nఅన్నప్రసాద వితరణ సేవ అధికారిక విరాళ రశీదు\n\nరశీదు నెం: ${customData.receiptNo}\nదాత: ${customData.donorName}\nమొత్తం: ₹${(customData.amount || 0).toLocaleString('en-IN')}/- (${customData.plates || 1} ప్లేట్స్)\nచెల్లింపు: ${customData.paymentRef}\n\nసంస్థ: వసుధైక ఫౌండేషన్ (80G అర్హత)`;

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

      {/* Manual Edit & Adjust Toggle Button */}
      <div className="w-full mt-3">
        <button
          type="button"
          onClick={() => setShowManualEditor(!showManualEditor)}
          className="w-full py-2 px-3 rounded-xl bg-[#240b03] hover:bg-[#341206] border border-[#ffca08]/60 text-[#ffca08] text-xs font-bold flex items-center justify-between transition-all shadow-md"
        >
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span>రశీదు వివరాలు & అమరిక సవరించండి (Edit / Align Receipt Manually)</span>
          </div>
          <span className="text-sm">{showManualEditor ? '▲ ముగించు' : '▼ తెరవండి'}</span>
        </button>

        {/* Manual Customization Drawer */}
        {showManualEditor && (
          <div className="mt-2 p-4 bg-[#240b03] border border-[#8b3d0b] rounded-2xl text-xs space-y-4 shadow-xl animate-fadeIn">
            {/* Tabs */}
            <div className="flex border-b border-[#8b3d0b] pb-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`py-1.5 px-3 rounded-lg font-bold transition-all ${
                  activeTab === 'data'
                    ? 'bg-[#ffca08] text-[#381609]'
                    : 'bg-[#381609] text-orange-200 hover:text-white'
                }`}
              >
                📝 వివరాలు (Edit Data)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offsets')}
                className={`py-1.5 px-3 rounded-lg font-bold transition-all ${
                  activeTab === 'offsets'
                    ? 'bg-[#ffca08] text-[#381609]'
                    : 'bg-[#381609] text-orange-200 hover:text-white'
                }`}
              >
                🎯 అమరిక సర్దుబాటు (Nudge Alignment)
              </button>
            </div>

            {/* TAB 1: EDIT DATA */}
            {activeTab === 'data' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-orange-200 block mb-1">దాత పేరు (Donor Name)</label>
                    <input
                      type="text"
                      value={customData.donorName || ''}
                      onChange={(e) => handleDataChange('donorName', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-orange-200 block mb-1">జన్మదినం (Date of Birth / D.O.B)</label>
                    <input
                      type="date"
                      value={customData.dob || ''}
                      onChange={(e) => handleDataChange('dob', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-orange-200 block mb-1">ఫోన్ నెంబర్ (Phone)</label>
                    <input
                      type="text"
                      value={customData.phoneNumber || ''}
                      onChange={(e) => handleDataChange('phoneNumber', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-orange-200 block mb-1">చిరునామా / ప్రాంతం (Location)</label>
                    <input
                      type="text"
                      value={customData.location || ''}
                      onChange={(e) => handleDataChange('location', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-orange-200 block mb-1">కేటాయించిన ప్లేట్ నెం. (Assigned Plate No.)</label>
                    <input
                      type="text"
                      value={customData.plateNumber || ''}
                      onChange={(e) => handleDataChange('plateNumber', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-emerald-400 font-mono font-bold rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-orange-200 block mb-1">రశీదు నెంబర్ (Receipt No)</label>
                    <input
                      type="text"
                      value={customData.receiptNo || ''}
                      onChange={(e) => handleDataChange('receiptNo', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-[#ffca08] font-mono rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-orange-200 block mb-1">ప్లేట్లు (Plates)</label>
                    <input
                      type="number"
                      min="1"
                      value={customData.plates || 1}
                      onChange={(e) => handleDataChange('plates', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-orange-200 block mb-1">మొత్తం (₹ Amount)</label>
                    <input
                      type="number"
                      value={customData.amount || 1}
                      onChange={(e) => handleDataChange('amount', parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-[#ffca08] font-bold rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-orange-200 block mb-1">తేదీ (DD-MM-YYYY)</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        maxLength={2}
                        value={customData.day || ''}
                        onChange={(e) => handleDataChange('day', e.target.value)}
                        placeholder="DD"
                        className="w-1/3 p-2 bg-[#170501] border border-[#8b3d0b] text-white text-center rounded-lg"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={customData.month || ''}
                        onChange={(e) => handleDataChange('month', e.target.value)}
                        placeholder="MM"
                        className="w-1/3 p-2 bg-[#170501] border border-[#8b3d0b] text-white text-center rounded-lg"
                      />
                      <input
                        type="text"
                        maxLength={4}
                        value={customData.year || ''}
                        onChange={(e) => handleDataChange('year', e.target.value)}
                        placeholder="YYYY"
                        className="w-1/3 p-2 bg-[#170501] border border-[#8b3d0b] text-white text-center rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-orange-200 block mb-1">మొత్తం అక్షరాలలో (Amount in Words)</label>
                  <input
                    type="text"
                    value={customData.amountWords || ''}
                    onChange={(e) => handleDataChange('amountWords', e.target.value)}
                    className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-orange-200 block mb-1">చెల్లింపు వివరాలు (Payment Ref / ID)</label>
                    <input
                      type="text"
                      value={customData.paymentRef || ''}
                      onChange={(e) => handleDataChange('paymentRef', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white font-mono rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-orange-200 block mb-1">సేవా రకం (Seva Description)</label>
                    <input
                      type="text"
                      value={customData.sevaDescription || ''}
                      onChange={(e) => handleDataChange('sevaDescription', e.target.value)}
                      className="w-full p-2 bg-[#170501] border border-[#8b3d0b] text-white rounded-lg focus:border-[#ffca08] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NUDGE ALIGNMENT (OFFSETS) */}
            {activeTab === 'offsets' && (
              <div className="space-y-3">
                <p className="text-orange-300/80 text-[11px]">
                  రశీదుపై ప్రతి అక్షర స్థానాన్ని కావాల్సినట్లుగా కదిలించండి (Nudge position in pixels):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'donorName', label: '1. దాత పేరు (Donor Name)' },
                    { id: 'receiptNo', label: '2. రశీదు నెంబర్ (Receipt No)' },
                    { id: 'date', label: '3. తేదీ (Date DD/MM/YYYY)' },
                    { id: 'phone', label: '4. ఫోన్ నెంబర్ (Phone)' },
                    { id: 'dob', label: '5. జన్మదినం (D.O.B)' },
                    { id: 'location', label: '6. చిరునామా (Address)' },
                    { id: 'amountWords', label: '7. మొత్తము మాటలలో (Words)' },
                    { id: 'amountBox', label: '8. రూ. పెట్టె (Rs. Box)' },
                    { id: 'paymentRef', label: '9. చెల్లింపు సూచన (Payment Ref)' },
                    { id: 'sevaDescription', label: '10. సేవా రకం (Seva Type)' },
                  ].map(item => {
                    const off = (customData.offsets as any)?.[item.id] || { x: 0, y: 0 };
                    return (
                      <div key={item.id} className="bg-[#170501] p-2 rounded-lg border border-[#8b3d0b]/80 flex items-center justify-between">
                        <div>
                          <span className="text-white font-semibold block text-[11px]">{item.label}</span>
                          <span className="text-[10px] text-orange-400 font-mono">
                            X: {off.x > 0 ? `+${off.x}` : off.x}px | Y: {off.y > 0 ? `+${off.y}` : off.y}px
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Move Left"
                            onClick={() => nudgeOffset(item.id as keyof ReceiptOffsets, -3, 0)}
                            className="w-6 h-6 rounded bg-[#381609] hover:bg-[#8b3d0b] text-white font-bold flex items-center justify-center text-xs"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            title="Move Right"
                            onClick={() => nudgeOffset(item.id as keyof ReceiptOffsets, 3, 0)}
                            className="w-6 h-6 rounded bg-[#381609] hover:bg-[#8b3d0b] text-white font-bold flex items-center justify-center text-xs"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            title="Move Up"
                            onClick={() => nudgeOffset(item.id as keyof ReceiptOffsets, 0, -3)}
                            className="w-6 h-6 rounded bg-[#381609] hover:bg-[#8b3d0b] text-white font-bold flex items-center justify-center text-xs"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={() => nudgeOffset(item.id as keyof ReceiptOffsets, 0, 3)}
                            className="w-6 h-6 rounded bg-[#381609] hover:bg-[#8b3d0b] text-white font-bold flex items-center justify-center text-xs"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={resetOffsets}
                    className="py-1 px-3 text-[11px] rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/50 transition-all font-semibold"
                  >
                    ↺ డిఫాల్ట్ అమరిక రీసెట్ (Reset All Offsets)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Chips */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">దాత పేరు (Donor)</span>
          <span className="font-bold text-white truncate block">
            {customData.donorName || '—'}
          </span>
          {customData.dob && (
            <span className="text-emerald-400 text-[10px] block mt-0.5 font-mono">
              DOB: {customData.dob}
            </span>
          )}
        </div>
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">మొత్తం (Amount)</span>
          <span className="font-bold text-[#ffca08] block">
            ₹{(customData.amount || 0).toLocaleString('en-IN')}/- ({customData.plates || 1} ప్లేట్లు)
          </span>
        </div>
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">ప్లేట్ నంబర్</span>
          <span className="font-mono text-emerald-400 font-bold text-[11px] truncate block">
            {customData.plateNumber ? `🔒 ${customData.plateNumber}` : '—'}
          </span>
        </div>
        <div className="bg-[#240b03] p-2.5 rounded-xl border border-[#8b3d0b]">
          <span className="text-orange-300/70 block text-[10px]">రశీదు నెంబర్</span>
          <span className="font-mono text-[#ffca08] text-[11px] truncate block">
            {customData.receiptNo || 'N/A'}
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
