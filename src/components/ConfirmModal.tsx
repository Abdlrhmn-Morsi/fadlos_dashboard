// src/components/ConfirmModal.tsx
import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title = 'Confirm',
    message,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">
                    {title}
                </h2>
                <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-primary text-white rounded"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
