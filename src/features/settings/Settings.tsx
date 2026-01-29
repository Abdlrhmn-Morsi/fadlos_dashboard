import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings as SettingsIcon,
    Store,
    User,
    ChevronRight,
    ShieldCheck,
    Briefcase,
    Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/user-role';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

const Settings = () => {
    const { t } = useTranslation(['common', 'stores']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSeller = user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE;

    const navItems = [
        {
            id: 'store',
            title: t('stores:title', { defaultValue: 'Store Data' }),
            description: t('stores:updateStoreSettings', { defaultValue: 'Manage your store operational details, images, and locations' }),
            icon: Store,
            path: '/store-settings',
            color: 'text-primary',
            bgColor: 'bg-primary-light',
            visible: isSeller
        },
        {
            id: 'profile',
            title: t('personalInformation', { defaultValue: 'Account Info' }),
            description: t('manageAccountDetails', { defaultValue: 'Update your personal profile information and email' }),
            icon: User,
            path: '/profile-settings?tab=profile',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            visible: true
        },
        {
            id: 'security',
            title: t('changePassword', { defaultValue: 'Security & Password' }),
            description: t('managePasswordDesc', { defaultValue: 'Keep your account secure by updating your password' }),
            icon: ShieldCheck,
            path: '/profile-settings?tab=security',
            color: 'text-rose-500',
            bgColor: 'bg-rose-50',
            visible: true
        },
        {
            id: 'app-updates',
            title: t('appUpdates', { defaultValue: 'App Updates' }),
            description: t('manageAppUpdatesDesc', { defaultValue: 'Manage minimum versions, blocked updates, and maintenance mode' }),
            icon: Smartphone,
            path: '/app-updates',
            color: 'text-purple-500',
            bgColor: 'bg-purple-50',
            visible: !isSeller // Only visible to Admins/Super Admins
        },

    ];

    return (

        <div className="p-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header Area */}
            <div className="flex flex-col gap-4 mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary-light dark:bg-primary/20 rounded-none shadow-inner">
                        <SettingsIcon size={32} className="text-primary animate-spin-slow" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {t('settings')}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {t('settingsHubDesc', { defaultValue: 'Choose a section to manage your preferences and account' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hub Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {navItems.filter(item => item.visible).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="group flex flex-col p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 relative overflow-hidden active:scale-95 text-start"
                    >
                        {/* Decorative Background Icon */}
                        <item.icon className="absolute -bottom-4 -end-4 w-32 h-32 text-slate-50 dark:text-slate-800/50 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />

                        <div className={`p-4 ${item.bgColor} dark:bg-slate-800 rounded-none w-fit mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                            <item.icon className={`${item.color} w-8 h-8`} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                            {item.title}
                        </h3>

                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 flex-grow">
                            {item.description}
                        </p>

                        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all mt-auto">
                            <span>{t('manage')}</span>
                            {isRTL ? <ChevronRight size={18} className="rotate-180" /> : <ChevronRight size={18} />}
                        </div>
                    </button>
                ))}
            </div>

            {/* Visual Guide / Illustration section (Optional) */}
            <div className="mt-20 p-12 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-none flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                    <h4 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                        {t('needHelpTitle', { defaultValue: 'System Configuration' })}
                    </h4>
                    <p className="text-slate-500 font-medium mb-6">
                        {t('needHelpDesc', { defaultValue: 'Manage your entire presence from one place. Ensure your store data is accurate to improve customer trust and visibility.' })}
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-primary">
                            <Briefcase size={18} />
                            <span className="font-bold text-xs uppercase">{t('businessReady', { defaultValue: 'Business Ready' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-500">
                            <ShieldCheck size={18} />
                            <span className="font-bold text-xs uppercase">{t('secureAccount', { defaultValue: 'Secure Account' })}</span>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <div className="w-24 h-24 bg-primary rounded-none absolute -top-4 -end-4 animate-pulse opacity-20" />
                    <div className="w-24 h-24 bg-blue-500 rounded-none absolute -bottom-4 -start-4 animate-pulse opacity-20 delay-75" />
                    <div className="p-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none relative z-10 shadow-xl">
                        <SettingsIcon size={48} className="text-primary animate-spin-slow" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
