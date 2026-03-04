import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import {
    getPromotionCredits,
    sendPromotionAd,
    PromotionTargetType,
    PromotionCredits
} from '../api/promotions.api';
import toolsApi from '../../../services/tools.api';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface PromotionAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTarget?: PromotionTargetType;
    initialTargetIds?: string[];
}

export const PromotionAdModal: React.FC<PromotionAdModalProps> = ({
    isOpen,
    onClose,
    initialTarget = PromotionTargetType.ALL_CLIENTS,
    initialTargetIds = [],
}) => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const [title, setTitle] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [message, setMessage] = useState('');
    const [messageAr, setMessageAr] = useState('');
    const [targetType, setTargetType] = useState<PromotionTargetType>(initialTarget);
    const [credits, setCredits] = useState<PromotionCredits | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingCredits, setFetchingCredits] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCredits();
            setTargetType(initialTarget);
            setTitle('');
            setTitleAr('');
            setMessage('');
            setMessageAr('');
        }
    }, [isOpen, initialTarget]);

    const loadCredits = async () => {
        setFetchingCredits(true);
        try {
            const result = await getPromotionCredits();
            setCredits(result);
        } catch (err) {
            console.error('Failed to load credits', err);
        } finally {
            setFetchingCredits(false);
        }
    };

    const handleTranslate = async (sourceText: string, targetSetter: (val: string) => void, currentTargetValue: string) => {
        if (!sourceText) return;
        try {
            const res: any = await toolsApi.translate(sourceText, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;
            if (translated && !currentTargetValue) {
                targetSetter(translated);
            }
        } catch (error) {
            console.error("Translation error", error);
        }
    };

    const handleSend = async () => {
        if (!messageAr || !message) return;
        if (messageAr.length > 200 || message.length > 200) return;
        if (credits && credits.remaining === 0) return;

        setLoading(true);
        try {
            await sendPromotionAd({
                title,
                titleAr,
                message,
                messageAr,
                targetType,
                targetIds: targetType === PromotionTargetType.INDIVIDUALS ? initialTargetIds : undefined,
            });
            toast.success(t('promotions.success'));
            onClose();
        } catch (err: any) {
            console.error('Failed to send promotion', err);
            toast.error(err.response?.data?.message || t('promotions.error'));
        } finally {
            setLoading(false);
        }
    };

    const isAtLimit = credits?.remaining === 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('promotions.title')}
        >
            <div className="space-y-6 py-2">
                {/* Credits Status */}
                <div className={clsx(
                    "p-4 rounded-xl flex items-center justify-between border",
                    isAtLimit
                        ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20"
                        : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isAtLimit ? "bg-rose-500" : "bg-emerald-500"
                        )}>
                            <Megaphone className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <p className={clsx(
                                "text-xs font-bold uppercase tracking-wider",
                                isAtLimit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                                {t('promotions.usage')}
                            </p>
                            {fetchingCredits ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            ) : (
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('promotions.count', {
                                        used: credits?.used ?? 0,
                                        total: credits?.total === -1 ? '∞' : credits?.total || 0
                                    })}
                                </p>
                            )}
                        </div>
                    </div>

                    {isAtLimit && (
                        <div className="text-end">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                                {t('promotions.noCredits')}
                            </p>
                            <button
                                onClick={() => { onClose(); /* navigate to sub */ }}
                                className="text-[10px] font-black text-rose-600 underline uppercase mt-0.5"
                            >
                                {t('promotions.upgrade')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Title Input (Arabic) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.titleAr', 'Title (Arabic)')}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={titleAr}
                            onChange={(e) => setTitleAr(e.target.value.slice(0, 50))}
                            onBlur={(e) => handleTranslate(e.target.value, setTitle, title)}
                            placeholder={t('promotions.titleArPlaceholder', 'Enter Arabic title...')}
                            disabled={loading || isAtLimit}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Title Input (English) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.titleEn', 'Title (English)')}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                            placeholder={t('promotions.titleEnPlaceholder', 'Enter English title...')}
                            disabled={loading || isAtLimit}
                            className="w-full text-left bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all disabled:opacity-50"
                            dir="ltr"
                        />
                    </div>
                </div>

                {/* Message Input (Arabic) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.messageAr')}
                    </label>
                    <div className="relative">
                        <textarea
                            value={messageAr}
                            onChange={(e) => setMessageAr(e.target.value.slice(0, 200))}
                            onBlur={(e) => handleTranslate(e.target.value, setMessage, message)}
                            placeholder={t('promotions.messageArPlaceholder')}
                            rows={3}
                            disabled={loading || isAtLimit}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all resize-none disabled:opacity-50"
                        />
                        <div className={clsx(
                            "absolute bottom-3 end-3 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border shadow-sm",
                            messageAr.length >= 180 ? "text-rose-500 border-rose-100" : "text-slate-400 border-slate-100"
                        )}>
                            {t('promotions.characterLimit', { count: messageAr.length })}
                        </div>
                    </div>
                </div>

                {/* Message Input (English) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.messageEn')}
                    </label>
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                            placeholder={t('promotions.messageEnPlaceholder')}
                            rows={3}
                            disabled={loading || isAtLimit}
                            className="w-full text-left bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all resize-none disabled:opacity-50"
                            dir="ltr"
                        />
                        <div className={clsx(
                            "absolute bottom-3 end-3 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border shadow-sm",
                            message.length >= 180 ? "text-rose-500 border-rose-100" : "text-slate-400 border-slate-100"
                        )}>
                            {t('promotions.characterLimit', { count: message.length })}
                        </div>
                    </div>
                </div>

                {/* Target Info */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    <CheckCircle2 size={16} className="text-primary" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t('promotions.target')}: <span className="font-bold text-slate-900 dark:text-white uppercase">{t(`promotions.${targetType}`)}</span>
                        {targetType === PromotionTargetType.INDIVIDUALS && (
                            <span className="ms-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black">
                                {initialTargetIds.length}
                            </span>
                        )}
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSend}
                    disabled={loading || !message || isAtLimit}
                    className={clsx(
                        "w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0",
                        isAtLimit || !message
                            ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary/90"
                    )}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Megaphone size={16} />
                    )}
                    {loading ? t('promotions.sending') : t('promotions.send')}
                </button>
            </div>
        </Modal>
    );
};
