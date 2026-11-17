import React, { useState, useRef, useEffect } from 'react';

interface Props {
  googleScriptUrl: string;
  title?: string;
  subtitle?: string;
  onNavigateToPoster?: () => void;
}

export interface MmdkRecord {
  name?: string;
  contact?: string;
  dob?: string;
  aadhar?: string;
  area?: string;
  timestamp?: string;
}

// Format date for clean display (handles Date objects or GMT strings)
const formatDobDisplay = (val?: string): string => {
  if (!val) return '-';
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (str.includes('GMT') || str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  return str;
};

export const MmdkDataPage: React.FC<Props> = ({
  googleScriptUrl,
  title = 'MMDK Data Register',
  subtitle = 'మహా మౌన ధ్యాన కుంభ్ - సందర్శకుల వివరాల నమోదు & తనిఖీ',
}) => {
  // Form State: Name, Phone No, DOB, Aadhar Card, Area
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [area, setArea] = useState('');

  // Visitors list & Cache
  const [allVisitors, setAllVisitors] = useState<MmdkRecord[]>([]);
  const [cachedRecords, setCachedRecords] = useState<Map<string, MmdkRecord[]>>(new Map());
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // UI status
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecords, setExistingRecords] = useState<MmdkRecord[]>([]);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [savedRecordSummary, setSavedRecordSummary] = useState<MmdkRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Load all visitors from Google Sheet
  const loadVisitors = async () => {
    if (!googleScriptUrl) return;
    setIsLoadingVisitors(true);
    try {
      const response = await fetch(`${googleScriptUrl}?action=get_all`);
      const json = await response.json();
      if (json.records && Array.isArray(json.records)) {
        const records: MmdkRecord[] = json.records;
        setAllVisitors(records);

        const map = new Map<string, MmdkRecord[]>();
        records.forEach((rec) => {
          const clean = (rec.contact || '').toString().replace(/\D/g, '').slice(-10);
          if (clean) {
            const list = map.get(clean) || [];
            list.push(rec);
            map.set(clean, list);
          }
        });
        setCachedRecords(map);
      }
    } catch (err) {
      console.warn('Failed to load visitors list:', err);
    } finally {
      setIsLoadingVisitors(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, [googleScriptUrl]);

  // Handle phone change & auto-check
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setContact(digits);
    setErrorMessage(null);
    setIsSavedSuccess(false);

    if (digits.length === 10) {
      checkPhoneExistence(digits);
    } else {
      setExistingRecords([]);
    }
  };

  // Handle DOB auto-segregation with '/' slashes (e.g. 15081995 -> 15/08/1995)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Handle backspacing smoothly when ending with '/'
    const rawVal = val.length < dob.length && val.endsWith('/') 
      ? val.slice(0, -1) 
      : val;

    const digits = rawVal.replace(/\D/g, '').slice(0, 8); // max 8 digits DDMMYYYY
    if (!digits) {
      setDob('');
      return;
    }

    let formatted = digits.slice(0, 2);
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }

    setDob(formatted);
  };

  // Check if phone number already exists
  const checkPhoneExistence = async (phoneDigits: string) => {
    if (cachedRecords.has(phoneDigits)) {
      setExistingRecords(cachedRecords.get(phoneDigits) || []);
      return;
    }

    if (!googleScriptUrl) return;

    setIsChecking(true);
    try {
      const response = await fetch(googleScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'check',
          contact: phoneDigits,
        }),
      });
      const result = await response.json();
      if (result.status === 'exists' && result.data) {
        const list: MmdkRecord[] = Array.isArray(result.data) ? result.data : [result.data];
        setExistingRecords(list);
        setCachedRecords((prev) => new Map(prev).set(phoneDigits, list));
      } else {
        setExistingRecords([]);
      }
    } catch (err) {
      console.warn('Live phone check warning:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Reset form for next entry (clears all)
  const handleResetForNextEntry = () => {
    setContact('');
    setName('');
    setDob('');
    setAadhar('');
    setArea('');
    setExistingRecords([]);
    setIsSavedSuccess(false);
    setSavedRecordSummary(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 150);
  };

  // Reset for adding another member with the SAME phone number
  const handleAddFamilyMemberSamePhone = () => {
    const keepPhone = contact || savedRecordSummary?.contact || '';
    const keepArea = area || savedRecordSummary?.area || '';
    setName('');
    setDob('');
    setAadhar('');
    setArea(keepArea);
    setIsSavedSuccess(false);
    setSavedRecordSummary(null);
    setErrorMessage(null);
    if (keepPhone) {
      checkPhoneExistence(keepPhone);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('mmdk-name')?.focus();
    }, 150);
  };

  // Submit visitor entry to Google Sheet
  const handleSaveToSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contact || contact.length !== 10) {
      setErrorMessage('దయచేసి సరైన 10 అంకెల మొబైల్ నెంబర్ నమోదు చేయండి (Please enter valid 10-digit Phone No.)');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('దయచేసి సందర్శకుని పేరు నమోదు చేయండి (Please enter Visitor Name)');
      return;
    }

    if (aadhar.trim()) {
      const cleanAadhar = aadhar.replace(/\D/g, '');
      if (cleanAadhar.length !== 12) {
        setErrorMessage('దయచేసి 12 అంకెల ఆధార్ నెంబర్ నమోదు చేయండి లేదా ఖాళీగా ఉంచండి (Please enter valid 12-digit Aadhar or leave empty)');
        return;
      }
    }

    if (!area.trim()) {
      setErrorMessage('దయచేసి ప్రాంతం / ఊరు నమోదు చేయండి (Please enter Area / City)');
      return;
    }

    setIsSubmitting(true);

    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const newRecord: MmdkRecord = {
      name: name.trim(),
      contact: contact.trim(),
      dob: dob.trim(),
      aadhar: aadhar.replace(/\D/g, '').trim(),
      area: area.trim(),
      timestamp: nowStr,
    };

    try {
      if (googleScriptUrl) {
        await fetch(googleScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'submit',
            name: newRecord.name,
            contact: newRecord.contact,
            dob: newRecord.dob || '',
            aadhar: newRecord.aadhar || '',
            area: newRecord.area,
            timestamp: nowStr,
          }),
        });
      }

      // Update local state and visitors list (keeps all records for this phone number)
      setCachedRecords((prev) => {
        const next = new Map(prev);
        const currentList = next.get(contact.trim()) || [];
        next.set(contact.trim(), [newRecord, ...currentList]);
        return next;
      });
      setAllVisitors((prev) => [newRecord, ...prev]);
      setSavedRecordSummary(newRecord);
      setIsSavedSuccess(true);
      setExistingRecords([]);

      // Scroll to top to see confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage('నమోదు చేయడంలో సమస్య తలెత్తింది. దయచేసి మళ్లీ ప్రయత్నించండి (Submission failed).');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter visitors for the log table
  const filteredVisitors = allVisitors.filter((v) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(q) ||
      (v.contact || '').includes(q) ||
      (v.dob || '').includes(q) ||
      (v.area || '').toLowerCase().includes(q) ||
      (v.aadhar || '').includes(q)
    );
  });

  const inputClass =
    'w-full bg-[#1c0802] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-sm sm:text-base';

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="bg-[#4a1c0b] rounded-3xl p-5 sm:p-8 shadow-2xl border-2 border-[#8b3d0b] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffca08] opacity-10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d97706] opacity-10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="flex justify-center mb-3">
            <img
              src="/assets/logo.png"
              alt="Gurusthan Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_20px_rgba(255,202,8,0.4)]"
            />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full border border-[#ffca08]/50 bg-[#ffca08]/20 text-[#ffca08] font-bold text-xs sm:text-sm tracking-widest uppercase mb-2 shadow-sm">
            MMDK డేటా ఎంట్రీ • Direct Excel Register
          </span>
          <h1 className="font-['Poppins',sans-serif] text-xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-md tracking-wide">
            {title}
          </h1>
          <p className="font-['Noto_Sans_Telugu'] text-orange-200/80 text-xs sm:text-sm mt-1.5">
            {subtitle}
          </p>
        </div>

        {/* Success Alert Banner */}
        {isSavedSuccess && savedRecordSummary && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#180601] to-emerald-950/80 border-2 border-emerald-500 shadow-2xl animate-fadeIn relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-black text-base sm:text-lg">
                  <span>✅ సందర్శకుని వివరాలు ఎక్సెల్‌లో నమోదయ్యాయి!</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                  పేరు: <strong className="text-white">{savedRecordSummary.name}</strong> | 
                  ఫోన్: <strong className="text-amber-300 font-mono">{savedRecordSummary.contact}</strong>
                  {savedRecordSummary.dob && (
                    <> | పుట్టిన తేదీ: <strong className="text-amber-300 font-mono">{savedRecordSummary.dob}</strong></>
                  )} | 
                  ప్రాంతం: <strong className="text-white">{savedRecordSummary.area}</strong>
                  {savedRecordSummary.aadhar && (
                    <> | ఆధార్: <strong className="text-amber-300 font-mono">{savedRecordSummary.aadhar}</strong></>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleAddFamilyMemberSamePhone}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 transform active:scale-98"
                >
                  <span>👥 ఇదే నెంబర్‌తో కుటుంబ సభ్యుని నమోదు</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForNextEntry}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 transform active:scale-98"
                >
                  <span>➕ కొత్త నెంబర్ నమోదు</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-950/90 border border-rose-500/60 rounded-xl text-rose-200 text-sm font-medium flex items-center gap-2 relative z-10 shadow-md">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Existing Visitor Info Banner (Supports Repeated Phone Numbers / Family Members) */}
        {existingRecords.length > 0 && (
          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-[#2a1306] via-[#1c0802] to-[#2a1306] rounded-2xl border-2 border-amber-500/80 relative z-10 shadow-xl animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                <span className="text-xl">👥</span>
                <span>
                  ఈ ఫోన్ నెంబర్‌తో ఇప్పటికే <strong>{existingRecords.length}</strong> నమోదు(లు) ఉన్నాయి
                </span>
                <span className="text-xs text-orange-200/80">({contact})</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                ✓ ఇంకొకరిని నమోదు చేయవచ్చు (Add Another Member)
              </span>
            </div>

            {/* List of members with this number */}
            <div className="space-y-2 mb-3">
              {existingRecords.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#240b03] p-2.5 sm:p-3 rounded-xl border border-[#8b3d0b] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[#ffca08] font-mono font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-white font-bold">{item.name || '-'}</span>
                    {item.dob && (
                      <span className="text-orange-200/80">
                        పుట్టిన తేదీ: <strong className="text-amber-300 font-mono">{formatDobDisplay(item.dob)}</strong>
                      </span>
                    )}
                    {item.area && (
                      <span className="text-orange-200/80">
                        ఊరు: <strong className="text-white">{item.area}</strong>
                      </span>
                    )}
                    {item.aadhar && (
                      <span className="text-orange-200/70 font-mono text-xs">
                        ఆధార్: {item.aadhar}
                      </span>
                    )}
                  </div>
                  {item.area && area !== item.area && (
                    <button
                      type="button"
                      onClick={() => setArea(item.area || '')}
                      className="py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>📍 ఇదే ఊరు ({item.area})</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-amber-200/80">
              💡 కుటుంబ సభ్యుల కోసం క్రింద వారి <strong>పేరు, పుట్టిన తేదీ, ఆధార్</strong> నమోదు చేసి నేరుగా సేవ్ చేయండి.
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* VISITOR ENTRY REGISTRATION FORM                      */}
        {/* ==================================================== */}
        <form onSubmit={handleSaveToSheet} className="bg-[#240b03] rounded-3xl p-5 sm:p-7 border-2 border-[#8b3d0b] relative z-10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#8b3d0b]/80 pb-3">
            <h2 className="text-base sm:text-lg font-black text-[#ffca08] flex items-center gap-2">
              <span>📝 సందర్శకుల వివరాల నమోదు (Visitor Entry Form)</span>
            </h2>
            <button
              type="button"
              onClick={handleResetForNextEntry}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              🔄 ఫారమ్ క్లియర్ చేయండి
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mmdk-phone" className="block text-xs font-bold text-[#ffca08]">
                  ఫోన్ నెంబర్ (Phone No.) <span className="text-rose-400">*</span>
                </label>
                {isChecking && <span className="text-[11px] text-amber-300 animate-pulse">తనిఖీ అవుతోంది...</span>}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-200/50 font-semibold text-xs">
                  +91
                </span>
                <input
                  id="mmdk-phone"
                  ref={phoneInputRef}
                  type="tel"
                  value={contact}
                  onChange={handlePhoneChange}
                  placeholder="10 అంకెల మొబైల్ నెంబర్"
                  maxLength={10}
                  required
                  className={`${inputClass} pl-12 font-mono font-bold tracking-wider`}
                />
              </div>
            </div>

            {/* 2. Full Name */}
            <div>
              <label htmlFor="mmdk-name" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                పేరు (Full Name) <span className="text-rose-400">*</span>
              </label>
              <input
                id="mmdk-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ఉదా: వెంకటేశ్వర రావు"
                required
                className={inputClass}
              />
            </div>

            {/* 3. Date of Birth (DOB - with auto / slashes) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mmdk-dob" className="block text-xs font-bold text-[#ffca08]">
                  పుట్టిన తేదీ (Date of Birth)
                </label>
                <span className="text-[10px] text-amber-300/80 font-mono">
                  ఆటోమేటిక్ / (Auto Format)
                </span>
              </div>
              <input
                id="mmdk-dob"
                type="text"
                value={dob}
                onChange={handleDobChange}
                placeholder="DD/MM/YYYY (ఉదా: 15/08/1995)"
                maxLength={10}
                className={`${inputClass} tracking-wider font-mono`}
              />
              <p className="text-[10px] text-orange-200/60 mt-1">
                ℹ️ కేవలం అంకెలు కొట్టండి (ఉదా: 15081995), ఆటోమేటిక్‌గా / వస్తుంది.
              </p>
            </div>

            {/* 4. Aadhar card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="mmdk-aadhar" className="block text-xs font-bold text-[#ffca08]">
                  ఆధార్ కార్డ్ (Aadhar Card)
                </label>
                <span className="text-[11px] text-orange-200/60 italic">(ఐచ్ఛికం • Optional)</span>
              </div>
              <input
                id="mmdk-aadhar"
                type="text"
                maxLength={12}
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12 అంకెల ఆధార్ నెంబర్"
                className={`${inputClass} tracking-widest font-mono`}
              />
              <p className="text-[10px] text-orange-200/60 mt-1">
                ℹ️ ఐచ్ఛికం • రికార్డుల కొరకు 12 అంకెల సంఖ్య నమోదు చేయవచ్చు.
              </p>
            </div>

            {/* 5. Area / City */}
            <div className="sm:col-span-2">
              <label htmlFor="mmdk-area" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                ప్రాంతం / నగరం (Area / City) <span className="text-rose-400">*</span>
              </label>
              <input
                id="mmdk-area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="ఉదా: హైదరాబాద్ / తిరువణ్ణామలై"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ffca08] via-amber-400 to-[#d97706] hover:from-[#ffd943] hover:to-amber-500 text-[#381609] font-black text-base sm:text-lg transition-all shadow-xl flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#381609]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>ఎక్సెల్‌లో నమోదు అవుతోంది...</span>
                </>
              ) : (
                <>
                  <span>💾 ఎక్సెల్‌లో నమోదు చేయండి (Save Visitor to Sheet)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ==================================================== */}
        {/* REGISTERED VISITORS LOG TABLE (Recent Entries)       */}
        {/* ==================================================== */}
        <div className="mt-8 bg-[#240b03] rounded-3xl p-5 sm:p-7 border border-[#8b3d0b] relative z-10 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#8b3d0b]/60 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <span>📋 నమోదైన సందర్శకుల జాబితా (Visitors Log)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                  {allVisitors.length} మంది
                </span>
              </h3>
              <p className="text-xs text-orange-200/70 mt-0.5">
                ఎక్సెల్‌లో నమోదైన సందర్శకుల తాజా వివరాలు
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="పేరు / ఫోన్ / ఊరు వెతకండి"
                className="px-3 py-1.5 bg-[#180601] border border-amber-500/40 rounded-xl text-xs text-white placeholder-orange-300/40 focus:outline-none w-44 sm:w-56"
              />
              <button
                type="button"
                onClick={loadVisitors}
                disabled={isLoadingVisitors}
                title="రీఫ్రెష్ చేయండి"
                className="p-2 bg-[#180601] hover:bg-[#310f04] border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isLoadingVisitors ? '...' : '🔄'}
              </button>
            </div>
          </div>

          {filteredVisitors.length === 0 ? (
            <div className="text-center py-8 text-orange-200/60 text-xs sm:text-sm">
              {isLoadingVisitors
                ? 'ఎక్సెల్ నుండి వివరాలు లోడ్ అవుతున్నాయి...'
                : 'ఇంకా ఎటువంటి సందర్శకుల వివరాలు నమోదు కాలేదు లేదా ఫిల్టర్ మ్యాచ్ కాలేదు.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#8b3d0b] text-amber-400 font-bold bg-[#180601]/80">
                    <th className="py-2.5 px-3">పేరు (Name)</th>
                    <th className="py-2.5 px-3">ఫోన్ (Phone)</th>
                    <th className="py-2.5 px-3">పుట్టిన తేదీ (DOB)</th>
                    <th className="py-2.5 px-3">ఆధార్ కార్డ్ (Aadhar)</th>
                    <th className="py-2.5 px-3">ప్రాంతం (Area)</th>
                    <th className="py-2.5 px-3">నమోదైన సమయం</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b3d0b]/40">
                  {filteredVisitors.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-[#180601]/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">{rec.name || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">{rec.contact || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-orange-200/90">{formatDobDisplay(rec.dob)}</td>
                      <td className="py-2.5 px-3 font-mono text-orange-200/90">{rec.aadhar || '-'}</td>
                      <td className="py-2.5 px-3 text-orange-200/90">{rec.area || '-'}</td>
                      <td className="py-2.5 px-3 text-orange-200/60 text-xs">{rec.timestamp || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
