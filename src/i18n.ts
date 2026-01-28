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
import productsEN from './locales/en/products.json';
import productsAR from './locales/ar/products.json';
import categoriesEN from './locales/en/categories.json';
import categoriesAR from './locales/ar/categories.json';
import ordersEN from './locales/en/orders.json';
import ordersAR from './locales/ar/orders.json';
import promocodesEN from './locales/en/promocodes.json';
import promocodesAR from './locales/ar/promocodes.json';
import reviewsEN from './locales/en/reviews.json';
import reviewsAR from './locales/ar/reviews.json';
import clientsEN from './locales/en/clients.json';
import clientsAR from './locales/ar/clients.json';
import followersEN from './locales/en/followers.json';
import followersAR from './locales/ar/followers.json';

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
        products: productsEN,
        categories: categoriesEN,
        orders: ordersEN,
        promocodes: promocodesEN,
        reviews: reviewsEN,
        clients: clientsEN,
        followers: followersEN,
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
        products: productsAR,
        categories: categoriesAR,
        orders: ordersAR,
        promocodes: promocodesAR,
        reviews: reviewsAR,
        clients: clientsAR,
        followers: followersAR,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ar',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            // If nothing is found, it will fallback to fallbackLng ('ar')
        },
    });

export default i18n;
