import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import DeliveryAreas from './components/DeliveryAreas';
import clsx from 'clsx';
import { useLanguage } from '../../contexts/LanguageContext';

const DeliveryAreasPage = () => {
    const { t } = useTranslation(['stores', 'common']);
    const { isRTL } = useLanguage();

    return (
        <div className="p-6 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-center">
                <div className="p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 animate-float shadow-xl shadow-primary/5">
                    <Truck size={40} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                        {t('deliveryAreas')}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {t('manageDeliveryPricing')}
                    </p>
                </div>
            </div>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                <div className="p-8">
                    <DeliveryAreas />
                </div>
            </section>
        </div>
    );
};

export default DeliveryAreasPage;
