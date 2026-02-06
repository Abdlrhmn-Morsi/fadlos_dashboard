import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Lock,
    Mail,
    Phone,
    Store as StoreIcon,
    Type,
    ChevronRight,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import authApi from './api/auth.api';
import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';
import toolsApi from '../../services/tools.api';
import { toast } from '../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import ThemeToggle from '../../components/common/ThemeToggle';
import clsx from 'clsx';

const FormSection = ({ title, icon: Icon, children, description }: any) => {
    const { isRTL } = useLanguage();
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm shrink-0">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Icon size={20} className="text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">{title}</h3>
                    {description && <p className="text-[10px] text-slate-400 font-medium">{description}</p>}
                </div>
            </div>
            <div className="p-6 space-y-6 flex-1">
                {children}
            </div>
        </div>
    );
};

const FormInput = ({ label, icon: Icon, ...props }: any) => {
    const { isRTL } = useLanguage();
    return (
        <div className="space-y-1.5 flex-1">
            <label className={clsx("text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest", isRTL ? "mr-1 text-right block" : "ml-1")}>
                {label} {props.required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative group">
                <div className={clsx(
                    "absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors",
                    isRTL ? "right-4" : "left-4"
                )}>
                    {Icon && <Icon size={18} />}
                </div>
                <input
                    {...props}
                    className={clsx(
                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium",
                        isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4"
                    )}
                />
            </div>
        </div>
    );
};

const Register = () => {
    const { t } = useTranslation(['auth', 'common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { clearAllCache } = useCache();

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        storeNameAr: '',
        storeName: ''
    });

    const handleTranslate = async (value: string) => {
        if (!value || formData.storeName) return;
        try {
            const res: any = await toolsApi.transliterate(value, 'ar');
            const translated = typeof res === 'string' ? res : res.translatedText;
            if (translated) {
                setFormData(prev => ({ ...prev, storeName: translated }));
                toast.success('Store name romanized');
            }
        } catch (error) {
            console.error("Translation error", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const responseData: any = await authApi.registerStoreOwner(formData);
            clearAllCache();
            if (responseData.requiresVerification) {
                navigate('/verify-email', { state: { token: responseData.verificationToken } });
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            const msg = err.response?.data?.message || 'Failed to register.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={clsx(
            "min-h-screen py-12 px-4 flex flex-col bg-white dark:bg-slate-950 relative overflow-x-hidden transition-colors",
            isRTL && "text-right"
        )}>
            <InteractiveBackground />

            {/* Top Bar for Switchers */}
            <div className={clsx(
                "fixed top-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500",
                isRTL ? "left-6" : "right-6"
            )}>
                <LanguageSwitcher />
                <ThemeToggle />
            </div>

            <div className="w-full max-w-5xl mx-auto relative z-10">
                <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <img src={appLogo} alt="Logo" className="h-20 object-contain mb-6" />
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">
                        {t('createStoreAccount')}
                    </h1>
                    <p className="text-slate-500 font-medium max-w-md">
                        {t('wantToBecomeSeller')} {t('setupStore')}
                    </p>
                    <div className="h-1.5 w-16 bg-primary rounded-full mt-4 shadow-sm shadow-primary/30"></div>
                </div>

                {error && (
                    <div className={clsx(
                        "max-w-xl mx-auto bg-rose-100 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-6 py-4 rounded-2xl mb-8 flex items-center gap-4 animate-shake",
                        isRTL && "flex-row-reverse"
                    )}>
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        {/* Section 1: Administrator Account */}
                        <div className="space-y-8 h-full">
                            <FormSection
                                title={t('createAccount')}
                                icon={User}
                                description={t('accountSectionDesc')}
                            >
                                <div className="space-y-6">
                                    <FormInput
                                        label={t('fullName')}
                                        icon={User}
                                        placeholder={t('fullNamePlaceholder')}
                                        required
                                        value={formData.name}
                                        onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label={t('username')}
                                            icon={Type}
                                            placeholder={t('usernamePlaceholder')}
                                            required
                                            value={formData.username}
                                            onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                        <FormInput
                                            label={t('phone')}
                                            icon={Phone}
                                            placeholder={t('phonePlaceholder')}
                                            required
                                            value={formData.phone}
                                            onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <FormInput
                                        label={t('emailAddress')}
                                        icon={Mail}
                                        type="email"
                                        placeholder={t('emailPlaceholder')}
                                        required
                                        value={formData.email}
                                        onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <FormInput
                                        label={t('password')}
                                        icon={Lock}
                                        type="password"
                                        placeholder={t('passwordPlaceholder')}
                                        required
                                        value={formData.password}
                                        onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </FormSection>
                        </div>

                        {/* Section 2: Store Information */}
                        <div className="space-y-8 h-full">
                            <FormSection
                                title={t('setupStore')}
                                icon={StoreIcon}
                                description={t('storeSectionDesc')}
                            >
                                <div className="flex flex-col h-full space-y-4">
                                    <div className="space-y-4">
                                        <FormInput
                                            label={t('storeNameAr')}
                                            icon={StoreIcon}
                                            placeholder={t('storeNameArPlaceholder')}
                                            required
                                            value={formData.storeNameAr}
                                            onChange={(e: any) => setFormData({ ...formData, storeNameAr: e.target.value })}
                                            onBlur={(e: any) => handleTranslate(e.target.value)}
                                        />
                                        <FormInput
                                            label={t('storeNameEn')}
                                            icon={StoreIcon}
                                            placeholder={t('storeNameEnPlaceholder')}
                                            required
                                            value={formData.storeName}
                                            onChange={(e: any) => setFormData({ ...formData, storeName: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 min-h-[40px]"></div>
                                    <div className="mt-auto p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20 shrink-0">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            {t('configLaterDesc')}
                                        </p>
                                    </div>
                                </div>
                            </FormSection>
                        </div>
                    </div>

                    {/* Submit and Footer */}
                    <div className="flex flex-col items-center gap-6 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={clsx(
                                "w-full max-w-md py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 group relative overflow-hidden",
                                loading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            <span className="relative z-10 uppercase tracking-widest">
                                {loading ? t('registering') : t('register')}
                            </span>
                            {!loading && <ChevronRight size={20} className={clsx("relative z-10 transition-transform group-hover:translate-x-1", isRTL && "rotate-180 group-hover:-translate-x-1")} />}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>

                        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            <p>
                                {t('alreadyHaveAccount')}{' '}
                                <Link to="/login" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">
                                    {t('loginHere')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;