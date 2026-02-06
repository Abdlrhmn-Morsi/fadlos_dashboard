import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
    language: string;
    toggleLanguage: () => void;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();

    // Initialize language from localStorage or default to 'ar'
    const getInitialLanguage = () => {
        const savedLang = localStorage.getItem('language');
        return savedLang || i18n.language || 'ar';
    };

    const [language, setLanguage] = useState(getInitialLanguage);
    const isRTL = language === 'ar';

    // Set initial language in i18n
    useEffect(() => {
        const initialLang = getInitialLanguage();
        if (i18n.language !== initialLang) {
            i18n.changeLanguage(initialLang);
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        // Save to localStorage whenever language changes
        localStorage.setItem('language', language);
    }, [language, isRTL]);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(newLang);
        setLanguage(newLang);
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
