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
    Flag
} from 'lucide-react';
import { DashboardStats } from '../models/dashboard.model';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface AdminStatCardProps {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: {
        value: string;
        positive: boolean;
    };
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
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
        <div className="bg-white dark:bg-slate-900 px-6 py-6 rounded border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div className={clsx(isRTL ? "text-right" : "text-left")}>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">{value}</h3>
                    {trend && (
                        <div className={clsx(
                            "flex items-center gap-1 mt-2 text-[10px] font-bold uppercase",
                            trend.positive ? "text-emerald-600" : "text-rose-600",
                            isRTL && "flex-row-reverse"
                        )}>
                            <TrendingUp size={12} className={clsx(!trend.positive && "rotate-180")} />
                            {trend.value}
                        </div>
                    )}
                </div>
                <div className={clsx(`w-12 h-12 rounded flex items-center justify-center shrink-0 shadow-sm`, colorClass)}>
                    <Icon size={24} strokeWidth={2} />
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Primary Metrics Grid */}
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
                />
                <AdminStatCard 
                    title={t('dashboard:platformUsers')} 
                    value={stats.totalUsers || 0} 
                    icon={Users} 
                    color="blue"
                    trend={{
                        value: `+${stats.platformGrowth || 0} ${t('dashboard:newThisMonth')}`,
                        positive: true
                    }}
                />
                <AdminStatCard 
                    title={t('dashboard:platformDrivers')} 
                    value={stats.totalDrivers || 0} 
                    icon={Truck} 
                    color="orange"
                />
                <AdminStatCard 
                    title={t('dashboard:activeSubscriptions')} 
                    value={stats.activeSubscriptions || 0} 
                    icon={CreditCard} 
                    color="emerald"
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard 
                    title={t('dashboard:totalOrders')} 
                    value={stats.totalOrders || 0} 
                    icon={Zap} 
                    color="violet"
                />
                <AdminStatCard 
                    title={t('dashboard:totalRevenue')} 
                    value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} 
                    icon={CreditCard} 
                    color="emerald"
                />
                 <AdminStatCard 
                    title={t('dashboard:avgOrderValue')} 
                    value={`${(stats.avgOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${t('common:currencySymbol')}`} 
                    icon={TrendingUp} 
                    color="blue"
                />
                 <AdminStatCard 
                    title={t('dashboard:totalTowns')} 
                    value={stats.totalTowns || 0} 
                    icon={MapPin} 
                    color="amber"
                />
            </div>

            {/* Admin Action Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard 
                    title={t('dashboard:pendingStores')} 
                    value={stats.pendingStores || 0} 
                    icon={Store} 
                    color="amber"
                />
                <AdminStatCard 
                    title={t('dashboard:pendingStoreVerifications')} 
                    value={stats.pendingStoreVerifications || 0} 
                    icon={ShieldCheck} 
                    color="blue"
                />
                <AdminStatCard 
                    title={t('dashboard:underReviewDrivers')} 
                    value={stats.underReviewDrivers || 0} 
                    icon={Truck} 
                    color="orange"
                />
                <AdminStatCard 
                    title={t('dashboard:reportedReviews')} 
                    value={stats.reportedReviews || 0} 
                    icon={Flag} 
                    color="rose"
                />
            </div>

            {/* Analytics Overview - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Performing Stores */}
                {stats.topStores && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm overflow-hidden text-[#1e293b] dark:text-[#f1f5f9]">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-500" />
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    {t('dashboard:topPerformingStores')}
                                </h3>
                            </div>
                            <button onClick={() => navigate('/stores')} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                                {t('common:viewAll')}
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {stats.topStores.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">{t('common:noData')}</p>
                            ) : (
                                stats.topStores.slice(0, 5).map((store: any) => (
                                    <div key={store.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center overflow-hidden">
                                                {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" /> : <Store size={20} className="text-slate-300" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{isRTL ? store.nameAr || store.name : store.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tabular-nums">
                                                        {(store.totalRevenue || 0).toLocaleString()} {t('common:currencySymbol')}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                        {store.totalOrders || 0} {t('dashboard:totalOrders')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/stores/${store.id}`)}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white dark:hover:bg-slate-800 rounded"
                                        >
                                            <Zap size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Subscriptions Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded shadow-sm overflow-hidden text-[#1e293b] dark:text-[#f1f5f9]">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard size={20} className="text-violet-500" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {t('dashboard:recentSubscriptions')}
                            </h3>
                        </div>
                        <button onClick={() => navigate('/subscriptions-admin')} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                            {t('common:viewAll')}
                        </button>
                    </div>
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className={clsx("w-full text-sm whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                                    <tr>
                                        <th className={clsx("px-6 py-3 font-black", isRTL ? "text-right" : "text-left")}>{t('dashboard:storeName')}</th>
                                        <th className={clsx("px-6 py-3 font-black", isRTL ? "text-right" : "text-left")}>{t('common:plan')}</th>
                                        <th className={clsx("px-6 py-3 font-black", isRTL ? "text-right" : "text-left")}>{t('common:status')}</th>
                                        <th className={clsx("px-6 py-3 font-black", isRTL ? "text-left" : "text-right")}>{t('common:date')}</th>
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
                                                <td className={clsx("px-6 py-4 font-bold text-slate-800 dark:text-slate-200", isRTL ? "text-right" : "text-left")}>
                                                    {isRTL ? sub.storeNameAr || sub.storeName : sub.storeName}
                                                </td>
                                                <td className={clsx("px-6 py-4", isRTL ? "text-right" : "text-left")}>
                                                    <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase rounded">
                                                        {t(`dashboard:plans.${sub.plan?.toUpperCase()}`)}
                                                    </span>
                                                </td>
                                                <td className={clsx("px-6 py-4", isRTL ? "text-right" : "text-left")}>
                                                    <span className={clsx(
                                                        "px-2 py-0.5 text-[10px] font-black uppercase rounded inline-flex items-center gap-1",
                                                        sub.status === 'ACTIVE' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                    )}>
                                                        <span className={clsx("w-1 h-1 rounded-full", sub.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-400")} />
                                                        {t(`dashboard:subscriptionStatus.${sub.status?.toUpperCase()}`)}
                                                    </span>
                                                </td>
                                                <td className={clsx("px-6 py-4 text-[11px] font-bold tracking-tight text-slate-400 uppercase tabular-nums", isRTL ? "text-left" : "text-right")}>
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
            </div>

            {/* Bottom Tier Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <AdminStatCard 
                    title={t('dashboard:totalCustomers')} 
                    value={stats.totalCustomers || 0} 
                    icon={Users} 
                    color="blue"
                />
                <AdminStatCard 
                    title={t('dashboard:totalStores')} 
                    value={stats.totalStores || 0} 
                    icon={Store} 
                    color="primary"
                />
                <AdminStatCard 
                    title={t('dashboard:totalDrivers')} 
                    value={stats.totalDrivers || 0} 
                    icon={Truck} 
                    color="orange"
                />
                <AdminStatCard 
                    title={t('dashboard:totalEmployees')} 
                    value={stats.totalEmployees || 0} 
                    icon={Users} 
                    color="violet"
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
