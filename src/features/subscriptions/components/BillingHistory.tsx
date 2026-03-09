import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CreditCard,
    Calendar,
    DollarSign,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { getBillingHistory } from '../api/subscriptions.api';
import { useLanguage } from '../../../contexts/LanguageContext';

interface BillingItem {
    id: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    paddleTransactionId?: string;
    billingCycle?: string;
    periodStart?: string;
    periodEnd?: string;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

const ITEMS_PER_PAGE = 10;

const BillingHistory: React.FC = () => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const { isRTL } = useLanguage();
    const [history, setHistory] = useState<BillingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    const fetchHistory = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await getBillingHistory(pageNum, ITEMS_PER_PAGE);
            setHistory(response.data || []);
            setMeta(response.meta || null);
        } catch (error) {
            console.error('Failed to fetch billing history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(page);
    }, [page, fetchHistory]);

    const handlePrevPage = () => {
        if (meta?.hasPreviousPage) setPage((p) => p - 1);
    };

    const handleNextPage = () => {
        if (meta?.hasNextPage) setPage((p) => p + 1);
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'failed':
                return <XCircle size={16} className="text-rose-500" />;
            case 'refunded':
                return <RefreshCcw size={16} className="text-amber-500" />;
            default:
                return <Clock size={16} className="text-slate-400" />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'failed':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'refunded':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="p-8 flex justify-center items-center flex-col gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">{t('common:loading')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <CreditCard className="text-primary" size={28} />
                    {t('billingHistory.title')}
                </h1>
                <p className="text-slate-500 text-sm font-medium italic opacity-80">
                    {t('billingHistory.description')}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")} dir={isRTL ? 'rtl' : 'ltr'}>
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        {t('billingHistory.date')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={12} />
                                        {t('billingHistory.plan')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <RefreshCcw size={12} />
                                        {t('billingHistory.cycle')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} />
                                        {t('billingHistory.period')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={12} />
                                        {t('billingHistory.amount')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} />
                                        {t('billingHistory.status')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {history.length > 0 ? (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(item.createdAt))}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(item.createdAt))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                {t(`plans.${item.plan.toLowerCase()}.name`, { defaultValue: item.plan })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.billingCycle ? (
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                                                    {t(`subscriptions:${item.billingCycle.toLowerCase()}`)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.periodStart && item.periodEnd ? (
                                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex flex-col">
                                                    <span>{new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit' }).format(new Date(item.periodStart))}</span>
                                                    <span className="opacity-40">-</span>
                                                    <span>{new Intl.DateTimeFormat(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(item.periodEnd))}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-slate-900 dark:text-white">
                                                {Number(item.amount).toFixed(2)} {item.currency}
                                            </div>
                                            {item.paddleTransactionId && (
                                                <div className="text-[10px] text-slate-400 font-medium group-hover:text-primary transition-colors truncate max-w-[120px]">
                                                    ID: {item.paddleTransactionId}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all duration-300",
                                                getStatusClass(item.status)
                                            )}>
                                                {getStatusIcon(item.status)}
                                                {t(`billingHistory.status_${item.status.toLowerCase()}` as any) || item.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <CreditCard size={48} className="text-slate-300" />
                                            <p className="text-slate-500 font-bold">{t('billingHistory.noHistory')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="text-xs font-medium text-slate-500">
                            {t('common:pagination.showing', {
                                from: (meta.page - 1) * meta.limit + 1,
                                to: Math.min(meta.page * meta.limit, meta.total),
                                total: meta.total,
                                defaultValue: `${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`,
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={!meta.hasPreviousPage || loading}
                                className={clsx(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200",
                                    meta.hasPreviousPage && !loading
                                        ? "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
                                        : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                )}
                            >
                                {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                                    .filter((p) => {
                                        if (meta.totalPages <= 5) return true;
                                        if (p === 1 || p === meta.totalPages) return true;
                                        if (Math.abs(p - page) <= 1) return true;
                                        return false;
                                    })
                                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                            acc.push('...');
                                        }
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        typeof p === 'string' ? (
                                            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">...</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                disabled={loading}
                                                className={clsx(
                                                    "w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                                                    p === page
                                                        ? "bg-primary text-white shadow-md shadow-primary/30"
                                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={!meta.hasNextPage || loading}
                                className={clsx(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200",
                                    meta.hasNextPage && !loading
                                        ? "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary cursor-pointer"
                                        : "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                )}
                            >
                                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingHistory;
