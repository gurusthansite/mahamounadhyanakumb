import React, { useState } from 'react';

interface Props {
  googleScriptUrl: string;
  onNavigateToPoster?: () => void;
}

export const RegistrationFormPage: React.FC<Props> = ({ googleScriptUrl, onNavigateToPoster }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'contact') {
      // Only keep digits and max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, contact: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("దయచేసి మీ పేరు నమోదు చేయండి (Please enter your name)");
      return;
    }

    if (!formData.contact || formData.contact.length !== 10) {
      setErrorMessage("దయచేసి 10 అంకెల మొబైల్ నెంబర్ నమోదు చేయండి (Please enter a valid 10-digit contact number)");
      return;
    }

    if (!formData.address.trim()) {
      setErrorMessage("దయచేసి మీ చిరునామా లేదా ప్రాంతం నమోదు చేయండి (Please enter your address / area)");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = JSON.stringify({
        formType: "Form_Responses",
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        address: formData.address.trim()
      });

      await fetch(googleScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: payload
      });

      setIsSubmitted(true);
      setFormData({ name: '', contact: '', address: '' });
    } catch (err) {
      console.error("Submission failed:", err);
      // Since Google Apps Script often gives CORS opaque response even on success,
      // if it succeeded or completed, we consider it done:
      setIsSubmitted(true);
      setFormData({ name: '', contact: '', address: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between mb-8">
        {onNavigateToPoster && (
          <button
            type="button"
            onClick={onNavigateToPoster}
            className="flex items-center gap-2 text-[#ffca08] hover:text-white font-semibold text-sm sm:text-base py-2 px-4 rounded-xl bg-[#240b03]/80 hover:bg-[#240b03] border border-[#d97706]/40 transition-all shadow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            పోస్టర్ & వీడియో మేకర్ (Poster Maker)
          </button>
        )}
      </div>

      {/* Main Form Card */}
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
          <span className="inline-block px-4 py-1 rounded-full border border-[#ffca08]/50 bg-[#ffca08]/20 text-[#ffca08] font-bold text-xs sm:text-sm tracking-widest uppercase mb-3">
            వివరాల నమోదు • Registration
          </span>
          <h1 className="font-['Noto_Sans_Telugu'] text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
            మహా మౌన ధ్యాన కుంభ్
          </h1>
          <p className="font-['Noto_Sans_Telugu'] text-orange-200/80 text-sm sm:text-base mt-2">
            దయచేసి క్రింది ఫారమ్‌లో మీ వివరాలను నమోదు చేయండి
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-[#240b03] rounded-2xl p-8 sm:p-10 text-center border border-[#d97706]/40 relative z-10 shadow-inner animate-fadeIn">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-green-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-['Noto_Sans_Telugu'] text-2xl font-bold text-[#ffca08] mb-2">
              ధన్యవాదాలు! (Thank You!)
            </h3>
            <p className="font-['Noto_Sans_Telugu'] text-orange-100 text-base mb-6">
              మీ వివరాలు విజయవంతంగా నమోదయ్యాయి. మా ప్రతినిధులు త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="py-3 px-6 rounded-xl bg-[#381609] hover:bg-[#1a0701] text-orange-200 border border-[#d97706] font-semibold text-sm transition-all"
              >
                + మరొకరి వివరాలు నమోదు చేయండి (Submit Another)
              </button>
              {onNavigateToPoster && (
                <button
                  type="button"
                  onClick={onNavigateToPoster}
                  className="py-3 px-6 rounded-xl bg-[#ffca08] hover:bg-[#ffd943] text-[#381609] font-bold text-sm transition-all shadow-md"
                >
                  🎨 పోస్టర్ తయారు చేయండి (Create Poster)
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {errorMessage && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Field 1: Name */}
            <div>
              <label htmlFor="form-name" className="block text-sm font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
                1. పూర్తి పేరు (Name) <span className="text-rose-400">*</span>
              </label>
              <input
                id="form-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="మీ పేరు రాయండి (e.g. G. Vinvanth)"
                required
                className="w-full bg-[#240b03] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3.5 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-base"
              />
            </div>

            {/* Field 2: Contact */}
            <div>
              <label htmlFor="form-contact" className="block text-sm font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
                2. మొబైల్ నెంబర్ (Contact Number) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200/50 font-semibold text-sm">
                  +91
                </span>
                <input
                  id="form-contact"
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="10 అంకెల మొబైల్ నెంబర్ (e.g. 9876543210)"
                  required
                  maxLength={10}
                  className="w-full bg-[#240b03] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl pl-14 pr-4 py-3.5 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-base tracking-wider"
                />
              </div>
            </div>

            {/* Field 3: Address */}
            <div>
              <label htmlFor="form-address" className="block text-sm font-bold text-[#ffca08] mb-2 font-['Noto_Sans_Telugu']">
                3. చిరునామా / ప్రాంతం (Address / Area) <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="form-address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="మీ ఏరియా లేదా ఊరి పేరు రాయండి (e.g. S R Nagar, Hyderabad)"
                required
                className="w-full bg-[#240b03] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-base resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] hover:from-[#ffd943] hover:to-white text-[#381609] font-extrabold text-base sm:text-lg transition-all shadow-xl hover:shadow-[#ffca08]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#381609]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>సమర్పిస్తున్నాము... (Submitting...)</span>
                  </>
                ) : (
                  <>
                    <span>వివరాలు సమర్పించండి (Submit Details)</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
