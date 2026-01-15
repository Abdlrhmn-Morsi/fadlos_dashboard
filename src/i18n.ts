import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from './locales/en/common.json';
import commonAR from './locales/ar/common.json';
import authEN from './locales/en/auth.json';
import authAR from './locales/ar/auth.json';
import dashboardEN from './locales/en/dashboard.json';
import dashboardAR from './locales/ar/dashboard.json';
import usersEN from './locales/en/users.json';
import usersAR from './locales/ar/users.json';
import storesEN from './locales/en/stores.json';
import storesAR from './locales/ar/stores.json';
import citiesEN from './locales/en/cities.json';
import citiesAR from './locales/ar/cities.json';
import townsEN from './locales/en/towns.json';
import townsAR from './locales/ar/towns.json';
import businessTypesEN from './locales/en/businessTypes.json';
import businessTypesAR from './locales/ar/businessTypes.json';

const resources = {
    en: {
        common: commonEN,
        auth: authEN,
        dashboard: dashboardEN,
        users: usersEN,
        stores: storesEN,
        cities: citiesEN,
        towns: townsEN,
        businessTypes: businessTypesEN,
    },
    ar: {
        common: commonAR,
        auth: authAR,
        dashboard: dashboardAR,
        users: usersAR,
        stores: storesAR,
        cities: citiesAR,
        towns: townsAR,
        businessTypes: businessTypesAR,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
