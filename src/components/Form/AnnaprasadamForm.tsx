import React, { useRef, useState, useEffect } from 'react';
import type { UserData } from '../../types/poster';
import { ANNAPRASADAM_PAYMENTS_SHEET_URL } from '../../config/sheets';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  type SupportedLanguage 
} from '../../i18n/annaprasadamTranslations';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onViewReceipt?: () => void;
  onOpenCropper?: () => void;
  lang?: SupportedLanguage;
}

export const AnnaprasadamForm: React.FC<Props> = ({ 
  userData, 
  setUserData, 
  onViewReceipt,
  onOpenCropper,
  lang = 'te'
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.te;
  const [isPaying, setIsPaying] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  // Date of Birth picker ref
  const dobInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    if (dobInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dobInputRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      dobInputRef.current.focus();
    }
  };

  // Camera state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Initialize or update titlePrefix when language changes if current is not in list
  useEffect(() => {
    const isCurrentValid = t.titles.some(opt => opt.id === userData.titlePrefix);
    if (!isCurrentValid && t.titles.length > 0) {
      setUserData(prev => ({
        ...prev,
        titlePrefix: t.titles[0].id
      }));
    }
  }, [lang, t.titles, userData.titlePrefix, setUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Prevent modifying locked fields after payment is completed
    if (userData.isPaid && (name === 'plates' || name === 'fullName')) {
      return;
    }
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Date of Birth validation
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userData.isPaid) return; // Prevent modifying DOB after payment
    const val = e.target.value;
    setUserData(prev => ({ ...prev, dob: val }));

    if (!val) {
      setDobError(t.dobRequired);
      return;
    }
    const dateObj = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(dateObj.getTime())) {
      setDobError(t.dobInvalid);
    } else if (dateObj > today) {
      setDobError(t.dobFuture);
    } else if (dateObj.getFullYear() < 1900) {
      setDobError(t.dobInvalid);
    } else {
      setDobError(null);
    }
  };

  // Photo handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserData(prev => ({ 
        ...prev, 
        rawMediaUrl: url,
        photoUrl: url
      }));
      if (onOpenCropper) onOpenCropper();
      e.target.value = '';
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Could not access camera. Please allow camera permissions or upload an image file.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setUserData(prev => ({
              ...prev,
              rawMediaUrl: url,
              photoUrl: url
            }));
            stopCamera();
            if (onOpenCropper) onOpenCropper();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Handle Payment with Strict Plate Locking
  const handlePayment = async () => {
    if (!userData.fullName || !userData.fullName.trim()) {
      alert("Please enter donor full name");
      return;
    }

    if (!userData.dob) {
      setDobError(t.dobRequired);
      alert(t.dobRequired);
      return;
    }

    if (dobError) {
      alert(dobError);
      return;
    }

    const platesNum = parseInt(userData.plates || '0', 10);
    if (!platesNum || platesNum <= 0) {
      alert("Please enter plate count");
      return;
    }

    const amountInRupees = platesNum * 1;
    const cleanPhone = (userData.phoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!(window as any).Razorpay) {
      alert("Razorpay payment gateway is loading, please try again in a moment.");
      return;
    }

    setIsPaying(true);

    // 1. SYNC LEAD TO GOOGLE SHEET (Form_Registrations)
    fetch(ANNAPRASADAM_PAYMENTS_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: "form_fill",
        donorName: `${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}`.trim(),
        dob: userData.dob || '',
        phoneNumber: cleanPhone || '',
        location: userData.location || '',
        plates: platesNum,
        amount: amountInRupees,
        language: lang,
        status: "PENDING",
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      })
    }).catch(err => console.warn('Form sync warning:', err));

    // 2. INITIATE PAYMENT ORDER
    try {
      const resp = await fetch('/api/initiatePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInRupees,
          donor_name: userData.fullName || 'Devotee',
          donor_mobile: cleanPhone || '9133014014',
          donor_email: 'annaprasadam@gurusthanmeditation.org'
        })
      });

      const data = await resp.json();
      if (!data.success || !data.razorpayOptions) {
        throw new Error(data.message || data.error || 'Could not initiate payment order');
      }

      const options = {
        ...data.razorpayOptions,
        image: "https://mahamounadhyanakumbposter.vercel.app/assets/logo.png",
        handler: async function (response: any) {
          // Verify payment
          try {
            await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                our_order_id: data.razorpayOptions.our_order_id,
                donor_name: userData.fullName || 'Devotee',
                donor_mobile: cleanPhone || '9133014014',
                amount: amountInRupees,
                category: 'guruprasadam',
                type: 'donation',
                plates: platesNum
              })
            });
          } catch (err) {
            console.warn('Verification report warning:', err);
          }

          const now = new Date();
          const dayStr = String(now.getDate()).padStart(2, '0');
          const monthStr = String(now.getMonth() + 1).padStart(2, '0');
          const receiptNo = `MK-${dayStr}${monthStr}-${(response.razorpay_payment_id || '108').slice(-4).toUpperCase()}`;

          // Update state to mark payment as complete
          setUserData(prev => ({
            ...prev,
            isPaid: true,
            paymentId: response.razorpay_payment_id,
            receiptNo: receiptNo
          }));

          // Send payment record to Google Sheet
          const paymentRecord = {
            action: "annaprasadam_payment",
            receiptNo: receiptNo,
            donorName: `${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}`.trim(),
            dob: userData.dob || '',
            phoneNumber: cleanPhone || '',
            location: userData.location || '',
            plates: platesNum,
            amount: amountInRupees,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || data.razorpayOptions.our_order_id || '',
            status: "SUCCESS",
            sevaType: `Annaprasadam Seva - Arunachalam (${lang.toUpperCase()})`,
            timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          };

          fetch(ANNAPRASADAM_PAYMENTS_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(paymentRecord)
          }).catch(sheetErr => console.warn('Payment sheet sync warning:', sheetErr));

          if (onViewReceipt) {
            onViewReceipt();
          }

          alert(`${t.paymentSuccess}!\nPayment ID: ${response.razorpay_payment_id}`);
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (paymentResp: any) {
        console.error("Razorpay Payment Failed:", paymentResp.error);
        const errDesc = paymentResp.error?.description || paymentResp.error?.reason || 'Payment was not completed';
        setIsPaying(false);
        alert(`Payment Notice: ${errDesc}`);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      alert("Payment error: " + (err.message || "Failed to initialize payment gateway."));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-[#4a1c0b] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#8b3d0b]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#8b3d0b]">
        <span className="text-2xl">🍲</span>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#ffca08] leading-tight">
            {t.formTitle}
          </h2>
          <p className="text-xs sm:text-sm text-orange-200/70 mt-0.5">
            {t.formSubtitle}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Donor Name with Title Selector */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2">
            {t.nameLabel}
          </label>
          
          <div className="flex gap-2 mb-2.5">
            {t.titles.map(opt => {
              const isSelected = (userData.titlePrefix || t.defaultTitle) === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(userData.isPaid)}
                  onClick={() => !userData.isPaid && setUserData(prev => ({ ...prev, titlePrefix: opt.id }))}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] border-[#ffca08] shadow-md scale-[1.02]'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:border-[#ffca08]/50'
                  } ${userData.isPaid ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className={`flex rounded-xl overflow-hidden border ${
            userData.isPaid 
              ? 'border-emerald-500/70 bg-[#180601]' 
              : 'border-[#8b3d0b] bg-[#240b03] focus-within:border-[#ffca08] focus-within:ring-2 focus-within:ring-[#ffca08]'
          } transition-all`}>
            <span className="px-3 py-2.5 text-[#ffca08] font-bold text-xs sm:text-sm select-none bg-[#1c0802] border-r border-[#8b3d0b]/80 shrink-0 flex items-center">
              {userData.titlePrefix || t.defaultTitle}
            </span>
            <input
              type="text"
              name="fullName"
              disabled={Boolean(userData.isPaid)}
              value={userData.fullName}
              onChange={handleChange}
              className={`flex-1 min-w-0 px-3 py-2.5 bg-transparent outline-none transition-all text-xs sm:text-sm placeholder-orange-700/50 text-white placeholder:text-xs sm:placeholder:text-sm ${
                userData.isPaid ? 'text-emerald-300 cursor-not-allowed' : ''
              }`}
              placeholder={t.namePlaceholder}
              required
            />
          </div>
        </div>

        {/* 2. Date of Birth (D.O.B) Field */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2">
            {t.dobLabel}
          </label>
          <div className="relative">
            <input
              ref={dobInputRef}
              type="date"
              name="dob"
              disabled={Boolean(userData.isPaid)}
              max={new Date().toISOString().split('T')[0]}
              value={userData.dob || ''}
              onChange={handleDobChange}
              onClick={() => {
                if (!userData.isPaid) openDatePicker();
              }}
              className={`w-full pl-4 pr-12 py-3 bg-[#240b03] border ${
                userData.isPaid
                  ? 'border-emerald-500/70 text-emerald-300 bg-[#180601] cursor-not-allowed'
                  : dobError
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-[#8b3d0b]'
              } text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all cursor-pointer`}
              required
            />
            {!userData.isPaid && (
              <button
                type="button"
                onClick={openDatePicker}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#3a1305] hover:bg-[#8b3d0b] text-[#ffca08] hover:text-white transition-all cursor-pointer text-lg leading-none shadow-sm active:scale-95"
                title="Open Calendar Picker"
                aria-label="Open Calendar"
              >
                📅
              </button>
            )}
          </div>
          {dobError ? (
            <p className="text-xs text-rose-400 mt-1 font-medium">{dobError}</p>
          ) : (
            <p className="text-[11px] text-orange-200/60 mt-1">
              {t.dobHelp}
            </p>
          )}
        </div>

        {/* 3. Plates Count & Real-time ₹1 Calculation (PERMANENTLY LOCKED AFTER PAYMENT) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-orange-100">
              {t.platesLabel}
            </label>
            {userData.isPaid && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span>{t.paidPlatesLocked}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              min="1"
              name="plates"
              disabled={Boolean(userData.isPaid)}
              value={userData.plates || ''}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#240b03] border ${
                userData.isPaid
                  ? 'border-emerald-500/70 text-emerald-400 bg-[#180601] cursor-not-allowed'
                  : 'border-[#8b3d0b] text-white focus:border-[#ffca08]'
              } rounded-xl focus:ring-2 focus:ring-[#ffca08] outline-none transition-all placeholder-orange-700/50 font-bold text-lg text-[#ffca08]`}
              placeholder={t.platesPlaceholder}
              required
            />
            {userData.isPaid && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs select-none">
                🔒 Locked
              </span>
            )}
          </div>

          {/* Calculation Badge with Localized Poshakulu Tier */}
          {parseInt(userData.plates || '0', 10) > 0 && (
            <div className="mt-2 text-xs text-[#ffca08] font-semibold flex items-center justify-between px-3 py-2 bg-[#240b03] rounded-lg border border-[#8b3d0b]">
              <div className="flex flex-col gap-0.5">
                <span>1 {t.plateSingular} = ₹1 • {parseInt(userData.plates || '0', 10)} {t.plateUnit}</span>
                <span className="text-emerald-400 font-bold">
                  {t.tierLabel} {getPoshakuluTitleByLang(parseInt(userData.plates || '0', 10), lang)}
                </span>
              </div>
              <span className="font-bold font-mono text-base text-[#ffca08]">
                ₹{(parseInt(userData.plates || '0', 10) * 1).toLocaleString('en-IN')}/-
              </span>
            </div>
          )}
        </div>

        {/* 4. Phone Number & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-2">
              {t.phoneLabel}
            </label>
            <input
              type="tel"
              name="phoneNumber"
              maxLength={10}
              value={userData.phoneNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setUserData(prev => ({ ...prev, phoneNumber: digits }));
              }}
              className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50"
              placeholder={t.phonePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-2">
              {t.locationLabel}
            </label>
            <input
              type="text"
              name="location"
              value={userData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50"
              placeholder={t.locationPlaceholder}
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 6. PHOTO OPTION: Directly above the Online Payment Section */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[#8b3d0b]/80">
          <label className="block text-sm font-semibold text-orange-100 mb-2">
            {t.photoLabel}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {userData.photoUrl ? (
            /* Photo Selected State - Fully responsive on all mobile screens */
            <div className="p-3 bg-[#240b03] border border-[#ffca08]/40 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden border-2 border-[#ffca08] shadow-md bg-black">
                  <img
                    src={userData.photoUrl}
                    alt="Donor Crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold text-white block truncate">{t.photoSelectedTitle}</span>
                  <span className="text-[11px] text-emerald-400 font-medium block truncate">{t.photoSelectedSub}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {onOpenCropper && (
                  <button
                    type="button"
                    onClick={onOpenCropper}
                    className="flex-1 sm:flex-none py-2 sm:py-1.5 px-3 rounded-lg bg-[#381609] hover:bg-[#8b3d0b] text-orange-200 hover:text-white text-xs font-bold border border-[#8b3d0b] transition-all flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm"
                  >
                    <span>{t.photoCropBtn}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none py-2 sm:py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <span>🔄 {t.photoChangeBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Choose Photo Options */
            <div className="p-4 bg-[#240b03] border border-dashed border-[#8b3d0b] rounded-2xl text-center">
              <p className="text-xs text-orange-200/80 mb-3">
                {t.photoPrompt}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>{t.photoGalleryBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="py-2.5 px-3 rounded-xl bg-[#381609] hover:bg-[#4a1c0b] text-orange-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#8b3d0b] hover:border-[#ffca08]/50 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>{t.photoCameraBtn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Streaming Modal if Camera active */}
          {isCameraOpen && (
            <div className="mt-3 p-3 bg-black/90 border border-[#ffca08] rounded-2xl flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-[320px] rounded-xl aspect-[4/3] object-cover bg-black"
              />
              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <span>{t.photoCaptureBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs"
                >
                  {t.photoCancelBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 7. ONLINE PAYMENT SECTION: Immediately below the Photo Option */}
        {/* ------------------------------------------------------------- */}
        {(() => {
          const platesNum = parseInt(userData.plates || '0', 10);
          const isDetailsEntered = Boolean(userData.fullName && userData.fullName.trim().length > 0 && platesNum > 0);

          if (!isDetailsEntered) {
            return (
              <div className="p-3.5 bg-[#240b03]/60 rounded-xl border border-dashed border-[#8b3d0b] text-center">
                <p className="text-xs text-orange-200/70">
                  {t.fillRequiredPrompt}
                </p>
              </div>
            );
          }

          return (
            <div className="pt-1 animate-fadeIn">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#240b03] via-[#3a1305] to-[#240b03] rounded-2xl border-2 border-[#ffca08]/60 shadow-xl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#8b3d0b]/80">
                  <span className="text-xl">💳</span>
                  <div>
                    <h3 className="text-base font-bold text-[#ffca08]">
                      {t.paymentHeading}
                    </h3>
                    <p className="text-xs text-orange-200/70">
                      {userData.titlePrefix || t.defaultTitle} {userData.fullName} {t.paymentInNameOf}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#8b3d0b]/80">
                  <span className="text-[#ffca08] font-bold text-base sm:text-lg">
                    {t.totalAmountLabel}
                  </span>
                  <span className="text-2xl font-black text-[#ffca08] font-mono tracking-wide">
                    ₹{(platesNum * 1).toLocaleString('en-IN')}/-
                  </span>
                </div>

                {/* Pay Button or Verified Success State */}
                {userData.isPaid ? (
                  <div className="mt-4 p-4 bg-emerald-900/60 border-2 border-emerald-500 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-base mb-1">
                      <span className="text-xl">✅</span>
                      <span>{t.paymentSuccess}</span>
                    </div>
                    {userData.paymentId && (
                      <p className="text-xs text-emerald-200/80 font-mono">
                        Payment ID: <span className="font-bold text-white">{userData.paymentId}</span>
                      </p>
                    )}
                    <p className="text-xs text-[#ffca08] mt-2 font-medium">
                      {t.paymentSuccessSub}
                    </p>
                    {onViewReceipt && (
                      <button
                        type="button"
                        onClick={onViewReceipt}
                        className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] font-bold text-xs sm:text-sm rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span>{t.viewReceiptBtn}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={handlePayment}
                      className="mt-3.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-75 disabled:cursor-wait text-white font-black text-base shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isPaying ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>{t.connectingGateway}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.payButton} (₹{(platesNum * 1).toLocaleString('en-IN')})</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-orange-200/60 mt-2.5">
                      {t.securityNotice}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
