import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { LanguageCode } from '../../i18n/translations';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage } = useTranslation();

  const options: { code: LanguageCode; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'EN' },
    { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-[#181818] border border-[#2A2A2A] rounded-lg p-0.5 text-xs font-mono">
        {options.map((opt) => {
          const isSelected = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              className={`px-2 py-1 rounded transition-colors text-[11px] font-bold ${
                isSelected
                  ? 'bg-brandLime text-brandDark shadow-[1px_1px_0px_#0A0A0A]'
                  : 'text-neutral-400 hover:text-brandCream'
              }`}
              title={opt.label}
            >
              {opt.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const isSelected = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all border ${
              isSelected
                ? 'bg-brandLime text-brandDark border-brandLime shadow-[3px_3px_0px_#0A0A0A]'
                : 'bg-[#1C1C1C] text-neutral-300 border-[#2A2A2A] hover:border-neutral-500 hover:text-brandCream'
            }`}
          >
            <span>{opt.nativeName}</span>
            <span className={`text-[10px] ${isSelected ? 'text-black/60' : 'text-neutral-500'}`}>
              ({opt.label})
            </span>
          </button>
        );
      })}
    </div>
  );
};
