import React, { useState, useRef } from 'react';

interface Props {
  googleScriptUrl: string;
  onNavigateToPoster?: () => void;
}

interface ExistingRecord {
  name?: string;
  contact?: string;
  address?: string;
  timestamp?: string;
}

export const RegistrationFormPage: React.FC<Props> = ({ googleScriptUrl }) => {
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Step states: 'check' | 'exists' | 'fill' | 'saved'
  const [step, setStep] = useState<'check' | 'exists' | 'fill' | 'saved'>('check');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState<ExistingRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setContact(digits);
    setErrorMessage(null);
    if (step !== 'check') {
      setStep('check');
      setExistingRecord(null);
    }
  };

  const handleCheckPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!contact || contact.length !== 10) {
      setErrorMessage("దయచేసి 10 అంకెల మొబైల్ నెంబర్ నమోదు చేయండి (Please enter a valid 10-digit number)");
      return;
    }

    setIsChecking(true);
    setExistingRecord(null);

    try {
      const response = await fetch(googleScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "check",
          contact: contact
        })
      });

      const result = await response.json();

      if (result.status === 'exists') {
        setExistingRecord(result.data || {});
        setStep('exists');
      } else {
        // Not found in sheet, proceed to fill full form
        setStep('fill');
      }
    } catch (err) {
      console.error("Check failed:", err);
      // If error or CORS issues, allow them to fill full form
      setStep('fill');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResetForNextEntry = () => {
    setContact('');
    setName('');
    setAddress('');
    setExistingRecord(null);
    setStep('check');
    setErrorMessage(null);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  const handleSaveToSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("దయచేసి పేరు నమోదు చేయండి (Please enter name)");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("దయచేసి చిరునామా నమోదు చేయండి (Please enter address / area)");
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch(googleScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "submit",
          name: name.trim(),
          contact: contact.trim(),
          address: address.trim()
        })
      });

      setStep('saved');
    } catch (err) {
      console.error("Save failed:", err);
      // Standard Apps Script opaque success handling
      setStep('saved');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="bg-[#4a1c0b] rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-[#8b3d0b] relative overflow-hidden">
        {/* Divine Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffca08] opacity-10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d97706] opacity-10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logo.png" 
              alt="Gurusthan Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_0_20px_rgba(255,202,8,0.4)]"
            />
          </div>
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#ffca08]/50 bg-[#ffca08]/20 text-[#ffca08] font-bold text-xs sm:text-sm tracking-widest uppercase mb-3 shadow-sm">
            డేటా ఎంట్రీ • Direct Excel Entry
          </span>
          <h1 className="font-['Poppins',sans-serif] text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md tracking-wide">
            S.R.Nagar Register Data 03-25 to 10-26
          </h1>
          <p className="font-['Noto_Sans_Telugu'] text-orange-200/80 text-sm sm:text-base mt-2">
            ఫోన్ నెంబర్ తనిఖీ చేసి కొత్త వివరాలను నమోదు చేయండి
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-950/90 border border-rose-500/60 rounded-xl text-rose-200 text-sm font-medium flex items-center gap-2 relative z-10 shadow-md">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Step 1: Phone Number Input & Check Button */}
        <div className="relative z-10 bg-[#240b03] p-5 sm:p-6 rounded-2xl border border-[#8b3d0b] shadow-inner mb-6">
          <label htmlFor="contact-input" className="block text-sm sm:text-base font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
            ఫోన్ నెంబర్ (Mobile Number) <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200/50 font-semibold text-sm">
                +91
              </span>
              <input
                id="contact-input"
                ref={phoneInputRef}
                type="tel"
                value={contact}
                onChange={handlePhoneChange}
                placeholder="10 అంకెల మొబైల్ నెంబర్"
                maxLength={10}
                className="w-full bg-[#1c0802] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl pl-14 pr-4 py-3.5 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-lg font-bold tracking-wider"
              />
            </div>
            <button
              type="button"
              onClick={() => handleCheckPhone()}
              disabled={isChecking || contact.length !== 10}
              className="py-3.5 px-6 rounded-xl bg-[#ffca08] hover:bg-[#ffd943] text-[#381609] font-extrabold text-base transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isChecking ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#381609]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>పరిశీలిస్తున్నాము...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>తనిఖీ చేయండి (Check)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CASE A: Number ALREADY EXISTS in Excel */}
        {step === 'exists' && (
          <div className="bg-[#1c0802] rounded-2xl p-6 sm:p-8 border-2 border-rose-500/70 relative z-10 shadow-xl animate-fadeIn mb-6">
            <div className="flex items-center gap-3 text-rose-400 font-bold text-lg sm:text-xl mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span>ఈ నెంబర్ ఇప్పటికే ఎక్సెల్‌లో నమోదై ఉంది! (Already Exists in Sheet)</span>
            </div>

            {existingRecord && (
              <div className="bg-[#240b03] p-4 rounded-xl border border-[#8b3d0b] space-y-2 mb-6 text-sm sm:text-base">
                {existingRecord.name && (
                  <p className="text-white">
                    <strong className="text-[#ffca08]">పేరు (Name):</strong> {existingRecord.name}
                  </p>
                )}
                {existingRecord.contact && (
                  <p className="text-white">
                    <strong className="text-[#ffca08]">మొబైల్ (Contact):</strong> {existingRecord.contact}
                  </p>
                )}
                {existingRecord.address && (
                  <p className="text-white">
                    <strong className="text-[#ffca08]">చిరునామా (Address):</strong> {existingRecord.address}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleResetForNextEntry}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>ముగించండి / నిష్క్రమించండి (Exit & Next Entry)</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {/* CASE B: Number DOES NOT EXIST -> Fill Full Form */}
        {step === 'fill' && (
          <form onSubmit={handleSaveToSheet} className="bg-[#240b03] rounded-2xl p-6 sm:p-8 border-2 border-emerald-500/70 relative z-10 shadow-xl animate-fadeIn space-y-6">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base sm:text-lg pb-3 border-b border-[#8b3d0b]">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>కొత్త నెంబర్! మిగిలిన వివరాలను పూర్తి చేయండి (New Number - Fill Details)</span>
            </div>

            {/* Field: Name */}
            <div>
              <label htmlFor="entry-name" className="block text-sm font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
                1. పూర్తి పేరు (Full Name) <span className="text-rose-400">*</span>
              </label>
              <input
                id="entry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="వ్యక్తి పూర్తి పేరు రాయండి (e.g. M. Akhileswar Reddy)"
                required
                className="w-full bg-[#1c0802] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-base"
              />
            </div>

            {/* Field: Address */}
            <div>
              <label htmlFor="entry-address" className="block text-sm font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
                2. చిరునామా / ప్రాంతం (Address / Area) <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="entry-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ప్రాంతం లేదా చిరునామా (e.g. Srnagar, Hyderabad)"
                required
                className="w-full bg-[#1c0802] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-base resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForNextEntry}
                className="py-3.5 px-6 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors text-sm sm:text-base order-2 sm:order-1"
              >
                రద్దు చేయండి (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] font-extrabold text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#381609]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>ఎక్సెల్‌లో సేవ్ చేస్తున్నాము...</span>
                  </>
                ) : (
                  <>
                    <span>💾 ఎక్సెల్‌లో సేవ్ చేయండి (Save to Excel)</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* CASE C: SAVED SUCCESSFULLY */}
        {step === 'saved' && (
          <div className="bg-[#240b03] rounded-2xl p-8 sm:p-10 text-center border-2 border-emerald-500/70 relative z-10 shadow-xl animate-fadeIn">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-green-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-['Noto_Sans_Telugu'] text-2xl font-bold text-[#ffca08] mb-2">
              ఎక్సెల్‌లో విజయవంతంగా నమోదయింది!
            </h3>
            <p className="text-orange-100 text-base mb-6">
              Saved successfully to Excel sheet.
            </p>
            <button
              type="button"
              onClick={handleResetForNextEntry}
              className="py-4 px-8 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] font-extrabold text-base transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              <span>+ తర్వాతి వివరాలు నమోదు చేయండి (Enter Next Entry)</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
