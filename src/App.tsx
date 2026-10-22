import { useState, useRef } from 'react';
import { UserForm } from './components/Form/UserForm';
import { PhotoUpload } from './components/PhotoUpload/PhotoUpload';
import { PosterPreview } from './components/PosterPreview/PosterPreview';
import { ActionButtons } from './components/GenerateButton/ActionButtons';
import { StartingScreen } from './components/StartingScreen';
import { ImageCropper } from './components/PhotoUpload/ImageCropper';
import { RegistrationFormPage } from './components/FormPage/RegistrationFormPage';
import { AnnaprasadamForm } from './components/Form/AnnaprasadamForm';
import { AnnaprasadamPreview } from './components/PosterPreview/AnnaprasadamPreview';
import { ReceiptPreview } from './components/Receipt/ReceiptPreview';
import { ComplianceFooter } from './components/Footer/ComplianceFooter';
import { DeveloperSignature } from './components/Footer/DeveloperSignature';
import { LanguageSwitcher } from './components/Language/LanguageSwitcher';
import { TRANSLATIONS, type SupportedLanguage } from './i18n/annaprasadamTranslations';
import type { UserData, CropArea } from './types/poster';
import { generateVideo } from './canvas/videoRenderer';
import { generateImage, IMAGE_PHOTO_AREA, ARUNACHALAM_PHOTO_AREA } from './canvas/imageRenderer';
import { PHOTO_AREA } from './canvas/coordinates';
import {
  GOOGLE_SCRIPT_URL,
  FORM_RESPONSES_SCRIPT_URL,
  SRINAGAR_COLONY_SCRIPT_URL,
  ARUNACHALAM_SCRIPT_URL,
  ANNAPRASADAM_PAYMENTS_SHEET_URL
} from './config/sheets';

  const getInitialLang = (): SupportedLanguage => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      if (langParam === 'en' || langParam === 'ta' || langParam === 'hi' || langParam === 'te' || langParam === 'kn') {
        return langParam;
      }
      const saved = localStorage.getItem('annaprasadam_lang');
      if (saved === 'en' || saved === 'ta' || saved === 'hi' || saved === 'te' || saved === 'kn') {
        return saved as SupportedLanguage;
      }
    }
    return 'te';
  };

  const getInitialTemplate = (): 'video' | 'image' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') || params.get('type');
      if (mode === 'image' || mode === 'photo' || mode === 'poster') return 'image';
      if (mode === 'video') return 'video';
    }
    return 'video';
  };

  type PageType = 'poster' | 'srnagar' | 'srinagar_colony' | 'arunachalam' | 'annaprasadam';

  const getInitialPage = (): PageType => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = (params.get('page') || params.get('view') || '').toLowerCase();
      const path = window.location.pathname.toLowerCase();

      // Check for Annaprasadam Seva
      if (
        page === 'annaprasadam' ||
        page === 'annadanam' ||
        page === 'prasadam' ||
        page === 'seva' ||
        path.includes('/annaprasadam') ||
        path.includes('/annadanam') ||
        path.includes('/prasadam') ||
        path.includes('/seva')
      ) {
        return 'annaprasadam';
      }

      // Check for Arunachalam
      if (
        page === 'arunachalam' || 
        page === 'arunachala' || 
        path.includes('/arunachalam') ||
        path.includes('/arunachala')
      ) {
        return 'arunachalam';
      }

      // Check for Srinagar Colony
      if (
        page === 'srinagar' || 
        page === 'srinagarcolony' || 
        page === 'srinagar-colony' || 
        page === 'scolony' ||
        path.includes('/srinagar-colony') ||
        path.includes('/srinagarcolony') ||
        path.includes('/srinagar')
      ) {
        return 'srinagar_colony';
      }

      // Check for S.R.Nagar
      if (
        page === 'form' || 
        page === 'registration' || 
        page === 'srnagar' || 
        page === 'sr-nagar' ||
        path.includes('/form') || 
        path.includes('/srnagar') || 
        path.includes('/sr-nagar')
      ) {
        return 'srnagar';
      }

      // Check for Poster Generator (Video/Photo status)
      if (
        page === 'poster' ||
        page === 'video' ||
        page === 'status' ||
        path.includes('/poster') ||
        path.includes('/video') ||
        path.includes('/status')
      ) {
        return 'poster';
      }
    }
    // Default main landing page is the Poster & Video Generator
    return 'poster';
  };

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(getInitialPage());
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getInitialLang());
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    phoneNumber: '',
    location: '',
    plates: '',
    photoUrl: null,
    templateType: getInitialTemplate()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [annaprasadamView, setAnnaprasadamView] = useState<'poster' | 'receipt'>('poster');
  const lastSubmittedData = useRef<string | null>(null);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('annaprasadam_lang', newLang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    if (page === 'annaprasadam') {
      setUserData(prev => ({ ...prev, plates: prev.plates || '' }));
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (page === 'srnagar') {
        url.searchParams.set('page', 'srnagar');
      } else if (page === 'srinagar_colony') {
        url.searchParams.set('page', 'srinagar-colony');
      } else if (page === 'arunachalam') {
        url.searchParams.set('page', 'arunachalam');
      } else if (page === 'annaprasadam') {
        url.searchParams.set('page', 'annaprasadam');
      } else {
        url.searchParams.delete('page');
      }
      window.history.pushState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCropComplete = (data: { croppedUrl?: string; cropArea: CropArea; cropPixels: CropArea }) => {
    const isImage = userData.templateType === 'image' || currentPage === 'annaprasadam';
    if (isImage) {
      setUserData(prev => ({
        ...prev,
        photoUrl: data.croppedUrl || prev.photoUrl,
        rawMediaUrl: prev.rawMediaUrl || prev.photoUrl || data.croppedUrl,
        cropArea: data.cropArea,
        cropPixels: data.cropPixels,
        videoScale: 1.0,
        videoOffset: { x: 0, y: 0 }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        photoUrl: prev.rawMediaUrl || prev.photoUrl,
        rawMediaUrl: prev.rawMediaUrl || prev.photoUrl,
        cropArea: data.cropArea,
        cropPixels: data.cropPixels,
        videoScale: 1.0,
        videoOffset: { x: 0, y: 0 }
      }));
    }
    setIsCropperOpen(false);
  };

  const submitToGoogleSheets = async () => {
    if (!userData.fullName && !userData.phoneNumber && !userData.location) return;

    const platesNum = parseInt(userData.plates || '0', 10);
    const currentDataStr = JSON.stringify({
      fullName: userData.fullName,
      dob: userData.dob || '',
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      hours: userData.hours || '',
      plates: platesNum > 0 ? platesNum : undefined,
      plateNumber: userData.plateNumber || '',
      amount: platesNum > 0 ? platesNum * 1 : undefined,
      isPaid: userData.isPaid || false,
      isPlateLocked: userData.isPlateLocked || false,
      paymentId: userData.paymentId || '',
      receiptNo: userData.receiptNo || '',
      category: currentPage === 'annaprasadam' ? 'Annaprasadam Seva' : 'Poster Generator',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    if (lastSubmittedData.current === currentDataStr) return;
    
    lastSubmittedData.current = currentDataStr;

    try {
      const targetUrl = (currentPage === 'annaprasadam' && userData.isPaid)
        ? ANNAPRASADAM_PAYMENTS_SHEET_URL
        : GOOGLE_SCRIPT_URL;

      fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", 
        },
        body: currentDataStr
      }).catch(err => console.error("Background sync failed:", err));
    } catch (e) {
      console.error("Failed to queue submission:", e);
    }
  };

  const validateInput = (): boolean => {
    if (currentPage === 'annaprasadam') {
      if (!userData.fullName.trim()) {
        alert("దయచేసి మీ పూర్తి పేరు నమోదు చేయండి (Please enter your full name)");
        return false;
      }
      if (!userData.dob) {
        alert("దయచేసి మీ పుట్టిన తేదీని నమోదు చేయండి (Please enter Date of Birth)");
        return false;
      }
      if (!userData.plates || parseInt(userData.plates, 10) <= 0) {
        alert("దయచేసి ఎన్ని ప్లేట్లో నమోదు చేయండి (Please enter number of plates)");
        return false;
      }
      if (!userData.isPaid) {
        alert(
          currentLang === 'en'
            ? 'Please complete online payment first to share the poster.'
            : currentLang === 'ta'
            ? 'போஸ்டரைப் பகிர முதலில் ஆன்லைன் கட்டணத்தை முடிக்கவும்.'
            : currentLang === 'hi'
            ? 'पोस्टर शेयर करने के लिए कृपया पहले ऑनलाइन भुगतान पूरा करें।'
            : currentLang === 'kn'
            ? 'ಪೋಸ್ಟರ್ ಹಂಚಿಕೊಳ್ಳಲು ದಯವಿಟ್ಟು ಮೊದಲು ಆನ್‌ಲೈನ್ ಪಾವತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.'
            : 'పోస్టర్ షೇర్ చేయడానికి దಯచేసి ముందుగా ఆన్‌లైన్ పేమెంట్ పూర్తి చేయండి.'
        );
        return false;
      }
    }

    if (userData.phoneNumber) {
      const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
        alert("Please enter a valid 10-digit phone number.");
        return false;
      }
    }
    return true;
  };

  const handleDownload = async () => {
    if (!validateInput()) return;
    setIsGenerating(true);
    setVideoProgress(0);
    try {
      submitToGoogleSheets();

      if (currentPage === 'annaprasadam') {
        const isMahaMouna = userData.sevaCategory === 'mahamouna';
        const templatePath = isMahaMouna ? '/assets/maharaj.png' : '/assets/Arunachalam.png';
        const blob = await generateImage(userData, templatePath, true, currentLang);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const prefix = isMahaMouna ? 'mahamouna' : 'annaprasadam';
        a.download = `${prefix}-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'poster'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (userData.templateType === 'image') {
        const blob = await generateImage(userData, '/assets/image_template.png');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poster-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'download'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const blob = await generateVideo(userData, '/assets/template_3.png', (progress) => {
          setVideoProgress(Math.round(progress * 100));
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'download'}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
      setVideoProgress(null);
    }
  };

  const handleShare = async () => {
    if (!validateInput()) return;
    setIsGenerating(true);
    setVideoProgress(0);
    try {
      submitToGoogleSheets();

      const isAnnaprasadam = currentPage === 'annaprasadam';
      const isImage = userData.templateType === 'image' || isAnnaprasadam;
      let blob: Blob;
      let filename: string;
      let shareText: string;
      const baseAppUrl = "https://mahamounadhyanakumbposter.vercel.app";
      const imageGenUrl = `${baseAppUrl}/?mode=image`;
      const videoGenUrl = `${baseAppUrl}/?mode=video`;
      const annaprasadamGenUrl = `${baseAppUrl}/annaprasadam`;

      const campaignBody = `అందరికీ ఆత్మీయ ఆహ్వానం \n\n*తరలిరండి అరుణాచలం*\n\nA Movement of Mouna \n\nపత్రీజీ మహా అవతరణ దినోత్సవానికి మనం అందించే \n*బహుమానం - బహుమౌనం*\n\n*మహా మౌన ధ్యాన కుంభ్*\n(నవంబర్ 11 నుండి 15 వరకు)\n\n*రిజిస్ట్రేషన్ కొరకు:*\nhttps://gurusthanmeditation.org/visitregistration\n\nమరిన్ని వివరాలకు:\n9133016016\n9133015015\n9133014014\n\nమీ ఫోటోతో పోస్టర్ తయారు చేయడానికి:\n${imageGenUrl}\n\nమీ ఫోటోతో వీడియో తయారు చేయడానికి:\n${videoGenUrl}`;

      const annaprasadamBodies: Record<SupportedLanguage, string> = {
        te: `అందరికీ ఆత్మీయ ఆహ్వానం \n\n*మహా మౌన ధ్యాన కుంభ్ - అరుణాచలం*\n(నవంబర్ 11 నుండి 15 వరకు)\n\n*మహా అన్నప్రసాద వితరణ సేవ*\n\nమీరు కూడా అన్నప్రసాద సేవలో భాగస్వామ్యం అవ్వండి!\n\nమీ పేరు, ఫోటోతో అన్నప్రసాద పోస్టర్ తయారు చేయడానికి:\n${annaprasadamGenUrl}\n\nమరిన్ని వివరాలకు:\n9133016016`,
        en: `Warm Welcome to All \n\n*Maha Mouna Dhyana Kumbh - Arunachalam*\n(November 11 to 15)\n\n*Maha Annaprasadam Seva*\n\nBe a blessed sponsor in holy Annaprasadam Seva!\n\nCreate your personalized Annaprasadam poster with your photo & name:\n${annaprasadamGenUrl}?lang=en\n\nFor more details:\n9133016016`,
        ta: `அனைவருக்கும் அன்பான வரவேற்பு \n\n*மகா மௌன தியான கும்ப் - அருணாச்சலம்*\n(நவம்பர் 11 முதல் 15 வரை)\n\n*மகா அன்னபிரசாத விநியோக சேவை*\n\nநீங்களும் இந்த புனித அன்னபிரசாத சேவையில் பங்கெடுங்கள்!\n\nஉங்கள் புகைப்படம் மற்றும் பெயருடன் அன்னபிரசாத போஸ்டர் உருவாக்க:\n${annaprasadamGenUrl}?lang=ta\n\nமேலும் விவரங்களுக்கு:\n9133016016`,
        hi: `आप सभी का सादर निमंत्रण \n\n*महा मौन ध्यान कुंभ - अरुणाचलम*\n(11 से 15 नवंबर)\n\n*महा अन्नप्रसाद वितरण सेवा*\n\nआप भी पवित्र अन्नप्रसाद सेवा में भागीदार बनें!\n\nअपने नाम और फोटो के साथ अन्नप्रसाद पोस्टर बनाएं:\n${annaprasadamGenUrl}?lang=hi\n\nअधिक जानकारी हेतु:\n9133016016`,
        kn: `ಎಲ್ಲರಿಗೂ ಆತ್ಮೀಯ ಆಹ್ವಾನ \n\n*ಮಹಾ ಮೌನ ಧ್ಯಾನ ಕುಂಭ - ಅರುಣಾಚಲ*\n(ನವೆಂಬರ್ 11 ರಿಂದ 15 ರವರೆಗೆ)\n\n*ಮಹಾ ಅನ್ನಪ್ರಸಾದ ವಿತರಣಾ ಸೇವೆ*\n\nನೀವು ಕೂಡ ಈ ಪವಿತ್ರ ಅನ್ನಪ್ರಸಾದ ಸೇವೆಯಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಿ!\n\nನಿಮ್ಮ ಹೆಸರು, ಫೋಟೋದೊಂದಿಗೆ ಅನ್ನಪ್ರಸಾದ ಪೋಸ್ಟರ್ ತಯಾರಿಸಲು:\n${annaprasadamGenUrl}?lang=kn\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ:\n9133016016`
      };

      if (isAnnaprasadam) {
        const isMahaMouna = userData.sevaCategory === 'mahamouna';
        const templatePath = isMahaMouna ? '/assets/maharaj.png' : '/assets/Arunachalam.png';
        blob = await generateImage(userData, templatePath, true, currentLang);
        const prefix = isMahaMouna ? 'mahamouna' : 'annaprasadam';
        filename = `${prefix}-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'poster'}.png`;
        shareText = annaprasadamBodies[currentLang] || annaprasadamBodies.te;
      } else if (isImage) {
        blob = await generateImage(userData, '/assets/image_template.png');
        filename = `poster-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'download'}.png`;
        shareText = campaignBody;
      } else {
        blob = await generateVideo(userData, '/assets/template_3.png', (progress) => {
          setVideoProgress(Math.round(progress * 100));
        });
        filename = `video-${userData.fullName.replace(/\s+/g, '-').toLowerCase() || 'download'}.webm`;
        shareText = campaignBody;
      }

      const file = new File([blob], filename, { type: isImage ? 'image/png' : 'video/webm' });
      
            let shareSuccess = false;
      // For images, we can try native share (WhatsApp preserves text for images usually)
      // For videos, native share often strips the text, so we skip native share and force the fallback!
      if (isImage && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Maha Mouna Dhyana Kumbh',
            text: shareText
          });
          shareSuccess = true;
        } catch (shareErr) {
          if (shareErr instanceof Error && shareErr.name !== 'AbortError') {
            console.error("Native share failed, falling back to download:", shareErr);
          } else {
            shareSuccess = true; // User aborted
          }
        }
      }

      if (!shareSuccess) {
        // Fallback: Download the file automatically since we already generated it
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const msg = isImage 
          ? "Your browser/device blocked direct sharing to WhatsApp. The poster has been downloaded instead! We will now open WhatsApp so you can attach it manually."
          : "The personalized video has been downloaded to your device! We will now open WhatsApp with your pre-filled text so you can easily attach and share it.";
        alert(msg);
        
        setTimeout(() => {
          window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
        }, 1000);
      }
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
      setVideoProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#381609] text-white pb-12 font-sans selection:bg-[#ffca08] selection:text-[#381609]">
      <StartingScreen />
      
      <header className="w-full bg-gradient-to-b from-[#240b03] to-[#4a1c0b] shadow-2xl border-b border-[#8b3d0b] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#ffca08] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d97706] opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <img 
                src="/assets/logo.png" 
                alt="Emblem" 
                className="w-12 h-12 rounded-full drop-shadow-[0_0_12px_rgba(255,202,8,0.5)] border border-[#ffca08]/50 object-cover"
              />
              <div className="inline-block px-4 py-1.5 rounded-full border border-[#ffca08]/50 bg-[#ffca08]/20 text-[#ffca08] font-bold text-sm tracking-widest uppercase shadow-sm">
                A Movement of Mouna
              </div>
            </div>
            <h1 className="font-['Noto_Sans_Telugu'] text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg tracking-wide">
              మహా మౌన <br />
              <span className="text-[#ffca08]">ధ్యాన కుంభ్</span>
            </h1>
            <p className="font-['Noto_Sans_Telugu'] text-xl md:text-2xl text-orange-100 font-light mb-8 max-w-2xl mx-auto lg:mx-0">
              తరలిరండి అరుణాచలం.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <span className="font-['Noto_Sans_Telugu'] px-5 py-2.5 rounded-lg bg-[#8b3d0b] border border-[#d97706] text-white font-medium flex items-center gap-2 shadow-md">
                <svg className="w-5 h-5 text-[#ffca08]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                నవంబర్ 11 - 15
              </span>
              <span className="font-['Noto_Sans_Telugu'] px-5 py-2.5 rounded-lg bg-[#8b3d0b] border border-[#d97706] text-[#ffca08] font-bold shadow-md">
                అరుణాచలం
              </span>
            </div>

            {/* Main Navigation Switcher */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => navigateTo('poster')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
                  currentPage === 'poster'
                    ? 'bg-[#ffca08] text-[#381609] ring-2 ring-[#ffca08]/60 shadow-amber-500/20 scale-[1.02]'
                    : 'bg-[#240b03]/80 hover:bg-[#8b3d0b] text-orange-200 border border-[#8b3d0b]'
                }`}
              >
                <span>🎥 🖼️ పోస్టర్ / వీడియో (Poster & Video)</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('annaprasadam')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
                  currentPage === 'annaprasadam'
                    ? 'bg-[#ffca08] text-[#381609] ring-2 ring-[#ffca08]/60 shadow-amber-500/20 scale-[1.02]'
                    : 'bg-[#240b03]/80 hover:bg-[#8b3d0b] text-orange-200 border border-[#8b3d0b]'
                }`}
              >
                <span>🍚 అన్నప్రసాద సేవ (Annaprasadam Seva)</span>
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 relative group mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-[#ffca08] rounded-3xl blur-2xl opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
            <img 
              src="/assets/mouna_banner.jpg" 
              alt="Maha Mouna Dhyana Kumbh" 
              className="relative w-full max-w-[420px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#ffca08]/30 object-contain"
            />
          </div>
        </div>
      </header>


      {currentPage === 'srnagar' ? (
        <RegistrationFormPage 
          googleScriptUrl={FORM_RESPONSES_SCRIPT_URL}
          title="S.R.Nagar Register Data 03-25 to 10-26"
          subtitle="ఫోన్ నెంబర్ తనిఖీ చేసి కొత్త వివరాలను నమోదు చేయండి"
          onNavigateToPoster={() => navigateTo('poster')} 
        />
      ) : currentPage === 'srinagar_colony' ? (
        <RegistrationFormPage 
          googleScriptUrl={SRINAGAR_COLONY_SCRIPT_URL}
          title="Srinagar Colony Register Data"
          subtitle="శ్రీనగర్ కాలనీ రిజిస్ట్రేషన్ డేటా - ఫోన్ నెంబర్ తనిఖీ చేసి వివరాలు నమోదు చేయండి"
          onNavigateToPoster={() => navigateTo('poster')} 
        />
      ) : currentPage === 'arunachalam' ? (
        <RegistrationFormPage 
          googleScriptUrl={ARUNACHALAM_SCRIPT_URL}
          title="Arunachalam Register Data"
          subtitle="అరుణాచలం రిజిస్ట్రేషన్ డేటా - ఫోన్ నెంబర్ తనిఖీ చేసి వివరాలు నమోదు చేయండి"
          includeAadhar={true}
          onNavigateToPoster={() => navigateTo('poster')} 
        />
      ) : currentPage === 'annaprasadam' ? (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
          {/* Responsive Language Switcher */}
          <LanguageSwitcher currentLang={currentLang} onLanguageChange={handleLanguageChange} />

          {/* Header Banner for Annaprasadam */}
          <div className="text-center mb-8 sm:mb-10 w-full px-2 sm:px-4">
            <h2 
              className="font-extrabold text-[#ffca08] drop-shadow-lg tracking-tight sm:tracking-normal whitespace-nowrap text-center max-w-full select-none"
              style={{ fontSize: 'clamp(9.5px, 3.15vw, 34px)' }}
            >
              {TRANSLATIONS[currentLang].bannerTitle}
            </h2>
            <p className="text-orange-200/85 text-xs sm:text-base mt-2.5 max-w-2xl mx-auto leading-relaxed px-2">
              {TRANSLATIONS[currentLang].bannerSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="flex flex-col gap-6">
              <AnnaprasadamForm
                userData={userData}
                setUserData={setUserData}
                onViewReceipt={() => setAnnaprasadamView('receipt')}
                onOpenCropper={() => setIsCropperOpen(true)}
                lang={currentLang}
              />
              {userData.isPaid && annaprasadamView === 'poster' && (
                <div className="hidden lg:block animate-fadeIn">
                  <ActionButtons 
                    onShare={handleShare} 
                    isGenerating={isGenerating} 
                    showDownload={false}
                    shareDisabled={false}
                    shareLabel={TRANSLATIONS[currentLang].shareWhatsApp}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              {/* Tab Selector when payment is completed */}
              {userData.isPaid && (
                <div className="bg-[#4a1c0b] p-1.5 rounded-2xl shadow-xl border border-[#8b3d0b] flex mb-4">
                  <button
                    type="button"
                    onClick={() => setAnnaprasadamView('poster')}
                    className={`flex-1 py-2.5 text-center rounded-xl font-bold text-sm sm:text-base transition-all ${
                      annaprasadamView === 'poster'
                        ? 'bg-[#ffca08] text-[#381609] shadow-md'
                        : 'text-orange-200 hover:text-white hover:bg-[#8b3d0b]/30'
                    }`}
                  >
                    {TRANSLATIONS[currentLang].posterTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnaprasadamView('receipt')}
                    className={`flex-1 py-2.5 text-center rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-1.5 ${
                      annaprasadamView === 'receipt'
                        ? 'bg-[#ffca08] text-[#381609] shadow-md'
                        : 'text-orange-200 hover:text-white hover:bg-[#8b3d0b]/30'
                    }`}
                  >
                    <span>{TRANSLATIONS[currentLang].receiptTab}</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-emerald-600 text-white font-bold rounded-full">✓ Paid</span>
                  </button>
                </div>
              )}

              {annaprasadamView === 'receipt' && userData.isPaid ? (
                <ReceiptPreview
                  userData={userData}
                  onBackToPoster={() => setAnnaprasadamView('poster')}
                />
              ) : (
                <>
                  <AnnaprasadamPreview
                    userData={userData}
                    setUserData={setUserData}
                    onEditCrop={() => setIsCropperOpen(true)}
                    lang={currentLang}
                  />
                  {userData.isPaid ? (
                    <div className="block lg:hidden mt-6 animate-fadeIn">
                      <ActionButtons 
                        onShare={handleShare} 
                        isGenerating={isGenerating} 
                        showDownload={false}
                        shareDisabled={false}
                        shareLabel={TRANSLATIONS[currentLang].shareWhatsApp}
                      />
                    </div>
                  ) : (
                    <div className="block lg:hidden mt-4 p-3.5 bg-[#240b03] border border-[#ffca08]/30 rounded-2xl text-center text-xs text-orange-200/80 shadow-md">
                      <span className="font-semibold">{TRANSLATIONS[currentLang].shareUnlockPrompt}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            
            {/* Template Toggle */}
            <div className="bg-[#4a1c0b] p-2 rounded-2xl shadow-xl border border-[#8b3d0b] flex">
              <button 
                onClick={() => setUserData(prev => ({...prev, templateType: 'video', photoUrl: null}))}
                className={`flex-1 py-3 text-center rounded-xl font-bold transition-all ${userData.templateType === 'video' ? 'bg-[#ffca08] text-[#381609] shadow-md' : 'text-orange-200 hover:text-white hover:bg-[#8b3d0b]/30'}`}
              >
                🎥 Video Template
              </button>
              <button 
                onClick={() => setUserData(prev => ({...prev, templateType: 'image', photoUrl: null}))}
                className={`flex-1 py-3 text-center rounded-xl font-bold transition-all ${userData.templateType === 'image' ? 'bg-[#ffca08] text-[#381609] shadow-md' : 'text-orange-200 hover:text-white hover:bg-[#8b3d0b]/30'}`}
              >
                🖼️ Image Template
              </button>
            </div>

            <UserForm userData={userData} setUserData={setUserData} />
            <PhotoUpload userData={userData} setUserData={setUserData} onOpenCropper={() => setIsCropperOpen(true)} />
            
            <div className="hidden lg:block">
              {videoProgress !== null && (
                <div className="mb-4 bg-[#240b03] rounded-xl overflow-hidden border border-[#8b3d0b]">
                  <div className="bg-gradient-to-r from-[#d97706] to-[#ffca08] text-[#381609] text-xs font-bold text-center p-1 transition-all duration-300" style={{ width: `${videoProgress}%` }}>
                    {videoProgress}%
                  </div>
                </div>
              )}
              <ActionButtons onDownload={handleDownload} onShare={handleShare} isGenerating={isGenerating} />
            </div>
          </div>

          <div className="flex flex-col">
            <PosterPreview userData={userData} setUserData={setUserData} onEditCrop={() => setIsCropperOpen(true)} />
            
            <div className="block lg:hidden mt-6">
              {videoProgress !== null && (
                <div className="mb-4 bg-[#240b03] rounded-xl overflow-hidden border border-[#8b3d0b]">
                  <div className="bg-gradient-to-r from-[#d97706] to-[#ffca08] text-[#381609] text-xs font-bold text-center p-1 transition-all duration-300" style={{ width: `${videoProgress}%` }}>
                    {videoProgress}%
                  </div>
                </div>
              )}
              <ActionButtons onDownload={handleDownload} onShare={handleShare} isGenerating={isGenerating} />
            </div>
          </div>
        </div>
      </main>
      )}

      {/* Developer Signature Small Text with Popover */}
      <DeveloperSignature />

      <ComplianceFooter />

      {isCropperOpen && (userData.rawMediaUrl || userData.photoUrl) && (
        <ImageCropper
          mediaSrc={(userData.rawMediaUrl || userData.photoUrl)!}
          isVideo={currentPage !== 'annaprasadam' && userData.templateType === 'video'}
          aspectRatio={
            currentPage === 'annaprasadam'
              ? ARUNACHALAM_PHOTO_AREA.width / ARUNACHALAM_PHOTO_AREA.height
              : userData.templateType === 'image'
              ? IMAGE_PHOTO_AREA.width / IMAGE_PHOTO_AREA.height
              : PHOTO_AREA.width / PHOTO_AREA.height
          }
          lang={currentLang}
          onComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
}

export default App;


