import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    AlertCircle,
    Calendar,
    Users2,
    MapPin
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchOrderStats, fetchProductMerchantStats, fetchCustomerAnalytics } from './api/analytics.api';
import clsx from 'clsx';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    growth?: number;
    icon: any;
    color: 'emerald' | 'blue' | 'orange' | 'amber' | 'rose' | 'indigo' | 'violet';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, growth, icon: Icon, color }) => {
    const { isRTL } = useLanguage();
    const { t } = useTranslation('common');

    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 border-violet-100 dark:border-violet-800',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-none", colorClasses[color])}>
                    <Icon size={24} />
                </div>
                {growth !== undefined && (
                    <div className={clsx(
                        "flex items-center gap-1 text-xs font-bold px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                        growth >= 0 ? "text-emerald-500" : "text-rose-500",
                        isRTL && "flex-row-reverse"
                    )}>
                        {growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(growth).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{value}</h3>
                {subValue && <p className="text-xs text-slate-400 mt-2 font-medium">{subValue}</p>}
            </div>
        </div>
    );
};

const Analytics: React.FC = () => {
    const { t } = useTranslation('common');
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();
    const [period, setPeriod] = useState('7d');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [orderStats, setOrderStats] = useState<any>(null);
    const [merchantStats, setMerchantStats] = useState<any>(null);
    const [customerStats, setCustomerStats] = useState<any>(null);

    useEffect(() => {
        const loadStats = async () => {
            // Only fetch if not custom OR if both dates are set for custom
            if (period === 'custom' && (!startDate || !endDate)) return;

            setLoading(true);
            try {
                const [orders, merchant, customers] = await Promise.all([
                    fetchOrderStats(period, startDate, endDate),
                    fetchProductMerchantStats(startDate, endDate),
                    fetchCustomerAnalytics(period === 'all' ? '30d' : period, startDate, endDate)
                ]);
                setOrderStats(orders);
                setMerchantStats(merchant);
                setCustomerStats(customers);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [period, startDate, endDate]);

    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    if (loading && !orderStats) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6 lg:p-10 space-y-10 animate-in fade-in duration-700">
            {/* Header & Period Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                        <TrendingUp size={36} className="text-primary" />
                        {t('analytics')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {t('performanceSummary')}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 w-fit">
                        {[
                            { id: 'today', label: t('today') },
                            { id: '7d', label: t('last_7_days') },
                            { id: '30d', label: t('last_30_days') },
                            { id: 'this_month', label: t('this_month') },
                            { id: 'all', label: t('all_time') },
                            { id: 'custom', label: t('custom') }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={clsx(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                    period === p.id
                                        ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {period === 'custom' && (
                        <div className={clsx(
                            "flex items-center gap-3 animate-in slide-in-from-top-2 duration-300",
                            isRTL && "flex-row-reverse"
                        )}>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <span className="text-slate-400 font-black">→</span>
                            <div className="relative group">
                                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Level Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={t('revenue')}
                    value={`${(orderStats?.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                    growth={orderStats?.comparison?.revenueGrowth}
                    subValue={t('previousPeriod')}
                    icon={DollarSign}
                    color="emerald"
                />
                <StatCard
                    title={t('totalOrdersCount')}
                    value={orderStats?.totalOrders || 0}
                    growth={orderStats?.comparison?.ordersGrowth}
                    subValue={t('previousPeriod')}
                    icon={ShoppingBag}
                    color="orange"
                />
                <StatCard
                    title={t('averageOrderValue')}
                    value={`${(orderStats?.averageOrderValue || 0).toFixed(2)} ${t('common:currencySymbol')}`}
                    icon={TrendingUp}
                    color="amber"
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={clsx("text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                                {t('revenueTrend')}
                            </h3>
                            <p className={clsx("text-xs text-slate-400 font-medium", isRTL && "text-right")}>
                                {period === 'today' ? t('hourly_breakdown') : t('daily_performance')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-primary" />
                            <span className="text-[10px] font-bold uppercase text-slate-400">{t('revenue')}</span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={orderStats?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 10, fontWeight: 'bold' }}
                                    dy={10}
                                    reversed={isRTL}
                                    tickFormatter={(str) => {
                                        const parts = str.split('-');
                                        if (parts.length === 3) return parseInt(parts[2], 10).toString();
                                        return str;
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
                                        border: '1px solid #FF5C0020',
                                        borderRadius: '0px',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                    itemStyle={{ color: '#FF5C00' }}
                                    labelFormatter={(label) => {
                                        const parts = label.split('-');
                                        if (parts.length === 3) {
                                            const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                        }
                                        return label;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#FF5C00"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Peak Ordering Times */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={clsx("text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                                {t('peakTimes')}
                            </h3>
                            <p className={clsx("text-xs text-slate-400 font-medium", isRTL && "text-right")}>
                                {t('orderDistribution')}
                            </p>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orderStats?.peakTimes?.hourly || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="hour"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 9 }}
                                    dy={10}
                                    tickFormatter={(h) => {
                                        const hour = parseInt(h, 10);
                                        const isPm = hour >= 12;
                                        const displayHour = hour % 12 || 12;
                                        const suffix = isPm ? t('common:pm') : t('common:am');
                                        return `${displayHour} ${suffix}`;
                                    }}
                                    reversed={isRTL}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 10 }}
                                    orientation={isRTL ? 'right' : 'left'}
                                />
                                <Tooltip
                                    cursor={{ fill: gridColor }}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        border: 'none',
                                        borderRadius: '0px',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                />
                                <Bar dataKey="count" fill="#4f46e5" radius={[2, 2, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Second Row: Products and Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Best Sellers */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <h3 className={clsx("text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>
                        {t('topProducts')}
                    </h3>
                    <div className="space-y-4">
                        {merchantStats?.bestSellers?.map((product: any, idx: number) => (
                            <div key={product.id} className={clsx(
                                "flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:border-primary/50",
                                isRTL && "flex-row-reverse"
                            )}>
                                <div className="w-12 h-12 bg-white dark:bg-slate-700 flex items-center justify-center font-black text-primary border border-slate-200 dark:border-slate-600">
                                    #{idx + 1}
                                </div>
                                {product.coverImage && (
                                    <img src={product.coverImage} className="w-12 h-12 object-cover" alt="" />
                                )}
                                <div className={clsx("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                                        {isRTL ? product.nameAr || product.name : product.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        {product.totalSold} {t('unitsSold')}
                                    </p>
                                </div>
                                <div className={clsx("text-right font-black text-slate-900 dark:text-slate-100", isRTL && "text-left")}>
                                    {Number(product.price).toLocaleString()} {t('common:currencySymbol')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <h3 className={clsx("text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-8", isRTL && "text-right")}>
                        {t('orderStatus')}
                    </h3>
                    <div className="space-y-6">
                        {[
                            { id: 'pending', color: 'bg-amber-500' },
                            { id: 'confirmed', color: 'bg-blue-500' },
                            { id: 'preparing', color: 'bg-indigo-500' },
                            { id: 'ready', color: 'bg-violet-500' },
                            { id: 'delivered', color: 'bg-emerald-500' },
                            { id: 'cancelled', color: 'bg-rose-500' }
                        ].map((statusObj) => {
                            const status = statusObj.id;
                            const count = orderStats?.statusCounts?.[status] || 0;
                            const percentage = (count / (orderStats?.totalOrders || 1)) * 100;
                            return (
                                <div key={status} className="space-y-2">
                                    <div className={clsx("flex justify-between text-[10px] font-black uppercase tracking-wider", isRTL && "flex-row-reverse")}>
                                        <span className="text-slate-500">{t(`common:${status}`)}</span>
                                        <span className="text-slate-900 dark:text-slate-100">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full transition-all duration-1000",
                                                statusObj.color
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Inventory Alerts Shortcut */}
                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className={clsx("flex flex-col gap-4", isRTL && "text-right")}>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                                <AlertCircle size={16} />
                                {t('inventoryAlerts')}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50">
                                    <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">{t('outOfStock')}</p>
                                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{merchantStats?.outOfStock?.length || 0}</p>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">{t('lowStock')}</p>
                                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-none">
                                            {t('lessThanFive')}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{merchantStats?.lowStock?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Third Row: Customer Insights */}
            <div className="pb-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className={clsx("text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('customerInsights')}
                        </h3>
                        <Users2 size={24} className="text-primary opacity-20" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-[10px] font-black uppercase text-slate-400 mb-2">{t('avgOrdersPerCustomer')}</span>
                            <span className="text-4xl font-black text-primary">{(customerStats?.averageOrdersPerCustomer || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-[10px] font-black uppercase text-slate-400 mb-2">{t('newCustomers')}</span>
                            <span className="text-4xl font-black text-emerald-500">{customerStats?.newClients || 0}</span>
                        </div>
                        <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-[10px] font-black uppercase text-slate-400 mb-2">{t('returningCustomers')}</span>
                            <span className="text-4xl font-black text-indigo-500">{customerStats?.returningClients || 0}</span>
                        </div>
                    </div>

                    {/* Customer Segments Chart (Simple Bar) */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <h4 className={clsx("text-xs font-black uppercase tracking-widest text-slate-400", isRTL && "text-right")}>{t('segments')}</h4>
                            {[
                                { label: t('vipClients'), desc: t('vipDescription'), value: customerStats?.vipClients || 0, color: 'bg-violet-500' },
                                { label: t('regularClients'), desc: t('regularDescription'), value: customerStats?.regularClients || 0, color: 'bg-blue-500' },
                                { label: t('newClients'), desc: t('newDescription'), value: customerStats?.newClients || 0, color: 'bg-emerald-500' }
                            ].map(seg => (
                                <div key={seg.label} className="flex items-center gap-4">
                                    <div className={clsx("w-3 h-3 shrink-0", seg.color)} />
                                    <div className="flex flex-col min-w-[120px]">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{seg.label}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">{seg.desc}</span>
                                    </div>
                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={clsx("h-full", seg.color)}
                                            style={{ width: `${(seg.value / (customerStats?.totalClients || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{seg.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="relative flex items-center justify-center h-48">
                            <div className="absolute inset-0 flex items-center justify-center flex-col z-0">
                                <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{customerStats?.totalClients}</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{t('totalClients')}</span>
                            </div>
                            {/* Decorative ring */}
                            <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 dark:border-slate-800" />
                        </div>
                    </div>
                </div>

                {/* Geo-Performance (Towns & Places) */}
                <div className="bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className={clsx("text-lg font-black text-slate-900 dark:text-slate-100", isRTL && "text-right")}>{t('geoPerformance')}</h3>
                            <p className={clsx("text-xs text-slate-400 mt-1", isRTL && "text-right")}>{t('orderDistribution')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                            <MapPin size={24} className="text-primary opacity-20" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Top Towns */}
                        <div className="space-y-6">
                            <h4 className={clsx("text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2", isRTL && "text-right")}>
                                {t('topTowns')}
                            </h4>
                            <div className="space-y-4">
                                {(orderStats?.geoPerformance?.topTowns || []).map((town: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {isRTL ? town.ar : town.en}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-600">{town.delivered}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    <span className="text-[10px] font-black text-rose-600">{town.cancelled}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary ml-2">
                                                    {town.total} {t('ordersCount')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/40 rounded-full"
                                                style={{ width: `${(town.total / (orderStats?.geoPerformance?.topTowns[0]?.total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!orderStats?.geoPerformance?.topTowns || orderStats.geoPerformance.topTowns.length === 0) && (
                                    <div className="py-8 text-center text-slate-400 text-xs italic">{t('noData')}</div>
                                )}
                            </div>
                        </div>

                        {/* Top Places */}
                        <div className="space-y-6">
                            <h4 className={clsx("text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2", isRTL && "text-right")}>
                                {t('topPlaces')}
                            </h4>
                            <div className="space-y-4">
                                {(orderStats?.geoPerformance?.topPlaces || []).map((place: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {isRTL ? place.ar : place.en}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-600">{place.delivered}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                    <span className="text-[10px] font-black text-rose-600">{place.cancelled}</span>
                                                </div>
                                                <span className="text-xs font-black text-indigo-500 ml-2">
                                                    {place.total} {t('ordersCount')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1 bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500/40 rounded-full"
                                                style={{ width: `${(place.total / (orderStats?.geoPerformance?.topPlaces[0]?.total || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!orderStats?.geoPerformance?.topPlaces || orderStats.geoPerformance.topPlaces.length === 0) && (
                                    <div className="py-8 text-center text-slate-400 text-xs italic">{t('noData')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
