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
import { LucideIcon, TrendingUp, Users, ShoppingBag, DollarSign, Store, Heart, Star, Layers, ShieldAlert, AlertTriangle, Info, Clock, Edit, ChevronRight } from 'lucide-react';
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
import { useCache } from '../../contexts/CacheContext';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
    const { isRTL } = useLanguage();
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-none flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                    <Icon size={24} />
                </div>
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
    const { getCache, setCache } = useCache();

    const { user, hasPermission } = useAuth();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return; // Add check
            setLoading(true);
            try {
                // Create cache key based on user role for better cache management
                const dashboardCacheKey = `dashboard-stats-${user.role}`;
                const storeCacheKey = 'store-details';

                // Check cache for dashboard stats
                const cachedStats = getCache<any>(dashboardCacheKey);
                if (cachedStats) {
                    setStats(cachedStats);

                    // Update chart data from cached stats (real daily data)
                    const data = cachedStats.chartData || [];
                    if (data.length === 0) {
                        const skeletonData = [];
                        for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            skeletonData.push({ date: d.toISOString().split('T')[0], revenue: 0 });
                        }
                        setChartData(skeletonData);
                    } else {
                        setChartData(data);
                    }
                } else {
                    // Fetch from API if not cached
                    const dashboardData = await fetchDashboardStats(user);
                    setStats(dashboardData);

                    // Update chart data (real daily data)
                    const data = dashboardData.chartData || [];
                    if (data.length === 0) {
                        // Generate skeleton data (last 7 days at 0)
                        const skeletonData = [];
                        for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            skeletonData.push({ date: d.toISOString().split('T')[0], revenue: 0 });
                        }
                        setChartData(skeletonData);
                    } else {
                        setChartData(data);
                    }

                    // Cache the dashboard stats
                    setCache(dashboardCacheKey, dashboardData);
                }

                // Fetch store details for sellers
                if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) {
                    // Check cache for store details
                    const cachedStore = getCache<any>(storeCacheKey);
                    if (cachedStore) {
                        setStoreDetails(cachedStore);
                    } else {
                        const storeData = await getMyStore();
                        setStoreDetails(storeData);

                        // Cache store details
                        setCache(storeCacheKey, storeData);
                    }
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
    }, [setStats, setLoading, setError, setChartData, user, t, getCache, setCache]); // Add cache methods to deps

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
        if (!hasPermission('store.view')) return null;

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
                {/* Revenue - Common for all, but check permission for analytics */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('totalRevenue')}
                        value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                        icon={DollarSign}
                        color="emerald"
                    />
                )}

                {(hasPermission('orders.view') || hasPermission('orders.update')) && (
                    <StatCard
                        title={t('totalOrders')}
                        value={stats.totalOrders || 0}
                        icon={ShoppingBag}
                        color="orange"
                    />
                )}

                {(hasPermission('orders.view') || hasPermission('orders.update')) && (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                    <StatCard
                        title={t('pendingOrders')}
                        value={stats.pendingOrders || 0}
                        icon={Clock}
                        color="amber"
                    />
                )}

                {/* Conditional Cards */}
                {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) ? (
                    <>
                        <StatCard
                            title={t('totalStores')}
                            value={stats.totalStores || 0}
                            icon={Store}
                            color="blue"
                        />
                        <StatCard
                            title={t('platformUsers')}
                            value={stats.totalUsers || 0}
                            icon={Users}
                            color="violet"
                        />
                        <StatCard
                            title={t('totalProducts')}
                            value={stats.totalProducts || 0}
                            icon={Layers}
                            color="indigo"
                        />
                    </>
                ) : (
                    <>
                        {hasPermission('users.view') && (
                            <StatCard
                                title={t('totalClients')}
                                value={stats.totalClients || 0}
                                icon={Users}
                                color="blue"
                            />
                        )}
                        {hasPermission('users.view') && (
                            <StatCard
                                title={t('totalFollowers')}
                                value={stats.totalFollowers || 0}
                                icon={Heart}
                                color="rose"
                            />
                        )}
                        {hasPermission('store.view') && (
                            <StatCard
                                title={t('totalReviews')}
                                value={stats.totalReviews || 0}
                                icon={Star}
                                color="yellow"
                            />
                        )}
                        {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                            <StatCard
                                title={t('totalProducts')}
                                value={stats.totalProducts || 0}
                                icon={Layers}
                                color="indigo"
                            />
                        )}
                    </>
                )}

                {/* Avg Order Value - Common */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('avgOrderValue')}
                        value={`${(stats.avgOrderValue || 0).toFixed(2)} ${t('common:currencySymbol')}`}
                        icon={TrendingUp}
                        color="amber"
                    />
                )}
            </div>

            {/* Quick Actions for Sellers - Stage 6 Streamlined Layout */}
            {hasPermission('store.update') && (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                <div className={clsx(
                    "relative overflow-hidden group rounded-none",
                    "p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8",
                    isRTL ? "text-right" : "text-left"
                )}>
                    {/* Background: Direct Primary to Secondary Gradient - Direction Aware */}
                    <div className={clsx(
                        "absolute inset-0",
                        isRTL ? "bg-gradient-to-l from-primary to-primary" : "bg-gradient-to-r from-primary to-primary"
                    )} />
                    <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />

                    {/* Subtle Glass Accents */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-[2000ms]" />
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-[2000ms]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 grow">
                        {/* 1. Icon (Start) */}
                        <div className="shrink-0">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/30 rounded-none flex items-center justify-center text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                                <Store size={44} strokeWidth={1} />
                            </div>
                        </div>

                        {/* 2. Content (Center) */}
                        <div className="flex-1 space-y-1">
                            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                                {t('common:manageYourStore')}
                            </h3>
                            <p className="text-white/80 font-medium text-lg md:text-xl opacity-90">
                                {t('common:updateStoreDirectly')}
                            </p>
                        </div>
                    </div>

                    {/* 3. Action Block (End) */}
                    <div className="relative z-10 shrink-0">
                        <button
                            onClick={() => navigate('/store-settings')}
                            className={clsx(
                                "group/btn relative px-10 py-5 bg-white text-slate-900 overflow-hidden transition-all duration-300 shadow-xl active:scale-95 hover:bg-slate-900 hover:text-white"
                            )}
                        >
                            <span className="relative z-10 flex items-center gap-4 font-black uppercase tracking-[0.2em] text-[10px]">
                                {t('common:storeSettings')}
                                <ChevronRight size={18} className={clsx("transition-transform group-hover/btn:translate-x-1", isRTL && "rotate-180")} />
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Top Rated Products Section */}
            {/* Top Rated Products Section */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('topRatedProducts')}
                        </h3>
                        {stats.topRatedProducts && stats.topRatedProducts.length > 0 && (
                            <button
                                onClick={() => navigate('/products')}
                                className="text-primary text-sm font-bold hover:underline"
                            >
                                {t('common:viewAll')}
                            </button>
                        )}
                    </div>

                    {!stats.topRatedProducts || stats.topRatedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <ShoppingBag size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 text-sm font-medium">{t('common:noDataAvailable')}</p>
                            <button
                                onClick={() => navigate('/products')}
                                className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                {t('common:addFirstProduct')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {stats.topRatedProducts.map((product: any) => (
                                <div
                                    key={product.id}
                                    className="group bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer relative"
                                    onClick={() => navigate(`/products/edit/${product.id}`)}
                                >
                                    {hasPermission('products.update') && (
                                        <div className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-700 p-1.5 shadow-sm border border-slate-100 dark:border-slate-600 shadow-xl">
                                            <Edit size={14} className="text-primary" />
                                        </div>
                                    )}
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
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className={clsx("font-bold text-sm text-slate-800 dark:text-slate-200 truncate flex-1", isRTL && "text-right")}>
                                            {isRTL ? product.nameAr || product.name : product.name}
                                        </h4>
                                    </div>
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
                    )}
                </div>
            )}

            {/* Top Categories Section */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('topCategories')}
                        </h3>
                        {stats.topCategories && stats.topCategories.length > 0 && (
                            <button
                                onClick={() => navigate('/categories')}
                                className="text-primary text-sm font-bold hover:underline"
                            >
                                {t('common:viewAll')}
                            </button>
                        )}
                    </div>

                    {!stats.topCategories || stats.topCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <Layers size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 text-sm font-medium">{t('common:noDataAvailable')}</p>
                            <button
                                onClick={() => navigate('/categories')}
                                className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                {t('common:addFirstCategory')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {stats.topCategories.map((category: any) => (
                                <div
                                    key={category.id}
                                    className="group bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer relative flex flex-col items-center justify-center text-center"
                                    onClick={() => navigate('/categories')}
                                >
                                    {hasPermission('categories.update') && (
                                        <div className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-700 p-1.5 shadow-sm border border-slate-100 dark:border-slate-600 shadow-xl">
                                            <Edit size={14} className="text-primary" />
                                        </div>
                                    )}
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
                    )}
                </div>
            )}

            {/* Revenue Performance section */}
            {hasPermission('analytics.view') && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors text-right">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('revenuePerformance')}</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 10 }}
                                    dy={10}
                                    reversed={isRTL}
                                    tickFormatter={(str) => {
                                        const date = new Date(str);
                                        return date.getDate().toString(); // Just show day numbers for bars to avoid overlap
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 11 }}
                                    dx={isRTL ? 10 : -10}
                                    tickFormatter={(val) => `${val}`}
                                    orientation={isRTL ? "right" : "left"}
                                />
                                <Tooltip
                                    cursor={{ fill: cursorFill, opacity: 0.4 }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderRadius: '0px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '14px',
                                        color: isDark ? '#f1f5f9' : '#0f172a',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                    formatter={(val: any) => [`${val.toLocaleString()} ${t('common:currencySymbol')}`, t('totalRevenue')]}
                                    labelFormatter={(label) => {
                                        const date = new Date(label);
                                        return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="#FF5C00"
                                    radius={[2, 2, 0, 0]}
                                    barSize={20}
                                    minPointSize={4}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
