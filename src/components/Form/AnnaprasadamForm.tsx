import React from 'react';
import type { UserData } from '../../types/poster';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

export const AnnaprasadamForm: React.FC<Props> = ({ userData, setUserData }) => {
  const [isPaying, setIsPaying] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    const platesNum = parseInt(userData.plates || '0', 10);
    if (!platesNum || platesNum <= 0) {
      alert("దయచేసి ఎన్ని ప్లేట్లో నమోదు చేయండి");
      return;
    }
    const amountInRupees = platesNum * 51;
    const cleanPhone = (userData.phoneNumber || '').replace(/\D/g, '').slice(-10);

    if (!(window as any).Razorpay) {
      alert("Razorpay payment gateway is loading, please try again in a moment.");
      return;
    }

    setIsPaying(true);
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
        handler: function (response: any) {
          // Report verification to Gurusthan backend
          fetch('/api/verifyPayment', {
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
              type: 'donation'
            })
          }).catch(err => console.warn('Verification report warning:', err));

          alert(`చెల్లింపు విజయవంతమైంది! (Payment Successful)\nPayment ID: ${response.razorpay_payment_id}`);
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed by user");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (paymentResp: any) {
        console.error("Razorpay Payment Failed:", paymentResp.error);
        const errDesc = paymentResp.error?.description || paymentResp.error?.reason || 'Payment was not completed';
        alert(`Payment Notice: ${errDesc}`);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      alert("Payment error: " + (err.message || "Failed to initialize payment gateway."));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-[#4a1c0b] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#8b3d0b]">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#8b3d0b]">
        <span className="text-2xl">🍲</span>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#ffca08] font-['Noto_Sans_Telugu']">
            అన్నప్రసాద వితరణ వివరాలు
          </h2>
          <p className="text-xs sm:text-sm text-orange-200/70">
            Fill in the details to generate your Annaprasadam Seva Poster
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Donor Name with Sri / Srimathi Selector */}
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

        {/* Plates Count & Real-time ₹51 Calculation */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            2. ఎన్ని ప్లేట్స్ అన్నప్రసాదం? (Number of Plates) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            name="plates"
            value={userData.plates || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50 font-bold text-lg text-[#ffca08]"
            placeholder="ఉదా: 10, 50, 100"
            required
          />

          {/* Real-time Amount Calculation Card */}
          {parseInt(userData.plates || '0', 10) > 0 && (
            <div className="mt-3 p-4 bg-gradient-to-r from-[#240b03] via-[#3a1305] to-[#240b03] rounded-xl border border-[#ffca08]/40 shadow-inner">
              <div className="flex items-center justify-between text-sm sm:text-base mb-1">
                <span className="text-orange-200">
                  లెక్క (1 ప్లేట్ = ₹51):
                </span>
                <span className="text-white font-mono font-semibold">
                  {parseInt(userData.plates || '0', 10)} × ₹51
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-[#8b3d0b]/80">
                <span className="text-[#ffca08] font-bold text-base sm:text-lg">
                  మొత్తం విరాళం (Total Amount):
                </span>
                <span className="text-2xl font-black text-[#ffca08] font-mono tracking-wide">
                  ₹{(parseInt(userData.plates || '0', 10) * 51).toLocaleString('en-IN')}/-
                </span>
              </div>

              {/* Direct Pay Button */}
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
                    <span>💳 ఆన్‌లైన్‌లో చెల్లించండి (Pay ₹{(parseInt(userData.plates || '0', 10) * 51).toLocaleString('en-IN')})</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            3. ఫోన్ నెంబర్ (Phone Number - ఐచ్ఛికం / Optional)
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

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            4. ప్రాంతం / నగరం (City / Location - ఐచ్ఛికం / Optional)
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
    </div>
  );
};
