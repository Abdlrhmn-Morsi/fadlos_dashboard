import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, RefreshCcw } from 'lucide-react';
import authApi from './api/auth.api';
import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../notification/context/NotificationContext';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = location.state || {}; // Get token from state
    const { login } = useAuth();
    const { loginOneSignal } = useNotification();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    useEffect(() => {
        let timer: any;
        if (countdown > 0 && !canResend) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [countdown, canResend]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const verificationCode = code.join('');
        if (verificationCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response: any = await authApi.verifyEmail(token, verificationCode);
            if (response.user) {
                login(response.user);
                await loginOneSignal(response.user.id);
                setMessage('Email verified successfully!');
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setResending(true);
        setError(null);
        setMessage(null);
        try {
            await authApi.resendVerificationCode(token);
            setMessage('A new verification code has been sent to your email.');
            setCanResend(false);
            setCountdown(60);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to resend code.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
            <InteractiveBackground />
            <div className="w-full max-w-[440px] relative z-10 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <img src={appLogo} alt="Logo" className="h-20 object-contain mb-6" />
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Mail className="text-primary" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verify your email</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm">
                        Enter the 6-digit code we sent to your email address.
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-none flex items-center gap-3 text-sm mb-6">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-none flex items-center gap-3 text-sm mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-between gap-2 text-center">
                        {code.map((digit, idx) => (
                            <input
                                key={idx}
                                id={`code-${idx}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                required
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-primary text-white font-bold rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                        disabled={loading || code.some(d => !d)}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Verify Account <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Didn't receive the code?
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={resending || !canResend}
                        className="flex items-center gap-2 mx-auto text-primary font-bold hover:underline transition-all disabled:opacity-50 disabled:no-underline"
                    >
                        <RefreshCcw size={16} className={resending ? 'animate-spin' : ''} />
                        {resending ? 'Resending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                    </button>
                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
