import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
    User,
    Mail,
    Lock,
    Save,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle
} from 'lucide-react';
import { updateProfile, updatePassword } from '../users/api/users.api';
import { toast } from '../../utils/toast';

const ProfileSettings = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile'; // default to profile if no tab specified

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [profileData, setProfileData] = useState({
        username: user.username || '',
        email: user.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const result = await updateProfile(profileData);
            // Update local storage with new user data
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success(t('common:success'));
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('passwordsDontMatch', { defaultValue: 'Passwords do not match' }));
            return;
        }
        setSavingPassword(true);
        try {
            await updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success(t('common:success'));
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Failed to update password:', error);
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setSavingPassword(false);
        }
    };

    const togglePasswordVisibility = (key: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in animate-fade">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-12">
                <div className="p-4 bg-primary-light dark:bg-primary/20 rounded-none shadow-inner">
                    <User size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {activeTab === 'profile' ? t('personalInformation', { defaultValue: 'Account Settings' }) : t('updatePassword', { defaultValue: 'Update Password' })}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {activeTab === 'profile'
                            ? t('manageProfileDesc', { defaultValue: 'Update your personal profile information' })
                            : t('managePasswordDesc', { defaultValue: 'Keep your account secure by updating your password' })
                        }
                    </p>
                </div>
            </div>

            {/* Profile Section */}
            {activeTab === 'profile' && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <User size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('personalInformation', { defaultValue: 'Personal Information' })}</h3>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> {t('username', { defaultValue: 'Full Name' })}
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={profileData.username}
                                onChange={handleProfileChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} /> {t('common:email', { defaultValue: 'Email Address' })}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="flex items-center gap-3 px-8 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                            >
                                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {t('common:save')}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Password Section */}
            {activeTab === 'security' && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Lock size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('updatePassword', { defaultValue: 'Update Password' })}</h3>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={14} /> {t('oldPassword', { defaultValue: 'Current Password' })}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.old ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('old')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                >
                                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} /> {t('newPassword', { defaultValue: 'New Password' })}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} /> {t('confirmPassword', { defaultValue: 'Confirm New' })}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-primary text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
                            >
                                {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {t('common:updateStatus')}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
};

export default ProfileSettings;
