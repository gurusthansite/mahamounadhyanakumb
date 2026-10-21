import React from 'react';
import { 
  type SupportedLanguage, 
  SUPPORTED_LANGUAGES 
} from '../../i18n/annaprasadamTranslations';

interface Props {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const LanguageSwitcher: React.FC<Props> = ({ currentLang, onLanguageChange }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 p-1.5 bg-[#240b03]/80 backdrop-blur-md border border-[#ffca08]/40 rounded-2xl shadow-lg max-w-md mx-auto mb-6">
      <span className="text-base pl-2 pr-1 select-none">🌐</span>
      <div className="grid grid-cols-4 gap-1 w-full">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onLanguageChange(lang.code)}
              className={`py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                isActive
                  ? 'bg-gradient-to-r from-[#ffca08] to-[#ffd943] text-[#381609] shadow-md scale-[1.03]'
                  : 'text-orange-200 hover:text-white hover:bg-[#8b3d0b]/40'
              }`}
            >
              {lang.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
