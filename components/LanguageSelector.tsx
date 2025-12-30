import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../constants';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2 justify-center py-4">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
            i18n.language === lang.code
              ? 'bg-indigo-600 text-white shadow-lg scale-110'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
