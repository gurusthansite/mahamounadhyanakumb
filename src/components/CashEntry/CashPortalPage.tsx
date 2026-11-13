import React, { useState, useRef, useEffect } from 'react';
import type { UserData, CropArea } from '../../types/poster';
import { CASH_PORTAL_PASSWORD } from '../../config/auth';
import { ANNAPRASADAM_CASH_PAYMENTS_SHEET_URL } from '../../config/sheets';
import { 
  TRANSLATIONS, 
  getAnnaprasadamTemplate, 
  type SupportedLanguage 
} from '../../i18n/annaprasadamTranslations';
import { AnnaprasadamPreview } from '../PosterPreview/AnnaprasadamPreview';
import { ReceiptPreview } from '../Receipt/ReceiptPreview';
import { ActionButtons } from '../GenerateButton/ActionButtons';
import { ImageCropper } from '../PhotoUpload/ImageCropper';
import { PHOTO_AREA } from '../../canvas/coordinates';
import { generateImage } from '../../canvas/imageRenderer';

interface CashPortalPageProps {
  lang: SupportedLanguage;
  onLangChange: (lang: SupportedLanguage) => void;
}

const DEFAULT_PLATES = 1;
const DEFAULT_AMOUNT = 501;

// Helper to generate sequential unique receipt numbers for cash payments
const getNextReceiptNumber = (): string => {
  if (typeof window === 'undefined') return 'MK-C-0001';
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');

  let counter = parseInt(localStorage.getItem('cash_receipt_seq_counter') || '1001', 10);
  if (isNaN(counter) || counter < 1) counter = 1001;

  return `MK-C-${dayStr}${monthStr}-${counter}`;
};

const incrementReceiptCounter = () => {
  if (typeof window === 'undefined') return;
  let counter = parseInt(localStorage.getItem('cash_receipt_seq_counter') || '1001', 10);
  if (isNaN(counter) || counter < 1) counter = 1001;
  localStorage.setItem('cash_receipt_seq_counter', String(counter + 1));
};

export const CashPortalPage: React.FC<CashPortalPageProps> = ({
  lang,
  onLangChange
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.te;

  // 1. Authentication State
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('cash_portal_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 2. Volunteer & Donor State
  const [volunteerName, setVolunteerName] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('cash_volunteer_name')) || '';
  });

  const [receiptNumberInput, setReceiptNumberInput] = useState<string>(() => getNextReceiptNumber());

  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    titlePrefix: lang === 'en' ? 'Sri' : 'శ్రీ',
    contributionFor: 'self',
    beneficiaryTitle: lang === 'en' ? 'Smt' : 'శ్రీమతి',
    beneficiaryName: '',
    phoneNumber: '',
    location: '',
    dob: '',
    aadhar: '',
    plates: '1',
    sevaCategory: 'guruprasadam',
    photoUrl: null,
    templateType: 'image',
    isPaid: false,
    paymentMode: 'CASH',
    paymentId: '',
    receiptNo: getNextReceiptNumber()
  });

  const [platesCount, setPlatesCount] = useState<number>(DEFAULT_PLATES);
  const [customPlates, setCustomPlates] = useState<string>('');
  const [donationAmount, setDonationAmount] = useState<number>(DEFAULT_AMOUNT);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [dobError, setDobError] = useState<string | null>(null);

  // 3. UI and Preview State
  const [activeTab, setActiveTab] = useState<'poster' | 'receipt'>('poster');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isMahaMouna = userData.sevaCategory === 'mahamouna';
  const totalAmount = isMahaMouna ? donationAmount : platesCount * 51;

  // Sync volunteer name to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cash_volunteer_name', volunteerName);
    }
  }, [volunteerName]);

  // Handle Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput.trim() === CASH_PORTAL_PASSWORD) {
      setIsAuthorized(true);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cash_portal_auth', 'true');
      }
    } else {
      setAuthError(lang === 'te' ? 'పాస్‌వర్డ్ సరికాదు. దయచేసి సరైన పాస్‌వర్డ్ నమోదు చేయండి.' : 'Invalid password. Please enter correct counter password.');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPasswordInput('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cash_portal_auth');
    }
  };

  // Reset form for next donor while keeping volunteer logged in
  const handleResetForNextDonor = () => {
    const nextRecNo = getNextReceiptNumber();
    setReceiptNumberInput(nextRecNo);
    setUserData({
      fullName: '',
      titlePrefix: lang === 'en' ? 'Sri' : 'శ్రీ',
      contributionFor: 'self',
      beneficiaryTitle: lang === 'en' ? 'Smt' : 'శ్రీమతి',
      beneficiaryName: '',
      phoneNumber: '',
      location: '',
      dob: '',
      aadhar: '',
      plates: '1',
      sevaCategory: 'guruprasadam',
      photoUrl: null,
      rawMediaUrl: undefined,
      templateType: 'image',
      isPaid: false,
      paymentMode: 'CASH',
      paymentId: '',
      receiptNo: nextRecNo
    });
    setPlatesCount(DEFAULT_PLATES);
    setCustomPlates('');
    setDonationAmount(DEFAULT_AMOUNT);
    setCustomAmount('');
    setActiveTab('poster');
    setDobError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Date of Birth validation (Optional)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserData(prev => ({ ...prev, dob: val }));

    if (!val || !val.trim()) {
      setDobError(null);
      return;
    }
    const dateObj = new Date(val);
    const year = dateObj.getFullYear();
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1920 || year > currentYear) {
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
      setUserData(prev => ({ ...prev, rawMediaUrl: url, photoUrl: url }));
      setIsCropperOpen(true);
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
      cameraStream.getTracks().forEach(tr => tr.stop());
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
            setUserData(prev => ({ ...prev, rawMediaUrl: url, photoUrl: url }));
            stopCamera();
            setIsCropperOpen(true);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleCropComplete = (cropData: { croppedUrl?: string; cropArea: CropArea; cropPixels: CropArea }) => {
    setUserData(prev => ({
      ...prev,
      photoUrl: cropData.croppedUrl || prev.photoUrl,
      cropArea: cropData.cropArea,
      cropPixels: cropData.cropPixels
    }));
    setIsCropperOpen(false);
  };

  // Confirm Cash Payment & Issue Receipt
  const handleConfirmCashPayment = async () => {
    if (!userData.fullName || !userData.fullName.trim()) {
      alert(lang === 'te' ? 'దయచేసి దాత పూర్తి పేరు నమోదు చేయండి' : 'Please enter donor full name');
      return;
    }

    const cleanPhone = (userData.phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert(lang === 'te' ? 'దయచేసి సరైన 10 అంకెల ఫోన్ నెంబర్ నమోదు చేయండి' : 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!userData.location || !userData.location.trim()) {
      alert(lang === 'te' ? 'దయచేసి మీ ప్రాంతం / నగరం నమోదు చేయండి' : 'Please enter your city/location');
      return;
    }

    if (userData.dob && userData.dob.trim() && dobError) {
      alert(dobError);
      return;
    }

    const cleanAadhar = (userData.aadhar || '').replace(/\D/g, '');
    if (userData.aadhar && userData.aadhar.trim() && cleanAadhar.length !== 12) {
      alert(lang === 'te' ? "దయచేసి సరైన 12 అంకెల ఆధార్ నెంబర్ నమోదు చేయండి లేదా ఖాళీగా ఉంచండి" : "Please enter a valid 12-digit Aadhar number or leave it empty");
      return;
    }

    const confirmMsg = lang === 'te'
      ? `రూ. ${totalAmount}/- నగదు స్వీకరించబడిందా?\nరశీదు & పోస్టర్ జారీ చేయడానికి ధృవీకరించండి.`
      : `Confirm receipt of ₹${totalAmount} in CASH?\nThis will generate the official 80G Receipt & Poster.`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);

    try {
      const finalReceiptNo = receiptNumberInput.trim() || getNextReceiptNumber();
      const randomPart = finalReceiptNo.replace(/[^A-Za-z0-9]/g, '').slice(-4) || '108';
      const paymentId = `CASH-${randomPart}`;

      // Update state
      setUserData(prev => ({
        ...prev,
        isPaid: true,
        paymentMode: 'CASH',
        paymentId: paymentId,
        receiptNo: finalReceiptNo,
        donationAmount: isMahaMouna ? String(donationAmount) : undefined,
        plates: isMahaMouna ? undefined : String(platesCount)
      }));

      // Increment counter for next receipt
      incrementReceiptCounter();

      // Post to dedicated Cash Payments Google Sheet
      if (ANNAPRASADAM_CASH_PAYMENTS_SHEET_URL) {
        const payload = {
          receiptNo: finalReceiptNo,
          donorName: `${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}`.trim(),
          amount: totalAmount,
          plates: isMahaMouna ? undefined : platesCount,
          paymentMode: 'CASH',
          paymentId: paymentId,
          phoneNumber: cleanPhone,
          location: userData.location || '',
          dob: userData.dob || '',
          aadhar: cleanAadhar || '',
          category: isMahaMouna ? 'Maha Mouna Dhyana Kumbh' : 'Guru Prasadam Annaprasadam',
          sevaType: isMahaMouna ? 'Maha Mouna Dhyana Kumbh (Cash)' : 'Guru Prasadam Annaprasadam (Cash)',
          contributionFor: userData.contributionFor === 'other' ? 'Someone Else' : 'Self',
          beneficiaryName: userData.contributionFor === 'other' && userData.beneficiaryName
            ? `${userData.beneficiaryTitle ? userData.beneficiaryTitle + ' ' : ''}${userData.beneficiaryName}`.trim()
            : '',
          volunteer: volunteerName || 'Counter Cash Desk',
          language: lang,
          status: 'CASH_COLLECTED',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        fetch(ANNAPRASADAM_CASH_PAYMENTS_SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Cash sheet sync warning:', err));
      }

      setActiveTab('receipt');
      alert(lang === 'te' ? `✅ నగదు నమోదు పూర్తయింది!\nరశీదు సంఖ్య: ${finalReceiptNo}` : `✅ Cash payment recorded!\nReceipt No: ${finalReceiptNo}`);
    } catch (err: any) {
      console.error('Cash recording error:', err);
      alert('Error recording payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poster Download Handler
  const handlePosterDownload = async () => {
    setIsGenerating(true);
    try {
      const templatePath = getAnnaprasadamTemplate(lang, isMahaMouna);
      const blob = await generateImage(userData, templatePath, true, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const targetName = (userData.contributionFor === 'other' && userData.beneficiaryName ? userData.beneficiaryName : userData.fullName) || 'poster';
      a.download = `cash-poster-${targetName.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Poster generation error:', err);
      alert('Failed to generate poster download.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Poster Share Handler
  const handlePosterShare = async () => {
    setIsGenerating(true);
    try {
      const templatePath = getAnnaprasadamTemplate(lang, isMahaMouna);
      const blob = await generateImage(userData, templatePath, true, lang);
      const targetName = (userData.contributionFor === 'other' && userData.beneficiaryName ? userData.beneficiaryName : userData.fullName) || 'poster';
      const file = new File([blob], `cash-poster-${targetName}.png`, { type: 'image/png' });

      const shareText = `మహా మౌన ధ్యాన కుంభ్ - అన్నప్రసాద సేవలో నా వంతు భాగస్వామ్యం.\nరశీదు సంఖ్య: ${userData.receiptNo || 'CASH'}\nగురుస్థాన్ మెడిటేషన్ సెంటర్, అరుణాచలం.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Annaprasadam Poster',
          text: shareText
        });
      } else {
        // Fallback: download and open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cash-poster-${targetName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ----------------------------------------------------
  // UN-AUTHENTICATED: LOCK SCREEN
  // ----------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#120401] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#240b03] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300 mb-4">
            🔐
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
            వాలంటీర్ నగదు పోర్టల్
          </h2>
          <p className="text-xs sm:text-sm text-orange-200/80 mb-6 font-medium">
            Volunteer Cash Counter Desk • Reception Only
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  setAuthError(null);
                }}
                placeholder="కౌంటర్ పాస్‌వర్డ్ (Password)"
                autoFocus
                className="w-full px-4 py-3 bg-[#180601] border-2 border-amber-400/50 rounded-xl text-white placeholder-orange-300/40 focus:border-amber-400 focus:outline-none text-center text-lg tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300/70 hover:text-white text-xs px-2 py-1"
              >
                {showPassword ? 'దాచు' : 'చూపు'}
              </button>
            </div>

            {authError && (
              <p className="text-red-400 text-xs font-semibold animate-pulse">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black rounded-xl shadow-lg transform active:scale-95 transition-all text-sm sm:text-base"
            >
              🔓 ప్రవేశించండి (Unlock Cash Desk)
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#8b3d0b]/40 text-xs text-orange-200/50">
            మహా మౌన ధ్యాన కుంభ్ • గురుస్థాన్ సేవా కౌంటర్
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED: CASH COUNTER DESK
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#120401] text-white">
      {/* Top Volunteer Sticky Banner */}
      <header className="sticky top-0 z-40 bg-[#1c0802]/95 backdrop-blur-md border-b-2 border-amber-500/60 px-4 py-2.5 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              CASH DESK
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-amber-300 leading-tight">
                అన్నప్రసాదం నగదు కౌంటర్ • Cash Entry
              </h1>
              <p className="text-[11px] text-orange-200/70 hidden sm:block">
                కౌంటర్ వాలంటీర్ నమోదు & 80G రశీదు జారీ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Volunteer Name */}
            <input
              type="text"
              value={volunteerName}
              onChange={e => setVolunteerName(e.target.value)}
              placeholder="వాలంటీర్ / కౌంటర్ పేరు"
              className="px-2.5 py-1 bg-[#240b03] border border-amber-500/40 rounded-lg text-xs text-white placeholder-orange-300/40 focus:outline-none focus:border-amber-400 w-36 sm:w-44"
            />

            {/* Language Switcher buttons */}
            <div className="flex bg-[#240b03] p-0.5 rounded-lg border border-amber-500/30">
              {(['te', 'en'] as SupportedLanguage[]).map(l => (
                <button
                  key={l}
                  onClick={() => onLangChange(l)}
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    lang === l ? 'bg-amber-400 text-stone-950' : 'text-orange-200/70 hover:text-white'
                  }`}
                >
                  {l === 'te' ? 'తెలుగు' : 'English'}
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Lock Counter"
              className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/50 rounded-lg text-red-200 text-xs font-bold transition-all"
            >
              🔒 లాగౌట్
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* Next Donor Registration Success Banner */}
        {userData.isPaid && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-[#180601] border-2 border-emerald-500 flex flex-wrap items-center justify-between gap-4 shadow-xl animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-black text-sm sm:text-base">
                <span>✅ నగదు స్వీకరించబడింది • Cash Recorded</span>
                <span className="text-xs bg-emerald-800/80 px-2 py-0.5 rounded font-mono text-white">
                  {userData.receiptNo}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                దాత: <strong className="text-white">{userData.titlePrefix} {userData.fullName}</strong> | మొత్తం: <strong className="text-amber-300">₹{totalAmount}</strong> | ID: <strong className="font-mono text-white">{userData.paymentId}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetForNextDonor}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <span>➕ తర్వాతి దాత నమోదు</span>
              <span className="text-xs opacity-75 font-normal">(Next Contributor)</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ==================================================== */}
          {/* LEFT COLUMN: DONOR FORM + CASH CONFIRMATION (7 cols) */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 bg-[#240b03] border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#8b3d0b]/60 pb-3">
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <span>📝 దాత వివరాలు (Donor Details)</span>
              </h2>
              {userData.isPaid && (
                <button
                  type="button"
                  onClick={handleResetForNextDonor}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  + కొత్త నమోదు
                </button>
              )}
            </div>

            {/* Receipt Number (Sequential Unique / Editable for Physical Receipt Book) */}
            <div className="bg-[#180601] p-3 rounded-2xl border border-amber-500/50">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🧾 రశీదు సంఖ్య (Unique Receipt No): *</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    ఆటోమేటిక్ క్రమసంఖ్య (Auto Unique)
                  </span>
                </label>
                {!userData.isPaid && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = getNextReceiptNumber();
                      setReceiptNumberInput(next);
                      setUserData(prev => ({ ...prev, receiptNo: next }));
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-semibold"
                  >
                    🔄 రీసెట్ / తదుపరి నెంబర్
                  </button>
                )}
              </div>
              <input
                type="text"
                disabled={Boolean(userData.isPaid)}
                value={receiptNumberInput}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setReceiptNumberInput(val);
                  setUserData(prev => ({ ...prev, receiptNo: val }));
                }}
                placeholder="ఉదా: MK-C-1311-1001"
                className={`w-full px-3 py-2 bg-[#240b03] border rounded-xl text-xs sm:text-sm font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400 ${
                  userData.isPaid ? 'border-emerald-500/70 text-emerald-300 cursor-not-allowed' : 'border-amber-500/40'
                }`}
              />
              <p className="text-[11px] text-orange-200/60 mt-1">
                ℹ️ ప్రతి రశీదుకు ప్రత్యేకమైన నెంబర్ ఆటోమేటిక్‌గా వస్తుంది. (భౌతిక రశీదు పుస్తకం వాడుతుంటే ఇక్కడ మార్చుకోవచ్చు).
              </p>
            </div>

            {/* 1. Donor Name & Title */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                దాత పూర్తి పేరు (Donor Full Name): *
              </label>
              <div className="flex gap-1.5 mb-2">
                {t.titles.map(opt => {
                  const isSelected = (userData.titlePrefix || (lang === 'en' ? 'Sri' : 'శ్రీ')) === opt.id;
                  return (
                    <button
                      key={'donor-' + opt.id}
                      type="button"
                      disabled={Boolean(userData.isPaid)}
                      onClick={() => !userData.isPaid && setUserData(prev => ({ ...prev, titlePrefix: opt.id }))}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                          : 'bg-[#180601] text-orange-200/70 border-[#8b3d0b]'
                      } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className={`flex rounded-xl overflow-hidden border ${
                userData.isPaid ? 'border-emerald-500/70 bg-[#180601]' : 'border-amber-400/50 bg-[#180601]'
              }`}>
                <span className="px-3 py-2 text-amber-400 font-bold text-xs select-none bg-[#120401] border-r border-[#8b3d0b]/80 shrink-0 flex items-center">
                  {userData.titlePrefix || (lang === 'en' ? 'Sri' : 'శ్రీ')}
                </span>
                <input
                  type="text"
                  name="fullName"
                  disabled={Boolean(userData.isPaid)}
                  value={userData.fullName}
                  onChange={e => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`flex-1 min-w-0 px-3 py-2 bg-transparent outline-none text-xs sm:text-sm text-white placeholder-orange-700/50 ${
                    userData.isPaid ? 'text-emerald-300 cursor-not-allowed' : ''
                  }`}
                  placeholder="ఉదా: రామారావు (Enter full name)"
                  required
                />
              </div>
            </div>

            {/* Contribution For: Self vs Someone Else */}
            <div className="bg-[#180601] p-3 rounded-2xl border border-[#8b3d0b]/60">
              <label className="block text-xs font-semibold text-amber-300 mb-2">
                ఈ సమర్పణ ఎవరి పేరున? (Contribution For):
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={Boolean(userData.isPaid)}
                  onClick={() => !userData.isPaid && setUserData(prev => ({ ...prev, contributionFor: 'self' }))}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    (userData.contributionFor || 'self') === 'self'
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                      : 'bg-[#240b03] text-orange-200/80 border-[#8b3d0b]'
                  } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  🙋 నా కోసం (For Myself)
                </button>
                <button
                  type="button"
                  disabled={Boolean(userData.isPaid)}
                  onClick={() => !userData.isPaid && setUserData(prev => ({
                    ...prev,
                    contributionFor: 'other',
                    beneficiaryTitle: prev.beneficiaryTitle || (lang === 'en' ? 'Smt' : 'శ్రీమతి')
                  }))}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    userData.contributionFor === 'other'
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                      : 'bg-[#240b03] text-orange-200/80 border-[#8b3d0b]'
                  } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  ❤️ ఇతరుల పేరున (Someone Else)
                </button>
              </div>

              {userData.contributionFor === 'other' && (
                <div className="mt-3 pt-3 border-t border-[#8b3d0b]/50">
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                    ఎవరి పేరు మీద అన్నప్రసాదం సమర్పిస్తున్నారు? (In the Name of): *
                  </label>
                  <div className="flex gap-1.5 mb-2">
                    {t.titles.map(opt => {
                      const isSelected = (userData.beneficiaryTitle || (lang === 'en' ? 'Smt' : 'శ్రీమతి')) === opt.id;
                      return (
                        <button
                          key={'ben-' + opt.id}
                          type="button"
                          disabled={Boolean(userData.isPaid)}
                          onClick={() => !userData.isPaid && setUserData(prev => ({ ...prev, beneficiaryTitle: opt.id }))}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                              : 'bg-[#240b03] text-orange-200/70 border-[#8b3d0b]'
                          } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    disabled={Boolean(userData.isPaid)}
                    value={userData.beneficiaryName || ''}
                    onChange={e => setUserData(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#240b03] border border-amber-400/50 rounded-xl text-xs sm:text-sm text-white placeholder-orange-700/50 focus:outline-none"
                    placeholder="ఉదా: సరస్వతి దేవి (Mother / Father / Loved One)"
                  />
                </div>
              )}
            </div>

            {/* 2. Date of Birth (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-amber-300">
                  పుట్టిన తేదీ (Date of Birth):
                </label>
                <span className="text-[11px] text-orange-200/60 italic">(ఐచ్ఛికం • Optional)</span>
              </div>
              <input
                type="date"
                disabled={Boolean(userData.isPaid)}
                value={userData.dob || ''}
                onChange={handleDobChange}
                max={new Date().toISOString().split('T')[0]}
                min="1920-01-01"
                className="w-full px-3 py-2 bg-[#180601] border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
              />
              {dobError && <p className="text-red-400 text-xs mt-1">{dobError}</p>}
            </div>

            {/* 3. Aadhar Card Number Field (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-amber-300">
                  ఆధార్ కార్డ్ నంబర్ (Aadhar Number):
                </label>
                <span className="text-[11px] text-orange-200/60 italic">(ఐచ్ఛికం • Optional)</span>
              </div>
              <input
                type="text"
                disabled={Boolean(userData.isPaid)}
                value={userData.aadhar || ''}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setUserData(prev => ({ ...prev, aadhar: digits }));
                }}
                maxLength={12}
                placeholder="12 అంకెల ఆధార్ నంబర్"
                className="w-full px-3 py-2 bg-[#180601] border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white focus:outline-none tracking-widest font-mono"
              />
              <p className="text-[11px] text-orange-200/60 mt-1">
                ℹ️ ఐచ్ఛికం • రికార్డుల కొరకు 12 అంకెల ఆధార్ సంఖ్య నమోదు చేయవచ్చు.
              </p>
            </div>

            {/* 3. Seva Category Selector */}
            <div className="bg-[#180601] p-3.5 rounded-2xl border border-[#8b3d0b]/60 space-y-3">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                సేవా విభాగం (Seva Category)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(userData.isPaid)}
                  onClick={() => {
                    if (userData.isPaid) return;
                    setUserData(prev => ({ ...prev, sevaCategory: 'guruprasadam' }));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isMahaMouna
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-[#240b03] border-[#8b3d0b] text-orange-200/70'
                  } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xs font-black">గురు ప్రసాదం (Guru Prasadam)</div>
                  <div className="text-[11px] text-orange-200/60 mt-0.5">₹51 / ప్లేట్</div>
                </button>

                <button
                  type="button"
                  disabled={Boolean(userData.isPaid)}
                  onClick={() => {
                    if (userData.isPaid) return;
                    setUserData(prev => ({ ...prev, sevaCategory: 'mahamouna' }));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isMahaMouna
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-[#240b03] border-[#8b3d0b] text-orange-200/70'
                  } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  <div className="text-xs font-black">మహా మౌన ధ్యాన కుంభ్</div>
                  <div className="text-[11px] text-orange-200/60 mt-0.5">డొనేషన్ మొత్తం (Amount)</div>
                </button>
              </div>

              {/* Guru Prasadam Plates Selection */}
              {!isMahaMouna ? (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-amber-300 font-semibold">ప్లేట్ల సంఖ్య (Plates):</span>
                    <span className="text-xs font-bold text-amber-400">{platesCount} ప్లేట్లు = ₹{platesCount * 51}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
                    {[1, 5, 11, 21, 51, 108].map(p => (
                      <button
                        key={p}
                        type="button"
                        disabled={Boolean(userData.isPaid)}
                        onClick={() => {
                          if (userData.isPaid) return;
                          setPlatesCount(p);
                          setCustomPlates('');
                          setUserData(prev => ({ ...prev, plates: String(p) }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          platesCount === p && !customPlates
                            ? 'bg-amber-400 text-stone-950 border-amber-400'
                            : 'bg-[#240b03] text-orange-200 border-[#8b3d0b]'
                        } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        {p} ({p * 51})
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    disabled={Boolean(userData.isPaid)}
                    value={customPlates}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomPlates(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setPlatesCount(num);
                        setUserData(prev => ({ ...prev, plates: String(num) }));
                      }
                    }}
                    placeholder="ఇతర ప్లేట్ల సంఖ్య నమోదు చేయండి (Custom plates)"
                    className="w-full px-3 py-1.5 bg-[#240b03] border border-amber-500/40 rounded-xl text-xs text-white placeholder-orange-300/40 focus:outline-none"
                    min="1"
                  />
                </div>
              ) : (
                /* Maha Mouna Amount Selection */
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-amber-300 font-semibold">సమర్పణ మొత్తం (Amount):</span>
                    <span className="text-xs font-bold text-amber-400">₹{donationAmount}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-2">
                    {[501, 1116, 2500, 5000, 11116].map(a => (
                      <button
                        key={a}
                        type="button"
                        disabled={Boolean(userData.isPaid)}
                        onClick={() => {
                          if (userData.isPaid) return;
                          setDonationAmount(a);
                          setCustomAmount('');
                          setUserData(prev => ({ ...prev, donationAmount: String(a) }));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          donationAmount === a && !customAmount
                            ? 'bg-amber-400 text-stone-950 border-amber-400'
                            : 'bg-[#240b03] text-orange-200 border-[#8b3d0b]'
                        } ${userData.isPaid ? 'opacity-80 cursor-not-allowed' : ''}`}
                      >
                        ₹{a}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    disabled={Boolean(userData.isPaid)}
                    value={customAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomAmount(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setDonationAmount(num);
                        setUserData(prev => ({ ...prev, donationAmount: String(num) }));
                      }
                    }}
                    placeholder="ఇతర మొత్తం నమోదు చేయండి (Custom amount ₹)"
                    className="w-full px-3 py-1.5 bg-[#240b03] border border-amber-500/40 rounded-xl text-xs text-white placeholder-orange-300/40 focus:outline-none"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* 4. Phone & City (Mandatory) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  ఫోన్ నెంబర్ (Phone Number): *
                </label>
                <input
                  type="tel"
                  disabled={Boolean(userData.isPaid)}
                  value={userData.phoneNumber || ''}
                  onChange={e => setUserData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="10 అంకెల మొబైల్ నెంబర్"
                  className="w-full px-3 py-2 bg-[#180601] border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  ప్రాంతం / నగరం (City / Location): *
                </label>
                <input
                  type="text"
                  disabled={Boolean(userData.isPaid)}
                  value={userData.location || ''}
                  onChange={e => setUserData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="ఉదా: హైదరాబాద్ / తిరువణ్ణామలై"
                  className="w-full px-3 py-2 bg-[#180601] border border-amber-500/40 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Photo Upload / Camera */}
            <div className="bg-[#180601] p-3 rounded-2xl border border-[#8b3d0b]/60">
              <label className="block text-xs font-semibold text-amber-300 mb-2">
                దాత ఫోటో (Donor Photo)
              </label>

              {isCameraOpen ? (
                <div className="relative rounded-xl overflow-hidden bg-black mb-2">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-1.5 bg-emerald-500 text-stone-950 font-bold rounded-lg text-xs"
                    >
                      📸 ఫోటో తీయండి (Capture)
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs"
                    >
                      రద్దు (Cancel)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(userData.isPaid)}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-[#240b03] hover:bg-[#310f04] border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>📁 గ్యాలరీ నుండి ఎంచుకోండి</span>
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(userData.isPaid)}
                    onClick={startCamera}
                    className="py-2 px-3 bg-[#240b03] hover:bg-[#310f04] border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span>📷 కెమెరా</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {userData.photoUrl && (
                <div className="mt-2 flex items-center justify-between bg-[#240b03] p-2 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <img
                      src={userData.photoUrl}
                      alt="Crop preview"
                      className="w-10 h-10 rounded-full object-cover border border-amber-400"
                    />
                    <span className="text-xs text-emerald-400 font-semibold">ఫోటో ఎంపికైంది ✓</span>
                  </div>
                  {!userData.isPaid && (
                    <button
                      type="button"
                      onClick={() => setIsCropperOpen(true)}
                      className="text-xs text-amber-400 underline font-bold px-2 py-1"
                    >
                      క్రాప్ చేయండి (Re-crop)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 6. CASH CONFIRMATION CARD */}
            <div className="bg-gradient-to-br from-amber-950/80 via-[#2a0e04] to-[#1a0802] border-2 border-amber-500/80 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-black text-amber-300 tracking-wider">
                  💵 నగదు చెల్లింపు వివరాలు (Cash Payment Desk)
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  ₹{totalAmount} CASH
                </span>
              </div>

              <div className="flex items-baseline justify-between border-b border-amber-500/30 pb-3 mb-3">
                <span className="text-sm font-semibold text-orange-200">మొత్తం స్వీకరించాల్సిన నగదు:</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  ₹{totalAmount}
                </span>
              </div>

              {!userData.isPaid ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCashPayment}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-stone-950 font-black rounded-xl shadow-2xl transform active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2 border-2 border-emerald-300 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>నమోదు అవుతోంది... (Recording Cash...)</span>
                  ) : (
                    <>
                      <span>💵 నగదు స్వీకరించబడింది • రశీదు & పోస్టర్ జారీ చేయండి</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-center">
                    <p className="text-xs text-emerald-300 font-black">
                      ✓ రశీదు నెం: {userData.receiptNo} • చెల్లింపు ID: {userData.paymentId}
                    </p>
                    <p className="text-[11px] text-emerald-200/70 mt-0.5">
                      రశీదు & పోస్టర్ సిద్ధమయ్యాయి. కింద లేదా కుడివైపు డౌన్‌లోడ్ / షేర్ చేయండి.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetForNextDonor}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>➕ తర్వాతి దాత నమోదు (Register Next Contributor)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: POSTER / RECEIPT TABS & PREVIEW (5 cols) */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* View Switcher Tabs */}
            <div className="bg-[#240b03] p-1.5 rounded-2xl border border-amber-500/40 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('poster')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'poster'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'text-orange-200/70 hover:text-white'
                }`}
              >
                <span>🎨 పోస్టర్ (Poster)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'receipt'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'text-orange-200/70 hover:text-white'
                }`}
              >
                <span>🧾 అధికారిక రశీదు (80G Receipt)</span>
                {userData.isPaid && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            {/* Poster / Receipt View */}
            <div className="bg-[#240b03] border border-amber-500/30 rounded-3xl p-4 shadow-xl">
              {activeTab === 'poster' ? (
                <div>
                  <div className="text-center mb-2">
                    <p className="text-xs text-orange-200/80 font-medium">
                      లైవ్ పోస్టర్ ప్రివ్యూ (Live Poster Preview)
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <AnnaprasadamPreview
                      userData={userData}
                      setUserData={setUserData}
                      onEditCrop={() => setIsCropperOpen(true)}
                      lang={lang}
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#8b3d0b]/40">
                    <ActionButtons
                      onDownload={handlePosterDownload}
                      onShare={handlePosterShare}
                      isGenerating={isGenerating}
                      shareLabel={lang === 'te' ? 'పోస్టర్ షేర్ చేయండి' : 'Share Poster'}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-2">
                    <p className="text-xs text-orange-200/80 font-medium">
                      అధికారిక 80G రశీదు (Official Donation Receipt - CASH)
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ReceiptPreview
                      userData={userData}
                      onBackToPoster={() => setActiveTab('poster')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Cropper Modal */}
      {isCropperOpen && userData.rawMediaUrl && (
        <ImageCropper
          mediaSrc={userData.rawMediaUrl}
          aspectRatio={PHOTO_AREA.width / PHOTO_AREA.height}
          lang={lang}
          onComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
};
