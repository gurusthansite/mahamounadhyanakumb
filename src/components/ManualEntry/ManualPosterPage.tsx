import React, { useState, useRef, useEffect } from 'react';
import type { UserData } from '../../types/poster';
import { AnnaprasadamPreview } from '../PosterPreview/AnnaprasadamPreview';
import { ActionButtons } from '../GenerateButton/ActionButtons';
import { 
  TRANSLATIONS, 
  getPoshakuluTitleByLang, 
  getMahaMounaTitleByLang,
  type SupportedLanguage 
} from '../../i18n/annaprasadamTranslations';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onOpenCropper: () => void;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onDownload: () => void;
  onShare: () => void;
  isGenerating: boolean;
  onNavigateHome: () => void;
}

export const ManualPosterPage: React.FC<Props> = ({
  userData,
  setUserData,
  onOpenCropper,
  lang,
  onLanguageChange,
  onDownload,
  onShare,
  isGenerating,
  onNavigateHome
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.te;
  const isMahaMouna = userData.sevaCategory === 'mahamouna';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setUserData(prev => ({
      ...prev,
      templateType: 'image'
    }));
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [setUserData, cameraStream]);

  // Quick preset titles by language and category
  const presetTitlesByLang: Record<SupportedLanguage, { guru: string[]; mahamouna: string[] }> = {
    te: {
      guru: [
        'పోషకులు',
        'సహరాజ పోషకులు',
        'రాజపోషకులు',
        'మహారాజ పోషకులు',
        'పోషక చక్రవర్తులు',
        'మహా పోషక చక్రవర్తులు'
      ],
      mahamouna: [
        'విరాళ దాతలు',
        'రాజ పోషకులు',
        'మహారాజ పోషకులు',
        'పోషక చక్రవర్తులు',
        'మహా పోషక చక్రవర్తులు'
      ]
    },
    en: {
      guru: [
        'Patron',
        'Co-Royal Patron',
        'Royal Patron',
        'Maharaja Patron',
        'Emperor Patron',
        'Maha Emperor Patron'
      ],
      mahamouna: [
        'Donors',
        'Royal Patron',
        'Maharaja Patron',
        'Emperor Patron',
        'Maha Emperor Patron'
      ]
    },
    ta: {
      guru: [
        'புரவலர்',
        'சக ராஜ புரவலர்',
        'ராஜ புரவலர்',
        'மகாராஜ புரவலர்',
        'புரவலர் சக்ரவர்த்தி',
        'மகா புரவலர் சக்ரவர்த்தி'
      ],
      mahamouna: [
        'நன்கொடையாளர்கள்',
        'ராஜ புரவலர்',
        'மகாராஜ புரவலர்',
        'புரவலர் சக்ரவர்த்தி',
        'மகா புரவலர் சக்ரவர்த்தி'
      ]
    },
    hi: {
      guru: [
        'पोषक',
        'सहराज पोषक',
        'राज पोषक',
        'महाराजा पोषक',
        'पोषक चक्रवर्ती',
        'महा पोषक चक्रवर्ती'
      ],
      mahamouna: [
        'दानदाता',
        'राज पोषक',
        'महाराजा पोषक',
        'पोषक चक्रवर्ती',
        'महा पोषक चक्रवर्ती'
      ]
    },
    kn: {
      guru: [
        'ಪೋಷಕರು',
        'ಸಹರಾಜ ಪೋಷಕರು',
        'ರಾಜಪೋಷಕರು',
        'ಮಹಾರಾಜ ಪೋಷಕರು',
        'ಪೋಷಕ ಚಕ್ರವರ್ತಿಗಳು',
        'ಮಹಾ ಪೋಷಕ ಚಕ್ರವರ್ತಿಗಳು'
      ],
      mahamouna: [
        'ದಾನಿಗಳು',
        'ರಾಜ ಪೋಷಕರು',
        'ಮಹಾರಾಜ ಪೋಷಕರು',
        'ಪೋಷಕ ಚಕ್ರವರ್ತಿಗಳು',
        'ಮಹಾ ಪೋಷಕ ಚಕ್ರವರ್ತಿಗಳು'
      ]
    }
  };

  const currentPresets = isMahaMouna 
    ? (presetTitlesByLang[lang]?.mahamouna || presetTitlesByLang.te.mahamouna)
    : (presetTitlesByLang[lang]?.guru || presetTitlesByLang.te.guru);

  const handleCategoryChange = (category: 'guruprasadam' | 'mahamouna') => {
    setUserData(prev => ({
      ...prev,
      sevaCategory: category,
      customTitle: '' // reset or let user pick new
    }));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'manual');
      url.searchParams.set('category', category === 'mahamouna' ? 'mahamouna' : 'mmts');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP)');
      return;
    }

    const url = URL.createObjectURL(file);
    setUserData(prev => ({
      ...prev,
      rawMediaUrl: url,
      photoUrl: url,
      cropArea: undefined,
      cropPixels: undefined,
      templateType: 'image'
    }));
    onOpenCropper();
    e.target.value = '';
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
              photoUrl: url,
              cropArea: undefined,
              cropPixels: undefined,
              templateType: 'image'
            }));
            stopCamera();
            onOpenCropper();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleRemovePhoto = () => {
    setUserData(prev => ({
      ...prev,
      photoUrl: null,
      rawMediaUrl: null,
      cropArea: undefined,
      cropPixels: undefined
    }));
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'manual');
      url.searchParams.set('category', isMahaMouna ? 'mahamouna' : 'mmts');
      url.searchParams.set('lang', lang);
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const titlesList = t.titles || [
    { id: 'శ్రీ', label: 'శ్రీ (Sri)' },
    { id: 'శ్రీమతి', label: 'శ్రీమతి (Srimathi)' },
    { id: 'శ్రీ & శ్రీమతి', label: 'శ్రీ & శ్రీమతి (Sri & Smt)' },
    { id: 'కుమారి', label: 'కుమారి (Kumari)' }
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 mb-16 animate-fadeIn">
      {/* Top Banner & Link Bar */}
      <div className="bg-gradient-to-r from-[#4a1c0b] via-[#381609] to-[#4a1c0b] p-4 sm:p-6 rounded-3xl border-2 border-[#ffca08]/40 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full bg-[#ffca08]/20 border border-[#ffca08]/50 text-[#ffca08] text-xs font-bold uppercase tracking-wider">
              ✍️ Direct Manual Entry
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              No Payment Required
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#ffca08] drop-shadow-md text-center md:text-left">
            {lang === 'en' 
              ? 'Manual Poster Generator (mmts & Maha Mouna)'
              : lang === 'ta'
              ? 'கைமுறை போஸ்டர் தயாரிப்பு (mmts & மகா மௌனம்)'
              : lang === 'hi'
              ? 'मैन्युअल पोस्टर मेकर (mmts और महा मौन)'
              : lang === 'kn'
              ? 'ಮ್ಯಾನುಯಲ್ ಪೋಸ್ಟರ್ ಜನರೇಟರ್ (mmts ಮತ್ತು ಮಹಾ ಮೌನ)'
              : 'మాన్యువల్ పోస్టర్ జనరేటర్ (mmts & మహా మౌన)'}
          </h1>
          <p className="text-xs sm:text-sm text-orange-200/80 mt-1 text-center md:text-left">
            {lang === 'en'
              ? 'Directly enter donor details, upload photo, and generate/download high-res poster.'
              : 'దాత వివరాలను నేరుగా నమోదు చేసి, ఫోటో జతచేసి వెంటనే పోస్టర్ డౌన్‌లోడ్ చేసుకోండి.'}
          </p>
        </div>

        {/* Copy Link & Share Direct Link Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-[#240b03] hover:bg-[#8b3d0b] text-[#ffca08] border border-[#ffca08]/40 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
            title="Copy this separate manual entry link to clipboard"
          >
            <span>{copiedLink ? '✅ లింక్ కాపీ అయింది!' : '📋 Copy Manual Link'}</span>
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-3.5 py-2.5 rounded-xl bg-[#240b03]/60 hover:bg-[#240b03] text-orange-200 text-xs sm:text-sm font-semibold transition-all border border-[#8b3d0b]/40"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Left Column: Form Controls */}
        <div className="flex flex-col gap-6">
          {/* 1. Poster Selection Switcher */}
          <div className="bg-[#4a1c0b] p-4 rounded-2xl shadow-xl border border-[#8b3d0b]">
            <label className="block text-xs font-bold text-[#ffca08] uppercase tracking-wider mb-2.5">
              1. పోస్టర్ టెంప్లేట్ ఎంచుకోండి (Select Poster Template):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange('guruprasadam')}
                className={`p-3.5 rounded-xl text-left border-2 transition-all flex items-start gap-2.5 ${
                  !isMahaMouna
                    ? 'bg-[#ffca08] text-[#381609] border-[#ffca08] shadow-lg font-bold'
                    : 'bg-[#240b03]/60 hover:bg-[#240b03] text-orange-100 border-[#8b3d0b]'
                }`}
              >
                <span className="text-2xl">🍲</span>
                <div>
                  <div className="text-sm font-extrabold leading-tight">
                    గురు ప్రసాదం (mmts)
                  </div>
                  <div className={`text-[11px] mt-0.5 ${!isMahaMouna ? 'text-[#381609]/80' : 'text-orange-200/70'}`}>
                    Divine Offering of Annaprasadam
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('mahamouna')}
                className={`p-3.5 rounded-xl text-left border-2 transition-all flex items-start gap-2.5 ${
                  isMahaMouna
                    ? 'bg-[#ffca08] text-[#381609] border-[#ffca08] shadow-lg font-bold'
                    : 'bg-[#240b03]/60 hover:bg-[#240b03] text-orange-100 border-[#8b3d0b]'
                }`}
              >
                <span className="text-2xl">🧘</span>
                <div>
                  <div className="text-sm font-extrabold leading-tight">
                    మహా మౌన ధ్యాన కుంభ్
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isMahaMouna ? 'text-[#381609]/80' : 'text-orange-200/70'}`}>
                    Poster_language Flyers
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Language Switcher inside form */}
          <div className="bg-[#4a1c0b] p-4 rounded-2xl shadow-xl border border-[#8b3d0b]">
            <label className="block text-xs font-bold text-[#ffca08] uppercase tracking-wider mb-2">
              2. పోస్టర్ భాష (Poster Language):
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { code: 'te', label: 'తెలుగు' },
                { code: 'en', label: 'English' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'kn', label: 'ಕನ್ನಡ' }
              ].map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onLanguageChange(item.code as SupportedLanguage)}
                  className={`py-2 px-1 text-center rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    lang === item.code
                      ? 'bg-[#ffca08] text-[#381609] shadow-md ring-2 ring-[#ffca08]/60'
                      : 'bg-[#240b03]/60 hover:bg-[#240b03] text-orange-200 border border-[#8b3d0b]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Donor Details Form */}
          <div className="bg-[#4a1c0b] p-5 sm:p-6 rounded-2xl shadow-xl border border-[#8b3d0b] flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#ffca08] border-b border-[#8b3d0b] pb-2 flex items-center gap-2">
              <span>👤</span>
              <span>3. దాత వివరాలు (Donor Details)</span>
            </h3>

            {/* Dedication Radio */}
            <div>
              <label className="block text-xs font-semibold text-orange-200/90 mb-1.5">
                ఈ పోస్టర్ ఎవరి పేరున? (This Poster is for):
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-orange-100 cursor-pointer">
                  <input
                    type="radio"
                    name="contributionFor"
                    checked={userData.contributionFor !== 'other'}
                    onChange={() => setUserData(prev => ({ ...prev, contributionFor: 'self' }))}
                    className="accent-[#ffca08] w-4 h-4 cursor-pointer"
                  />
                  <span>🙋 నా కోసం (Self)</span>
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm text-orange-100 cursor-pointer">
                  <input
                    type="radio"
                    name="contributionFor"
                    checked={userData.contributionFor === 'other'}
                    onChange={() => setUserData(prev => ({ ...prev, contributionFor: 'other' }))}
                    className="accent-[#ffca08] w-4 h-4 cursor-pointer"
                  />
                  <span>❤️ ఇతరుల పేరున (In the Name of Loved One)</span>
                </label>
              </div>
            </div>

            {/* Title & Name Inputs */}
            {userData.contributionFor === 'other' ? (
              <div className="flex flex-col gap-3 p-3 bg-[#240b03]/60 rounded-xl border border-[#8b3d0b]/40">
                <label className="block text-xs font-semibold text-[#ffca08]">
                  ఎవరి పేరున సమర్పిస్తున్నారు? (Beneficiary Title & Name):
                </label>
                <div className="flex gap-2">
                  <select
                    value={userData.beneficiaryTitle || titlesList[0]?.id || 'శ్రీ'}
                    onChange={(e) => setUserData(prev => ({ ...prev, beneficiaryTitle: e.target.value }))}
                    className="px-2.5 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-orange-100 font-bold text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  >
                    {titlesList.map(item => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={userData.beneficiaryName || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                    placeholder="e.g. సరస్వతి దేవి"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-semibold text-orange-200/90">
                  గౌరవ సంబోధన & దాత పేరు (Title & Full Name):
                </label>
                <div className="flex gap-2">
                  <select
                    value={userData.titlePrefix || titlesList[0]?.id || 'శ్రీ'}
                    onChange={(e) => setUserData(prev => ({ ...prev, titlePrefix: e.target.value }))}
                    className="px-2.5 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-orange-100 font-bold text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  >
                    {titlesList.map(item => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={userData.fullName || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. రమేష్ కుమార్"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  />
                </div>
              </div>
            )}

            {/* Top Banner Poshakulu Title Selector */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-orange-200/90">
                  టాప్ బ్యానర్ శీర్షిక (Top Banner Title / Category):
                </label>
                {userData.customTitle && (
                  <button
                    type="button"
                    onClick={() => setUserData(prev => ({ ...prev, customTitle: '' }))}
                    className="text-[10px] text-amber-300 hover:underline"
                  >
                    Clear Custom
                  </button>
                )}
              </div>

              {/* Quick preset pills */}
              <div className="flex flex-wrap gap-1.5">
                {currentPresets.map((preset) => {
                  const activeTitle = userData.customTitle || (isMahaMouna
                    ? getMahaMounaTitleByLang(parseInt(userData.donationAmount || '1', 10), lang)
                    : getPoshakuluTitleByLang(parseInt(userData.plates || '1', 10), lang));
                  const isSelected = activeTitle === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUserData(prev => ({ ...prev, customTitle: preset }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#ffca08] text-[#381609] font-bold shadow-sm'
                          : 'bg-[#240b03] text-orange-200 border border-[#8b3d0b] hover:bg-[#8b3d0b]/40'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom Title Input */}
              <input
                type="text"
                value={userData.customTitle || ''}
                onChange={(e) => setUserData(prev => ({ ...prev, customTitle: e.target.value }))}
                placeholder="లేదా మీకు నచ్చిన శీర్షికను రాయండి (Or type any custom title)"
                className="w-full px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08] placeholder-orange-200/40"
              />
            </div>

            {/* Photo Upload Section */}
            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-[#8b3d0b]/60">
              <label className="block text-xs sm:text-sm font-bold text-[#ffca08] uppercase tracking-wider mb-1">
                4. {t.photoLabel || 'దాత ఫోటో (Select / Upload Photo):'}
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {userData.photoUrl ? (
                /* Photo Selected State Card */
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
                      <span className="text-xs sm:text-sm font-bold text-white block truncate">
                        {t.photoSelectedTitle || '✓ ఫోటో ఎంపికైంది'}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium block truncate">
                        {t.photoSelectedSub || 'క్రాప్ చేయడానికి సిద్ధంగా ఉంది'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={onOpenCropper}
                      className="py-1.5 px-2.5 rounded-lg bg-[#381609] hover:bg-[#8b3d0b] text-[#ffca08] text-xs font-bold border border-[#ffca08]/40 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="క్రాప్ సరిచేయండి"
                    >
                      <span>✂️</span>
                      <span>{t.photoCropBtn || 'క్రాప్ చేయండి'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-1.5 px-2.5 rounded-lg bg-[#8b3d0b] hover:bg-[#a0460c] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      title="ఫోటో మార్చండి"
                    >
                      <span>🔄</span>
                      <span>{t.photoChangeBtn || 'మార్చండి'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 text-xs font-bold transition-colors active:scale-95"
                      title="ఫోటో తొలగించండి"
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Choose Photo Buttons */
                <div className="p-3 bg-[#240b03] border border-dashed border-[#8b3d0b] rounded-2xl text-center">
                  <p className="text-xs text-orange-200/80 mb-2.5">
                    {t.photoPrompt || 'ఫోటోను గ్యాలరీ నుండి ఎంచుకోండి లేదా కెమెరాతో తీయండి'}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <span>📁</span>
                      <span>{t.photoGalleryBtn || 'గ్యాలరీ నుండి'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="py-2.5 px-3 rounded-xl bg-[#381609] hover:bg-[#4a1c0b] text-orange-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#8b3d0b] hover:border-[#ffca08]/50 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <span>📷</span>
                      <span>{t.photoCameraBtn || 'కెమెరా'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Desktop / Left Column */}
          <div className="hidden lg:block bg-[#4a1c0b] p-5 rounded-2xl border border-[#8b3d0b] shadow-xl">
            <ActionButtons
              onDownload={onDownload}
              onShare={onShare}
              isGenerating={isGenerating}
              showDownload={true}
              shareDisabled={false}
              shareLabel={t.shareWhatsApp || 'WhatsApp లో షేర్ చేయండి'}
            />
          </div>
        </div>

        {/* Right Column: Live Poster Preview with Adjuster */}
        <div className="flex flex-col items-center">
          <AnnaprasadamPreview
            userData={userData}
            setUserData={setUserData}
            onEditCrop={onOpenCropper}
            lang={lang}
          />

          {/* Action Buttons for Mobile / Below Preview */}
          <div className="block lg:hidden w-full max-w-[420px] mt-6 bg-[#4a1c0b] p-4 rounded-2xl border border-[#8b3d0b] shadow-xl">
            <ActionButtons
              onDownload={onDownload}
              onShare={onShare}
              isGenerating={isGenerating}
              showDownload={true}
              shareDisabled={false}
              shareLabel={t.shareWhatsApp || 'WhatsApp లో షేర్ చేయండి'}
            />
          </div>
        </div>
      </div>

      {/* Camera Streaming Modal if Camera active */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#240b03] rounded-3xl overflow-hidden border-2 border-[#ffca08] shadow-2xl flex flex-col items-center">
            <div className="p-3 w-full bg-[#381609] text-center border-b border-[#8b3d0b] flex items-center justify-between px-4">
              <span className="text-sm font-bold text-[#ffca08] flex items-center gap-2">
                <span>📷</span> {t.photoCameraBtn || 'ఫోటో తీయండి (Take Photo)'}
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs bg-red-900/60 hover:bg-red-800 text-white px-2.5 py-1 rounded-lg border border-red-700"
              >
                ✕ {t.photoCancelBtn || 'రద్దు'}
              </button>
            </div>
            <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
            <div className="p-4 w-full flex items-center justify-center gap-4 bg-[#381609]">
              <button
                type="button"
                onClick={capturePhoto}
                className="py-3 px-6 rounded-2xl bg-[#ffca08] hover:bg-[#ffd943] text-[#381609] font-black text-sm sm:text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>📸</span>
                <span>{t.photoCaptureBtn || 'ఫోటో క్లిక్ చేయండి'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
