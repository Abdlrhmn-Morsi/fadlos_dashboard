import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import authApi from '../../auth/api/auth.api';
import { toast } from 'react-hot-toast';
import { KeyRound, Mail, CheckCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userRole?: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, userEmail, userRole }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState({
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [tokens, setTokens] = useState({
        session: '',
        authorized: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestCode = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.forgotPassword(userEmail, userRole);
            setTokens(prev => ({ ...prev, session: response.resetSessionToken }));
            setStep(2);
            toast.success(t('codeSentTo', { email: userEmail }));
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.code.length !== 6) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.verifyResetCode(formData.code, tokens.session);
            setTokens(prev => ({ ...prev, authorized: response.authorizedResetToken }));
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError(t('passwordsDontMatch'));
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await authApi.resetPassword(formData.newPassword, tokens.authorized);
            toast.success(t('resetSuccess'));
            onClose();
            // Reset state for next time
            setStep(1);
            setFormData({ code: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('resetPasswordTitle')}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {t('resetPasswordDesc')}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                                {t('email')}
                            </p>
                            <p className="text-gray-900 dark:text-white font-medium">{userEmail}</p>
                        </div>
                        <button
                            onClick={handleRequestCode}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            {t('sendRequest')}
                        </button>
                    </div>
                );
            case 2:
                return (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                         <div className="flex justify-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('verifyCode')}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {t('codeSentTo', { email: userEmail })}
                            </p>
                        </div>
                        <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="000000"
                            className="w-full text-center text-3xl tracking-[1em] font-mono py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || formData.code.length !== 6}
                            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('verifyCodeBtn')}
                        </button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                         <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('setNewPassword')}
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('newPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        required
                                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pe-12"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors end-3"
                                    >
                                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('confirmPassword')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        required
                                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pe-12"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors end-3"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('updatePassword')}
                        </button>
                    </form>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
                {renderContent()}
            </div>
        </Modal>
    );
};

export default ResetPasswordModal;
