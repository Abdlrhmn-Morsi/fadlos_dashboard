import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { LucideIcon, TrendingUp, Users, ShoppingBag, DollarSign, Store, Heart, Star, Layers, ShieldAlert, AlertTriangle, Info, Clock, Edit } from 'lucide-react';
import { fetchDashboardStats } from './api/dashboard.api';
import { getMyStore } from '../stores/api/stores.api';
import { UserRole } from '../../types/user-role';
import {
    dashboardStatsState,
    dashboardLoadingState,
    dashboardErrorState,
    dashboardChartDataState
} from './store/dashboard.store';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    change: string;
    icon: LucideIcon;
    color: string;
    comparisonText: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color, comparisonText }) => {
    const { isRTL } = useLanguage();
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-none flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={24} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <TrendingUp size={14} className={isRTL ? "rotate-180" : ""} /> {change}
                </span>
                <span className="text-slate-400 dark:text-slate-500">{comparisonText}</span>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useRecoilState(dashboardStatsState);
    const [loading, setLoading] = useRecoilState(dashboardLoadingState);
    const [error, setError] = useRecoilState(dashboardErrorState);
    const [chartData, setChartData] = useRecoilState(dashboardChartDataState);
    const [storeDetails, setStoreDetails] = useState<any>(null);

    const { user } = useAuth();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return; // Add check
            setLoading(true);
            try {

                const dashboardData = await fetchDashboardStats(user);
                setStats(dashboardData);

                // Update chart data
                setChartData([
                    { name: t('week', { number: 1 }), revenue: (dashboardData.totalRevenue || 0) * 0.1 },
                    { name: t('week', { number: 2 }), revenue: (dashboardData.totalRevenue || 0) * 0.2 },
                    { name: t('week', { number: 3 }), revenue: (dashboardData.totalRevenue || 0) * 0.3 },
                    { name: t('week', { number: 4 }), revenue: (dashboardData.totalRevenue || 0) * 0.4 },
                ]);

                // Fetch store details for sellers
                if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) {
                    const storeData = await getMyStore();
                    setStoreDetails(storeData);
                }

                setError(null);
            } catch (err: any) {
                console.error("Dashboard enhancement error:", err);
                setError(t('failedToLoad') + " " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [setStats, setLoading, setError, setChartData, user, t]); // Add user and t to deps

    // Dynamic Chart Colors
    const gridColor = isDark ? '#334155' : '#f1f5f9'; // slate-700 : slate-100
    const tooltipBg = isDark ? '#1e293b' : '#ffffff'; // slate-800 : white
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
    const textColor = isDark ? '#94a3b8' : '#94a3b8'; // slate-400
    const cursorFill = isDark ? '#334155' : '#f8fafc'; // slate-700 : slate-50

    if (loading || !user) return (
        <div className="flex items-center justify-center min-h-[50vh] p-6 animate-pulse">
            <div className="text-slate-500 font-medium">{t('common:loading')}</div>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-none text-rose-600 font-medium m-6">
            {error}
        </div>
    );

    const renderStatusBanner = () => {
        if (!storeDetails || storeDetails.status?.toUpperCase() === 'ACTIVE') return null;

        const status = storeDetails.status?.toUpperCase();
        const reason = storeDetails.statusReason;

        let bgColor = "bg-amber-50 dark:bg-amber-900/20";
        let borderColor = "border-amber-200 dark:border-amber-800";
        let textColor = "text-amber-800 dark:text-amber-300";
        let iconColor = "text-amber-500";
        let label = t('common:underReview');
        let Icon = Clock;

        if (status === 'SUSPENDED') {
            bgColor = "bg-rose-50 dark:bg-rose-900/20";
            borderColor = "border-rose-200 dark:border-rose-800";
            textColor = "text-rose-800 dark:text-rose-300";
            iconColor = "text-rose-500";
            label = t('common:accountSuspended');
            Icon = ShieldAlert;
        } else if (status === 'INACTIVE') {
            bgColor = "bg-slate-50 dark:bg-slate-800";
            borderColor = "border-slate-200 dark:border-slate-700";
            textColor = "text-slate-800 dark:text-slate-300";
            iconColor = "text-slate-500";
            label = t('common:accountInactive');
            Icon = AlertTriangle;
        }

        return (
            <div className={clsx(
                bgColor, borderColor, "border rounded-none p-5 flex gap-4 animate-in slide-in-from-top-4 duration-500",
                isRTL && "flex-row-reverse"
            )}>
                <div className={`p-3 rounded-none bg-white/50 dark:bg-black/20 ${iconColor} h-fit`}>
                    <Icon size={24} />
                </div>
                <div className={clsx("space-y-1 flex-1", isRTL ? "text-right" : "text-left")}>
                    <h4 className={`text-lg font-black uppercase tracking-tight ${textColor}`}>{label}</h4>
                    <p className={`text-sm font-medium opacity-90 ${textColor}`}>
                        {reason || (status === 'SUSPENDED' || status === 'INACTIVE' ? t('common:statusReasonPlaceholder') : t('common:completeStoreInfo'))}
                    </p>
                    {status === 'SUSPENDED' && (
                        <div className={clsx(
                            "pt-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400",
                            isRTL && "flex-row-reverse"
                        )}>
                            <Info size={12} />
                            {t('common:contactSupportMistake')}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-8 animate-in animate-fade">
            {renderStatusBanner()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Revenue - Common for all */}
                <StatCard
                    title={t('totalRevenue')}
                    value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                    change="+12.5%"
                    icon={DollarSign}
                    color="emerald"
                    comparisonText={t('vsLastPeriod')}
                />

                <StatCard
                    title={t('totalOrders')}
                    value={stats.totalOrders || 0}
                    change="+5.2%"
                    icon={ShoppingBag}
                    color="orange"
                    comparisonText={t('vsLastPeriod')}
                />

                {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                    <StatCard
                        title={t('pendingOrders')}
                        value={stats.pendingOrders || 0}
                        change=""
                        icon={Clock}
                        color="amber"
                        comparisonText={t('needsAction')}
                    />
                )}

                {/* Conditional Cards */}
                {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) ? (
                    <>
                        <StatCard
                            title={t('totalStores')}
                            value={stats.totalStores || 0}
                            change="+2.4%"
                            icon={Store}
                            color="blue"
                            comparisonText={t('vsLastPeriod')}
                        />
                        <StatCard
                            title={t('platformUsers')}
                            value={stats.totalUsers || 0}
                            change="+3.7%"
                            icon={Users}
                            color="violet"
                            comparisonText={t('vsLastPeriod')}
                        />
                        <StatCard
                            title={t('totalProducts')}
                            value={stats.totalProducts || 0}
                            change="+1.8%"
                            icon={Layers}
                            color="indigo"
                            comparisonText={t('vsLastPeriod')}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title={t('totalClients')}
                            value={stats.totalClients || 0}
                            change="+4.1%"
                            icon={Users}
                            color="blue"
                            comparisonText={t('newThisMonth')}
                        />
                        <StatCard
                            title={t('totalFollowers')}
                            value={stats.totalFollowers || 0}
                            change="+8.5%"
                            icon={Heart}
                            color="rose"
                            comparisonText={t('newFollowers')}
                        />
                        <StatCard
                            title={t('totalReviews')}
                            value={stats.totalReviews || 0}
                            change="+2.0%"
                            icon={Star}
                            color="yellow"
                            comparisonText={t('avgStars', { stars: Number(stats.averageRating || 0).toFixed(1) })}
                        />
                        <StatCard
                            title={t('totalProducts')}
                            value={stats.totalProducts || 0}
                            change="+1"
                            icon={Layers}
                            color="indigo"
                            comparisonText={t('activeItems')}
                        />
                    </>
                )}

                {/* Avg Order Value - Common */}
                <StatCard
                    title={t('avgOrderValue')}
                    value={`${(stats.avgOrderValue || 0).toFixed(2)} ${t('common:currencySymbol')}`}
                    change="+1.2%"
                    icon={TrendingUp}
                    color="amber"
                    comparisonText={t('vsLastPeriod')}
                />
            </div>

            {/* Quick Actions for Sellers */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                <div className={clsx(
                    "bg-gradient-to-r from-primary to-primary-dark p-8 rounded-none border border-primary/20 shadow-xl shadow-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group",
                    isRTL && "md:flex-row-reverse"
                )}>
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-none rotate-12 transition-transform group-hover:scale-110" />
                    <div className={clsx("relative z-10 flex items-center gap-6", isRTL && "flex-row-reverse")}>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center text-white shadow-inner">
                            <Store size={40} />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{t('common:manageYourStore')}</h3>
                            <p className="text-white/80 font-medium">{t('common:updateStoreDirectly')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/store-settings')}
                        className="relative z-10 px-8 py-4 bg-white text-primary font-black uppercase tracking-widest text-sm rounded-none hover:-translate-y-1 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        {t('common:storeSettings')}
                    </button>
                </div>
            )}

            {/* Top Rated Products Section */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && stats.topRatedProducts && stats.topRatedProducts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('topRatedProducts')}
                        </h3>
                        <button
                            onClick={() => navigate('/products')}
                            className="text-primary text-sm font-bold hover:underline"
                        >
                            {t('common:viewAll')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {stats.topRatedProducts.map((product: any) => (
                            <div
                                key={product.id}
                                className="group bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer relative"
                                onClick={() => navigate(`/products/edit/${product.id}`)}
                            >
                                <div className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-700 p-1.5 shadow-sm border border-slate-100 dark:border-slate-600 shadow-xl">
                                    <Edit size={14} className="text-primary" />
                                </div>
                                <div className="aspect-square w-full mb-3 overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    {product.coverImage ? (
                                        <img
                                            src={product.coverImage}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag size={32} strokeWidth={1} />
                                        </div>
                                    )}
                                </div>
                                <h4 className={clsx("font-bold text-sm text-slate-800 dark:text-slate-200 truncate mb-1", isRTL && "text-right")}>
                                    {isRTL ? product.nameAr || product.name : product.name}
                                </h4>
                                <div className={clsx("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-400">
                                        {Number(product.averageRating || 0).toFixed(1)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 lowercase">
                                        {t('review_count', { count: product.reviewCount || 0 })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Categories Section */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && stats.topCategories && stats.topCategories.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('topCategories')}
                        </h3>
                        <button
                            onClick={() => navigate('/categories')}
                            className="text-primary text-sm font-bold hover:underline"
                        >
                            {t('common:viewAll')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {stats.topCategories.map((category: any) => (
                            <div
                                key={category.id}
                                className="group bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer relative flex flex-col items-center justify-center text-center"
                                onClick={() => navigate('/categories')}
                            >
                                <div className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-700 p-1.5 shadow-sm border border-slate-100 dark:border-slate-600 shadow-xl">
                                    <Edit size={14} className="text-primary" />
                                </div>
                                <div className="w-16 h-16 mb-3 rounded-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Layers size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate w-full">
                                    {isRTL ? category.nameAr || category.name : category.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                    {t('product_count', { count: category.productCount || 0 })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors text-right">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('revenuePerformance')}</h3>
                        <select className={clsx(
                            "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-none px-3 py-1.5 focus:ring-primary focus:border-primary outline-none",
                            isRTL && "text-right"
                        )}>
                            <option>{t('last30Days')}</option>
                            <option>{t('last90Days')}</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 12 }}
                                    dy={10}
                                    reversed={isRTL}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 12 }}
                                    dx={isRTL ? 10 : -10}
                                    tickFormatter={(val) => `${val} ${t('common:currencySymbol')}`}
                                    orientation={isRTL ? "right" : "left"}
                                />
                                <Tooltip
                                    cursor={{ fill: cursorFill }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderRadius: '0px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '14px',
                                        color: isDark ? '#f1f5f9' : '#0f172a',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors">
                    <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100 mb-6", isRTL && "text-right")}>{t('recentActivity')}</h3>
                    <div className="space-y-6 flex-grow">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className={clsx("flex gap-4 group cursor-pointer", isRTL && "flex-row-reverse text-right")}>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{t('statsSynchronized')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('justNow')}</p>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-none bg-primary mt-1.5 group-hover:scale-125 transition-transform shrink-0" />
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-none transition-colors">
                        {t('viewAllActivity')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
