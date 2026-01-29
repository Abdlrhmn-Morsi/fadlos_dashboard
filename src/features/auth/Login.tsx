import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import authApi from './api/auth.api';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../notification/context/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';

const Login = () => {
    const { t } = useTranslation('auth');
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const { loginOneSignal } = useNotification();
    const { login } = useAuth(); // Add useAuth

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const responseData: any = await authApi.login(formData);
            const { user } = responseData; // token no longer needed manually

            if (user) {
                login(user); // Set global user state
                // Login Subscription
                if (user.id) {
                    await loginOneSignal(user.id);
                }
                navigate('/');
            } else if (responseData.requiresVerification) {
                navigate('/verify-email', { state: { token: responseData.verificationToken } });
            } else {
                console.error("Login response:", responseData);
                setError(t('loginFailed'));
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || t('invalidCredentials');
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={clsx(
            "min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4 relative overflow-hidden transition-colors",
            isRTL && "text-right"
        )}>
            <InteractiveBackground />
            <div className="w-full max-w-[440px] relative z-10 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src={appLogo}
                        alt="Logo"
                        className="h-24 object-contain"
                    />
                </div>

                {error && (
                    <div className={clsx(
                        "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-none flex items-center gap-3 text-sm mb-6 animate-in animate-fade duration-300",
                        isRTL && "flex-row-reverse"
                    )}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="identifier" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {t('identifier')}
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            placeholder={t('identifierPlaceholder')}
                            className={clsx(
                                "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500",
                                isRTL && "text-right"
                            )}
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" title="password label" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {t('password')}
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder={t('passwordPlaceholder')}
                            className={clsx(
                                "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500",
                                isRTL && "text-right"
                            )}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className={clsx("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                        <label className={clsx("flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer group", isRTL && "flex-row-reverse")}>
                            <input type="checkbox" className="w-4 h-4 rounded-none border-slate-300 dark:border-slate-600 text-primary focus:ring-primary appearance-none checked:bg-primary checked:border-primary checked:after:content-['✓'] checked:after:text-white checked:after:text-[10px] checked:after:flex checked:after:items-center checked:after:justify-center border bg-slate-50 dark:bg-slate-900" />
                            <span className="font-medium group-hover:text-primary transition-colors">{t('rememberMe')}</span>
                        </label>
                        <Link to="/forgot-password" title="Go to forgot password page" className="text-primary font-bold hover:underline transition-all">
                            {t('forgotPassword')}
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-none animate-spin" />
                        ) : (
                            <div className={clsx("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                {t('signIn')} <ArrowRight size={18} className={isRTL ? "rotate-180" : ""} />
                            </div>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>
                        {t('wantToBecomeSeller')}{' '}
                        <Link to="/register" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">
                            {t('createStoreAccount')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
