import React, { useRef, useState, useEffect } from 'react';
import type { UserData } from '../../types/poster';
import { ANNAPRASADAM_PAYMENTS_SHEET_URL } from '../../config/sheets';
import { getPoshakuluTitle } from '../../canvas/coordinates';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  onViewReceipt?: () => void;
  onOpenCropper?: () => void;
}

export const AnnaprasadamForm: React.FC<Props> = ({ 
  userData, 
  setUserData, 
  onViewReceipt,
  onOpenCropper 
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [plateLockStatus, setPlateLockStatus] = useState<'available' | 'reserved' | 'locked' | 'checking'>('checking');
  const [plateLockMessage, setPlateLockMessage] = useState<string>('');

  // Camera state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Initialize or fetch default assigned plate number on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchPlateStatus = async () => {
      try {
        setPlateLockStatus('checking');
        const plate = userData.plateNumber || '';
        const url = plate 
          ? `/api/plateLock?action=status&plateNumber=${encodeURIComponent(plate)}`
          : `/api/plateLock?action=status`;

        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          if (!isCancelled) {
            if (!userData.plateNumber && data.nextSuggestedPlate) {
              setUserData(prev => ({
                ...prev,
                plateNumber: data.nextSuggestedPlate
              }));
              setPlateLockStatus('available');
              setPlateLockMessage(`కేటాయించిన ప్లేట్: ${data.nextSuggestedPlate}`);
            } else if (data.status === 'LOCKED') {
              setPlateLockStatus('locked');
              setPlateLockMessage('🔒 శాశ్వతంగా లాక్ చేయబడింది (Permanently Locked)');
            } else if (data.status === 'PENDING') {
              setPlateLockStatus('reserved');
              setPlateLockMessage('⏳ రిజర్వ్ చేయబడింది (Reserved for Ongoing Payment)');
            } else {
              setPlateLockStatus('available');
              setPlateLockMessage('✓ అందుబాటులో ఉంది (Available & Ready)');
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          // Fallback default plate if API is unreachable
          if (!userData.plateNumber) {
            setUserData(prev => ({ ...prev, plateNumber: 'PL-108' }));
          }
          setPlateLockStatus('available');
          setPlateLockMessage('✓ సిద్ధంగా ఉంది');
        }
      }
    };

    fetchPlateStatus();
    return () => {
      isCancelled = true;
    };
  }, [userData.plateNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Date of Birth validation
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserData(prev => ({ ...prev, dob: val }));

    if (!val) {
      setDobError('దయచేసి పుట్టిన తేదీ నమోదు చేయండి (Date of Birth is required)');
      return;
    }
    const dateObj = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(dateObj.getTime())) {
      setDobError('దయచేసి సరైన తేదీ నమోదు చేయండి (Invalid date format)');
    } else if (dateObj > today) {
      setDobError('భవిష్యత్తు తేదీని నమోదు చేయకూడదు (Date cannot be in the future)');
    } else if (dateObj.getFullYear() < 1900) {
      setDobError('దయచేసి సరైన సంవత్సరం నమోదు చేయండి (Year must be after 1900)');
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
      alert("దయచేసి దాత పూర్తి పేరు నమోదు చేయండి (Please enter donor's full name)");
      return;
    }

    if (!userData.dob) {
      setDobError('దయచేసి పుట్టిన తేదీ నమోదు చేయండి (Date of Birth is required for official receipt)');
      alert("దయచేసి మీ పుట్టిన తేదీని నమోదు చేయండి (Please enter Date of Birth)");
      return;
    }

    if (dobError) {
      alert("దయచేసి సరైన పుట్టిన తేదీని నమోదు చేయండి (Please provide a valid Date of Birth)");
      return;
    }

    const platesNum = parseInt(userData.plates || '0', 10);
    if (!platesNum || platesNum <= 0) {
      alert("దయచేసి ఎన్ని ప్లేట్లో నమోదు చేయండి (Please enter plate count)");
      return;
    }

    const assignedPlate = (userData.plateNumber || 'PL-108').trim().toUpperCase();
    const amountInRupees = platesNum * 1;
    const cleanPhone = (userData.phoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!(window as any).Razorpay) {
      alert("Razorpay payment gateway is loading, please try again in a moment.");
      return;
    }

    setIsPaying(true);

    // 1. ACQUIRE SECURE PLATE LOCK BEFORE INITIATING PAYMENT
    let lockToken = userData.plateLockToken || '';
    try {
      const lockResp = await fetch('/api/plateLock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'lock',
          plateNumber: assignedPlate,
          lockToken: lockToken,
          donorName: `${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}`.trim(),
          phoneNumber: cleanPhone || '',
          plates: platesNum,
          amount: amountInRupees
        })
      });

      const lockData = await lockResp.json();
      if (!lockResp.ok || !lockData.success) {
        setIsPaying(false);
        alert(lockData.error || 'ఈ ప్లేట్ నంబర్ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి వేరొక నంబర్ ఎంచుకోండి. (Plate number unavailable)');
        return;
      }

      lockToken = lockData.lockToken;
      setUserData(prev => ({
        ...prev,
        plateNumber: assignedPlate,
        plateLockToken: lockToken
      }));
      setPlateLockStatus('reserved');
      setPlateLockMessage('⏳ పేమెంట్ కొరకు 15 నిమిషాలు రిజర్వ్ చేయబడింది');
    } catch (err) {
      console.warn('Backend plate lock warning:', err);
    }

    // 2. SYNC LEAD TO GOOGLE SHEET (Form_Registrations)
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
        plateNumber: assignedPlate,
        amount: amountInRupees,
        status: "PENDING",
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      })
    }).catch(err => console.warn('Form sync warning:', err));

    // 3. INITIATE PAYMENT ORDER
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
          // 4. VERIFY PAYMENT AND PERMANENTLY LOCK PLATE NUMBER
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
                plateNumber: assignedPlate,
                lockToken: lockToken,
                plates: platesNum
              })
            });
          } catch (err) {
            console.warn('Verification report warning:', err);
          }

          // Mark plate as permanently locked
          setPlateLockStatus('locked');
          setPlateLockMessage('🔒 శాశ్వతంగా లాక్ చేయబడింది (Permanently Locked)');

          const now = new Date();
          const dayStr = String(now.getDate()).padStart(2, '0');
          const monthStr = String(now.getMonth() + 1).padStart(2, '0');
          const receiptNo = `MK-${dayStr}${monthStr}-${(response.razorpay_payment_id || '108').slice(-4).toUpperCase()}`;

          // Update state to permanently mark payment and plate as locked
          setUserData(prev => ({
            ...prev,
            isPaid: true,
            isPlateLocked: true,
            plateNumber: assignedPlate,
            paymentId: response.razorpay_payment_id,
            receiptNo: receiptNo
          }));

          // Send payment record to Google Sheet / Excel with Permanent Lock Status
          const paymentRecord = {
            action: "annaprasadam_payment",
            receiptNo: receiptNo,
            donorName: `${userData.titlePrefix ? userData.titlePrefix + ' ' : ''}${userData.fullName}`.trim(),
            dob: userData.dob || '',
            phoneNumber: cleanPhone || '',
            location: userData.location || '',
            plates: platesNum,
            plateNumber: assignedPlate,
            amount: amountInRupees,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || data.razorpayOptions.our_order_id || '',
            status: "SUCCESS",
            sevaType: "Annaprasadam Seva - Arunachalam",
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

          alert(`చెల్లింపు విజయవంతమైంది! (Payment Successful)\nప్లేట్ నంబర్: ${assignedPlate} (శాశ్వతంగా లాక్ చేయబడింది)\nPayment ID: ${response.razorpay_payment_id}\n\nమీ అధికారిక విరాళ రశీదు సిద్ధమైంది!`);
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed by user, releasing temporary lock...");
            // Safely release pending lock on dismiss
            fetch('/api/plateLock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'release',
                plateNumber: assignedPlate,
                lockToken: lockToken
              })
            }).catch(e => console.warn('Could not release lock:', e));
            setPlateLockStatus('available');
            setPlateLockMessage('✓ అందుబాటులో ఉంది (Available)');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (paymentResp: any) {
        console.error("Razorpay Payment Failed:", paymentResp.error);
        const errDesc = paymentResp.error?.description || paymentResp.error?.reason || 'Payment was not completed';
        // Safely release lock on failure
        fetch('/api/plateLock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'release',
            plateNumber: assignedPlate,
            lockToken: lockToken
          })
        }).catch(e => console.warn('Could not release lock:', e));
        setPlateLockStatus('available');
        setPlateLockMessage('✓ అందుబాటులో ఉంది (Available)');
        alert(`Payment Notice: ${errDesc}`);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      // Safely release lock on error
      fetch('/api/plateLock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release',
          plateNumber: assignedPlate,
          lockToken: lockToken
        })
      }).catch(e => console.warn('Could not release lock:', e));
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#ffca08] font-['Noto_Sans_Telugu']">
            అన్నప్రసాద వితరణ వివరాలు
          </h2>
          <p className="text-xs sm:text-sm text-orange-200/70">
            Fill in the details to sponsor Annaprasadam Seva at Arunachalam
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Donor Name with Title Selector */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            1. గౌరవ సంబోధన & దాత పేరు (Title & Full Name) <span className="text-rose-400">*</span>
          </label>
          
          <div className="flex gap-2 mb-2.5">
            {[
              { id: 'శ్రీ', label: 'శ్రీ (Sri)' },
              { id: 'శ్రీమతి', label: 'శ్రీమతి (Srimathi)' },
              { id: 'శ్రీ / శ్రీమతి', label: 'శ్రీ / శ్రీమతి' }
            ].map(opt => {
              const isSelected = (userData.titlePrefix || 'శ్రీ') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setUserData(prev => ({ ...prev, titlePrefix: opt.id }))}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] border-[#ffca08] shadow-md scale-[1.02]'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:border-[#ffca08]/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ffca08] font-bold text-base select-none pointer-events-none">
              {userData.titlePrefix || 'శ్రీ'}
            </span>
            <input
              type="text"
              name="fullName"
              value={userData.fullName}
              onChange={handleChange}
              style={{ paddingLeft: `${(userData.titlePrefix || 'శ్రీ').length * 15 + 24}px` }}
              className="w-full pr-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50"
              placeholder="పేరు రాయండి (e.g. రమేష్ బాబు)"
              required
            />
          </div>
        </div>

        {/* 2. Date of Birth (D.O.B) Field */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            2. జన్మదినం (Date of Birth / D.O.B) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              name="dob"
              max={new Date().toISOString().split('T')[0]}
              value={userData.dob || ''}
              onChange={handleDobChange}
              className={`w-full px-4 py-3 bg-[#240b03] border ${
                dobError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#8b3d0b]'
              } text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all`}
              required
            />
          </div>
          {dobError ? (
            <p className="text-xs text-rose-400 mt-1 font-medium">{dobError}</p>
          ) : (
            <p className="text-[11px] text-orange-200/60 mt-1">
              * ఈ జన్మదిన వివరాలు మీ అధికారిక విరాళ రశీదుపై నమోదు చేయబడతాయి.
            </p>
          )}
        </div>

        {/* 3. Plates Count & Real-time ₹1 Calculation */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            3. ఎన్ని ప్లేట్స్ అన్నప్రసాదం? (Number of Plates) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            name="plates"
            value={userData.plates || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50 font-bold text-lg text-[#ffca08]"
            placeholder="1 ప్లేట్ = ₹1 (ఉదా: 10, 20, 50, 100)"
            required
          />

          {/* Quick preset plate count buttons */}
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {[
              { count: '10', label: '10 (₹10)' },
              { count: '20', label: '20 (₹20)' },
              { count: '50', label: '50 (₹50)' },
              { count: '100', label: '100 (₹100)' },
              { count: '200', label: '200 (₹200)' }
            ].map(opt => {
              const isSelected = userData.plates === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setUserData(prev => ({ ...prev, plates: opt.count }))}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] border-[#ffca08] shadow-md scale-[1.02]'
                      : 'bg-[#240b03] text-orange-200 border-[#8b3d0b] hover:border-[#ffca08]/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Calculation Badge with Poshakulu Tier */}
          {parseInt(userData.plates || '0', 10) > 0 && (
            <div className="mt-2 text-xs text-[#ffca08] font-semibold flex items-center justify-between px-3 py-2 bg-[#240b03] rounded-lg border border-[#8b3d0b]">
              <div className="flex flex-col gap-0.5">
                <span>1 ప్లేట్ = ₹1 • {parseInt(userData.plates || '0', 10)} ప్లేట్లు</span>
                <span className="text-emerald-400 font-bold">
                  శ్రేణి: {getPoshakuluTitle(parseInt(userData.plates || '0', 10))}
                </span>
              </div>
              <span className="font-bold font-mono text-base text-[#ffca08]">
                ₹{(parseInt(userData.plates || '0', 10) * 1).toLocaleString('en-IN')}/-
              </span>
            </div>
          )}
        </div>

        {/* 4. Assigned Plate Number & Backend Locking System */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-orange-100 font-['Noto_Sans_Telugu']">
              4. కేటాయించిన ప్లేట్ నంబర్ (Assigned Plate Number)
            </label>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              userData.isPaid || userData.isPlateLocked
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : plateLockStatus === 'reserved'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
            }`}>
              {userData.isPaid || userData.isPlateLocked ? '🔒 శాశ్వతంగా లాక్ చేయబడింది' : plateLockMessage || '✓ అందుబాటులో ఉంది'}
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              name="plateNumber"
              disabled={Boolean(userData.isPaid || userData.isPlateLocked)}
              value={userData.plateNumber || 'PL-108'}
              onChange={(e) => {
                if (userData.isPaid || userData.isPlateLocked) return;
                setUserData(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }));
              }}
              className={`w-full px-4 py-3 bg-[#240b03] border ${
                userData.isPaid || userData.isPlateLocked
                  ? 'border-emerald-500/70 text-emerald-400 cursor-not-allowed bg-[#180601]'
                  : 'border-[#8b3d0b] text-white focus:border-[#ffca08]'
              } font-mono font-bold text-base rounded-xl outline-none transition-all`}
              placeholder="ఉదా: PL-108"
            />
          </div>

          <p className="text-[11px] text-orange-200/60 mt-1">
            {userData.isPaid || userData.isPlateLocked
              ? '✓ విజయవంతమైన చెల్లింపు తర్వాత ఈ ప్లేట్ నంబర్ మీ పేరున శాశ్వతంగా లాక్ చేయబడింది (మార్చలేరు).'
              : '🔒 పేమెంట్ విజయవంతం కాగానే ఈ ప్లేట్ నంబర్ డేటాబేస్‌లో శాశ్వతంగా లాక్ చేయబడుతుంది.'}
          </p>
        </div>

        {/* 5. Phone Number & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
              5. ఫోన్ నెంబర్ (Phone - ఐచ్ఛికం)
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
              placeholder="10 అంకెల మొబైల్ నెంబర్"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
              6. ప్రాంతం / నగరం (Location - ఐచ్ఛికం)
            </label>
            <input
              type="text"
              name="location"
              value={userData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50"
              placeholder="ఉదా: హైదరాబాద్ / తిరువణ్ణామలై"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 6. PHOTO OPTION: Directly above the Online Payment Section */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[#8b3d0b]/80">
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            7. మీ ఫోటో ఎంపిక / అప్‌లోడ్ (Select / Upload Photo)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {userData.photoUrl ? (
            /* Photo Selected State */
            <div className="p-3 bg-[#240b03] border border-[#ffca08]/40 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#ffca08] shadow-md bg-black">
                  <img
                    src={userData.photoUrl}
                    alt="Donor Crop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">ఫోటో సిద్ధమైంది (Photo Selected)</span>
                  <span className="text-[11px] text-emerald-400 font-medium">✓ పోస్టర్‌పై లైవ్‌గా కనిపిస్తుంది</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenCropper && (
                  <button
                    type="button"
                    onClick={onOpenCropper}
                    className="py-1.5 px-3 rounded-lg bg-[#381609] hover:bg-[#8b3d0b] text-orange-200 hover:text-white text-xs font-bold border border-[#8b3d0b] transition-all flex items-center gap-1"
                  >
                    <span>✂️ క్రాప్</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-lg bg-[#ffca08] hover:bg-[#ffd943] text-[#381609] text-xs font-bold transition-all shadow-sm"
                >
                  మార్చండి
                </button>
              </div>
            </div>
          ) : (
            /* Choose Photo Options */
            <div className="p-4 bg-[#240b03] border border-dashed border-[#8b3d0b] rounded-2xl text-center">
              <p className="text-xs text-orange-200/80 mb-3">
                పోస్టర్‌పై ముద్రించడానికి మీ లేదా దాత ఫోటోను ఎంచుకోండి:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>📁</span>
                  <span>గ్యాలరీ నుండి ఎంచుకోండి</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="py-2.5 px-3 rounded-xl bg-[#381609] hover:bg-[#4a1c0b] text-orange-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#8b3d0b] hover:border-[#ffca08]/50 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>📸</span>
                  <span>కెమెరాతో తీయండి</span>
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
                  <span>📸 ఫోటో తీయండి (Capture)</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="py-2 px-4 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs"
                >
                  రద్దు చేయండి (Cancel)
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
                <p className="text-xs text-orange-200/70 font-['Noto_Sans_Telugu']">
                  ℹ️ దాత పేరు మరియు ప్లేట్స్ సంఖ్య నమోదు చేసిన తర్వాత పేమెంట్ ఆప్షన్ కనిపిస్తుంది.
                </p>
                <p className="text-[11px] text-orange-200/40 mt-0.5">
                  (Payment option will appear after entering name and plates count)
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
                    <h3 className="text-base font-bold text-[#ffca08] font-['Noto_Sans_Telugu']">
                      అన్నప్రసాద విరాళం చెల్లింపు (Online Payment)
                    </h3>
                    <p className="text-xs text-orange-200/70">
                      {userData.titlePrefix || 'శ్రీ'} {userData.fullName} గారి పేరున
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base mb-1">
                  <span className="text-orange-200">అన్నప్రసాదం ప్లేట్లు:</span>
                  <span className="text-white font-mono font-semibold">
                    {platesNum} ప్లేట్లు ({platesNum} × ₹1)
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base mb-2">
                  <span className="text-orange-200">కేటాయించిన ప్లేట్ నంబర్:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {userData.plateNumber || 'PL-108'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-[#8b3d0b]/80">
                  <span className="text-[#ffca08] font-bold text-base sm:text-lg">
                    మొత్తం విరాళం (Total Amount):
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
                      <span>చెల్లింపు పూర్తయింది (Payment Successful)</span>
                    </div>
                    {userData.paymentId && (
                      <p className="text-xs text-emerald-200/80 font-mono">
                        Payment ID: <span className="font-bold text-white">{userData.paymentId}</span>
                      </p>
                    )}
                    <p className="text-xs text-emerald-300 font-mono mt-1 font-semibold">
                      🔒 ప్లేట్ నంబర్: {userData.plateNumber || 'PL-108'} (శాశ్వతంగా లాక్ చేయబడింది)
                    </p>
                    <p className="text-xs text-[#ffca08] mt-2 font-medium">
                      మీ పేరు, ప్లేట్స్ వివరాలతో పోస్టర్ మరియు అధికారిక రశీదు సిద్ధమయ్యాయి!
                    </p>
                    {onViewReceipt && (
                      <button
                        type="button"
                        onClick={onViewReceipt}
                        className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] font-bold text-xs sm:text-sm rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span>🧾 అధికారిక విరాళ రశీదు చూడండి (View Receipt)</span>
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
                          <span>చెల్లింపు గేట్‌వే సిద్ధమవుతోంది... (Connecting...)</span>
                        </>
                      ) : (
                        <>
                          <span>💳 ఆన్‌లైన్‌లో చెల్లించండి (Pay ₹{(platesNum * 1).toLocaleString('en-IN')})</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-orange-200/60 mt-2.5">
                      🔒 Secured by Razorpay · UPI, Google Pay, PhonePe, Cards, NetBanking
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
