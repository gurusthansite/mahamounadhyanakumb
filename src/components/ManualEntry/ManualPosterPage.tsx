import React, { useState, useRef } from 'react';
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
  const [copiedLink, setCopiedLink] = useState(false);

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUserData(prev => ({
        ...prev,
        photoUrl: result,
        rawMediaUrl: result,
        cropArea: undefined,
        cropPixels: undefined
      }));
      onOpenCropper();
    };
    reader.readAsDataURL(file);
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
    { id: 'శ్రీమతి', label: 'శ్రీమతి (Srimathi)' }
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
                    <option value="శ్రీ & శ్రీమతి">శ్రీ & శ్రీమతి (Sri & Smt)</option>
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
                    <option value="శ్రీ & శ్రీమతి">శ్రీ & శ్రీమతి (Sri & Smt)</option>
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
              <label className="block text-xs font-semibold text-orange-200/90">
                దాత ఫోటో (Select / Upload Photo):
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-[#8b3d0b] hover:bg-[#a0460c] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>📁</span>
                  <span>{userData.photoUrl ? 'ఫోటో మార్చండి (Change Photo)' : 'ఫోటో ఎంచుకోండి (Choose Photo)'}</span>
                </button>

                {userData.photoUrl && (
                  <button
                    type="button"
                    onClick={onOpenCropper}
                    className="px-3.5 py-2.5 rounded-xl bg-[#240b03] hover:bg-[#381609] text-[#ffca08] border border-[#ffca08]/50 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>✂️</span>
                    <span>క్రాప్ సరిచేయండి (Recrop)</span>
                  </button>
                )}
              </div>
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
    </main>
  );
};
