import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LanguageCode, TranslationDictionary, translations } from './translations';

export interface TranslateFunction extends TranslationDictionary {
  (key: string, fallback?: string): string;
  formatDate: (date: Date | string | number) => string;
  formatNumber: (num: number) => string;
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslateFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'campusops_language_preference';

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && (saved === 'en' || saved === 'ta' || saved === 'hi')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo<TranslateFunction>(() => {
    const currentDict = translations[language] || translations.en;
    const fallbackDict = translations.en;

    const translate = (key: string, fallback?: string): string => {
      const direct = getNestedValue(currentDict, key);
      if (direct !== undefined) return direct;
      const fallbackVal = getNestedValue(fallbackDict, key);
      if (fallbackVal !== undefined) return fallbackVal;
      return fallback !== undefined ? fallback : key;
    };

    translate.formatDate = (date: Date | string | number) => {
      try {
        const d = new Date(date);
        const locale = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return String(date);
      }
    };

    translate.formatNumber = (num: number) => {
      try {
        const locale = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        return num.toLocaleString(locale);
      } catch {
        return String(num);
      }
    };

    return Object.assign(translate, currentDict) as TranslateFunction;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
};
