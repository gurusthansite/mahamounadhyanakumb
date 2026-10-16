import React from 'react';
import type { UserData } from '../../types/poster';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

export const AnnaprasadamForm: React.FC<Props> = ({ userData, setUserData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
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

        {/* Plates Count */}
        <div>
          <label className="block text-sm font-semibold text-orange-100 mb-2 font-['Noto_Sans_Telugu']">
            2. ఎన్ని ప్లేట్స్ అన్నప్రసాదం? (Number of Plates) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="plates"
            value={userData.plates || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#240b03] border border-[#8b3d0b] text-white rounded-xl focus:ring-2 focus:ring-[#ffca08] focus:border-[#ffca08] outline-none transition-all placeholder-orange-700/50 font-bold text-lg text-[#ffca08]"
            placeholder="ఉదా: 50, 100, 500"
            required
          />
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
