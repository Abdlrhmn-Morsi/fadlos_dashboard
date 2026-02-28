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

                // Fetch subscription usage for store owners
                if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) {
                    try {
                        const subData = await getMySubscriptionUsage();
                        setSubscription(subData as SubscriptionUsage);
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

    const renderPendingApprovals = () => {
        if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.ADMIN) return null;
        if (!stats.pendingApprovals) return null;

        const { stores, drivers } = stats.pendingApprovals;
        if (stores.length === 0 && drivers.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
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
                                <p className="text-xs text-slate-400 italic">{t('common.no_results')}</p>
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
                                <p className="text-xs text-slate-400 italic">{t('common.no_results')}</p>
                            ) : (
                                drivers.map((profile: any) => (
                                    <div key={profile.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={20} className="text-slate-300" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.user?.name || 'Unknown Driver'}</p>
                                                <p className="text-[10px] text-slate-400">{profile.driverType}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/delivery-drivers`)}
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
                                    <p className="text-sm text-slate-400 italic">{t('common.no_results')}</p>
                                </div>
                            ) : (
                                incoming.map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.driver?.deliveryProfile?.avatarUrl ?
                                                    <img src={req.driver.deliveryProfile.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.driver?.name || 'Unknown Driver'}</p>
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
                                                            req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED'
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED' ? t('common.verified') : (req.driver?.deliveryProfile?.verificationStatus || 'Unknown')}
                                                        </span>
                                                    </div>
                                                    {req.notes && <span className="text-[10px] text-slate-400 truncate max-w-[150px]">— {req.notes}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'ACCEPT', name: req.driver?.name });
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                disabled={actionLoading === req.id}
                                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {t('approve')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'REJECT', name: req.driver?.name });
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
                                    <p className="text-sm text-slate-400 italic">{t('common.no_results')}</p>
                                </div>
                            ) : (
                                sent.map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg group hover:border-slate-300 dark:hover:border-slate-600 transition-all text-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.driver?.deliveryProfile?.avatarUrl ?
                                                    <img src={req.driver.deliveryProfile.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.driver?.name || 'Unknown Driver'}</p>
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
                                                            req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED'
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                        )}>
                                                            {req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED' ? t('common.verified') : (req.driver?.deliveryProfile?.verificationStatus || 'Unknown')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setConfirmData({ id: req.id, type: 'CANCEL', name: req.driver?.name });
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
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
        <div className="p-6 space-y-8 animate-in animate-fade">
            {renderStatusBanner()}

            {/* Subscription Badge */}
            {subscription && (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (() => {
                const plan = (subscription.plan || 'free').toUpperCase();
                const planKey = plan.toLowerCase();
                const isPremium = plan === 'PREMIUM';
                const isPro = plan === 'PRO';

                const bgClass = isPremium
                    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-none'
                    : isPro
                        ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
                const textClassPrimary = isPremium ? 'text-amber-400' : isPro ? 'text-primary' : 'text-slate-900 dark:text-slate-100';
                const textClassSecondary = isPremium ? 'text-white/60' : isPro ? 'text-primary/60' : 'text-slate-500';
                const badgeClass = isPremium
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                    : isPro
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
                const PlanIcon = isPremium ? Crown : isPro ? Zap : Shield;

                return (
                    <div className={clsx('relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-8 py-6 rounded-2xl transition-all duration-500 group', bgClass)}>
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
                            <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center transform -rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110', badgeClass)}>
                                <PlanIcon size={28} className={isPremium ? 'animate-pulse' : ''} />
                            </div>
                            <div className="flex flex-col justify-center text-start">
                                <p className={clsx('text-xs font-bold uppercase tracking-widest mb-1', textClassSecondary)}>
                                    {t('subscriptions:currentPlan')}
                                </p>
                                <p className={clsx('text-2xl font-black uppercase tracking-tight', textClassPrimary)}>
                                    {t(`subscriptions:plans.${planKey}.name`, plan)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/subscription')}
                            className={clsx(
                                'relative z-10 w-full sm:w-auto px-8 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0',
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Today's Revenue */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('todayRevenue')}
                        value={`${(stats.todayRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                        icon={Zap}
                        color="emerald"
                    />
                )}

                {/* Today's Pending Revenue */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('orders:pendingRevenue')}
                        value={`${(stats.todayPendingRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                        icon={Clock}
                        color="amber"
                    />
                )}

                {/* Total Revenue */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('totalRevenue')}
                        value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                        icon={DollarSign}
                        color="emerald"
                    />
                )}

                {/* Total Pending Revenue */}
                {hasPermission('analytics.view') && (
                    <StatCard
                        title={t('orders:pendingRevenue')}
                        value={`${(stats.totalPendingRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                        icon={Clock}
                        color="amber"
                    />
                )}

                {/* Today's Orders */}
                {(hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view')) && (
                    <StatCard
                        title={t('todayOrders')}
                        value={stats.todayOrders || 0}
                        icon={Activity}
                        color="blue"
                    />
                )}

                {/* Total Orders */}
                {(hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view')) && (
                    <StatCard
                        title={t('totalOrders')}
                        value={stats.totalOrders || 0}
                        icon={ShoppingBag}
                        color="orange"
                    />
                )}

                {/* Pending Orders */}
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
                            title={t('pendingStores')}
                            value={stats.pendingStores || 0}
                            icon={Store}
                            color="amber"
                        />
                        <StatCard
                            title={t('platformUsers')}
                            value={stats.totalUsers || 0}
                            icon={Users}
                            color="violet"
                        />
                        <StatCard
                            title={t('totalCustomers')}
                            value={stats.totalCustomers || 0}
                            icon={Users}
                            color="emerald"
                        />
                        <StatCard
                            title={t('platformDrivers')}
                            value={stats.totalDrivers || 0}
                            icon={Truck}
                            color="blue"
                        />
                        <StatCard
                            title={t('totalProducts')}
                            value={stats.totalProducts || 0}
                            icon={Layers}
                            color="indigo"
                        />
                        <StatCard
                            title={t('activeSubscriptions')}
                            value={stats.activeSubscriptions || 0}
                            icon={Zap}
                            color="emerald"
                        />
                        <StatCard
                            title={t('totalTowns')}
                            value={stats.totalTowns || 0}
                            icon={MapPin}
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
                    </>
                )}
            </div>

            {/* Phase 2: Super Admin Sections */}
            {renderPendingApprovals()}
            {renderStoreHiringRequests()}
            {renderTopPerformingStores()}

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
                        {/* 1. Icon (Star) */}
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
                            <p className="text-slate-500 text-sm font-medium">{t('common.no_results')}</p>
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
                                    onClick={() => navigate(`/products/${product.id}`)}
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
                            <p className="text-slate-500 text-sm font-medium">{t('common.no_results')}</p>
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
            {hasPermission('analytics.view') && user?.role !== UserRole.SUPER_ADMIN && (
                <div className={clsx("bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors", isRTL ? "text-right" : "text-left")}>
                    <div className="flex flex-col mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('revenuePerformance')}</h3>
                        <p className="text-xs text-slate-400 font-medium">{t('last30Days')}</p>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                key={`chart-${isRTL}`}
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 10 }}
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
                                    itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                                    labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                                    formatter={(val: any) => [`${val.toLocaleString()} ${t('common:currencySymbol')}`, t('totalRevenue')]}
                                    labelFormatter={(label) => {
                                        const parts = label.split('-');
                                        if (parts.length === 3) {
                                            const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                                        }
                                        return label;
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    radius={[2, 2, 0, 0]}
                                    barSize={20}
                                    minPointSize={4}
                                    animationDuration={1500}
                                >
                                    {(() => {
                                        const todayStr = new Date().toLocaleDateString('sv-SE');
                                        return chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.label === todayStr ? '#4F46E5' : '#FF5C00'}
                                            />
                                        ));
                                    })()}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
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
