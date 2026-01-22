import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import DeliveryAreas from './components/DeliveryAreas';

const DeliveryAreasPage = () => {
    const { t } = useTranslation(['stores', 'common']);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-primary-light rounded-none animate-float">
                    <Truck size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {t('deliveryAreas', { defaultValue: 'Delivery Areas' })}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {t('manageDeliveryPricing', { defaultValue: 'Manage your delivery zones and pricing' })}
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
