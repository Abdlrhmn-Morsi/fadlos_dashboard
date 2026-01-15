import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-none text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
        >
            <Languages size={18} />
            <span className="text-sm font-bold uppercase">{language}</span>
        </button>
    );
};

export default LanguageSwitcher;
