import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    CreditCard,
    Users,
    Store,
    Package,
    Truck,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    BarChart3,
    ShoppingBag,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { fetchSubscriptionAnalytics, fetchSystemAnalytics } from '../api/analytics.api';
import clsx from 'clsx';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const PLAN_COLORS: Record<string, string> = {
    free: '#94a3b8',
    pro: '#6366f1',
    premium: '#f59e0b',
};

const CYCLE_COLORS: Record<string, string> = {
    monthly: '#3b82f6',
    yearly: '#10b981',
};

const AdminAnalytics: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [subData, setSubData] = useState<any>(null);
    const [sysData, setSysData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'subscriptions' | 'system'>('subscriptions');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [sub, sys] = await Promise.all([
                    fetchSubscriptionAnalytics(startDate, endDate),
                    fetchSystemAnalytics(startDate, endDate),
                ]);
                setSubData(sub);
                setSysData(sys);
            } catch (err) {
                console.error('Failed to load admin analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [startDate, endDate]);

    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getDateRangeLabel = () => {
        if (!startDate && !endDate) return t('dashboard:allTime');
        const start = formatDate(startDate);
        const end = formatDate(endDate);
        if (startDate && endDate) return `${t('common:from')} ${start} ${t('common:to')} ${end}`;
        if (startDate) return `${t('common:from')} ${start}`;
        if (endDate) return `${t('common:to')} ${end}`;
        return t('dashboard:allTime');
    };

    if (loading) return <LoadingSpinner />;

    const totalPlanCount = (subData?.planDistribution || []).reduce((sum: number, p: any) => sum + p.count, 0);

    return (
        <div className="p-6 lg:p-10 space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <BarChart3 size={36} className="text-primary" />
                        {t('dashboard:adminAnalytics')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {t('dashboard:adminAnalyticsDesc')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[0.625rem] font-bold text-slate-400 uppercase">{t('common:from')}</span>
                            <Calendar size={14} className="text-slate-400 dark:text-slate-300" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28"
                            />
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[0.625rem] font-bold text-slate-400 uppercase">{t('common:to')}</span>
                            <Calendar size={14} className="text-slate-400 dark:text-slate-300" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button 
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-fit">
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={clsx(
                                "px-5 py-2.5 text-[0.625rem] font-extrabold uppercase tracking-widest transition-all",
                                activeTab === 'subscriptions'
                                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {t('dashboard:subscriptionAnalytics')}
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={clsx(
                                "px-5 py-2.5 text-[0.625rem] font-extrabold uppercase tracking-widest transition-all",
                                activeTab === 'system'
                                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {t('dashboard:systemAnalytics')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* SUBSCRIPTION ANALYTICS TAB                 */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === 'subscriptions' && subData && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total System Profit */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded border border-slate-100 dark:border-slate-800 shadow-sm transition-all  ">
                            <div className="flex items-start justify-between">
                                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                                        {t('dashboard:totalSystemProfit')}
                                    </p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {(subData.totalSystemProfit || 0).toLocaleString()} {t('common:systemCurrency')}
                                    </h3>
                                    <p className="text-[0.625rem] text-slate-400 mt-1 font-bold uppercase">{getDateRangeLabel()}</p>
                                </div>
                                <div className="w-12 h-12 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </div>

                        {/* This Month Revenue */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded border border-slate-100 dark:border-slate-800 shadow-sm transition-all  ">
                            <div className="flex items-start justify-between">
                                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                                        {(subData as any).isFiltered ? t('common:periodRevenue') : t('dashboard:thisMonthRevenue')}
                                    </p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {(subData.thisMonthRevenue || 0).toLocaleString()} {t('common:systemCurrency')}
                                    </h3>
                                    {!(subData as any).isFiltered && (
                                        <div className={clsx(
                                            "flex items-center gap-1 mt-2 text-[0.625rem] font-bold uppercase",
                                            (subData.revenueGrowth || 0) >= 0 ? "text-emerald-600" : "text-rose-600",
                                            isRTL && "flex-row-reverse"
                                        )}>
                                            {(subData.revenueGrowth || 0) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            {Math.abs(subData.revenueGrowth || 0).toFixed(1)}% {t('dashboard:vsLastMonth')}
                                        </div>
                                    )}
                                    {(subData as any).isFiltered && (
                                        <p className="text-[0.625rem] text-slate-400 mt-1 font-bold uppercase">{getDateRangeLabel()}</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Active Subscriptions */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded border border-slate-100 dark:border-slate-800 shadow-sm transition-all  ">
                            <div className="flex items-start justify-between">
                                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                                        {t('dashboard:activeSubscriptions')}
                                    </p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {subData.totalActiveSubscriptions || 0}
                                    </h3>
                                    <p className="text-[0.625rem] text-emerald-500 mt-1 font-bold uppercase">
                                        +{subData.newSubscriptionsThisMonth || 0} {(subData as any).isFiltered ? t('common:newInPeriod') : t('dashboard:newThisMonth')}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-sm">
                                    <CreditCard size={24} />
                                </div>
                            </div>
                        </div>

                        {/* This Month Transactions */}
                        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded border border-slate-100 dark:border-slate-800 shadow-sm transition-all  ">
                            <div className="flex items-start justify-between">
                                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                                        {(subData as any).isFiltered ? t('common:periodTransactions') : t('dashboard:monthlyTransactions')}
                                    </p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {subData.thisMonthTransactions || 0}
                                    </h3>
                                    {!(subData as any).isFiltered && (
                                        <p className="text-[0.625rem] text-slate-400 mt-1 font-bold uppercase">
                                            {t('dashboard:lastMonth')}: {subData.lastMonthTransactions || 0}
                                        </p>
                                    )}
                                    {(subData as any).isFiltered && (
                                        <p className="text-[0.625rem] text-slate-400 mt-1 font-bold uppercase">{getDateRangeLabel()}</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
                                    <Zap size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-8">
                        {/* Revenue Trend Chart */}
                        <div className="xl:col-span-2 lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                            <h3 className={clsx("text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-8", isRTL && "text-right")}>
                                {t('dashboard:subscriptionRevenueTrend')}
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={subData.monthlyRevenueTrend || []}>
                                        <defs>
                                            <linearGradient id="colorSubRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }}
                                            dy={10}
                                            reversed={isRTL}
                                            tickFormatter={(val) => {
                                                const d = new Date(val + '-01');
                                                return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short' });
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }}
                                            orientation={isRTL ? 'right' : 'left'}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                                border: '1px solid #10b98120',
                                                borderRadius: '0px',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: isDark ? '#e2e8f0' : '#1e293b',
                                                textAlign: isRTL ? 'right' : 'left'
                                            }}
                                            itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                            labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} ${t('common:systemCurrency')}`, t('dashboard:revenue')]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorSubRevenue)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Plan Distribution */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                            <h3 className={clsx("text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>
                                {t('dashboard:planDistribution')}
                            </h3>
                            <div className="flex items-center justify-center h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={subData.planDistribution || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="plan"
                                            animationDuration={1500}
                                        >
                                            {(subData.planDistribution || []).map((entry: any, index: number) => (
                                                <Cell key={index} fill={PLAN_COLORS[entry.plan?.toLowerCase()] || '#94a3b8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [value, t(`dashboard:plans.${String(name).toUpperCase()}`, { defaultValue: name })]}
                                            contentStyle={{
                                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                                border: 'none',
                                                borderRadius: '0px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: isDark ? '#e2e8f0' : '#1e293b'
                                            }}
                                            itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                            labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="space-y-3 mt-4">
                                {(subData.planDistribution || []).map((p: any) => (
                                    <div key={p.plan} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PLAN_COLORS[p.plan?.toLowerCase()] || '#94a3b8' }} />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{t(`dashboard:plans.${String(p.plan).toUpperCase()}`)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">{p.count}</span>
                                            <span className="text-[0.625rem] font-bold text-slate-400">
                                                ({totalPlanCount > 0 ? ((p.count / totalPlanCount) * 100).toFixed(0) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cycle Distribution */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                            <h3 className={clsx("text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>
                                {t('dashboard:cycleDistribution')}
                            </h3>
                            <div className="flex items-center justify-center h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={subData.cycleDistribution || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="billingCycle"
                                            animationDuration={1500}
                                        >
                                            {(subData.cycleDistribution || []).map((entry: any, index: number) => (
                                                <Cell key={index} fill={CYCLE_COLORS[entry.billingCycle?.toLowerCase()] || '#94a3b8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [value, t(`dashboard:${String(name).toLowerCase()}`, { defaultValue: name })]}
                                            contentStyle={{
                                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                                border: 'none',
                                                borderRadius: '0px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: isDark ? '#e2e8f0' : '#1e293b'
                                            }}
                                            itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                            labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div className="space-y-3 mt-4">
                                {(()=>{
                                    const totalCycleCount = (subData.cycleDistribution || []).reduce((sum: number, p: any) => sum + p.count, 0);
                                    return (subData.cycleDistribution || []).map((p: any) => (
                                        <div key={p.billingCycle} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CYCLE_COLORS[p.billingCycle?.toLowerCase()] || '#94a3b8' }} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                                    {t(`dashboard:${String(p.billingCycle).toLowerCase()}`, { defaultValue: p.billingCycle })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{p.count}</span>
                                                <span className="text-[0.625rem] font-bold text-slate-400">
                                                    ({totalCycleCount > 0 ? ((p.count / totalCycleCount) * 100).toFixed(0) : 0}%)
                                                </span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Recent Billing */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-primary" />
                                <h3 className={clsx("text-sm font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                                    {t('dashboard:recentBillings')}
                                </h3>
                            </div>
                            <Link
                                to="/billing-transactions"
                                className="text-[0.625rem] font-extrabold uppercase tracking-widest text-primary hover:underline"
                            >
                                {t('common:viewAll')}
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className={clsx("w-full text-sm whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                                <thead className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                                    <tr>
                                        <th className={clsx("px-6 py-3 font-extrabold", isRTL ? "text-right" : "text-left")}>{t('dashboard:storeName')}</th>
                                        <th className={clsx("px-6 py-3 font-extrabold", isRTL ? "text-right" : "text-left")}>{t('common:plan')}</th>
                                        <th className={clsx("px-6 py-3 font-extrabold", isRTL ? "text-right" : "text-left")}>{t('dashboard:billingCycle')}</th>
                                        <th className={clsx("px-6 py-3 font-extrabold", isRTL ? "text-right" : "text-left")}>{t('dashboard:amount')}</th>
                                        <th className={clsx("px-6 py-3 font-extrabold", isRTL ? "text-left" : "text-right")}>{t('common:date')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                                    {(!subData.recentBillings || subData.recentBillings.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic font-medium">
                                                {t('common:noData')}
                                            </td>
                                        </tr>
                                    ) : (
                                        subData.recentBillings.map((b: any) => (
                                            <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className={clsx("px-6 py-4 font-bold text-slate-800 dark:text-slate-200", isRTL ? "text-right" : "text-left")}>
                                                    {isRTL ? b.storeNameAr || b.storeName : b.storeName}
                                                </td>
                                                <td className={clsx("px-6 py-4", isRTL ? "text-right" : "text-left")}>
                                                    <span
                                                        className="px-2 py-0.5 text-[0.625rem] font-extrabold uppercase rounded"
                                                        style={{
                                                            backgroundColor: (PLAN_COLORS[b.plan?.toLowerCase()] || '#94a3b8') + '20',
                                                            color: PLAN_COLORS[b.plan?.toLowerCase()] || '#94a3b8',
                                                        }}
                                                    >
                                                        {t(`dashboard:plans.${String(b.plan).toUpperCase()}`)}
                                                    </span>
                                                </td>
                                                <td className={clsx("px-6 py-4 text-xs font-bold uppercase text-slate-500", isRTL ? "text-right" : "text-left")}>
                                                    {b.billingCycle ? t(`dashboard:${String(b.billingCycle).toLowerCase()}`) : '—'}
                                                </td>
                                                <td className={clsx("px-6 py-4 font-extrabold text-emerald-600", isRTL ? "text-right" : "text-left")}>
                                                    {(b.amount || 0).toLocaleString()} {t('common:systemCurrency')}
                                                </td>
                                                <td className={clsx("px-6 py-4 text-[0.6875rem] font-bold tracking-tight text-slate-400 uppercase tabular-nums", isRTL ? "text-left" : "text-right")}>
                                                    {new Date(b.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* SYSTEM ANALYTICS TAB                       */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === 'system' && sysData && (
                <div className="space-y-8">
                    {/* System Totals Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                            { label: t('dashboard:platformUsers'), value: sysData.totals?.users || 0, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
                            { label: t('dashboard:totalStores'), value: sysData.totals?.stores || 0, icon: Store, color: 'text-primary bg-primary/10' },
                            { label: t('dashboard:totalOrders'), value: sysData.totals?.orders || 0, icon: ShoppingBag, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400' },
                            { label: t('dashboard:totalProducts'), value: sysData.totals?.products || 0, icon: Package, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' },
                            { label: t('dashboard:totalCustomers'), value: sysData.totals?.customers || 0, icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
                            { label: t('dashboard:platformDrivers'), value: sysData.totals?.drivers || 0, icon: Truck, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' },
                            { label: t('dashboard:totalTowns'), value: sysData.totals?.towns || 0, icon: MapPin, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                                <div className={clsx("w-10 h-10 rounded mx-auto mb-2 flex items-center justify-center", item.color)}>
                                    <item.icon size={18} />
                                </div>
                                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">{item.value.toLocaleString()}</h4>
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">{item.label}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 opacity-60">{getDateRangeLabel()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Growth Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                        <h3 className={clsx("text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-2", isRTL && "text-right")}>
                            {t('dashboard:platformGrowthTrend')}
                        </h3>
                        <p className={clsx("text-xs text-slate-400 font-medium mb-8", isRTL && "text-right")}>
                            {t('dashboard:last6Months')}
                        </p>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sysData.monthlyGrowth || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }}
                                        dy={10}
                                        reversed={isRTL}
                                        tickFormatter={(val) => {
                                            const d = new Date(val + '-01');
                                            return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short' });
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }}
                                        orientation={isRTL ? 'right' : 'left'}
                                    />
                                    <Tooltip
                                        cursor={{ fill: gridColor }}
                                        contentStyle={{
                                            backgroundColor: isDark ? '#1e293b' : '#fff',
                                            border: 'none',
                                            borderRadius: '0px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            textAlign: isRTL ? 'right' : 'left',
                                            color: isDark ? '#f1f5f9' : '#0f172a'
                                        }}
                                        itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                                        labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                                    />
                                    <Bar dataKey="newUsers" name={t('dashboard:newUsers')} fill="#3b82f6" radius={[2, 2, 0, 0]} animationDuration={1500} />
                                    <Bar dataKey="newStores" name={t('dashboard:newStores')} fill="#FF5C00" radius={[2, 2, 0, 0]} animationDuration={1500} />
                                    <Bar dataKey="newOrders" name={t('dashboard:newOrders')} fill="#8b5cf6" radius={[2, 2, 0, 0]} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                                <span className="text-[0.625rem] font-bold uppercase text-slate-400">{t('dashboard:newUsers')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-primary" />
                                <span className="text-[0.625rem] font-bold uppercase text-slate-400">{t('dashboard:newStores')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-violet-500" />
                                <span className="text-[0.625rem] font-bold uppercase text-slate-400">{t('dashboard:newOrders')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Distributions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Store Status Distribution */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                            <h3 className={clsx("text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>
                                {t('dashboard:storeStatusDistribution')}
                            </h3>
                            <div className="space-y-4">
                                {(sysData.storeStatusDistribution || []).map((item: any) => {
                                    const totalStores = sysData.totals?.stores || 1;
                                    const pct = ((item.count / totalStores) * 100).toFixed(0);
                                    const statusColors: Record<string, string> = {
                                        active: 'bg-emerald-500',
                                        pending: 'bg-amber-500',
                                        suspended: 'bg-rose-500',
                                        rejected: 'bg-red-600',
                                    };
                                    return (
                                        <div key={item.status} className="space-y-2">
                                            <div className={clsx("flex justify-between text-[0.625rem] font-extrabold uppercase tracking-wider", isRTL && "flex-row-reverse")}>
                                                <span className="text-slate-500">{t(`dashboard:storeStatuses.${item.status}`)}</span>
                                                <span className="text-slate-900 dark:text-slate-100">{item.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-full">
                                                <div
                                                    className={clsx("h-full transition-all duration-1000 rounded-full", statusColors[item.status] || 'bg-slate-400')}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* User Role Distribution */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm p-8">
                            <h3 className={clsx("text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>
                                {t('dashboard:userRoleDistribution')}
                            </h3>
                            <div className="space-y-4">
                                {(sysData.userRoleDistribution || []).map((item: any) => {
                                    const totalUsers = sysData.totals?.users || 1;
                                    const pct = ((item.count / totalUsers) * 100).toFixed(0);
                                    const roleColors: Record<string, string> = {
                                        customer: 'bg-blue-500',
                                        store_owner: 'bg-primary',
                                        employee: 'bg-violet-500',
                                        delivery: 'bg-orange-500',
                                        super_admin: 'bg-rose-500',
                                        admin: 'bg-indigo-500',
                                    };
                                    return (
                                        <div key={item.role} className="space-y-2">
                                            <div className={clsx("flex justify-between text-[0.625rem] font-extrabold uppercase tracking-wider", isRTL && "flex-row-reverse")}>
                                                <span className="text-slate-500">{t(`dashboard:roles.${item.role}`)}</span>
                                                <span className="text-slate-900 dark:text-slate-100">{item.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-full">
                                                <div
                                                    className={clsx("h-full transition-all duration-1000 rounded-full", roleColors[item.role] || 'bg-slate-400')}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;
