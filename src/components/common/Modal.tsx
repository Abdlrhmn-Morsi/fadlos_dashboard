import React from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '450px'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in animate-fade duration-300"
                onClick={onClose}
            />
            <div
                className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-700 shadow-2xl w-full relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden transition-colors"
                style={{ maxWidth }}
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{title}</h3>
                    <button
                        className="p-2 -mr-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-all"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="px-8 py-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

