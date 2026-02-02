import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

import { useTranslation } from 'react-i18next';

const StatusModal: React.FC<StatusModalProps> = ({
    isOpen,
    onClose,
    type = 'success', // success, error, confirm
    title,
    message,
    onConfirm,
    confirmText,
    cancelText
}) => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    if (!isOpen) return null;

    const finalConfirmText = confirmText || t('confirm');
    const finalCancelText = cancelText || t('cancel');

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-none flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={48} />
                    </div>
                );
            case 'error':
                return (
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-none flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                        <XCircle className="text-rose-600 dark:text-rose-400" size={48} />
                    </div>
                );
            case 'confirm':
                return (
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-none flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400" size={48} />
                    </div>
                );
            default:
                return (
                    <div className="w-20 h-20 bg-primary-light dark:bg-primary/20 rounded-none flex items-center justify-center mb-6">
                        <CheckCircle className="text-primary" size={48} />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div
                className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in animate-fade duration-300"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-slate-900 rounded-none p-10 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center border border-slate-100 dark:border-slate-700 transition-colors">
                <button
                    className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-all"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                {getIcon()}

                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">{message}</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {type === 'confirm' ? (
                        <>
                            <button
                                className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
                                onClick={onClose}
                            >
                                {finalCancelText}
                            </button>
                            <button
                                className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-rose-600 rounded-none hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all active:scale-95"
                                onClick={() => {
                                    onConfirm?.();
                                    onClose();
                                }}
                            >
                                {finalConfirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            className="w-full px-6 py-3.5 text-sm font-bold text-white bg-primary rounded-none-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                            onClick={onClose}
                        >
                            {t('understood')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusModal;

