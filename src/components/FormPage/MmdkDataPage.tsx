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
  aadhar?: string;
  area?: string;
  noOfPersons?: string;
  dobMrd?: string;
  roomNo?: string;
  checkIn?: string;
  checkOut?: string;
  checkoutStatus?: string;
  timestamp?: string;
}

export const MmdkDataPage: React.FC<Props> = ({
  googleScriptUrl,
  title = 'MMDK Data Register',
  subtitle = 'మహా మౌన ధ్యాన కుంభ్ - సందర్శకుల వివరాల నమోదు & తనిఖీ',
}) => {
  // Form State
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [area, setArea] = useState('');
  const [noOfPersons, setNoOfPersons] = useState('1');
  const [dobMrd, setDobMrd] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('Checked In');

  // Visitors list & Cache
  const [allVisitors, setAllVisitors] = useState<MmdkRecord[]>([]);
  const [cachedRecords, setCachedRecords] = useState<Map<string, MmdkRecord>>(new Map());
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // UI status
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState<MmdkRecord | null>(null);
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

        const map = new Map<string, MmdkRecord>();
        records.forEach((rec) => {
          const clean = (rec.contact || '').toString().replace(/\D/g, '').slice(-10);
          if (clean) map.set(clean, rec);
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
      setExistingRecord(null);
    }
  };

  // Check if phone number already exists
  const checkPhoneExistence = async (phoneDigits: string) => {
    if (cachedRecords.has(phoneDigits)) {
      setExistingRecord(cachedRecords.get(phoneDigits) || null);
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
        setExistingRecord(result.data);
        setCachedRecords((prev) => new Map(prev).set(phoneDigits, result.data));
      } else {
        setExistingRecord(null);
      }
    } catch (err) {
      console.warn('Live phone check warning:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Reset form for next entry
  const handleResetForNextEntry = () => {
    setContact('');
    setName('');
    setAadhar('');
    setArea('');
    setNoOfPersons('1');
    setDobMrd('');
    setRoomNo('');
    setCheckIn(new Date().toISOString().split('T')[0]);
    setCheckOut('');
    setCheckoutStatus('Checked In');
    setExistingRecord(null);
    setIsSavedSuccess(false);
    setSavedRecordSummary(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      phoneInputRef.current?.focus();
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
      aadhar: aadhar.replace(/\D/g, '').trim(),
      area: area.trim(),
      noOfPersons: (noOfPersons || '1').toString().trim(),
      dobMrd: dobMrd.trim(),
      roomNo: roomNo.trim(),
      checkIn: checkIn.trim(),
      checkOut: checkOut.trim(),
      checkoutStatus: checkoutStatus.trim(),
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
            aadhar: newRecord.aadhar || '',
            area: newRecord.area,
            noOfPersons: newRecord.noOfPersons || '1',
            dobMrd: newRecord.dobMrd || '',
            roomNo: newRecord.roomNo || '',
            checkIn: newRecord.checkIn || '',
            checkOut: newRecord.checkOut || '',
            checkoutStatus: newRecord.checkoutStatus || 'Checked In',
            timestamp: nowStr,
          }),
        });
      }

      // Update local state and visitors list
      setCachedRecords((prev) => new Map(prev).set(contact.trim(), newRecord));
      setAllVisitors((prev) => [newRecord, ...prev]);
      setSavedRecordSummary(newRecord);
      setIsSavedSuccess(true);
      setExistingRecord(null);

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
      (v.area || '').toLowerCase().includes(q) ||
      (v.roomNo || '').toLowerCase().includes(q)
    );
  });

  const inputClass =
    'w-full bg-[#1c0802] border-2 border-[#8b3d0b] focus:border-[#ffca08] rounded-xl px-4 py-3 text-white placeholder-orange-200/30 focus:outline-none transition-all shadow-inner text-sm sm:text-base';

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
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
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-[#180601] border-2 border-emerald-500 shadow-2xl animate-fadeIn relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-black text-base sm:text-lg">
                  <span>✅ సందర్శకుని వివరాలు ఎక్సెల్‌లో నమోదయ్యాయి!</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                  పేరు: <strong className="text-white">{savedRecordSummary.name}</strong> | 
                  ఫోన్: <strong className="text-amber-300 font-mono">{savedRecordSummary.contact}</strong> | 
                  ప్రాంతం: <strong className="text-white">{savedRecordSummary.area}</strong> | 
                  రూమ్: <strong className="text-amber-300">{savedRecordSummary.roomNo || 'N/A'}</strong> | 
                  స్థితి: <strong className="text-emerald-400">{savedRecordSummary.checkoutStatus}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetForNextEntry}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>➕ తర్వాతి సందర్శకుని నమోదు</span>
                <span className="text-xs font-normal opacity-80">(Next Visitor)</span>
              </button>
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

        {/* Existing Visitor Alert Banner */}
        {existingRecord && (
          <div className="mb-6 p-5 bg-[#1c0802] rounded-2xl border-2 border-rose-500 relative z-10 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base sm:text-lg mb-3">
              <span className="text-xl">⚠️</span>
              <span>ఈ ఫోన్ నెంబర్ ఇప్పటికే ఎక్సెల్‌లో నమోదై ఉంది! (Already Registered)</span>
            </div>
            <div className="bg-[#240b03] p-3.5 rounded-xl border border-[#8b3d0b] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
              <p className="text-white"><strong className="text-[#ffca08]">Name:</strong> {existingRecord.name || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Phone:</strong> {existingRecord.contact || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Area:</strong> {existingRecord.area || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Room:</strong> {existingRecord.roomNo || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Persons:</strong> {existingRecord.noOfPersons || '1'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Status:</strong> {existingRecord.checkoutStatus || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Check In:</strong> {existingRecord.checkIn || '-'}</p>
              <p className="text-white"><strong className="text-[#ffca08]">Check Out:</strong> {existingRecord.checkOut || '-'}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleResetForNextEntry}
                className="py-1.5 px-4 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs"
              >
                కొత్త నెంబర్ నమోదు చేయండి (Clear & New)
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VISITOR ENTRY REGISTRATION FORM (Always Visible)      */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* 3. Area / City */}
            <div>
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

            {/* 4. Aadhar card */}
            <div>
              <label htmlFor="mmdk-aadhar" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                ఆధార్ కార్డ్ (Aadhar - <span className="text-orange-200/60 font-normal">ఐచ్ఛికం</span>)
              </label>
              <input
                id="mmdk-aadhar"
                type="text"
                maxLength={12}
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12 అంకెల ఆధార్ నెంబర్"
                className={`${inputClass} tracking-widest font-mono`}
              />
            </div>

            {/* 5. Number of Persons */}
            <div>
              <label htmlFor="mmdk-persons" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                వ్యక్తుల సంఖ్య (No. of persons)
              </label>
              <input
                id="mmdk-persons"
                type="number"
                min="1"
                value={noOfPersons}
                onChange={(e) => setNoOfPersons(e.target.value)}
                placeholder="1"
                className={inputClass}
              />
            </div>

            {/* 6. DOB / MRD */}
            <div>
              <label htmlFor="mmdk-dob-mrd" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                DOB / MRD
              </label>
              <input
                id="mmdk-dob-mrd"
                type="text"
                value={dobMrd}
                onChange={(e) => setDobMrd(e.target.value)}
                placeholder="DD/MM/YYYY or MRD"
                className={inputClass}
              />
            </div>

            {/* 7. Room Number */}
            <div>
              <label htmlFor="mmdk-room" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                రూమ్ నెం. (Room no.)
              </label>
              <input
                id="mmdk-room"
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="ఉదా: 108 / Hall-A"
                className={inputClass}
              />
            </div>

            {/* 8. Check in Date */}
            <div>
              <label htmlFor="mmdk-checkin" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                చెక్ ఇన్ తేదీ (Check in)
              </label>
              <input
                id="mmdk-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* 9. Check out Date */}
            <div>
              <label htmlFor="mmdk-checkout" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                చెక్ అవుట్ తేదీ (Check out)
              </label>
              <input
                id="mmdk-checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* 10. Checkout Status */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="mmdk-status" className="block text-xs font-bold text-[#ffca08] mb-1.5">
                చెక్-అవుట్ స్థితి (Checkout status)
              </label>
              <select
                id="mmdk-status"
                value={checkoutStatus}
                onChange={(e) => setCheckoutStatus(e.target.value)}
                className={inputClass}
              >
                <option value="Checked In">Checked In (హాజరయ్యారు)</option>
                <option value="Checked Out">Checked Out (నిష్క్రమించారు)</option>
                <option value="Reserved">Reserved (ముందస్తు బుకింగ్)</option>
                <option value="Pending">Pending (పెండింగ్)</option>
              </select>
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
                placeholder="పేరు / ఫోన్ / రూమ్ వెతకండి"
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
                    <th className="py-2.5 px-3">ప్రాంతం (Area)</th>
                    <th className="py-2.5 px-3">వ్యక్తులు</th>
                    <th className="py-2.5 px-3">రూమ్ నెం.</th>
                    <th className="py-2.5 px-3">స్థితి (Status)</th>
                    <th className="py-2.5 px-3">నమోదైన సమయం</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b3d0b]/40">
                  {filteredVisitors.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-[#180601]/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">{rec.name || '-'}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-300">{rec.contact || '-'}</td>
                      <td className="py-2.5 px-3 text-orange-200/90">{rec.area || '-'}</td>
                      <td className="py-2.5 px-3 text-center text-orange-200/90">{rec.noOfPersons || '1'}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">{rec.roomNo || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            rec.checkoutStatus === 'Checked Out'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                          }`}
                        >
                          {rec.checkoutStatus || 'Checked In'}
                        </span>
                      </td>
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
