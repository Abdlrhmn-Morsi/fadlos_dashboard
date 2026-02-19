import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, History, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface AppVersionHistoryItem {
    id: string;
    appType: string;
    platform: string;
    storeUrl: string;
    latestVersion: string;
    minSupportedVersion: string;
    exactBlockedVersion: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    isForceUpdate: boolean;
    updatedBy: string;
    createdAt: string;
}

const AppVersionHistory: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [history, setHistory] = useState<AppVersionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/app-version/history');
            const data = response.data.data || response.data;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    {isRTL ? <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400" /> : <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-6 h-6" />
                        {t('appVersionHistory', { defaultValue: 'App Version History' })}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('appVersionHistoryDesc', { defaultValue: 'View log of all app configuration changes' })}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('date', { defaultValue: 'Date' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('appType', { defaultValue: 'App Type' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('platform', { defaultValue: 'Platform' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('storeUrl', { defaultValue: 'Store URL' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('latestVer', { defaultValue: 'Latest Ver' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('minVersion', { defaultValue: 'Min Version' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('blockedVersion', { defaultValue: 'Blocked Version' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('status:status', { defaultValue: 'Status' })}</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">{t('updatedBy', { defaultValue: 'Updated By' })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-500">{t('loadingHistory', { defaultValue: 'Loading history...' })}</td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-slate-500">{t('noHistoryFound', { defaultValue: 'No history found' })}</td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${item.appType === 'customer'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                }`}>
                                                {item.appType === 'customer' ? t('customerApp', { defaultValue: 'Customer App' }) : t('driverApp', { defaultValue: 'Driver App' })}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${item.platform === 'android'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {item.platform}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.storeUrl || ''}>
                                            {item.storeUrl || '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {item.latestVersion || '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {item.minSupportedVersion || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.exactBlockedVersion || '-'}
                                        </td>
                                        <td className="p-4">
                                            {item.maintenanceMode ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    {t('maintenance', { defaultValue: 'Maintenance' })}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    {t('active', { defaultValue: 'Active' })}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                            {item.updatedBy || t('system', { defaultValue: 'System' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AppVersionHistory;
