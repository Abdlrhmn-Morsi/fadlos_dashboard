import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Download, 
    RefreshCw,
    Store,
    CreditCard,
    Calendar,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    RotateCcw
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { fetchAllSubscriptions } from '../api/analytics.api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import clsx from 'clsx';

// Simple debounce function to avoid lodash dependency
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

const AdminBillingTransactions: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common', 'subscriptions']);
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
    
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [cycleFilter, setCycleFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const loadData = async (params: any) => {
        setLoading(true);
        try {
            const response = await fetchAllSubscriptions(params);
            setData(response.data);
            setMeta(response.meta);
        } catch (err) {
            console.error('Failed to fetch subscriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    const debouncedFetch = useDebounce((params: any) => {
        loadData(params);
    }, 500);

    useEffect(() => {
        const params = {
            page,
            limit: 10,
            search,
            plan: planFilter,
            billingCycle: cycleFilter,
            startDate,
            endDate
        };
        
        if (search) {
            debouncedFetch(params);
        } else {
            loadData(params);
        }
    }, [page, planFilter, cycleFilter, search, startDate, endDate]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPlanFilter(e.target.value);
        setPage(1);
    };

    const handleCycleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCycleFilter(e.target.value);
        setPage(1);
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        setPage(1);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        setPage(1);
    };

    const handleRefresh = () => {
        loadData({
            page,
            limit: 10,
            search,
            plan: planFilter,
            billingCycle: cycleFilter
        });
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan.toLowerCase()) {
            case 'premium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            case 'pro': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'}
            className={clsx(
                "p-6 lg:p-10 space-y-8 animate-in fade-in duration-700",
                isRTL ? "text-right" : "text-left"
            )}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <CreditCard size={32} className="text-primary" />
                        {t('dashboard:billingTransactions')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                        {t('dashboard:billingTransactionsDesc')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    {/* Potential CSV export button */}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="xl:col-span-2 relative">
                    <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
                    <input 
                        type="text"
                        placeholder={t('dashboard:searchByStoreName')}
                        value={search}
                        onChange={handleSearchChange}
                        className={clsx(
                            "w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-slate-200",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    />
                </div>

                <div className="relative">
                    <Filter className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={16} />
                    <select 
                        value={planFilter}
                        onChange={handlePlanChange}
                        className={clsx(
                            "w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all dark:text-slate-200",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    >
                        <option value="all">{t('dashboard:allPlans')}</option>
                        <option value="free">{t('dashboard:free')}</option>
                        <option value="pro">{t('dashboard:pro')}</option>
                        <option value="premium">{t('dashboard:premium')}</option>
                    </select>
                </div>

                <div className="relative">
                    <Calendar className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={16} />
                    <select 
                        value={cycleFilter}
                        onChange={handleCycleChange}
                        className={clsx(
                            "w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all dark:text-slate-200",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    >
                        <option value="all">{t('dashboard:allCycles')}</option>
                        <option value="monthly">{t('dashboard:monthly')}</option>
                        <option value="yearly">{t('dashboard:yearly')}</option>
                        <option value="1_months">{t('dashboard:1_months')}</option>
                        <option value="3_months">{t('dashboard:3_months')}</option>
                        <option value="6_months">{t('dashboard:6_months')}</option>
                        <option value="12_months">{t('dashboard:12_months')}</option>
                    </select>
                </div>

                <div className="relative">
                    <label className={clsx(
                        "absolute -top-2 px-1 bg-white dark:bg-slate-900 text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider z-10",
                        isRTL ? "right-3" : "left-3"
                    )}>
                        {t('common:from')}
                    </label>
                    <Calendar className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500", isRTL ? "right-3" : "left-3")} size={16} />
                    <input 
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        className={clsx(
                            "w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-slate-200",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    />
                </div>

                <div className="relative">
                    <label className={clsx(
                        "absolute -top-2 px-1 bg-white dark:bg-slate-900 text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider z-10",
                        isRTL ? "right-3" : "left-3"
                    )}>
                        {t('common:to')}
                    </label>
                    <Calendar className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500", isRTL ? "right-3" : "left-3")} size={16} />
                    <input 
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        className={clsx(
                            "w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-slate-200",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className={clsx("px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                                    {t('dashboard:store')}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {t('common:plan')}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {t('dashboard:cycle')}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {t('dashboard:amount')}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {t('dashboard:date')}
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {t('common:status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : (data?.length ?? 0) > 0 ? (
                                data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                                                    {item.store?.logo ? (
                                                        <img src={item.store.logo} alt="Image" aria-hidden="true" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store size={20} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                        {isRTL ? item.store?.nameAr || item.store?.name : item.store?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[0.6875rem] font-bold border",
                                                getPlanBadgeColor(item.plan)
                                            )}>
                                                {t(`dashboard:${item.plan.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {t(`dashboard:${item.billingCycle.toLowerCase()}`)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-extrabold text-primary">
                                            {Number(item.amount) === 0 && item.paddleTransactionId?.startsWith('code:') ? (
                                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                                    {t('subscriptions:billingHistory.amountFree')}
                                                </span>
                                            ) : (
                                                <>{Number(item.amount).toFixed(2)} {t('common:systemCurrency')}</>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500 dark:text-slate-400">
                                            <div>{new Intl.DateTimeFormat(isRTL ? 'ar' : 'en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(item.createdAt))}</div>
                                            {item.paddleTransactionId?.startsWith('code:') && (
                                                <div className="text-[0.625rem] text-emerald-500 font-bold mt-0.5">
                                                    {t('subscriptions:billingHistory.promoCode')}: {item.paddleTransactionId.split(':')[1]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.625rem] font-extrabold uppercase",
                                                item.status === 'completed' 
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : item.status === 'refunded'
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {item.status === 'completed' && <CheckCircle2 size={12} />}
                                                {item.status === 'failed' && <XCircle size={12} />}
                                                {item.status === 'refunded' && <RotateCcw size={12} />}
                                                {t(`subscriptions:billingHistory.status_${item.status}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <Search size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                    {t('dashboard:noTransactionsFound')}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {t('dashboard:adjustFilters')}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && meta.totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {t('dashboard:showingItems', { 
                                from: (meta.page - 1) * meta.limit + 1, 
                                to: Math.min(meta.page * meta.limit, meta.total),
                                total: meta.total 
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={meta.page === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                            >
                                <ChevronLeft size={20} className={clsx(isRTL && "rotate-180")} />
                            </button>
                            
                            <div className="flex items-center gap-1 mx-2">
                                {Array.from({ length: meta.totalPages }).map((_, i) => {
                                    const p = i + 1;
                                    // Logic to show limited pages if totalPages is large
                                    if (
                                        meta.totalPages > 7 && 
                                        p !== 1 && 
                                        p !== meta.totalPages && 
                                        Math.abs(p - meta.page) > 2
                                    ) {
                                        if (p === 2 || p === meta.totalPages - 1) return <span key={p} className="px-1 text-slate-400">...</span>;
                                        return null;
                                    }
                                    
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={clsx(
                                                "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                                                meta.page === p 
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                    : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button 
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={meta.page === meta.totalPages}
                                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                            >
                                <ChevronRight size={20} className={clsx(isRTL && "rotate-180")} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBillingTransactions;
