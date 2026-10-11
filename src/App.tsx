import { useState, useRef } from 'react';
import { UserForm } from './components/Form/UserForm';
import { PhotoUpload } from './components/PhotoUpload/PhotoUpload';
import { PosterPreview } from './components/PosterPreview/PosterPreview';
import { ActionButtons } from './components/GenerateButton/ActionButtons';
import { StartingScreen } from './components/StartingScreen';
import type { UserData } from './types/poster';
import { generateVideo } from './canvas/videoRenderer';
import { generateImage } from './canvas/imageRenderer';

  const getInitialTemplate = (): 'video' | 'image' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode') || params.get('type');
      if (mode === 'image' || mode === 'photo' || mode === 'poster') return 'image';
      if (mode === 'video') return 'video';
    }
    return 'video';
  };

function App() {
  const [userData, setUserData] = useState<UserData>({
    fullName: '',
    phoneNumber: '',
    location: '',
    photoUrl: null,
    templateType: getInitialTemplate()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const lastSubmittedData = useRef<string | null>(null);

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1PBmNDZvbN3cQrx27gMfvFOFRnbP-wTGZIH7MAVAfuG1Qi2kQxKSsOudPdk2MUSHYlA/exec";

  const submitToGoogleSheets = async () => {
    if (!userData.fullName && !userData.phoneNumber && !userData.location) return;

    const currentDataStr = JSON.stringify({
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      hours: userData.hours || ''
    });

    if (lastSubmittedData.current === currentDataStr) return;
    
    lastSubmittedData.current = currentDataStr;

    try {
      fetch(GOOGLE_SCRIPT_URL, {
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

      if (userData.templateType === 'image') {
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

      const isImage = userData.templateType === 'image';
      let blob: Blob;
      let filename: string;
      let shareText: string;
      const baseAppUrl = "https://mahamounadhyanakumbposter.vercel.app";
      const imageGenUrl = `${baseAppUrl}/?mode=image`;
      const videoGenUrl = `${baseAppUrl}/?mode=video`;

      const campaignBody = `అందరికీ ఆత్మీయ ఆహ్వానం \n\n*తరలిరండి అరుణాచలం*\n\nA Movement of Mouna \n\nపత్రీజీ మహా అవతరణ దినోత్సవానికి మనం అందించే \n*బహుమానం - బహుమౌనం*\n\n*మహా మౌన ధ్యాన కుంభ్*\n(నవంబర్ 11 నుండి 15 వరకు)\n\n*రిజిస్ట్రేషన్ కొరకు:*\nhttps://gurusthanmeditation.org/visitregistration\n\nమరిన్ని వివరాలకు:\n9133016016\n9133015015\n9133014014\n\nమీ ఫోటోతో పోస్టర్ తయారు చేయడానికి:\n${imageGenUrl}\n\nమీ ఫోటోతో వీడియో తయారు చేయడానికి:\n${videoGenUrl}`;

      if (isImage) {
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
            <div className="inline-block px-4 py-1.5 rounded-full border border-[#ffca08]/50 bg-[#ffca08]/20 text-[#ffca08] font-bold text-sm tracking-widest mb-6 uppercase shadow-sm">
              A Movement of Mouna
            </div>
            <h1 className="font-['Noto_Sans_Telugu'] text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg tracking-wide">
              మహా మౌన <br />
              <span className="text-[#ffca08]">ధ్యాన కుంభ్</span>
            </h1>
            <p className="font-['Noto_Sans_Telugu'] text-xl md:text-2xl text-orange-100 font-light mb-8 max-w-2xl mx-auto lg:mx-0">
              తరలిరండి అరుణాచలం. <br/>
              <span className="font-sans text-lg opacity-80 mt-2 block">Upload a short video below to generate your personalized status video.</span>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
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
            <PhotoUpload userData={userData} setUserData={setUserData} />
            
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
            <PosterPreview userData={userData} setUserData={setUserData} />
            
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

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-6 text-left flex justify-start">
        <a href="#" className="font-['Poppins'] text-xs font-medium text-orange-200/40 hover:text-[#ffca08] transition-colors duration-300 tracking-wider uppercase">
          Developed by Sai Ram Lohith
        </a>
      </footer>
    </div>
  );
}

export default App;


