import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../services/api';

import './Login.css';
import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', formData);

            // TransformInterceptor wraps response in { data: { ... }, message: "...", success: true }
            // So token is in response.data.data.token
            const responseData = response.data.data || response.data;
            const { token, user } = responseData;

            if (token) {
                localStorage.setItem('token', token);
                if (user) {
                    localStorage.setItem('user', JSON.stringify(user));
                }
                navigate('/');
            } else {
                // Fallback checks
                if (responseData.accessToken) {
                    localStorage.setItem('token', responseData.accessToken);
                    navigate('/');
                } else {
                    console.error("Login response:", response.data);
                    setError('Login failed: Token not found in response');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            // Check for nested message from Interceptor
            const msg = err.response?.data?.message || 'Failed to sign in. Please check your credentials.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <InteractiveBackground />
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <img src={appLogo} alt="Logo" />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your Fadlos workspace</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="identifier">Email, Username or Phone</label>
                        <input
                            type="text"
                            id="identifier"
                            placeholder="Enter your identifier"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#" className="forgot-password">Forgot password?</a>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : (
                            <>
                                Sign In <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <span className="text-muted">Contact support</span></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
