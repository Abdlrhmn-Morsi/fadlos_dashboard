import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ResendConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    adTitle: string;
    adMessage: string;
    targetType: string;
    targetCount: number;
    criteria?: string;
}

export const ResendConfirmationModal: React.FC<ResendConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    adTitle,
    adMessage,
    targetType,
    targetCount,
    criteria,
}) => {
    const { t } = useTranslation(['subscriptions', 'common']);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {t('promotions.resendPromotionConfirmTitle', 'Resend Promotion')}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {t('promotions.resendPromotionConfirmDesc', 'Are you sure you want to send this promotion again? This will use your monthly promotion credits.')}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
                        {adTitle && (
                            <div className="mb-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                                    {t('promotions.title_label', 'Title')}
                                </span>
                                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 italic">
                                    "{adTitle}"
                                </p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                                {t('promotions.message_header', 'Message')}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 italic">
                                "{adMessage}"
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500">{t('promotions.target_header', 'Target')}</span>
                            <div className="flex flex-col items-end">
                                <span className="font-medium text-slate-900 dark:text-white capitalize">
                                    {t(`promotions.targetTypes.${targetType}`, targetType.replace(/_/g, ' '))}
                                </span>
                                {(() => {
                                    const val = (criteria || targetType).toLowerCase();
                                    let label = '';
                                    if (val.includes('all')) label = t('promotions.targetTypes.send_to_everyone', 'Send to everyone');
                                    else if (val.includes('top_spenders') || val.includes('first_n_spent')) label = t('promotions.targetTypes.highest_lifetime_value', 'Highest lifetime value');
                                    else if (val.includes('lowest_spenders') || val.includes('last_n_spent')) label = t('promotions.targetTypes.lowest_lifetime_value', 'Lowest lifetime value');
                                    else if (val.includes('most_active') || val.includes('first_n_orders')) label = t('promotions.targetTypes.highest_orders', 'Highest number of orders');
                                    else if (val.includes('least_active') || val.includes('last_n_orders')) label = t('promotions.targetTypes.lowest_orders', 'Lowest number of orders');
                                    else if (val.includes('earliest') || val.includes('first_n')) label = t('promotions.targetTypes.earliest', 'Earliest followers');
                                    else if (val.includes('recent') || val.includes('last_n')) label = t('promotions.targetTypes.most_recent', 'Most recent followers');
                                    else if (val.includes('individual') || val.includes('pick')) label = t('promotions.targetTypes.pick_one_by_one', 'Pick one by one');

                                    return label ? (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {label}
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">{t('promotions.recipients', 'Recipients')}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {targetCount} {t('promotions.users', 'Users')}
                            </span>
                        </div>

                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all shadow-md shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                t('promotions.resendNow', 'Resend Now')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
