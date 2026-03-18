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
    MapPin
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
    chartData: ChartDataItem[];
}

const StoreDashboard: React.FC<StoreDashboardProps> = ({
    stats,
    user,
    storeDetails,
    subscription,
    hasPermission,
    chartData
}) => {
    const { t } = useTranslation(['dashboard', 'common', 'orders', 'subscriptions']);
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<{ id: string, type: 'CANCEL' | 'REJECT' | 'ACCEPT', name: string } | null>(null);
    const [hiringTab, setHiringTab] = useState<'incoming' | 'sent'>('incoming');

    // Dynamic Chart Colors
    const gridColor = isDark ? '#334155' : '#f1f5f9';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#94a3b8';

    const handleHiringAction = async () => {
        if (!confirmData) return;
        const { id, type } = confirmData;
        setIsConfirmModalOpen(false);
        setActionLoading(id);

        try {
            if (type === 'CANCEL') {
                await cancelHiringRequest(id);
            } else {
                await respondToHiringRequest(id, type === 'REJECT' ? 'REJECTED' : 'ACCEPTED');
            }
            toast.success(t('common:success'));
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common:error'));
        } finally {
            setActionLoading(null);
            setConfirmData(null);
        }
    };

    const renderStatusBanner = () => {
        if (user?.role !== 'store_owner') return null;
        if (!storeDetails || storeDetails.status?.toUpperCase() === 'ACTIVE') return null;

        const status = storeDetails.status?.toUpperCase();
        const reason = storeDetails.statusReason;
        const Icon = status === 'SUSPENDED' ? ShieldAlert : status === 'INACTIVE' ? AlertTriangle : Clock;

        return (
            <div className={clsx(
                "border rounded p-5 flex gap-4 animate-in slide-in-from-top-4 duration-500",
                status === 'SUSPENDED' ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20" : "bg-amber-50 border-amber-200 dark:bg-amber-900/20",
                isRTL && "flex-row-reverse"
            )}>
                <div className="p-3 rounded bg-white/50 dark:bg-black/20 text-amber-500 h-fit">
                    <Icon size={24} />
                </div>
                <div className={clsx("space-y-1 flex-1", isRTL ? "text-right" : "text-left")}>
                    <h4 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-300">
                        {status === 'SUSPENDED' ? t('common:accountSuspended') : status === 'INACTIVE' ? t('common:accountInactive') : t('common:underReview')}
                    </h4>
                    <p className="text-sm font-medium opacity-90 text-slate-600 dark:text-slate-400">
                        {reason || t('common:statusReasonPlaceholder')}
                    </p>
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
                <div className="p-3 rounded bg-white/50 dark:bg-black/20 text-amber-500 h-fit">
                    <AlertTriangle size={24} />
                </div>
                <div className={clsx("space-y-1 flex-1", isRTL ? "text-right" : "text-left")}>
                    <h4 className="text-lg font-black uppercase tracking-tight text-amber-800 dark:text-amber-300">
                        {t('subscriptions:planEndingAlert')}
                        {subscription?.gracePeriodEnd && (
                            <span className="mx-2 bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded text-sm inline-block text-center min-w-[80px]">
                                <CountdownTimer expiryDate={subscription.gracePeriodEnd} />
                            </span>
                        )}
                    </h4>
                    <button onClick={() => navigate('/subscription')} className="text-amber-700 dark:text-amber-400 text-xs font-bold underline uppercase tracking-widest mt-1">
                        {t('subscriptions:renewBundle')}
                    </button>
                </div>
            </div>
        );
    };

    const showOrderSummary = hasPermission('orders.view') || hasPermission('orders.update') || hasPermission('analytics.view');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {renderStatusBanner()}
            {renderGracePeriodBanner()}

            <div className={clsx("grid gap-8", showOrderSummary ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1")}>
                <div className={clsx("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", showOrderSummary ? "lg:col-span-3" : "w-full")}>
                    <StatCard title={t('dashboard:todayRevenue')} value={`${(stats.todayRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} icon={Zap} color="emerald" />
                    <StatCard title={t('dashboard:todayOrders')} value={stats.todayOrders || 0} icon={Activity} color="blue" />
                    <StatCard title={t('dashboard:totalRevenue')} value={`${(stats.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} icon={DollarSign} color="emerald" />
                    <StatCard title={t('dashboard:totalOrders')} value={stats.totalOrders || 0} icon={ShoppingBag} color="orange" />
                    <StatCard title={t('dashboard:totalProducts')} value={stats.totalProducts || 0} icon={Store} color="indigo" />
                    <StatCard title={t('dashboard:totalClients')} value={stats.totalClients || 0} icon={Users} color="emerald" />
                </div>

                {showOrderSummary && stats.statusCounts && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <h3 className="font-black text-slate-900 dark:text-white tracking-tight mb-6">{t('dashboard:orderSummary')}</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.statusCounts).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx("w-2 h-2 rounded-full",
                                            status === 'PENDING' ? "bg-amber-400" :
                                                status === 'CONFIRMED' ? "bg-blue-400" :
                                                    status === 'DELIVERED' ? "bg-emerald-400" : "bg-slate-400"
                                        )} />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t(`dashboard:status.${status.toLowerCase()}`)}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Hiring Requests Section */}
            {(stats.incomingRequests && stats.incomingRequests.length > 0) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden rounded">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard:incomingRequests')}</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {stats.incomingRequests.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                                            {req.delivery?.avatarUrl ? <img src={req.delivery.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users size={24} className="text-slate-200" />}
                                        </div>
                                        <div className={isRTL ? "text-right" : "text-left"}>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{req.delivery?.profile?.user?.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{req.delivery?.driverType}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setConfirmData({ id: req.id, type: 'ACCEPT', name: req.delivery?.profile?.user?.name }); setIsConfirmModalOpen(true); }}
                                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-700"
                                        >
                                            {t('dashboard:approve')}
                                        </button>
                                        <button
                                            onClick={() => { setConfirmData({ id: req.id, type: 'REJECT', name: req.delivery?.profile?.user?.name }); setIsConfirmModalOpen(true); }}
                                            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold uppercase rounded hover:bg-rose-700"
                                        >
                                            {t('common:reject')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onCancel={() => setIsConfirmModalOpen(false)}
                onConfirm={handleHiringAction}
                title={confirmData?.type === 'ACCEPT' ? t('dashboard:approve') : t('common:reject')}
                message={t('common:areYouSure')}
            />
        </div>
    );
};

export default StoreDashboard;
