import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateStoreStatus } from '../api/stores.api';
import { toast } from '../../../utils/toast';
import { useLanguage } from '../../../contexts/LanguageContext';

interface StoreStatusModalProps {
    store: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const StoreStatusModal: React.FC<StoreStatusModalProps> = ({ store, isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation(['stores', 'common']);
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: store?.status?.toLowerCase() || 'pending',
        reason: store?.statusReason || ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateStoreStatus(store.id, formData);
            toast.success('Store status updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to update store status:', error);
            const msg = error.response?.data?.message || 'Failed to update status';
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    const statuses = [
        { id: 'active', label: t('common:active'), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { id: 'pending', label: t('common:pending'), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { id: 'suspended', label: t('common:suspended'), icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        { id: 'inactive', label: t('common:inactive'), icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4px] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-[4px]">
                            <Clock className="text-primary" size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('common:updateStatus')}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ms-1">{t('common:operationalState')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {statuses.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s.id })}
                                    className={`flex items-center gap-3 p-3 border transition-all rounded-[4px] ${formData.status === s.id
                                        ? `border-primary ring-4 ring-primary/5 ${s.bg}`
                                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <s.icon size={18} className={formData.status === s.id ? 'text-primary' : s.color} />
                                    <span className={`text-sm font-bold ${formData.status === s.id ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between ms-1">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('common:reasonNotes')}</label>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t('common:optional')}</span>
                        </div>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[4px] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-900 dark:text-white text-sm min-h-[120px] resize-none placeholder:text-slate-400"
                            placeholder={t('common:statusReasonPlaceholder')}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                        <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[4px]">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 dark:text-amber-400/80 font-medium leading-relaxed">
                                {t('common:storeOwnerVisibilityNote')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-[4px]"
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-3 bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 rounded-[4px]"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-[4px] animate-spin" />
                            ) : (
                                t('common:updateStatus')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoreStatusModal;
