import React, { useState, useEffect, useRef } from 'react';
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
    CheckCircle,
    Camera,
    Phone
} from 'lucide-react';
import { updateProfile, updatePassword } from '../users/api/users.api';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

const ProfileSettings = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const { isRTL } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, refreshProfile } = useAuth();
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profileImage || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        phone: user?.phone || '',
        email: user?.email || '' // Read only
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                username: user.username || '',
                phone: user.phone || '',
                email: user.email || ''
            });
            setImagePreview(user.profileImage || null);
        }
    }, [user]);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('username', profileData.username);
            formData.append('phone', profileData.phone);

            if (selectedFile) {
                formData.append('profileImage', selectedFile);
            }

            await updateProfile(formData);
            await refreshProfile(); // Refresh global auth state

            toast.success(t('common:success'));
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            const message = error.response?.data?.message;
            toast.error(Array.isArray(message) ? message[0] : message || t('common:errorUpdatingData'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('common:passwordsDontMatch'));
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
        } catch (error: any) {
            console.error('Failed to update password:', error);
            const message = error.response?.data?.message;
            toast.error(message || t('common:errorUpdatingData'));
        } finally {
            setSavingPassword(false);
        }
    };

    const togglePasswordVisibility = (key: keyof typeof showPasswords) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in animate-fade" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-4 mb-12">
                <div className="p-4 bg-primary-light dark:bg-primary/20 rounded-none shadow-inner">
                    <User size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {activeTab === 'profile' ? t('common:accountSettings') : t('common:updatePassword')}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {activeTab === 'profile'
                            ? t('common:manageProfileDesc')
                            : t('common:managePasswordDesc')
                        }
                    </p>
                </div>
            </div>

            {/* Personal Information Section */}
            {activeTab === 'profile' && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <User size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('common:personalInformation')}</h3>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="p-8 space-y-8">
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 end-0 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-110 active:scale-95 z-10"
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {t('common:changeProfilePicture')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> {t('common:fullName')}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleProfileChange}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> {t('common:username')}
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleProfileChange}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={14} /> {t('common:email')}
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    readOnly
                                    className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-slate-500 cursor-not-allowed font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={14} /> {t('common:phone')}
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleProfileChange}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>
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

            {/* Security Section */}
            {activeTab === 'security' && (
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Lock size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('common:updatePassword')}</h3>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock size={14} /> {t('common:oldPassword')}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.old ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pe-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('old')}
                                    className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors end-4"
                                >
                                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} /> {t('common:newPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pe-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('new')}
                                        className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors end-4"
                                    >
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={14} /> {t('common:confirmPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 pe-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                        className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors end-4"
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
                                {t('common:updatePassword')}
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </div>
    );
};

export default ProfileSettings;
