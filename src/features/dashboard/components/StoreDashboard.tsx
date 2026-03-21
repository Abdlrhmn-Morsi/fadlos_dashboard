import React, { useState } from 'react';
import {
    Users,
    ShoppingBag,
    DollarSign,
    Store,
    Heart,
    Star,
    CheckCircle,
    Layers,
    ShieldAlert,
    AlertTriangle,
    Info,
    Clock,
    Edit,
    ChevronRight,
    Zap,
    Activity,
    Truck,
    MapPin,
    Crown,
    Shield,
    TrendingUp
} from 'lucide-react';
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
import { DashboardStats, ChartDataItem } from '../models/dashboard.model';
import { SubscriptionUsage } from '../../subscriptions/api/subscriptions.api';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import { respondToHiringRequest, cancelHiringRequest } from '../../delivery/api/delivery-drivers.api';
import CountdownTimer from '../../../components/common/CountdownTimer';
import { UserRole } from '../../../types/user-role';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: any;
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

interface StoreDashboardProps {
    stats: DashboardStats;
    user: any;
    storeDetails: any;
    subscription: SubscriptionUsage | null;
    hasPermission: (perm: string) => boolean;
}

const StoreDashboard: React.FC<StoreDashboardProps> = ({
    stats,
    user,
    storeDetails,
    subscription,
    hasPermission
}) => {
    const { t, i18n } = useTranslation(['dashboard', 'common', 'orders', 'subscriptions']);
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<{ id: string, type: 'CANCEL' | 'REJECT' | 'ACCEPT', name: string } | null>(null);
    const [hiringTab, setHiringTab] = useState<'incoming' | 'sent'>('incoming');

    const chartData = stats.chartData || [];

    // Dynamic Chart Colors
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const textColor = '#94a3b8';

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
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common:error'));
        } finally {
            setActionLoading(null);
            setConfirmData(null);
        }
    };

    const renderStatusBanner = () => {
        if (!storeDetails || storeDetails.status?.toUpperCase() === 'ACTIVE') return null;
        if (!hasPermission('store.view')) return null;

        const status = storeDetails.status?.toUpperCase();
        const reason = storeDetails.statusReason;

        let bgColor = "bg-amber-50 dark:bg-amber-900/20";
        let borderColor = "border-amber-200 dark:border-amber-800";
        let textColorClass = "text-amber-800 dark:text-amber-300";
        let iconColor = "text-amber-500";
        let label = t('common:underReview');
        let Icon = Clock;

        if (status === 'SUSPENDED') {
            bgColor = "bg-rose-50 dark:bg-rose-900/20";
            borderColor = "border-rose-200 dark:border-rose-800";
            textColorClass = "text-rose-800 dark:text-rose-300";
            iconColor = "text-rose-500";
            label = t('common:accountSuspended');
            Icon = ShieldAlert;
        } else if (status === 'INACTIVE') {
            bgColor = "bg-slate-50 dark:bg-slate-800";
            borderColor = "border-slate-200 dark:border-slate-700";
            textColorClass = "text-slate-800 dark:text-slate-300";
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
                    <h4 className={`text-lg font-black uppercase tracking-tight ${textColorClass}`}>{label}</h4>
                    <p className={`text-sm font-medium opacity-90 ${textColorClass}`}>
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

    const renderBranchInfo = () => {
        if (user?.role !== UserRole.EMPLOYEE || !user?.profile?.employee?.branch) return null;

        const branch = user.profile.employee.branch;
        return (
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
                            ? [branch.town?.arName || branch.town?.enName, branch.place?.arName || branch.place?.enName, branch.addressAr || branch.addressEn].filter(Boolean).join(' - ')
                            : [branch.town?.enName || branch.town?.arName, branch.place?.enName || branch.place?.arName, branch.addressEn || branch.addressAr].filter(Boolean).join(' - ')}
                    </p>
                </div>
            </div>
        );
    };

    const renderActionCenter = () => {
        if (user?.role !== UserRole.STORE_OWNER && user?.role !== UserRole.EMPLOYEE) return null;
        if (!stats.incomingRequests && !stats.sentInvitations) return null;

        const incoming = stats.incomingRequests || [];
        const sent = stats.sentInvitations || [];

        if (incoming.length === 0 && sent.length === 0) return null;

        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={20} className="text-primary" />
                        <h3 className={clsx("text-lg font-bold text-slate-900 dark:text-slate-100", isRTL && "text-right")}>
                            {t('dashboard:actionCenter')}
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500">{t('dashboard:totalDrivers')}</p>
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
                        {t('dashboard:incomingRequests')}
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
                        {t('dashboard:sentInvitations')}
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
                                    <p className="text-sm text-slate-400 italic">{t('dashboard:noHiringRequests')}</p>
                                </div>
                            ) : (
                                incoming.map((req: any) => (
                                    <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded group hover:border-primary/30 transition-all gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.delivery?.avatarUrl ?
                                                    <img src={req.delivery.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.delivery?.profile?.user?.name || 'Unknown Driver'}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded">
                                                        {String(t(`dashboard:status.${req.status?.toLowerCase()}`, req.status))}
                                                    </span>
                                                    <span className={clsx(
                                                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                                        req.delivery?.verificationStatus === 'VERIFIED'
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                    )}>
                                                        {req.delivery?.verificationStatus === 'VERIFIED' ? t('common:verified') : req.delivery?.verificationStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'ACCEPT', name: req.delivery?.profile?.user?.name });
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                disabled={actionLoading === req.id}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                                            >
                                                {t('common:approve')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setConfirmData({ id: req.id, type: 'REJECT', name: req.delivery?.profile?.user?.name });
                                                    setIsConfirmModalOpen(true);
                                                }}
                                                disabled={actionLoading === req.id}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 text-white text-xs font-bold uppercase rounded shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-50"
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
                                    <p className="text-sm text-slate-400 italic">{t('dashboard:noHiringRequests')}</p>
                                </div>
                            ) : (
                                sent.map((req: any) => (
                                    <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded group transition-all gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden shadow-sm">
                                                {req.delivery?.avatarUrl ?
                                                    <img src={req.delivery.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                                                    <Users size={24} className="text-slate-200" />}
                                            </div>
                                            <div className={isRTL ? "text-right" : "text-left"}>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.delivery?.profile?.user?.name || 'Unknown Driver'}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded">
                                                        {String(t(`dashboard:status.${req.status?.toLowerCase()}`, req.status))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setConfirmData({ id: req.id, type: 'CANCEL', name: req.delivery?.profile?.user?.name });
                                                setIsConfirmModalOpen(true);
                                            }}
                                            disabled={actionLoading === req.id}
                                            className="w-full sm:w-auto px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded hover:bg-slate-300 transition-all dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50"
                                        >
                                            {t('dashboard:cancelInvitation')}
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

    return (
        <div className={clsx(
            "max-w-full mx-auto space-y-8 animate-in fade-in duration-700",
            isRTL ? "font-cairo" : "font-inter"
        )}>
            {renderStatusBanner()}
            {renderGracePeriodBanner()}
            {renderBranchInfo()}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <div className="lg:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <StatCard title={t('dashboard:todayRevenue')} value={`${(stats.todayRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} icon={Zap} color="emerald" />
                    <StatCard title={t('dashboard:todayOrders')} value={stats.todayOrders || 0} icon={Activity} color="blue" />
                    <StatCard title={t('dashboard:totalRevenue')} value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} icon={DollarSign} color="emerald" />
                    <StatCard title={t('dashboard:totalOrders')} value={stats.totalOrders || 0} icon={ShoppingBag} color="orange" />
                    <StatCard title={t('dashboard:totalProducts')} value={stats.totalProducts || 0} icon={Store} color="indigo" />
                    <StatCard title={t('dashboard:totalEmployees')} value={stats.totalEmployees || 0} icon={Users} color="violet" />
                </div>

                {/* Sidebar Summary */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{t('dashboard:orderSummary')}</h3>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {t('common:thisMonth')}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: t('common:pending'), value: stats.statusCounts?.PENDING || 0, bg: "bg-amber-500" },
                            { label: t('common:confirmed'), value: stats.statusCounts?.CONFIRMED || 0, bg: "bg-blue-500" },
                            { label: t('orders:onTheWay'), value: stats.statusCounts?.OUT_FOR_DELIVERY || 0, bg: "bg-indigo-500" },
                            { label: t('common:delivered'), value: (stats.statusCounts?.DELIVERED || 0) + (stats.statusCounts?.DELIVERED_CONFIRMED || 0), bg: "bg-emerald-500" },
                            { label: t('common:cancelled'), value: stats.statusCounts?.CANCELLED || 0, bg: "bg-rose-500" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("w-2 h-2 rounded-full", item.bg)} />
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Visual Content (Chart + Top Products) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex flex-col mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">{t('dashboard:revenuePerformance')}</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">{t('dashboard:last30Days')}</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="0 0" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 11, fontWeight: 600 }}
                                    dy={15}
                                    reversed={isRTL}
                                    tickFormatter={(str) => {
                                        const parts = str.split('-');
                                        return parts.length === 3 ? parseInt(parts[2], 10).toString() : str;
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 11, fontWeight: 600 }}
                                    dx={isRTL ? 15 : -15}
                                    orientation={isRTL ? "right" : "left"}
                                />
                                <Tooltip
                                    cursor={{ fill: isDark ? '#1e293b' : '#f8fafc', opacity: 0.8 }}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                        borderRadius: '4px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                    formatter={(val: any) => [`${val.toLocaleString()} ${t('common:currencySymbol')}`, t('dashboard:totalRevenue')]}
                                />
                                <Bar dataKey="revenue" radius={[4, 4, 4, 4]} barSize={12}>
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

                {/* Top Rated Products */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">{t('dashboard:topRatedProducts')}</h3>
                        <button onClick={() => navigate('/products')} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">{t('common:viewAll')}</button>
                    </div>
                    <div className="space-y-4">
                        {(!stats.topRatedProducts || stats.topRatedProducts.length === 0) ? (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded">
                                <ShoppingBag size={48} className="text-slate-200 mb-4" />
                                <p className="text-slate-400 text-sm">{t('common:noResults')}</p>
                            </div>
                        ) : (
                            stats.topRatedProducts.slice(0, 4).map((product: any, idx) => (
                                <div key={product.id} className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                                    <div className="w-16 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        {product.coverImage ? <img src={product.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <ShoppingBag size={24} className="text-slate-300 m-auto" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{isRTL ? product.nameAr || product.name : product.name}</h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Star size={12} className="fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Number(product.averageRating || 5).toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className="text-[10px] font-black text-slate-300 block mb-1">#{idx + 1}</span>
                                        <span className="text-xs font-bold text-primary tabular-nums">{product.unitsSold || 0} {t('common:unitsSold')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Action Center - Moved after visual content */}
            {renderActionCenter()}

            {/* Bottom Tier Cards (Plan & Management) */}
            {user?.role === UserRole.STORE_OWNER && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                    {/* My Plan Card */}
                    {subscription && (() => {
                        const plan = (subscription.plan || 'free').toUpperCase();
                        const isPremium = plan === 'PREMIUM';
                        const isPro = plan === 'PRO';
                        const PlanIcon = isPremium ? Crown : isPro ? Zap : Shield;

                        return (
                            <div className={clsx(
                                "relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-6 rounded transition-all duration-500 group",
                                isPremium ? "bg-slate-900 text-white border-none shadow-xl" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                            )}>
                                {isPremium && (
                                    <>
                                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none group-hover:translate-x-8 transition-transform duration-700" />
                                    </>
                                )}
                                <div className="z-10 flex items-center gap-5">
                                    <div className={clsx(
                                        "w-14 h-14 rounded flex items-center justify-center transform -rotate-3 group-hover:rotate-0 transition-transform duration-500",
                                        isPremium ? "bg-amber-400 text-slate-900" : "bg-primary/10 text-primary"
                                    )}>
                                        <PlanIcon size={28} className={isPremium ? "animate-pulse" : ""} />
                                    </div>
                                    <div className="text-start">
                                        <p className={clsx("text-[10px] font-black uppercase tracking-widest mb-1", isPremium ? "text-amber-400/80" : "text-slate-400")}>{t('subscriptions:currentPlan')}</p>
                                        <p className={clsx("text-2xl font-black uppercase tracking-tight", isPremium ? "text-amber-400" : "text-slate-900 dark:text-white")}>
                                            {t(`subscriptions:plans.${plan.toLowerCase()}.name`, plan)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/subscription')}
                                    className={clsx(
                                        "z-10 w-full sm:w-auto px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded transition-all duration-300",
                                        isPremium ? "bg-amber-400 text-slate-900 hover:shadow-lg hover:shadow-amber-500/30" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105"
                                    )}
                                >
                                    {t('common:manage')}
                                </button>
                            </div>
                        );
                    })()}

                    {/* Manage Store Shortcut */}
                    {hasPermission('store.update') && (
                        <div className="relative overflow-hidden group rounded p-8 bg-primary flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
                            <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-[2000ms]" />
                            <div className="z-10 flex items-center gap-6">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl border border-white/30 rounded flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                                    <Store size={32} strokeWidth={1.5} />
                                </div>
                                <div className="text-start">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{t('common:manageYourStore')}</h3>
                                    <p className="text-white/80 text-sm font-medium">{t('common:updateStoreDirectly')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/store-settings')}
                                className="z-10 group/btn bg-white text-slate-900 px-6 py-3 rounded font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-4 hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                {t('common:storeSettings')}
                                <ChevronRight size={14} className={clsx("transition-transform group-hover/btn:translate-x-1", isRTL && "rotate-180")} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                onConfirm={handleHiringAction}
                title={confirmData?.type === 'CANCEL' ? t('dashboard:cancelInvitation') : confirmData?.type === 'REJECT' ? t('common:reject') : t('common:approve')}
                message={t('common:areYouSure')}
            />
        </div>
    );
};

export default StoreDashboard;
