import React from 'react';
import { 
    Users, 
    Store, 
    Truck, 
    CreditCard, 
    ShieldAlert, 
    Zap, 
    CheckCircle, 
    Clock, 
    TrendingUp,
    MapPin,
    Package,
    Layers,
    ShieldCheck,
    Flag,
    Building2,
    LayoutGrid
} from 'lucide-react';
import { DashboardStats } from '../models/dashboard.model';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminPermissions } from '../../../types/admin-permissions';
import { UserRole } from '../../../types/user-role';

interface AdminStatCardProps {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    size?: 'default' | 'sm';
    t: any;
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, icon: Icon, color, trend, size = 'default', t }) => {
    const { isRTL } = useLanguage();

    const colorVariants: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    };

    const colorClass = colorVariants[color] || colorVariants.blue;

    return (
        <div className="group bg-white dark:bg-slate-900 px-6 py-6 rounded-none border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden active-push cursor-default hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
            <div className="flex items-start justify-between relative z-10">
                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                    <p className="text-slate-400 dark:text-slate-500 text-[0.625rem] font-bold uppercase tracking-[0.15em] mb-1.5 transition-colors group-hover:text-slate-500">{title}</p>
                    <h3 className={clsx("font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none flex items-baseline gap-1.5", size === 'sm' ? "text-xl" : "text-4xl")}>
                        {typeof value === 'string' && value.includes(t('common:storeCurrency')) ? (
                            <>
                                <span>{value.replace(t('common:storeCurrency'), '').trim()}</span>
                                <span className="text-[0.45em] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('common:storeCurrency')}</span>
                            </>
                        ) : value}
                    </h3>
                    {trend && (
                        <div className={clsx(
                            "flex items-center gap-1 mt-2 text-[0.625rem] font-semibold uppercase tracking-wide",
                            trend.positive ? "text-emerald-600" : "text-rose-600",
                            isRTL && "flex-row-reverse"
                        )}>
                            <TrendingUp size={12} className={clsx(!trend.positive && "rotate-180")} />
                            {trend.value}
                        </div>
                    )}
                </div>
                <div className={clsx(size === 'sm' ? "w-10 h-10" : "w-12 h-12", `rounded flex items-center justify-center shrink-0 shadow-sm`, colorClass)}>
                    <Icon size={size === 'sm' ? 18 : 24} strokeWidth={2} />
                </div>
            </div>
        </div>
    );
};

interface AdminDashboardProps {
    stats: DashboardStats;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
    const { t, i18n } = useTranslation(['dashboard', 'common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const { user, hasAdminPermission } = useAuth();
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const showSubscriptions = isSuperAdmin || hasAdminPermission(AdminPermissions.ANALYTICS_VIEW);
    const showDashboard = hasAdminPermission(AdminPermissions.ANALYTICS_VIEW);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* ZONE 1: Action Required (Highest Priority) */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-1">
                <div className="flex items-center gap-2 px-1">
                    <ShieldAlert size={18} className="text-amber-500" />
                    <h2 className="text-[0.6875rem] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em]">{t('dashboard:needsAttention', 'Needs Attention')}</h2>
                </div>
                <div className="flex flex-col lg:flex-row flex-wrap gap-4">
                    {hasAdminPermission(AdminPermissions.STORES_VIEW) && (stats.pendingStores || 0) > 0 && (
                        <div onClick={() => navigate('/stores')} className="flex-1 min-w-[250px] flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-4 border border-amber-200/60 dark:border-amber-800/40 rounded-none shadow-sm active-push cursor-pointer hover:border-amber-300">
                            <div className="flex items-center gap-3">
                                <Store size={18} className="text-amber-500/80" />
                                <span className="text-[0.6875rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em]">{t('dashboard:pendingStores')}</span>
                            </div>
                            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 leading-none">{stats.pendingStores}</span>
                        </div>
                    )}
                    {hasAdminPermission(AdminPermissions.STORE_VERIFICATION_VIEW) && (stats.pendingStoreVerifications || 0) > 0 && (
                        <div onClick={() => navigate('/stores/verification')} className="flex-1 min-w-[250px] flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-4 border border-blue-200/60 dark:border-blue-800/40 rounded-none shadow-sm active-push cursor-pointer hover:border-blue-300">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={18} className="text-blue-500/80" />
                                <span className="text-[0.6875rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em]">{t('dashboard:pendingStoreVerifications')}</span>
                            </div>
                            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 leading-none">{stats.pendingStoreVerifications}</span>
                        </div>
                    )}
                    {hasAdminPermission(AdminPermissions.DRIVER_VERIFICATION_VIEW) && (stats.underReviewDrivers || 0) > 0 && (
                        <div onClick={() => navigate('/drivers/verification')} className="flex-1 min-w-[250px] flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-4 border border-orange-200/60 dark:border-orange-800/40 rounded-none shadow-sm active-push cursor-pointer hover:border-orange-300">
                            <div className="flex items-center gap-3">
                                <Truck size={18} className="text-orange-500/80" />
                                <span className="text-[0.6875rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em]">{t('dashboard:underReviewDrivers')}</span>
                            </div>
                            <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 leading-none">{stats.underReviewDrivers}</span>
                        </div>
                    )}
                    {hasAdminPermission(AdminPermissions.REPORTED_REVIEWS_VIEW) && (stats.reportedReviews || 0) > 0 && (
                        <div onClick={() => navigate('/reported-reviews')} className="flex-1 min-w-[250px] flex items-center justify-between bg-white dark:bg-slate-900 px-5 py-4 border border-rose-200/60 dark:border-rose-800/40 rounded-none shadow-sm active-push cursor-pointer hover:border-rose-300">
                            <div className="flex items-center gap-3">
                                <Flag size={18} className="text-rose-500/80" />
                                <span className="text-[0.6875rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em]">{t('dashboard:reportedReviews')}</span>
                            </div>
                            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">{stats.reportedReviews}</span>
                        </div>
                    )}
                    
                    {/* Fallback if everything is 0 */}
                    {((!hasAdminPermission(AdminPermissions.STORES_VIEW) || !stats.pendingStores) &&
                      (!hasAdminPermission(AdminPermissions.STORE_VERIFICATION_VIEW) || !stats.pendingStoreVerifications) &&
                      (!hasAdminPermission(AdminPermissions.DRIVER_VERIFICATION_VIEW) || !stats.underReviewDrivers) &&
                      (!hasAdminPermission(AdminPermissions.REPORTED_REVIEWS_VIEW) || !stats.reportedReviews)) && (
                        <div className="flex-1 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/10 px-5 py-4 border border-emerald-200 dark:border-emerald-800/40 rounded-none text-emerald-600 dark:text-emerald-400 shadow-sm transition-all hover:bg-emerald-100/50">
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.1em]">{t('dashboard:allCaughtUp', 'All caught up!')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ZONE 2: Platform Analytics & Revenue */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-2">
                <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={18} className="text-emerald-500" />
                    <h2 className="text-[0.6875rem] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em]">{t('dashboard:platformAnalytics', 'Platform Analytics')}</h2>
                </div>
                {showDashboard && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        {/* Huge Revenue Card */}
                        <div className="col-span-1 lg:col-span-6 bg-white dark:bg-slate-900 px-8 py-8 rounded-none border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between active-push hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-300">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex items-center justify-between mb-2">
                                <h3 className="text-slate-400 dark:text-slate-500 text-[0.625rem] font-bold uppercase tracking-[0.15em]">{t('dashboard:totalRevenue')}</h3>
                                <div className="w-12 h-12 rounded-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/30">
                                    <CreditCard size={24} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="relative z-10 flex items-baseline gap-2">
                                <span className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{(stats.totalRevenue || 0).toLocaleString()}</span>
                                <span className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('common:storeCurrency')}</span>
                            </div>
                        </div>

                        {/* Orders Card */}
                        <div className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 px-6 py-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between active-push hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300">
                            <div className="relative z-10 flex items-center justify-between mb-4">
                                <h3 className="text-slate-400 dark:text-slate-500 text-[0.625rem] font-bold uppercase tracking-[0.15em]">{t('dashboard:totalOrders')}</h3>
                                <div className="w-10 h-10 rounded-none bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-800/30">
                                    <Zap size={20} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <span className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{stats.totalOrders || 0}</span>
                            </div>
                        </div>

                        {/* Side Stack for Avg Order and Subscriptions */}
                        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
                            <AdminStatCard 
                                title={t('dashboard:avgOrderValue')} 
                                value={`${(stats.avgOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${t('common:storeCurrency')}`} 
                                icon={TrendingUp} 
                                color="blue"
                                t={t}
                            />
                            {showSubscriptions ? (
                                <AdminStatCard 
                                    title={t('dashboard:activeSubscriptions')} 
                                    value={stats.activeSubscriptions || 0} 
                                    icon={CreditCard} 
                                    color="emerald"
                                    t={t}
                                />
                            ) : (
                                <AdminStatCard 
                                    title={t('dashboard:totalAdminEmployees')} 
                                    value={stats.totalAdminEmployees || 0} 
                                    icon={ShieldCheck} 
                                    color="violet"
                                    t={t}
                                />
                            )}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AdminStatCard 
                        title={t('dashboard:totalStores')} 
                        value={stats.totalStores || 0} 
                        icon={Store} 
                        color="primary"
                        trend={{
                            value: `+${stats.newStoresCount || 0} ${t('dashboard:newThisMonth')}`,
                            positive: true
                        }}
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalUsers')} 
                        value={stats.totalUsers || 0} 
                        icon={Users} 
                        color="blue"
                        trend={{
                            value: `+${stats.platformGrowth || 0} ${t('dashboard:newThisMonth')}`,
                            positive: true
                        }}
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalDrivers')} 
                        value={stats.totalDrivers || 0} 
                        icon={Truck} 
                        color="orange"
                        t={t}
                    />
                    {showSubscriptions && (
                        <AdminStatCard 
                            title={t('dashboard:totalAdminEmployees')} 
                            value={stats.totalAdminEmployees || 0} 
                            icon={ShieldCheck} 
                            color="violet"
                            t={t}
                        />
                    )}
                </div>
            </div>

            {/* Analytics Lists - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-3">
                {/* Top Performing Stores - Universal fallback */}
                {stats.topStores && (
                    <div className={clsx(
                        "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm overflow-hidden text-[#1e293b] dark:text-[#f1f5f9]",
                        !showSubscriptions && "lg:col-span-2"
                    )}>
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {t('dashboard:topPerformingStores')}
                                </h3>
                            </div>
                            {hasAdminPermission(AdminPermissions.STORES_VIEW) && (
                                <button onClick={() => navigate('/stores')} className="text-primary text-[0.6875rem] font-extrabold uppercase tracking-widest hover:underline">
                                    {t('common:viewAll')}
                                </button>
                            )}
                        </div>
                        <div className="p-4 space-y-3">
                            {stats.topStores.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">{t('common:noData')}</p>
                            ) : (
                                stats.topStores.slice(0, 5).map((store: any) => (
                                    <div key={store.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800/50 cursor-pointer" onClick={() => navigate(`/stores/${store.id}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center overflow-hidden">
                                                {store.logo ? <img src={store.logo} alt={`${store.title || 'Store'} logo`} className="w-full h-full object-cover" /> : <Store size={20} className="text-slate-300" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{isRTL ? store.nameAr || store.name : store.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[0.6875rem] font-bold text-emerald-600 uppercase tabular-nums">
                                                        {(store.totalRevenue || 0).toLocaleString()} {t('common:storeCurrency')}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                    <span className="text-[0.625rem] text-slate-400 font-medium uppercase tracking-wider">
                                                        {store.totalOrders || 0} {t('dashboard:totalOrders')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {hasAdminPermission(AdminPermissions.STORES_VIEW) && (
                                            <button 
                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white dark:hover:bg-slate-800 rounded"
                                            >
                                                <Zap size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Subscriptions - Gated */}
                {showSubscriptions && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm overflow-hidden text-[#1e293b] dark:text-[#f1f5f9]">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard size={20} className="text-violet-500" />
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {t('dashboard:recentSubscriptions')}
                                </h3>
                            </div>
                            <button onClick={() => navigate('/billing-transactions')} className="text-primary text-[0.6875rem] font-extrabold uppercase tracking-widest hover:underline">
                                {t('common:viewAll')}
                            </button>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className={clsx("w-full text-sm whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                                    <thead className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                                        <tr>
                                            <th className={clsx("px-6 py-3 font-bold", isRTL ? "text-right" : "text-left")}>{t('dashboard:storeName')}</th>
                                            <th className={clsx("px-6 py-3 font-bold", isRTL ? "text-right" : "text-left")}>{t('common:plan')}</th>
                                            <th className={clsx("px-6 py-3 font-bold", isRTL ? "text-right" : "text-left")}>{t('common:status')}</th>
                                            <th className={clsx("px-6 py-3 font-bold", isRTL ? "text-left" : "text-right")}>{t('common:date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                                        {(!stats.recentSubscriptions || stats.recentSubscriptions.length === 0) ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic font-medium">
                                                    {t('dashboard:noRecentSubscriptions')}
                                                </td>
                                            </tr>
                                        ) : (
                                            stats.recentSubscriptions.slice(0, 5).map((sub: any) => (
                                                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className={clsx("px-6 py-4 font-semibold text-slate-800 dark:text-slate-200", isRTL ? "text-right" : "text-left")}>
                                                        {isRTL ? sub.storeNameAr || sub.storeName : sub.storeName}
                                                    </td>
                                                    <td className={clsx("px-6 py-4", isRTL ? "text-right" : "text-left")}>
                                                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[0.6875rem] font-extrabold uppercase rounded">
                                                            {t(`dashboard:plans.${sub.plan?.toUpperCase()}`)}
                                                        </span>
                                                    </td>
                                                    <td className={clsx("px-6 py-4", isRTL ? "text-right" : "text-left")}>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 text-[0.6875rem] font-extrabold uppercase rounded inline-flex items-center gap-1",
                                                            sub.status === 'ACTIVE' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                        )}>
                                                            <span className={clsx("w-1 h-1 rounded-full", sub.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-400")} />
                                                            {t(`dashboard:subscriptionStatus.${sub.status?.toUpperCase()}`)}
                                                        </span>
                                                    </td>
                                                    <td className={clsx("px-6 py-4 text-xs font-medium tracking-tight text-slate-400 uppercase tabular-nums", isRTL ? "text-left" : "text-right")}>
                                                        {new Date(sub.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
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
            </div>

            {/* ZONE 3: System Meta Data (Quieted Typography) */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-4">
                <div className="flex items-center gap-2 px-1">
                    <Layers size={18} className="text-slate-400" />
                    <h2 className="text-[0.6875rem] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">{t('dashboard:systemMetadata', 'System Infrastructure Metrics')}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AdminStatCard 
                        title={t('dashboard:totalTowns')} 
                        value={stats.totalTowns || 0} 
                        icon={MapPin} 
                        color="amber"
                        size="sm"
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalCities')} 
                        value={stats.totalCities || 0} 
                        icon={MapPin} 
                        color="blue"
                        size="sm"
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalBusinessTypes')} 
                        value={stats.totalBusinessTypes || 0} 
                        icon={Building2} 
                        color="emerald"
                        size="sm"
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalBusinessCategories')} 
                        value={stats.totalBusinessCategories || 0} 
                        icon={LayoutGrid} 
                        color="rose"
                        size="sm"
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalCustomers')} 
                        value={stats.totalCustomers || 0} 
                        icon={Users} 
                        color="primary"
                        size="sm"
                        t={t}
                    />
                    <AdminStatCard 
                        title={t('dashboard:totalEmployees')} 
                        value={stats.totalEmployees || 0} 
                        icon={Users} 
                        color="violet"
                        size="sm"
                        t={t}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
