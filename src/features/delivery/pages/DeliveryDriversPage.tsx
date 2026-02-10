import React, { useState } from 'react';
import { DeliveryDriversList, FreelancerMarketplace } from '../components';
import { useTranslation } from 'react-i18next';
import { Truck, Globe } from 'lucide-react';
import clsx from 'clsx';

const DeliveryDriversPage = () => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState<'my-drivers' | 'marketplace'>('my-drivers');

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold mb-4">{t('delivery.drivers.title', 'Delivery Drivers')}</h1>

            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('my-drivers')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'my-drivers'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Truck size={18} />
                    {t('delivery.drivers.my_drivers')}
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'marketplace'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Globe size={18} />
                    {t('delivery.drivers.marketplace')}
                </button>
            </div>

            {activeTab === 'my-drivers' ? <DeliveryDriversList /> : <FreelancerMarketplace />}
        </div>
    );
};

export default DeliveryDriversPage;
