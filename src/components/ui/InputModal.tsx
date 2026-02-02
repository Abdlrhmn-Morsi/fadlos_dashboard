import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

import { useTranslation } from 'react-i18next';

const InputModal: React.FC<InputModalProps> = ({
    isOpen,
    title,
    message,
    placeholder = 'Enter value...',
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel
}) => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) setValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    const finalSubmitLabel = submitLabel || t('submit');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value);
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in animate-fade duration-300"
                onClick={isLoading ? undefined : onCancel}
            />
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {message && <p className="text-slate-500 dark:text-slate-400 mb-4">{message}</p>}

                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        disabled={isLoading}
                        className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white mb-6"
                        required
                    />

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !value.trim()}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                        >
                            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>}
                            {finalSubmitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InputModal;
