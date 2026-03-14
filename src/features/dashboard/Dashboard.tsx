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
    ResponsiveContainer,
    Cell
} from 'recharts';
import { LucideIcon, Users, ShoppingBag, DollarSign, Store, Heart, Star, CheckCircle, Layers, ShieldAlert, AlertTriangle, Info, Clock, Edit, ChevronRight, Zap, Activity, Truck, MapPin, Crown, Shield } from 'lucide-react';
import { fetchDashboardStats } from './api/dashboard.api';
import { getMyStore } from '../stores/api/stores.api';
import { getMySubscriptionUsage, SubscriptionUsage } from '../subscriptions/api/subscriptions.api';
import { respondToHiringRequest, cancelHiringRequest } from '../delivery/api/delivery-drivers.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';
import { UserRole } from '../../types/user-role';
import CountdownTimer from '../../components/common/CountdownTimer';
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

    const colorVariants: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
        sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
    };

    const colorClass = colorVariants[color] || colorVariants.blue;

    return (
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 h-full">
            <div className="flex items-center gap-4 h-full">
                <div className={clsx(`w-14 h-14 rounded flex items-center justify-center shrink-0`, colorClass)}>
                    <Icon size={28} strokeWidth={1.5} />
                </div>
                <div className={clsx("flex flex-col justify-center", isRTL ? "text-right" : "text-left")}>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-1">{value}</h3>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common', 'orders', 'subscriptions']);
    const { isDark } = useTheme();
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useRecoilState(dashboardStatsState);
    const [loading, setLoading] = useRecoilState(dashboardLoadingState);
    const [error, setError] = useRecoilState(dashboardErrorState);
    const [chartData, setChartData] = useRecoilState(dashboardChartDataState);
    const [storeDetails, setStoreDetails] = useState<any>(null);
    const [subscription, setSubscription] = useState<SubscriptionUsage | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<{ id: string, type: 'CANCEL' | 'REJECT' | 'ACCEPT', name: string } | null>(null);
    const [hiringTab, setHiringTab] = useState<'incoming' | 'sent'>('incoming');
    const { getCache, setCache, invalidateCache } = useCache();

    const { user, hasPermission } = useAuth();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return; // Add check
            setLoading(true);
            try {
                // Create cache key based on user role for better cache management
                const dashboardCacheKey = `dashboard-stats-v3-${user.role}`;
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
                            skeletonData.push({ label: d.toLocaleDateString('sv-SE'), revenue: 0 });
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
                            skeletonData.push({ label: d.toLocaleDateString('sv-SE'), revenue: 0 });
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

                // Fetch subscription usage for store owners only
                if (user?.role !== UserRole.STORE_OWNER) {
                    // Skip for non-store-owner roles
                } else {
                    try {
                        const subCacheKey = 'subscription-usage';
                        const cachedSub = getCache<SubscriptionUsage>(subCacheKey);
                        if (cachedSub) {
                            setSubscription(cachedSub);
                        } else {
                            const subData = await getMySubscriptionUsage();
                            setSubscription(subData as SubscriptionUsage);
                            setCache(subCacheKey, subData);
                        }
                    } catch (subErr) {
                        console.warn('Could not fetch subscription:', subErr);
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

    if (loading || !user) {
        return <LoadingSpinner />;
    }

    if (error) return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded text-rose-600 font-medium m-6">
            {error}
        </div>
    );

    const renderStatusBanner = () => {
        if (user?.role !== UserRole.STORE_OWNER) return null;
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
                bgColor, borderColor, "border rounded p-5 flex gap-4 animate-in slide-in-from-top-4 duration-500",
                isRTL && "flex-row-reverse"
            )}>
                <div className={`p-3 rounded bg-white/50 dark:bg-black/20 ${iconColor} h-fit`}>
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

    const renderGracePeriodBanner = () => {
        if (!subscription?.isGracePeriod) return null;

        return (
            <div className={clsx(
                "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-5 flex gap-4 animate-in slide-in-from-top-4 duration-500",
                isRTL && "flex-row-reverse"
            )}>
                <div className={`p-3 rounded bg-white/50 dark:bg-black/20 text-amber-500 h-fit`}>
                    <AlertTriangle size={24} />
                </div>
                <div className={clsx("space-y-1 flex-1", isRTL ? "text-right" : "text-left")}>
                    <h4 className={`text-lg font-black uppercase tracking-tight text-amber-800 dark:text-amber-300`}>
                        {t('subscriptions:planEndingAlert')}
                        {subscription?.gracePeriodEnd && (
                            <span className="mx-2 bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded text-sm min-w-[80px] inline-block text-center">
                                <CountdownTimer expiryDate={subscription.gracePeriodEnd} />
                            </span>
                        )}
                    </h4>
                    <button
                        onClick={() => navigate('/subscription')}
                        className="text-amber-700 dark:text-amber-400 text-xs font-bold underline uppercase tracking-widest mt-1 hover:text-amber-600 transition-colors"
                    >
                        {t('subscriptions:renewBundle')}
                    </button>
                </div>
            </div>
        );
    };

    const renderPendingApprovals = () => {
        if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) return null;
        if (!stats.pendingApprovals) return null;

        const { stores, drivers } = stats.pendingApprovals;
        if (stores.length === 0 && drivers.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldAlert size={20} className="text-amber-500" />
                    <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                        {t('actionCenter')}
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Stores */}
                    <div>
                        <h4 className={clsx("text-sm font-bold text-slate-500 uppercase tracking-wider mb-4", isRTL && "text-right")}>
                            {t('pendingApprovals')} - {t('totalStores')}
                        </h4>
                        <div className="space-y-3">
                            {stores.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">{t('noPendingApprovals')}</p>
                            ) : (
                                stores.map((store: any) => (
                                    <div key={store.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                {store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" /> : <Store size={20} className="text-slate-300" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{isRTL ? store.nameAr || store.name : store.name}</p>
                                                <p className="text-[10px] text-slate-400">{store.owner?.name || 'Unknown Owner'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/stores/${store.id}`)}
                                            className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                                        >
                                            {t('review')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pending Drivers */}
                    <div>
                        <h4 className={clsx("text-sm font-bold text-slate-500 uppercase tracking-wider mb-4", isRTL && "text-right")}>
                            {t('pendingApprovals')} - {t('platformDrivers')}
                        </h4>
                        <div className="space-y-3">
                            {drivers.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">{t('noPendingApprovals')}</p>
                            ) : (
                                drivers.map((profile: any) => (
                                    <div key={profile.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-300" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.profile?.user?.name || 'Unknown Driver'}</p>
                                                <p className="text-[10px] text-slate-400">{profile.driverType}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/drivers/verification`)}
                                            className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                                        >
                                            {t('review')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleHiringAction = async () => {
        if (!confirmData) return;
        const { id, type } = confirmData;
        setIsConfirmModalOpen(false);
        setActionLoading(id);

        try {
            if (type === 'CANCEL') {
                await cancelHiringRequest(id);
                toast.success(t('common:success'));
            } else {
                await respondToHiringRequest(id, type === 'REJECT' ? 'REJECTED' : 'ACCEPTED');
                toast.success(t('common:success'));
            }
            // Invalidate and refresh
            invalidateCache(`dashboard-stats-v3-${user.role}`);
            window.location.reload(); // Quickest way to refresh everything for now
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common:error'));
        } finally {
            setActionLoading(null);
            setConfirmData(null);
        }
    };

    const renderStoreHiringRequests = () => {
        if (user?.role !== UserRole.STORE_OWNER && user?.role !== UserRole.EMPLOYEE) return null;
        if (!stats.incomingRequests && !stats.sentInvitations) return null;

        const incoming = stats.incomingRequests || [];
        const sent = stats.sentInvitations || [];

        if (incoming.length === 0 && sent.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={20} className="text-primary" />
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('actionCenter')}
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500">{t('totalDrivers')}</p>
                </div>

                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <button
                        onClick={() => setHiringTab('incoming')}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                            hiringTab === 'incoming'
                                ? "border-primary text-primary bg-white dark:bg-slate-900"
                                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        {t('incomingRequests')}
                        {incoming.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                                {incoming.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setHiringTab('sent')}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
                            hiringTab === 'sent'
                                ? "border-primary text-primary bg-white dark:bg-slate-900"
                                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        {t('sentInvitations')}
                        {sent.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px]">
                                {sent.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="p-6">
                    {hiringTab === 'incoming' ? (
                        <div className="space-y-3">
                            {incoming.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-slate-400 italic">{t('noHiringRequests')}</p>
                                </div>
                            ) : (
                                incoming.map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.delivery?.avatarUrl ?
                                                    <img src={req.delivery.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.delivery?.profile?.user?.name || 'Unknown Driver'}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{t('common.hiringStatus')}:</span>
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded">
                                                            {String(t(`delivery.drivers.hiring_status.${req.status?.toLowerCase()}`, req.status))}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{t('common.driverVerification')}:</span>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                                            req.delivery?.verificationStatus === 'VERIFIED'
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {req.delivery?.verificationStatus === 'VERIFIED' ? t('common.verified') : (req.delivery?.verificationStatus || 'Unknown')}
                                                        </span>
                                                    </div>
                                                    {req.notes && <span className="text-[10px] text-slate-400 truncate max-w-[150px]">— {req.notes}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'ACCEPT', name: req.delivery?.profile?.user?.name });
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                disabled={actionLoading === req.id}
                                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {t('approve')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'REJECT', name: req.delivery?.profile?.user?.name });
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                disabled={actionLoading === req.id}
                                                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {t('common:reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sent.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-slate-400 italic">{t('noHiringRequests')}</p>
                                </div>
                            ) : (
                                sent.map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded group hover:border-slate-300 dark:hover:border-slate-600 transition-all text-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.delivery?.avatarUrl ?
                                                    <img src={req.delivery.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.delivery?.profile?.user?.name || 'Unknown Driver'}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{t('common.hiringStatus')}:</span>
                                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">
                                                            {String(t(`delivery.drivers.hiring_status.${req.status?.toLowerCase()}`, req.status))}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{t('common.driverVerification')}:</span>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                                            req.delivery?.verificationStatus === 'VERIFIED'
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {req.delivery?.verificationStatus === 'VERIFIED' ? t('common.verified') : (req.delivery?.verificationStatus || 'Unknown')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setConfirmData({ id: req.id, type: 'CANCEL', name: req.delivery?.profile?.user?.name });
                                                setIsConfirmModalOpen(true);
                                            }}
                                            disabled={actionLoading === req.id}
                                            className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-300 active:scale-95 transition-all dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50"
                                        >
                                            {t('cancelInvitation')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTopPerformingStores = () => {
        if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) return null;
        if (!stats.topStores || stats.topStores.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Star size={20} className="text-yellow-500" />
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('topPerformingStores')}
                        </h3>
                    </div>
                    <button onClick={() => navigate('/stores')} className="text-primary text-xs font-bold hover:underline">
                        {t('common:viewAll')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {stats.topStores.map((store: any) => (
                        <div key={store.id} className="group p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/stores/${store.id}`)}>
                            <div className="w-16 h-16 bg-white dark:bg-slate-900 mx-auto mb-3 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
                                {store.logo ? (
                                    <img src={store.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <Store size={24} className="text-slate-300" />
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center truncate mb-1">
                                {isRTL ? store.nameAr || store.name : store.name}
                            </p>
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                                    {(store.totalRevenue || 0).toLocaleString()} {t('common:currencySymbol')}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    {store.totalOrders || 0} {t('totalOrders')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    return (
        <div className={clsx(
            "p-6 max-w-7xl mx-auto space-y-6 min-h-full bg-[#fdfdfd] dark:bg-slate-950 transition-colors duration-500",
            isRTL ? "font-cairo" : "font-inter"
        )}>
            {renderStatusBanner()}
            {renderGracePeriodBanner()}

            {user?.role === UserRole.EMPLOYEE && user?.profile?.employee?.branch && (
                <div className={clsx(
                    "bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3",
                    isRTL && "flex-row-reverse"
                )}>
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                        <Store size={20} />
                    </div>
                    <div className={clsx("flex-1", isRTL ? "text-right" : "text-left")}>
                        <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mb-0.5">
                            {t('common:branch')}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {isRTL
                                ? [user.profile.employee.branch.town?.arName || user.profile.employee.branch.town?.enName, user.profile.employee.branch.place?.arName || user.profile.employee.branch.place?.enName, user.profile.employee.branch.addressAr || user.profile.employee.branch.addressEn].filter(Boolean).join(' - ')
                                : [user.profile.employee.branch.town?.enName || user.profile.employee.branch.town?.arName, user.profile.employee.branch.place?.enName || user.profile.employee.branch.place?.arName, user.profile.employee.branch.addressEn || user.profile.employee.branch.addressAr].filter(Boolean).join(' - ')}
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content Grid: Stats, Summary, Best Deal */}
            {(() => {
                const showOrderSummary = hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view');
                
                return (
                    <div className={clsx(
                        "grid gap-8",
                        showOrderSummary ? "grid-cols-1 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                    )}>
                        {/* Left Columns: Stat Cards Grid */}
                        <div className={clsx(
                            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                            showOrderSummary ? "lg:col-span-2 xl:col-span-3" : "w-full"
                        )}>
                            {(() => {
                                const allCards = [
                                    // Primary Metrics (Revenue & Orders)
                                    {
                                        id: 'todayRevenue',
                                        cond: hasPermission('analytics.view'),
                                        title: t('todayRevenue'),
                                        value: `${(stats.todayRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`,
                                        icon: Zap,
                                        color: 'emerald'
                                    },
                                    {
                                        id: 'todayPendingRevenue',
                                        cond: hasPermission('analytics.view'),
                                        title: t('orders:todayPendingRevenue'),
                                        value: `${(stats.todayPendingRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`,
                                        icon: Clock,
                                        color: 'amber'
                                    },
                                    {
                                        id: 'todayOrders',
                                        cond: hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view'),
                                        title: t('todayOrders'),
                                        value: stats.todayOrders || 0,
                                        icon: Activity,
                                        color: 'blue'
                                    },
                                    {
                                        id: 'totalRevenue',
                                        cond: hasPermission('analytics.view'),
                                        title: t('totalRevenue'),
                                        value: `${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`,
                                        icon: DollarSign,
                                        color: 'emerald'
                                    },
                                    {
                                        id: 'totalPendingRevenue',
                                        cond: hasPermission('analytics.view'),
                                        title: t('orders:totalPendingRevenue'),
                                        value: `${(stats.totalPendingRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`,
                                        icon: Clock,
                                        color: 'amber'
                                    },
                                    {
                                        id: 'totalOrders',
                                        cond: hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view'),
                                        title: t('totalOrders'),
                                        value: stats.totalOrders || 0,
                                        icon: ShoppingBag,
                                        color: 'orange'
                                    },
                                    // Fallback Metrics
                                    {
                                        id: 'products',
                                        cond: true,
                                        title: t('totalProducts'),
                                        value: stats.totalProducts || 0,
                                        icon: Store,
                                        color: 'indigo'
                                    },
                                    {
                                        id: 'categories',
                                        cond: true,
                                        title: t('topCategories'),
                                        value: stats.totalCategories || 0,
                                        icon: Layers,
                                        color: 'violet'
                                    },
                                    {
                                        id: 'addons',
                                        cond: true,
                                        title: t('totalAddons'),
                                        value: stats.totalAddons || 0,
                                        icon: Zap,
                                        color: 'blue'
                                    },
                                    {
                                        id: 'drivers',
                                        cond: hasPermission('delivery_drivers.view'),
                                        title: t('totalDrivers'),
                                        value: stats.totalDrivers || 0,
                                        icon: Truck,
                                        color: 'orange'
                                    },
                                    {
                                        id: 'clients',
                                        cond: hasPermission('clients.view'),
                                        title: t('totalClients'),
                                        value: stats.totalClients || 0,
                                        icon: Users,
                                        color: 'emerald'
                                    },
                                    {
                                        id: 'followers',
                                        cond: hasPermission('store.view'),
                                        title: t('totalFollowers'),
                                        value: stats.totalFollowers || 0,
                                        icon: Heart,
                                        color: 'rose'
                                    }
                                ];

                                // Filter by permission and take the first 6
                                const visibleCards = allCards.filter(card => card.cond).slice(0, 6);

                                return visibleCards.map((card) => (
                                    <StatCard
                                        key={card.id}
                                        title={card.title}
                                        value={card.value}
                                        icon={card.icon}
                                        color={card.color}
                                    />
                                ));
                            })()}
                        </div>

                        {/* Right Column: Summary */}
                        {showOrderSummary && (
                            <div className="flex flex-col gap-8">
                                {/* Order Summary Card */}
                                <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{t('dashboard:orderSummary') || "Order Summary"}</h3>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                                            {t('common:this_month') || "This Month"}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: t('common:pending') || "Pending", value: stats.pendingOrders || stats.statusCounts?.pending || 0, bg: "bg-amber-500" },
                                            { label: t('common:confirmed') || "Confirmed", value: stats.statusCounts?.confirmed || 0, bg: "bg-blue-500" },
                                            { label: t('orders:onTheWay') || "On The Way", value: stats.statusCounts?.out_for_delivery || 0, bg: "bg-indigo-500" },
                                            { label: t('common:delivered') || "Delivered", value: stats.statusCounts?.delivered || 0, bg: "bg-emerald-500" },
                                            { label: t('common:cancelled') || "Cancelled", value: stats.statusCounts?.cancelled || 0, bg: "bg-rose-500" },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("w-2 h-2 rounded-full", item.bg)} />
                                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                                                </div>
                                                <span className={clsx("text-sm font-black tracking-tight", isDark ? "text-slate-200" : "text-slate-900")}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}


            {/* Phase 2: Super Admin Sections */}
            {renderPendingApprovals()}
            {renderStoreHiringRequests()}
            {renderTopPerformingStores()}


            {/* Lists Section: Top Rated Products, Top Categories & Top Add-ons */}
            {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (() => {
                const showOrderSummary = hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view');
                
                return (
                    <div className={clsx(
                        "grid gap-8",
                        showOrderSummary ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                    )}>
                        {/* Top Rated Products */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={clsx("text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight", isRTL && "text-right")}>
                                    {t('topRatedProducts')}
                                </h3>
                                {stats?.topRatedProducts && stats.topRatedProducts.length > 0 && (
                                    <button
                                        onClick={() => navigate('/products')}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        {t('common:viewAll')}
                                    </button>
                                )}
                            </div>

                            {!stats?.topRatedProducts || stats.topRatedProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50">
                                    <ShoppingBag size={48} className="text-slate-200 mb-4" />
                                    <p className="text-slate-400 text-sm font-medium">{t('common:noResults')}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {stats.topRatedProducts?.slice(0, 3).map((product: any, index: number) => (
                                        <div
                                            key={product.id}
                                            className="group flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                                            onClick={() => navigate(`/products/${product.id}`)}
                                        >
                                            <div className="w-16 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                                {product.coverImage ? (
                                                    <img
                                                        src={product.coverImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ShoppingBag size={24} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={clsx("font-bold text-slate-900 dark:text-slate-100 truncate", isRTL ? "text-right" : "text-left")}>
                                                    {isRTL ? product.nameAr || product.name : product.name}
                                                </h4>
                                                <div className={clsx("flex items-center gap-2 mt-1", isRTL && "flex-row-reverse justify-end")}>
                                                    <div className="flex items-center gap-0.5">
                                                        <Star size={12} className="fill-amber-400 text-amber-400" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {Number(product.averageRating || 0).toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-400">
                                                        ({product.totalReviews || 0} {t('common:reviews')})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={clsx("text-right", isRTL ? "pl-2" : "pr-2")}>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-xs font-bold text-primary">
                                                    {product.unitsSold || 0} {t('common:unitsSold') || 'Units Sold'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Categories */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={clsx("text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight", isRTL && "text-right")}>
                                    {t('topCategories')}
                                </h3>
                                {stats?.topCategories && stats.topCategories.length > 0 && (
                                    <button
                                        onClick={() => navigate('/categories')}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        {t('common:viewAll')}
                                    </button>
                                )}
                            </div>

                            {!stats?.topCategories || stats.topCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50">
                                    <Layers size={48} className="text-slate-200 mb-4" />
                                    <p className="text-slate-400 text-sm font-medium">{t('common:noResults')}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {stats.topCategories?.slice(0, 3).map((category: any, index: number) => (
                                        <div
                                            key={category.id}
                                            className="group flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                                            onClick={() => navigate('/categories')}
                                        >
                                            <div className="w-16 h-16 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:rotate-6">
                                                <Layers size={28} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={clsx("font-bold text-slate-900 dark:text-slate-100 truncate", isRTL ? "text-right" : "text-left")}>
                                                    {isRTL ? category.nameAr || category.name : category.name}
                                                </h4>
                                                <p className={clsx("text-xs text-slate-500 mt-0.5 font-medium", isRTL ? "text-right" : "text-left")}>
                                                    {category.productCount || 0} {t('common:products') || 'Products'}
                                                </p>
                                            </div>
                                            <div className={clsx("text-right", isRTL ? "pl-2" : "pr-2")}>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">
                                                    #{index + 1}
                                                </span>
                                                <ChevronRight size={18} className={clsx("text-slate-300 group-hover:text-primary transition-colors", isRTL && "rotate-180")} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Add-ons (Full width when order summary hidden) */}
                        {!showOrderSummary && (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className={clsx("text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight", isRTL && "text-right")}>
                                        {t('topAddons') || 'Top Add-ons'}
                                    </h3>
                                    {stats?.topAddons && stats.topAddons.length > 0 && (
                                        <button
                                            onClick={() => navigate('/addons')}
                                            className="text-primary text-sm font-bold hover:underline"
                                        >
                                            {t('common:viewAll')}
                                        </button>
                                    )}
                                </div>

                                {!stats?.topAddons || stats.topAddons.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/50">
                                        <Zap size={48} className="text-slate-200 mb-4" />
                                        <p className="text-slate-400 text-sm font-medium">{t('common:noResults')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {stats.topAddons?.slice(0, 3).map((addon: any, index: number) => (
                                            <div
                                                key={addon.id}
                                                className="group flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                                                onClick={() => navigate('/addons')}
                                            >
                                                <div className="w-16 h-16 rounded bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 transition-transform group-hover:rotate-6">
                                                    <Zap size={28} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx("font-bold text-slate-900 dark:text-slate-100 truncate", isRTL ? "text-right" : "text-left")}>
                                                        {isRTL ? addon.nameAr || addon.name : addon.name}
                                                    </h4>
                                                    <p className={clsx("text-xs text-slate-500 mt-0.5 font-medium", isRTL ? "text-right" : "text-left")}>
                                                        {addon.price ? `${addon.price.toLocaleString()} ${t('common:currencySymbol')}` : t('common:free')}
                                                    </p>
                                                </div>
                                                <div className={clsx("text-right", isRTL ? "pl-2" : "pr-2")}>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">
                                                        #{index + 1}
                                                    </span>
                                                    <ChevronRight size={18} className={clsx("text-slate-300 group-hover:text-primary transition-colors", isRTL && "rotate-180")} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Revenue Performance section */}
            {hasPermission('analytics.view') && user?.role !== UserRole.SUPER_ADMIN && (
                <div className={clsx("bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors", isRTL ? "text-right" : "text-left")}>
                    <div className="flex flex-col mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('revenuePerformance')}</h3>
                        <p className="text-sm text-slate-400 font-medium">{t('last30Days')}</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                key={`chart-${isRTL}`}
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="0 0" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    dy={15}
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
                                    tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    dx={isRTL ? 15 : -15}
                                    tickFormatter={(val) => `${val.toLocaleString()}`}
                                    orientation={isRTL ? "right" : "left"}
                                />
                                <Tooltip
                                    cursor={{ fill: isDark ? '#1e293b' : '#f8fafc', opacity: 0.8 }}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                        borderRadius: '4px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '12px 16px',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                    itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: 700 }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    formatter={(val: any) => [`${val.toLocaleString()} ${t('common:currencySymbol')}`, t('totalRevenue')]}
                                    labelFormatter={(label) => {
                                        const parts = label.split('-');
                                        if (parts.length === 3) {
                                            const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                        }
                                        return label;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    radius={[4, 4, 4, 4]}
                                    barSize={12}
                                    minPointSize={4}
                                >
                                    {chartData.map((entry, index) => {
                                        const todayStr = new Date().toLocaleDateString('sv-SE');
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.label === todayStr ? '#4F46E5' : (isDark ? '#334155' : '#e2e8f0')}
                                                className="transition-all duration-300 hover:fill-primary"
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Subscription & Management Section - Moved to bottom */}
            {user?.role === UserRole.STORE_OWNER && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-4">
                    {/* My Plan Card */}
                    {subscription && (() => {
                        const plan = (subscription?.plan || 'free').toUpperCase();
                        const planKey = plan.toLowerCase();
                        const isPremium = plan === 'PREMIUM';
                        const isPro = plan === 'PRO';

                        const bgClass = isPremium
                            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-none'
                            : isPro
                                ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
                        const textClassPrimary = isPremium ? 'text-amber-400' : isPro ? 'text-primary' : 'text-slate-900 dark:text-slate-100';
                        const textClassSecondary = isPremium ? 'text-white/60' : isPro ? 'text-primary/60' : 'text-slate-500';
                        const badgeClass = isPremium
                            ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                            : isPro
                                ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
                        const PlanIcon = isPremium ? Crown : isPro ? Zap : Shield;

                        return (
                            <div className={clsx('relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-8 py-4 rounded transition-all duration-500 group h-full', bgClass)}>
                                {/* Decorative background elements */}
                                {isPremium && (
                                    <>
                                        <div className={clsx("absolute top-0 -mt-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150", isRTL ? "left-0 -ml-10" : "right-0 -mr-10")} />
                                        <div className={clsx("absolute bottom-0 -mb-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:translate-x-8", isRTL ? "right-0 -mr-10" : "left-0 -ml-10")} />
                                    </>
                                )}
                                {isPro && (
                                    <div className={clsx("absolute inset-y-0 w-1/2 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity", isRTL ? "left-0" : "right-0")} />
                                )}

                                <div className="relative z-10 flex items-center gap-5">
                                    <div className={clsx('w-12 h-12 rounded flex items-center justify-center transform -rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110', badgeClass)}>
                                        <PlanIcon size={24} className={isPremium ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="flex flex-col justify-center text-start">
                                        <p className={clsx('text-[10px] font-bold uppercase tracking-widest mb-0.5', textClassSecondary)}>
                                            {t('subscriptions:currentPlan')}
                                        </p>
                                        <p className={clsx('text-xl font-black uppercase tracking-tight', textClassPrimary)}>
                                            {t(`subscriptions:plans.${planKey}.name`, plan)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/subscription')}
                                    className={clsx(
                                        'relative z-10 w-full sm:w-auto px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0',
                                        isPremium
                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 hover:shadow-lg hover:shadow-amber-500/30'
                                            : isPro
                                                ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30'
                                                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-[1.02] shadow-md hover:shadow-xl'
                                    )}
                                >
                                    {t('common:manage')}
                                </button>
                            </div>
                        );
                    })()}

                    {/* Manage Your Store Card */}
                    {hasPermission('store.update') && (
                        <div className={clsx(
                            "relative overflow-hidden group rounded h-full",
                            "p-5 md:py-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
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
                                {/* 1. Icon (Star) */}
                                <div className="shrink-0">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/30 rounded flex items-center justify-center text-white shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                                        <Store size={28} strokeWidth={1} />
                                    </div>
                                </div>

                                {/* 2. Content (Center) */}
                                <div className="flex-1 space-y-0.5">
                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                                        {t('common:manageYourStore')}
                                    </h3>
                                    <p className="text-white/80 font-medium text-xs md:text-sm opacity-90 max-w-[200px] md:max-w-none">
                                        {t('common:updateStoreDirectly')}
                                    </p>
                                </div>
                            </div>

                            {/* 3. Action Block (End) */}
                            <div className="relative z-10 shrink-0">
                                <button
                                    onClick={() => navigate('/store-settings')}
                                    className={clsx(
                                        "group/btn relative px-6 py-3 bg-white text-slate-900 overflow-hidden transition-all duration-300 shadow-xl active:scale-95 hover:bg-slate-900 hover:text-white rounded"
                                    )}
                                >
                                    <span className="relative z-10 flex items-center gap-4 font-black uppercase tracking-[0.2em] text-[8px]">
                                        {t('common:storeSettings')}
                                        <ChevronRight size={14} className={clsx("transition-transform group-hover/btn:translate-x-1", isRTL && "rotate-180")} />
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isConfirmModalOpen && confirmData && (
                <ConfirmModal
                    isOpen={isConfirmModalOpen}
                    title={confirmData.type === 'CANCEL' ? t('cancelInvitation') : confirmData.type === 'REJECT' ? t('common:reject') : t('approve')}
                    message={t('common:confirmAction', { action: confirmData.type, name: confirmData.name })}
                    onConfirm={handleHiringAction}
                    onCancel={() => {
                        setIsConfirmModalOpen(false);
                        setConfirmData(null);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
