import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Clock, ArrowLeft, Search, Users, User, Calendar,
    ChevronLeft, ChevronRight, RotateCcw, Megaphone,
    Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink
} from 'lucide-react';
import {
    getPromotionHistory,
    PromotionLogItem,
    sendPromotionAd,
    PromotionTargetType,
    getPromotionCredits,
    PromotionCredits
} from '../api/promotions.api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ResendConfirmationModal } from '../components/ResendConfirmationModal';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

const PromotionHistoryPage: React.FC = () => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();

    const [logs, setLogs] = useState<PromotionLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'clients'>('all');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [credits, setCredits] = useState<PromotionCredits | null>(null);

    // Resend State
    const [isResendModalOpen, setIsResendModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<PromotionLogItem | null>(null);
    const [isResending, setIsResending] = useState(false);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit: pageSize,
            };
            if (activeTab !== 'all') {
                params.type = activeTab;
            }
            const response = await getPromotionHistory(params);
            setLogs(response.data);
            setTotalItems(response.meta.totalItems);
            setTotalPages(response.meta.totalPages);
        } catch (error) {
            console.error('Failed to fetch promotion history:', error);
            toast.error(t('promotions.failedToFetchHistory', 'Failed to load promotion history'));
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, activeTab, t]);

    const fetchCredits = useCallback(async () => {
        try {
            const data = await getPromotionCredits();
            setCredits(data);
        } catch (error) {
            console.error('Failed to fetch credits:', error);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    const handleResendClick = (log: PromotionLogItem) => {
        setSelectedLog(log);
        setIsResendModalOpen(true);
    };

    const handleConfirmResend = async () => {
        if (!selectedLog) return;

        setIsResending(true);
        try {
            await sendPromotionAd({
                message: selectedLog.message,
                messageAr: selectedLog.messageAr,
                title: selectedLog.title,
                titleAr: selectedLog.titleAr,
                targetType: selectedLog.targetType as any,
                // For direct resends from logs, we're assuming the same target type criteria applies
            });
            toast.success(t('promotions.promotionSentSuccessfully', 'Promotion sent successfully!'));
            setIsResendModalOpen(false);
            fetchCredits();
            fetchHistory(); // Refresh to show new log entry
        } catch (error: any) {
            console.error('Failed to resend promotion:', error);
            const errorMsg = error.response?.data?.message || t('promotions.failedToResend', 'Failed to resend promotion');
            toast.error(errorMsg);
        } finally {
            setIsResending(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date),
            time: new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        };
    };


    const getCriteriaLabel = (type: string, criteria?: string) => {
        const val = (criteria || type).toLowerCase();
        let criteriaLabel = '';

        if (val.includes('all')) {
            criteriaLabel = t('promotions.targetTypes.send_to_everyone', 'Send to everyone');
        } else if (val.includes('top_spenders') || val.includes('first_n_spent')) {
            criteriaLabel = t('promotions.targetTypes.highest_lifetime_value', 'Highest lifetime value');
        } else if (val.includes('lowest_spenders') || val.includes('last_n_spent')) {
            criteriaLabel = t('promotions.targetTypes.lowest_lifetime_value', 'Lowest lifetime value');
        } else if (val.includes('most_active') || val.includes('first_n_orders')) {
            criteriaLabel = t('promotions.targetTypes.highest_orders', 'Highest number of orders');
        } else if (val.includes('least_active') || val.includes('last_n_orders')) {
            criteriaLabel = t('promotions.targetTypes.lowest_orders', 'Lowest number of orders');
        } else if (val.includes('earliest') || val.includes('first_n')) {
            criteriaLabel = t('promotions.targetTypes.earliest', 'Earliest followers');
        } else if (val.includes('recent') || val.includes('last_n')) {
            criteriaLabel = t('promotions.targetTypes.most_recent', 'Most recent followers');
        } else if (val.includes('individual') || val.includes('pick')) {
            criteriaLabel = t('promotions.targetTypes.pick_one_by_one', 'Pick one by one');
        }

        if (!criteriaLabel) return '-';

        return (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {criteriaLabel}
            </span>
        );
    };

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rtl:rotate-180"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-6 h-6 text-primary" />
                            {t('promotions.promotionAdHistory', 'Promotion History')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            {t('promotions.manageSentPromotions', 'View and manage your sent promotional ads')}
                        </p>
                    </div>
                </div>

                {credits && (
                    <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                {t('promotions.monthlyUsage', 'Total Usage this Month')}
                            </div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {credits.used} / {credits.total === -1 ? '∞' : credits.total}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl inline-flex w-full sm:w-auto">
                <button
                    onClick={() => { setActiveTab('all'); setPage(1); }}
                    className={clsx(
                        "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === 'all'
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    {t('promotions.all', 'All')}
                </button>
                <button
                    onClick={() => { setActiveTab('followers'); setPage(1); }}
                    className={clsx(
                        "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === 'followers'
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    {t('promotions.followers', 'Followers')}
                </button>
                <button
                    onClick={() => { setActiveTab('clients'); setPage(1); }}
                    className={clsx(
                        "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === 'clients'
                            ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    {t('promotions.storeClients', 'Clients')}
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-slate-400 font-medium">{t('common:loading')}</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {t('promotions.noHistoryFound', 'No promotion history found')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                            {t('promotions.noHistoryDesc', 'Start reaching out to your customers by sending your first promotional ad.')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-start">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-start">{t('promotions.date', 'Date')}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-start">{t('promotions.message_header', 'Message')}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-start">{t('promotions.type_header', 'Type')}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-start">{t('promotions.criteria_header', 'Criteria')}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-start">{t('promotions.recipients', 'Recipients')}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-end">{t('promotions.actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        {formatDate(log.createdAt).date}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(log.createdAt).time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 min-w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    {log.title && (
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                                            {isRTL ? log.titleAr || log.title : log.title}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {isRTL ? log.messageAr || log.message : log.message}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={clsx(
                                                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                                                    log.targetType.toLowerCase().includes('follower')
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                )}>
                                                    {log.targetType.toLowerCase().includes('follower')
                                                        ? t('promotions.followers', 'Followers')
                                                        : t('promotions.storeClients', 'Clients')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-start">
                                                {getCriteriaLabel(log.targetType, log.criteria)}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {log.targetCount}
                                                    </span>
                                                    <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                                                        {t('promotions.users', 'Users')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-end">
                                                <button
                                                    onClick={() => handleResendClick(log)}
                                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all transform active:scale-95 shadow-sm group-hover:shadow"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 rtl:-scale-x-100" />
                                                    {t('promotions.resend', 'Resend')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                                <div className="text-sm text-slate-500">
                                    {t('promotions.showing', 'Showing')} <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * pageSize + 1}</span> {t('promotions.to', 'to')} <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * pageSize, totalItems)}</span> {t('promotions.of', 'of')} <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm rtl:rotate-180"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-slate-400">...</span>}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={clsx(
                                                    "w-9 h-9 rounded-lg text-sm font-bold transition-all shadow-sm",
                                                    page === p
                                                        ? "bg-primary text-white shadow-primary/20 scale-110"
                                                        : "hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm rtl:rotate-180"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Resend Confirmation Modal */}
            <ResendConfirmationModal
                isOpen={isResendModalOpen}
                onClose={() => setIsResendModalOpen(false)}
                onConfirm={handleConfirmResend}
                isLoading={isResending}
                adTitle={isRTL ? selectedLog?.titleAr || selectedLog?.title || '' : selectedLog?.title || ''}
                adMessage={isRTL ? selectedLog?.messageAr || selectedLog?.message || '' : selectedLog?.message || ''}
                targetType={selectedLog?.targetType || ''}
                targetCount={selectedLog?.targetCount || 0}
                criteria={selectedLog?.criteria}
            />

        </div>
    );
};

export default PromotionHistoryPage;
