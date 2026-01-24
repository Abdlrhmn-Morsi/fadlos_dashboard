import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
    type = 'info'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle className="text-rose-500" size={32} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={32} />;
            default: return <AlertCircle className="text-indigo-500" size={32} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in animate-fade duration-300"
                onClick={isLoading ? undefined : onCancel}
            />
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-rose-50 dark:bg-rose-900/20' : type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                            {getIcon()}
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 flex items-center gap-2 ${type === 'danger'
                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 hover:shadow-rose-500/30'
                                    : type === 'warning'
                                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 hover:shadow-amber-500/30'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
