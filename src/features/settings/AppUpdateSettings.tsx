import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, History as HistoryIcon, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

enum PlatformType {
    ANDROID = 'android',
    IOS = 'ios',
}

interface AppVersionConfig {
    exact_blocked_version: string;
    store_url: string;
    latest_version: string;
    min_supported_version: string;
    maintenance_mode: boolean;
    maintenance_message: string;
    is_force_update: boolean;
}

interface AppVersionResponse {
    meta: any;
    android: AppVersionConfig;
    ios: AppVersionConfig;
}

const AppUpdateSettings: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<PlatformType>(PlatformType.ANDROID);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<AppVersionResponse | null>(null);

    // Local state for editing form
    const [formData, setFormData] = useState<AppVersionConfig>({
        exact_blocked_version: '',
        store_url: '',
        latest_version: '',
        min_supported_version: '',
        maintenance_mode: false,
        maintenance_message: '',
        is_force_update: false,
    });

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get('/app-version');
            // Handle wrapped response from TransformInterceptor
            const data = response.data.data || response.data;
            setConfig(data);
            if (data) {
                // Initialize form data based on active tab
                const platformData = activeTab === PlatformType.ANDROID ? data.android : data.ios;
                // Map API response to local state structure if needed (handling any key mismatches)
                setFormData({
                    ...platformData,
                    latest_version: (platformData as any).last_version || platformData.latest_version || ''
                });
            }
        } catch (error) {
            console.error('Error fetching app version config:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        // update form data when tab changes or config loads
        if (config) {
            const platformData = activeTab === PlatformType.ANDROID ? config.android : config.ios;
            setFormData({
                ...platformData,
                latest_version: (platformData as any).last_version || platformData.latest_version || ''
            });
        }
    }, [activeTab, config]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const payload = {
                platform: activeTab,
                storeUrl: formData.store_url,
                latestVersion: formData.latest_version,
                minSupportedVersion: formData.min_supported_version,
                exactBlockedVersion: formData.exact_blocked_version,
                maintenanceMode: formData.maintenance_mode,
                maintenanceMessage: formData.maintenance_message,
                isForceUpdate: formData.is_force_update,
            };

            await api.post('/app-version', payload);

            toast.success('App settings updated successfully');
            // Refresh config
            fetchConfig();
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    if (!config && loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <div className={clsx("mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4", isRTL && "md:flex-row-reverse")}>
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className={clsx("text-2xl font-bold text-gray-900 dark:text-white", isRTL && "text-right")}>
                        {t('appUpdates', { defaultValue: 'App Update Controls' })}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('unsavedChangesSpecific', { defaultValue: 'Unsaved changes are specific to the active tab.' })}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/app-version-history')}
                    className={clsx("flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm", isRTL && "flex-row-reverse")}
                >
                    <HistoryIcon className={clsx("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
                    {t('viewVersionHistory', { defaultValue: 'View Version History' })}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className={clsx("flex px-6", isRTL ? "space-x-reverse space-x-8" : "space-x-8")} aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab(PlatformType.ANDROID)}
                            className={`${activeTab === PlatformType.ANDROID
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            Android
                        </button>
                        <button
                            onClick={() => setActiveTab(PlatformType.IOS)}
                            className={`${activeTab === PlatformType.IOS
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            iOS
                        </button>
                    </nav>
                </div>

                <div className="p-6 space-y-6">


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={clsx("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", isRTL && "text-right")}>
                                {t('storeUrl', { defaultValue: 'Store URL' })}
                            </label>
                            <input
                                type="text"
                                name="store_url"
                                value={formData.store_url || ''}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder={activeTab === PlatformType.ANDROID ? "https://play.google.com/..." : "https://apps.apple.com/..."}
                            />
                            <p className={clsx("mt-1 text-sm text-gray-500 dark:text-gray-400", isRTL && "text-right")}>
                                {t('storeUrlDesc', { defaultValue: 'Link to the app updates.' })}
                            </p>
                        </div>

                        <div>
                            <label className={clsx("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", isRTL && "text-right")}>
                                {t('latestVersion', { defaultValue: 'Latest Version' })}
                            </label>
                            <input
                                type="text"
                                name="latest_version"
                                value={formData.latest_version || ''}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 1.5.0"
                            />
                            <p className={clsx("mt-1 text-sm text-gray-500 dark:text-gray-400", isRTL && "text-right")}>
                                {t('latestVersionDesc', { defaultValue: 'Current semantic version.' })}
                            </p>
                        </div>

                        <div>
                            <label className={clsx("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", isRTL && "text-right")}>
                                {t('minSupportedVersion', { defaultValue: 'Minimum Supported Version' })}
                            </label>
                            <input
                                type="text"
                                name="min_supported_version"
                                value={formData.min_supported_version}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 5.3.0"
                            />
                            <p className={clsx("mt-1 text-sm text-gray-500 dark:text-gray-400", isRTL && "text-right")}>
                                {t('minSupportedVersionDesc', { defaultValue: 'Versions lower than this will be forced to update.' })}
                            </p>
                        </div>

                        <div>
                            <label className={clsx("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", isRTL && "text-right")}>
                                {t('exactBlockedVersion', { defaultValue: 'Exact Blocked Version' })}
                            </label>
                            <input
                                type="text"
                                name="exact_blocked_version"
                                value={formData.exact_blocked_version}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 5.2.7"
                            />
                            <p className={clsx("mt-1 text-sm text-gray-500 dark:text-gray-400", isRTL && "text-right")}>
                                {t('exactBlockedVersionDesc', { defaultValue: 'Block a specific buggy version from accessing the API.' })}
                            </p>
                        </div>
                    </div>

                    <div className={clsx("flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_force_update"
                                name="is_force_update"
                                checked={formData.is_force_update}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_force_update" className={clsx("block text-sm text-gray-900 dark:text-white", isRTL ? "mr-2" : "ml-2")}>
                                {t('forceUpdate', { defaultValue: 'Force Update (Recommended for critical updates)' })}
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className={clsx("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
                            <h3 className={clsx("text-lg font-medium text-gray-900 dark:text-white flex items-center", isRTL && "flex-row-reverse")}>
                                <AlertTriangle className={clsx("h-5 w-5 text-yellow-500", isRTL ? "ml-2" : "mr-2")} />
                                {t('maintenanceMode', { defaultValue: 'Maintenance Mode' })}
                            </h3>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="maintenance_mode"
                                    id="maintenance_mode_toggle"
                                    checked={formData.maintenance_mode}
                                    onChange={handleInputChange}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label htmlFor="maintenance_mode_toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>

                        {formData.maintenance_mode && (
                            <div>
                                <label className={clsx("block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", isRTL && "text-right")}>
                                    {t('maintenanceMessage', { defaultValue: 'Maintenance Message' })}
                                </label>
                                <textarea
                                    name="maintenance_message"
                                    value={formData.maintenance_message}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="We'll be back soon..."
                                />
                            </div>
                        )}
                    </div>

                    <div className={clsx("flex pt-4", isRTL ? "justify-start" : "justify-end")}>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={clsx("flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", isRTL && "flex-row-reverse")}
                        >
                            <Save className={clsx("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {loading ? t('common:saving') : t('savePlatformSettings', { defaultValue: `Save ${activeTab === PlatformType.ANDROID ? 'Android' : 'iOS'} Settings` })}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #68D391;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #68D391;
        }
        .toggle-checkbox {
          right: auto;
          left: 0;
          transition: all 0.3s;
        }
      `}</style>
        </div>
    );
};

export default AppUpdateSettings;
