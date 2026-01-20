import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, KeyRound, Mail, Lock } from 'lucide-react';
import authApi from './api/auth.api';
import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Request Email, 2: Verify Code, 3: Reset Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokens, setTokens] = useState({
        session: '',
        authorized: ''
    });
    const [formData, setFormData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await authApi.forgotPassword(formData.email);
            // apiService automatically unwraps the 'data' field
            const sessionToken = response.resetSessionToken;
            setTokens(prev => ({ ...prev, session: sessionToken }));
            setStep(2);
            toast.success('Reset code sent to your email');
        } catch (err: any) {
            console.error('Request code error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to send reset code. Please try again.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await authApi.verifyResetCode(formData.code, tokens.session);
            // apiService automatically unwraps the 'data' field
            const authorizedToken = response.authorizedResetToken;
            setTokens(prev => ({ ...prev, authorized: authorizedToken }));
            setStep(3);
            toast.success('Code verified successfully');
        } catch (err: any) {
            console.error('Verify code error:', err);
            const msg = err.response?.data?.message || err.message || 'Invalid or expired code.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await authApi.resetPassword(formData.newPassword, tokens.authorized);
            toast.success('Password reset successful');
            navigate('/login');
        } catch (err: any) {
            console.error('Reset password error:', err);
            const msg = err.response?.data?.message || 'Failed to reset password. Please check your token.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
            <InteractiveBackground />
            <div className="w-full max-w-[440px] relative z-10 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src={appLogo}
                        alt="Logo"
                        className="h-20 object-contain mb-6"
                    />
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify Code' : 'Reset Password'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
                        {step === 1
                            ? "Enter your email address and we'll send you a 6-digit code to reset your password."
                            : step === 2
                                ? "Enter the 6-digit code we sent to your email address."
                                : "Choose a new password for your account."
                        }
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-none flex items-center gap-3 text-sm mb-6 animate-in animate-fade duration-300">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRequestCode} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center gap-2">
                                <Mail size={14} className="text-primary" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Send Reset Code <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : step === 2 ? (
                    <form onSubmit={handleVerifyCode} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center gap-2">
                                <KeyRound size={14} className="text-primary" />
                                6-Digit Code
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="123456"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify Code <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                        >
                            Back to email entry
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center gap-2">
                                <Lock size={14} className="text-primary" />
                                New Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center gap-2">
                                <Lock size={14} className="text-primary" />
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Reset Password <CheckCircle2 size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                        >
                            Back to code verification
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>Remember your password? <Link to="/login" className="font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
