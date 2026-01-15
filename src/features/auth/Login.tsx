import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowRight, AlertCircle } from 'lucide-react';
import apiService from '../../services/api.service';

import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const responseData: any = await apiService.post('/auth/login', formData);
            const { token, user } = responseData;

            if (token) {
                localStorage.setItem('token', token);
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                navigate('/');
            } else {
                if (responseData.accessToken) {
                    localStorage.setItem('token', responseData.accessToken);
                    navigate('/');
                } else {
                    console.error("Login response:", responseData);
                    setError('Login failed: Token not found in response');
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || 'Failed to sign in. Please check your credentials.';
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
                        className="h-24 object-contain"
                    />
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-none flex items-center gap-3 text-sm mb-6 animate-in animate-fade duration-300">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="identifier" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Email, Username or Phone</label>
                        <input
                            type="text"
                            id="identifier"
                            placeholder="Enter your identifier"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" title="password label" className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-900 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded-none border-slate-300 dark:border-slate-600 text-primary focus:ring-primary" />
                            <span className="font-medium group-hover:text-primary transition-colors">Remember me</span>
                        </label>
                        <a href="#" className="text-primary font-bold hover:underline transition-all">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-none-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-none-none animate-spin" />
                        ) : (
                            <>
                                Sign In <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>Don't have an account? <span className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition-colors">Contact support</span></p>
                </div>
            </div>
        </div>
    );
};

export default Login;

