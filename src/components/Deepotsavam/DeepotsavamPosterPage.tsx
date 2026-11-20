import React, { useState, useRef, useEffect } from 'react';
import { DeepotsavamPreview, type DeepotsavamData } from '../PosterPreview/DeepotsavamPreview';
import { generateDeepotsavamImage, DEEPOTSAVAM_PHOTO_AREA } from '../../canvas/imageRenderer';
import { ImageCropper } from '../PhotoUpload/ImageCropper';
import type { CropArea } from '../../types/poster';

interface Props {
  onNavigateHome: () => void;
}

export const DeepotsavamPosterPage: React.FC<Props> = ({ onNavigateHome }) => {
  const [data, setData] = useState<DeepotsavamData>({
    fullName: '',
    phoneNumber: '',
    location: '',
    titlePrefix: 'శ్రీ',
    contributionFor: 'self',
    beneficiaryTitle: 'శ్రీమతి',
    beneficiaryName: '',
    categoryTitle: 'దీప దాత',
    deepamCount: '108 దీపాలు',
    displayFormat: 'name_location',
    photoUrl: null,
    rawMediaUrl: null,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle Photo File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('దయచేసి ఇమేజ్ ఫైల్ (JPEG, PNG, WebP) ఎంచుకోండి');
      return;
    }

    const url = URL.createObjectURL(file);
    setData((prev) => ({
      ...prev,
      rawMediaUrl: url,
      photoUrl: url,
    }));
    setIsCropperOpen(true);
    e.target.value = '';
  };

  // Camera start / stop / capture
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
      alert('కెమెరా అందుబాటులో లేదు. దయచేసి కెమెరా అనుమతులు ఇవ్వండి లేదా ఫోటోను అప్‌లోడ్ చేయండి.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
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
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setData((prev) => ({
              ...prev,
              rawMediaUrl: url,
              photoUrl: url,
            }));
            stopCamera();
            setIsCropperOpen(true);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleCropComplete = (cropped: { croppedUrl?: string; cropArea: CropArea; cropPixels: CropArea }) => {
    setData((prev) => ({
      ...prev,
      photoUrl: cropped.croppedUrl || prev.photoUrl,
      rawMediaUrl: prev.rawMediaUrl || cropped.croppedUrl || prev.photoUrl,
    }));
    setIsCropperOpen(false);
  };

  const handleRemovePhoto = () => {
    setData((prev) => ({
      ...prev,
      photoUrl: null,
      rawMediaUrl: null,
    }));
  };

  const handleResetForNextContributor = () => {
    setData({
      fullName: '',
      phoneNumber: '',
      location: data.location || '', // keep location handy if same town
      titlePrefix: 'శ్రీ',
      contributionFor: 'self',
      beneficiaryTitle: 'శ్రీమతి',
      beneficiaryName: '',
      categoryTitle: data.categoryTitle || 'దీప దాత',
      deepamCount: data.deepamCount || '108 దీపాలు',
      displayFormat: data.displayFormat || 'name_location',
      photoUrl: null,
      rawMediaUrl: null,
    });
    setDownloadSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('deepotsavam-name')?.focus();
    }, 150);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'deepotsavam');
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const isOther = data.contributionFor === 'other' && Boolean(data.beneficiaryName?.trim());
    const targetName = isOther ? data.beneficiaryName!.trim() : data.fullName.trim();
    if (!targetName) {
      alert('దయచేసి దాత పేరు నమోదు చేయండి (Please enter contributor name)');
      document.getElementById('deepotsavam-name')?.focus();
      return false;
    }
    return true;
  };

  // Download High-Resolution Flyer
  const handleDownload = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    try {
      const blob = await generateDeepotsavamImage(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const isOther = data.contributionFor === 'other' && data.beneficiaryName;
      const cleanName = (isOther ? data.beneficiaryName : data.fullName) || 'contributor';
      a.download = `mahadeepotsavam-${cleanName.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Download flyer error:', err);
      alert('ఫ్లైయర్ తయారు చేయడంలో సమస్య ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsGenerating(false);
    }
  };

  // WhatsApp Share
  const handleShare = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    try {
      const blob = await generateDeepotsavamImage(data);
      const isOther = data.contributionFor === 'other' && data.beneficiaryName;
      const targetName = (isOther ? data.beneficiaryName : data.fullName) || 'దాత';
      const locText = data.location ? `, ${data.location}` : '';

      const shareText = `🪔 *మహాదీపోత్సవ విశిష్ట దాత:* ${targetName}${locText}\n\nమహా మౌన ధ్యాన కుంభ్ - మహాదీపోత్సవంలో పాల్గొంటున్న విశిష్ట దాతలకు ప్రణామములు! 🙏\n\nమీరూ పాల్గొని మీ విశిష్ట ఫ్లైయర్ రూపొందించుకోండి:\n${window.location.origin}/?page=deepotsavam`;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `mahadeepotsavam-${targetName}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'మహాదీపోత్సవం విశిష్ట దాతల ఫ్లైయర్',
            text: shareText,
          });
          return;
        }
      }

      // Fallback: Download and open WhatsApp Web/App
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mahadeepotsavam-${targetName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Share flyer error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const titlesList = [
    { id: 'శ్రీ', label: 'శ్రీ (Sri)' },
    { id: 'శ్రీమతి', label: 'శ్రీమతి (Srimathi)' },
    { id: 'శ్రీ & శ్రీమతి', label: 'శ్రీ & శ్రీమతి (Sri & Smt)' },
    { id: 'కుమారి', label: 'కుమారి (Kumari)' },
    { id: 'డాక్టర్', label: 'డాక్టర్ (Dr.)' },
    { id: '', label: 'ఏదీ వద్దు (None)' },
  ];

  const categoryPresets = [
    '108 దీపాలు',
    '365 దీపాలు',
    '516 దీపాలు',
    '1,008 దీపాలు',
    '5,116 దీపాలు',
    'సహస్ర దీప దాత',
    'లక్ష దీప దాత',
    'దీప దాత',
    'మహాదీపోత్సవ దాత',
    'మహాదీపోత్సవ పోషకులు',
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 mb-20 animate-fadeIn">
      {/* Photo Cropper Modal */}
      {isCropperOpen && data.rawMediaUrl && (
        <ImageCropper
          mediaSrc={data.rawMediaUrl}
          aspectRatio={DEEPOTSAVAM_PHOTO_AREA.width / DEEPOTSAVAM_PHOTO_AREA.height} // 414 / 369 = 1.12195
          lang="te"
          onComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#240b03] rounded-3xl border-2 border-[#ffca08] overflow-hidden shadow-2xl p-4 flex flex-col items-center">
            <h3 className="text-base font-bold text-[#ffca08] mb-3">📸 దాత ఫోటో తీయండి</h3>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-3 bg-gradient-to-r from-[#ffca08] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-[#381609] font-black rounded-xl text-sm transition-all shadow-lg"
              >
                📸 ఫోటో తీయండి (Capture)
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="py-3 px-5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-sm"
              >
                రద్దు చేయండి
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Links Bar */}
      <div className="bg-gradient-to-r from-[#4a1c0b] via-[#381609] to-[#4a1c0b] p-4 sm:p-6 rounded-3xl border-2 border-[#ffca08]/40 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full bg-[#ffca08]/20 border border-[#ffca08]/50 text-[#ffca08] text-xs font-bold uppercase tracking-wider">
              🪔 మహాదీపోత్సవం ఫ్లైయర్ మేకర్
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              Instant Flyer Generator
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#ffca08] drop-shadow-md text-center md:text-left">
            మహాదీపోత్సవం విశిష్ట దాతల ఫ్లైయర్ (Contributors Flyer)
          </h1>
          <p className="text-xs sm:text-sm text-orange-200/80 mt-1 text-center md:text-left">
            దాత వివరాలు, ఊరు నమోదు చేసి, ఫోటో జతచేసి వెంటనే హై-రిజల్యూషన్ దివ్యమైన ఫ్లైయర్ డౌన్‌లోడ్ చేసుకోండి.
          </p>
        </div>

        {/* Copy Link & Back Home Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-[#240b03] hover:bg-[#8b3d0b] text-[#ffca08] border border-[#ffca08]/40 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
            title="Copy direct Deepotsavam flyer link to clipboard"
          >
            <span>{copiedLink ? '✅ లింక్ కాపీ అయింది!' : '📋 Copy Deepotsavam Link'}</span>
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

      {/* Main Grid: Form Controls (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* ==================================================== */}
        {/* LEFT COLUMN: CONTRIBUTOR DETAILS FORM                */}
        {/* ==================================================== */}
        <div className="flex flex-col gap-5">
          {/* Form Card */}
          <div className="bg-[#4a1c0b] p-5 sm:p-6 rounded-3xl shadow-xl border border-[#8b3d0b] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#8b3d0b]/80 pb-3">
              <h3 className="text-base font-bold text-[#ffca08] flex items-center gap-2">
                <span>👤</span>
                <span>1. దాత వివరాలు (Contributor Details)</span>
              </h3>
              <button
                type="button"
                onClick={handleResetForNextContributor}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                🔄 ఫారమ్ క్లియర్
              </button>
            </div>

            {/* Dedication Radio */}
            <div>
              <label className="block text-xs font-semibold text-orange-200/90 mb-1.5">
                ఈ ఫ్లైయర్ ఎవరి పేరున? (Poster Dedication):
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-orange-100 cursor-pointer">
                  <input
                    type="radio"
                    name="contributionFor"
                    checked={data.contributionFor !== 'other'}
                    onChange={() => setData((prev) => ({ ...prev, contributionFor: 'self' }))}
                    className="accent-[#ffca08] w-4 h-4 cursor-pointer"
                  />
                  <span>🙋 నా కోసం (Self)</span>
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm text-orange-100 cursor-pointer">
                  <input
                    type="radio"
                    name="contributionFor"
                    checked={data.contributionFor === 'other'}
                    onChange={() => setData((prev) => ({ ...prev, contributionFor: 'other' }))}
                    className="accent-[#ffca08] w-4 h-4 cursor-pointer"
                  />
                  <span>❤️ కుటుంబం / ఇతరుల పేరున (In the Name of Loved One)</span>
                </label>
              </div>
            </div>

            {/* Title & Name Input */}
            {data.contributionFor === 'other' ? (
              <div className="flex flex-col gap-2 p-3 bg-[#240b03]/60 rounded-xl border border-[#8b3d0b]/40">
                <label className="block text-xs font-semibold text-[#ffca08]">
                  ఎవరి పేరున సమర్పిస్తున్నారు? (Beneficiary Title & Name):
                </label>
                <div className="flex gap-2">
                  <select
                    value={data.beneficiaryTitle || 'శ్రీమతి'}
                    onChange={(e) => setData((prev) => ({ ...prev, beneficiaryTitle: e.target.value }))}
                    className="px-2.5 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-orange-100 font-bold text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  >
                    {titlesList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="deepotsavam-name"
                    type="text"
                    value={data.beneficiaryName || ''}
                    onChange={(e) => setData((prev) => ({ ...prev, beneficiaryName: e.target.value }))}
                    placeholder="ఉదా: సరస్వతి దేవి"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-semibold text-orange-200/90">
                  గౌరవ సంబోధన & దాత పేరు (Title & Full Name): <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={data.titlePrefix ?? 'శ్రీ'}
                    onChange={(e) => setData((prev) => ({ ...prev, titlePrefix: e.target.value }))}
                    className="px-2.5 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-orange-100 font-bold text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  >
                    {titlesList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="deepotsavam-name"
                    type="text"
                    value={data.fullName || ''}
                    onChange={(e) => setData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="ఉదా: రమేష్ కుమార్"
                    required
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
                  />
                </div>
              </div>
            )}

            {/* Location / City Input */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-orange-200/90">
                ప్రాంతం / ఊరు (Location / Town):
              </label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => setData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="ఉదా: హైదరాబాద్ / తిరువణ్ణామలై / బెంగళూరు"
                className="w-full px-3 py-2 rounded-xl bg-[#1c0802] border border-[#8b3d0b] text-white text-xs sm:text-sm focus:outline-none focus:border-[#ffca08]"
              />
            </div>

            {/* Display Format on Flyer */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="block text-xs font-semibold text-orange-200/90">
                ఫ్లైయర్‌పై పేరు ప్రదర్శించే విధానం (Display Format on Ribbon):
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, displayFormat: 'name_location' }))}
                  className={`py-2 px-2 rounded-xl font-bold transition-all text-center border ${
                    data.displayFormat === 'name_location'
                      ? 'bg-[#ffca08] text-[#381609] border-[#ffca08] shadow-sm'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:bg-[#8b3d0b]/40'
                  }`}
                >
                  పేరు & ఊరు
                </button>
                <button
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, displayFormat: 'name_only' }))}
                  className={`py-2 px-2 rounded-xl font-bold transition-all text-center border ${
                    data.displayFormat === 'name_only'
                      ? 'bg-[#ffca08] text-[#381609] border-[#ffca08] shadow-sm'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:bg-[#8b3d0b]/40'
                  }`}
                >
                  పేరు మాత్రమే
                </button>
                <button
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, displayFormat: 'two_lines' }))}
                  className={`py-2 px-2 rounded-xl font-bold transition-all text-center border ${
                    data.displayFormat === 'two_lines'
                      ? 'bg-[#ffca08] text-[#381609] border-[#ffca08] shadow-sm'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:bg-[#8b3d0b]/40'
                  }`}
                >
                  రెండు వరుసలలో
                </button>
              </div>
            </div>

            {/* Deepotsavam Category / Deepam Presets */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#8b3d0b]/60">
              <label className="block text-xs font-semibold text-orange-200/90">
                దీపోత్సవ సేవ / సంకల్పం (Deepotsavam Category Presets):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categoryPresets.map((preset) => {
                  const isSelected = data.deepamCount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, deepamCount: preset }))}
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
            </div>

            {/* Photo Selection Section */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#8b3d0b]/60">
              <label className="block text-xs sm:text-sm font-bold text-[#ffca08] uppercase tracking-wider mb-1">
                2. దాత ఫోటో (Upload / Capture Photo):
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {data.photoUrl ? (
                <div className="flex items-center gap-4 bg-[#240b03] p-3 rounded-2xl border border-[#8b3d0b]">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#ffca08]/60 flex-shrink-0 shadow-md">
                    <img src={data.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCropperOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#381609] hover:bg-[#ffca08] hover:text-[#381609] text-[#ffca08] text-xs font-bold border border-[#ffca08]/40 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>✂️ క్రాప్ సవరించండి</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#240b03] hover:bg-[#8b3d0b] text-orange-200 text-xs font-medium border border-[#8b3d0b] transition-colors"
                    >
                      🔄 మార్చండి
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-medium border border-rose-800/40 transition-colors"
                    >
                      ✕ తొలగించు
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-2xl bg-[#240b03] hover:bg-[#8b3d0b] border-2 border-dashed border-[#ffca08]/60 text-orange-100 flex flex-col items-center justify-center gap-1.5 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                    <span className="text-xs font-bold text-[#ffca08]">ఫోటో ఎంచుకోండి</span>
                    <span className="text-[10px] text-orange-200/70">గ్యాలరీ నుండి అప్‌లోడ్</span>
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-3.5 rounded-2xl bg-[#240b03] hover:bg-[#8b3d0b] border-2 border-dashed border-[#ffca08]/60 text-orange-100 flex flex-col items-center justify-center gap-1.5 transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
                    <span className="text-xs font-bold text-[#ffca08]">కెమెరాతో తీయండి</span>
                    <span className="text-[10px] text-orange-200/70">తక్షణమే కెమెరాతో ఫోటో</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Download Success Notice */}
          {downloadSuccess && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-[#180601] border-2 border-emerald-500 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold">
                <span>✅</span>
                <span>ఫ్లైయర్ విజయవంతంగా డౌన్‌లోడ్ అయింది!</span>
              </div>
              <button
                type="button"
                onClick={handleResetForNextContributor}
                className="py-1.5 px-3 rounded-lg bg-emerald-500 text-stone-950 font-black text-xs hover:bg-emerald-400 transition-all shadow-md flex items-center gap-1 shrink-0"
              >
                <span>➕ తర్వాతి దాత</span>
              </button>
            </div>
          )}

          {/* Action Buttons for Mobile */}
          <div className="flex flex-col gap-3 lg:hidden">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ffca08] via-amber-400 to-[#d97706] hover:from-[#ffd943] hover:to-amber-500 text-[#381609] font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isGenerating ? 'తయారవుతోంది...' : '📥 డౌన్‌లోడ్ ఫ్లైయర్ (Download Flyer)'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>📲 వాట్సాప్‌లో షేర్ చేయండి (Share)</span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: LIVE FLYER PREVIEW & ACTIONS           */}
        {/* ==================================================== */}
        <div className="flex flex-col items-center">
          <DeepotsavamPreview
            data={data}
            setData={setData}
            onEditCrop={() => setIsCropperOpen(true)}
          />

          {/* Action Buttons for Desktop */}
          <div className="w-full max-w-[440px] hidden lg:flex flex-col gap-3 mt-4">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ffca08] via-amber-400 to-[#d97706] hover:from-[#ffd943] hover:to-amber-500 text-[#381609] font-black text-base transition-all shadow-2xl flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#381609]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>హై-రిజల్యూషన్ ఫ్లైయర్ తయారవుతోంది...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">📥</span>
                  <span>డౌన్‌లోడ్ ఫ్లైయర్ (Download High-Res Flyer)</span>
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                disabled={isGenerating}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>📲 వాట్సాప్ షేర్ (Share)</span>
              </button>
              <button
                type="button"
                onClick={handleResetForNextContributor}
                className="py-3 px-4 rounded-xl bg-[#240b03] hover:bg-[#8b3d0b] text-[#ffca08] border border-[#ffca08]/40 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>➕ తర్వాతి దాత</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
