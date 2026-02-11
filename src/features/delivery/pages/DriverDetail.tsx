import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    Clock,
    ShieldCheck,
    User,
    MapPin,
    Edit,
    Calendar,
    ExternalLink,
    Map
} from 'lucide-react';
import { getDriverById, adminToggleDriverBusy } from '../api/delivery-drivers.api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/user-role';
import { Permissions } from '../../../types/permissions';
import { toast } from '../../../utils/toast';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import clsx from 'clsx';

// Modern Stat Card with Gradient Subtle Accent
const StatCard = ({ title, value, icon: Icon, color, trend }: any) => {
    const colorClasses: any = {
        emerald: 'from-emerald-50 to-emerald-100/30 text-emerald-700 border-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/5 dark:text-emerald-400 dark:border-emerald-800',
        blue: 'from-blue-50 to-blue-100/30 text-blue-700 border-blue-100 dark:from-blue-900/20 dark:to-blue-900/5 dark:text-blue-400 dark:border-blue-800',
        orange: 'from-orange-50 to-orange-100/30 text-orange-700 border-orange-100 dark:from-orange-900/20 dark:to-orange-900/5 dark:text-orange-400 dark:border-orange-800',
        red: 'from-rose-50 to-rose-100/30 text-rose-700 border-rose-100 dark:from-rose-900/20 dark:to-rose-900/5 dark:text-rose-400 dark:border-rose-800',
        indigo: 'from-indigo-50 to-indigo-100/30 text-indigo-700 border-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/5 dark:text-indigo-400 dark:border-indigo-800',
    };

    return (
        <div className={clsx(
            "relative overflow-hidden bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group rounded-[4px]",
        )}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{value}</h3>
                </div>
                <div className={clsx("p-2 rounded-[4px] bg-gradient-to-br", colorClasses[color] || colorClasses.indigo)}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            </div>
            {/* Background Decorative Element */}
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.07] transition-opacity">
                <Icon size={80} strokeWidth={1} />
            </div>
        </div>
    );
};

// Modern Detail Section Card
const DetailCard = ({ title, icon: Icon, children, className, action }: any) => (
    <div className={clsx("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px] flex flex-col overflow-hidden", className)}>
        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400">
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{title}</h3>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className="p-6 h-full font-medium">
            {children}
        </div>
    </div>
);

const DriverDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { user: authUser, hasPermission } = useAuth();
    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canEdit = hasPermission(Permissions.DELIVERY_DRIVERS_UPDATE);
    const canToggleBusy = hasPermission(Permissions.DELIVERY_DRIVERS_UPDATE) &&
        driver?.deliveryProfile?.driverType === 'STORE_DRIVER';

    const handleToggleBusy = async () => {
        if (!id) return;
        setToggling(true);
        try {
            await adminToggleDriverBusy(id);
            const response: any = await getDriverById(id);
            setDriver(response.data || response);
            toast.success(t('statusUpdated', 'Status updated successfully'));
        } catch (err) {
            console.error("Failed to toggle busy status:", err);
            toast.error(t('errorUpdatingStatus', 'Failed to update status'));
        } finally {
            setToggling(false);
        }
    };

    useEffect(() => {
        const fetchDriverDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await getDriverById(id);
                setDriver(response.data || response);
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch driver details:", err);
                setError(t('failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        fetchDriverDetail();
    }, [id, t]);

    const getStatusBadge = (status: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-[4px] border transition-all";
        switch (status) {
            case 'VERIFIED':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50`}><ShieldCheck size={12} strokeWidth={2.5} /> {t('delivery.drivers.verification.verified')}</span>;
            case 'UNDER_REVIEW':
                return <span className={`${baseClass} bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50`}><Clock size={12} strokeWidth={2.5} /> {t('delivery.drivers.verification.under_review')}</span>;
            case 'REJECTED':
                return <span className={`${baseClass} bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50`}><XCircle size={12} strokeWidth={2.5} /> {t('delivery.drivers.verification.rejected')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}>{status}</span>;
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error || !driver) {
        return (
            <div className="p-10 text-center">
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 border border-rose-100 dark:border-rose-900/30 font-bold inline-block rounded-[4px]">
                    {error || t('noDataAvailable')}
                </div>
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/delivery-drivers')}
                        className="flex items-center gap-2 mx-auto text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-sm hover:translate-x-[-4px] transition-transform duration-200"
                    >
                        <ChevronLeft size={18} className="rtl:rotate-180" /> {t('back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/delivery-drivers')}
                    className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-[4px] border border-slate-200 dark:border-slate-800 group-hover:border-indigo-300 dark:group-hover:border-indigo-800 shadow-sm transition-all">
                        <ChevronLeft size={18} className="rtl:rotate-180" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">{t('back')}</span>
                </button>

                {canEdit && (
                    <button
                        onClick={() => navigate(`/delivery-drivers/edit/${driver.id}`)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[4px] shadow-sm shadow-indigo-200 dark:shadow-none transition-all text-sm active:scale-95"
                    >
                        <Edit size={16} />
                        {t('delivery.drivers.edit_title')}
                    </button>
                )}
            </div>

            {/* Profile Overview Banner */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[4px] opacity-10 group-hover:opacity-15 transition-opacity blur-xl shadow-2xl -z-10" />
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[4px] shadow-sm relative overflow-hidden">
                    {/* Abstract background pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-0" />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[4px] border-4 border-slate-50 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                                {driver.deliveryProfile?.avatarUrl ? (
                                    <img src={driver.deliveryProfile.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl font-black bg-slate-50 dark:bg-slate-800">
                                        {driver.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className={clsx(
                                "absolute -bottom-2 -right-2 w-8 h-8 rounded-[4px] border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center",
                                driver.deliveryProfile?.isAvailableForWork ? "bg-emerald-500" : "bg-slate-400"
                            )} title={driver.deliveryProfile?.isAvailableForWork ? t('delivery.status.online') : t('delivery.status.offline')}>
                                {driver.deliveryProfile?.isAvailableForWork ? <CheckCircle size={16} className="text-white" /> : <XCircle size={16} className="text-white" />}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-start">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase leading-tight">{driver.name}</h1>
                                {getStatusBadge(driver.deliveryProfile?.verificationStatus || driver.storeDriverStatus)}
                            </div>
                            <p className="text-slate-500 lowercase font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                                <span className="opacity-50">@</span>{driver.username}
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span className="text-xs uppercase tracking-widest font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {driver.deliveryProfile?.driverType === 'FREELANCER' ? t('driverTypes.FREELANCER') : t('driverTypes.STORE_DRIVER')}
                                </span>
                            </p>

                            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-[4px] border border-slate-100 dark:border-slate-700/50">
                                    <Calendar size={14} className="text-indigo-500" />
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">
                                        {t('fields.joined_at')}
                                        <div className="text-xs text-slate-700 dark:text-slate-200 mt-0.5 font-bold">
                                            {new Date(driver.joinedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-[4px] border border-slate-100 dark:border-slate-700/50">
                                    <SmartphoneIcon size={14} className="text-indigo-500" />
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">
                                        {t('fields.phone')}
                                        <div className="text-xs text-slate-700 dark:text-slate-200 mt-0.5 font-bold">{driver.phone}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('delivery.drivers.stats.on_the_way_orders')}
                    value={driver.onTheWayOrdersCount || 0}
                    icon={Package}
                    color="orange"
                />
                <StatCard
                    title={t('delivery.drivers.stats.delivered_orders')}
                    value={driver.deliveredOrdersCount || 0}
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatCard
                    title={t('delivery.drivers.stats.cancelled_orders')}
                    value={driver.cancelledOrdersCount || 0}
                    icon={XCircle}
                    color="red"
                />
                <StatCard
                    title={t('delivery.drivers.stats.total_orders')}
                    value={driver.totalOrdersCount || 0}
                    icon={Truck}
                    color="blue"
                />
            </div>

            {/* Detailed Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Status, Vehicle & Operating Regions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Availability Card */}
                    <DetailCard title={t('fields.status')} icon={Clock}>
                        <div className="space-y-6">
                            <div className="group/item">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fields.availability')}</span>
                                    <div className={clsx(
                                        "flex items-center gap-2 px-2.5 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all",
                                        driver.deliveryProfile?.isAvailableForWork
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50"
                                            : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                    )}>
                                        <span className={clsx("w-2 h-2 rounded-full", driver.deliveryProfile?.isAvailableForWork ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                        {driver.deliveryProfile?.isAvailableForWork ? t('delivery.status.online') : t('delivery.status.offline')}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-[4px] border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed transition-colors group-hover/item:border-indigo-100 dark:group-hover/item:border-indigo-900/40">
                                    {driver.deliveryProfile?.isAvailableForWork ? t('delivery.status.online_desc') : t('delivery.status.offline_desc')}
                                </div>
                            </div>

                            <div className="group/item pt-6 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('delivery.status.busy')}</span>
                                    <div className="flex items-center gap-3">
                                        {canToggleBusy && (
                                            <label className={clsx("relative inline-flex items-center", !toggling ? "cursor-pointer" : "cursor-default")}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={driver.deliveryProfile?.isBusy}
                                                    onChange={handleToggleBusy}
                                                    disabled={toggling}
                                                />
                                                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-sm transition-all"></div>
                                            </label>
                                        )}
                                        <div className={clsx(
                                            "flex items-center gap-2 px-2.5 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all",
                                            driver.deliveryProfile?.isBusy
                                                ? "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/50"
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50"
                                        )}>
                                            <span className={clsx("w-2 h-2 rounded-full", driver.deliveryProfile?.isBusy ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                            {driver.deliveryProfile?.isBusy ? t('delivery.status.busy') : t('delivery.status.available')}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-[4px] border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed transition-colors group-hover/item:border-indigo-100 dark:group-hover/item:border-indigo-900/40">
                                    {driver.deliveryProfile?.isBusy ? t('delivery.status.busy_desc') : t('delivery.status.available_desc')}
                                </div>
                            </div>
                        </div>
                    </DetailCard>

                    {/* Vehicle Details Card */}
                    <DetailCard title={t('delivery.drivers.vehicle_details')} icon={Truck}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group/v">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('delivery.drivers.vehicle_type')}</span>
                                <div className="flex items-center gap-2 group-hover/v:translate-x-[-4px] transition-transform">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight tabular-nums">
                                        {driver.deliveryProfile?.vehicleType ? t('vehicle_types.' + driver.deliveryProfile.vehicleType) : t('notSet')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center group/v pt-4 border-t border-slate-50 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('delivery.drivers.plate_number')}</span>
                                <div className="flex items-center gap-2 group-hover/v:translate-x-[-4px] transition-transform">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {driver.deliveryProfile?.vehiclePlateNumber || t('notSet')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DetailCard>

                    {/* Contact Card (Dark Theme) */}
                    <div className="bg-slate-900 text-white p-6 rounded-[4px] shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rotate-45 translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000" />
                        <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
                            <User size={16} className="text-indigo-400" strokeWidth={2.5} /> {t('fields.contact')}
                        </h3>
                        <div className="space-y-5 relative z-10">
                            <a href={`mailto:${driver.email}`} className="flex items-center gap-4 hover:bg-white/5 p-2 rounded transition-colors group/e">
                                <div className="p-2 bg-indigo-500/20 rounded text-indigo-400 group-hover/e:scale-110 transition-transform">
                                    <Mail size={16} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t('fields.email')}</p>
                                    <p className="text-xs font-bold mt-0.5 break-all opacity-90">{driver.email}</p>
                                </div>
                                <ExternalLink size={12} className="ml-auto opacity-0 group-hover/e:opacity-40 transition-opacity" />
                            </a>
                            <a href={`tel:${driver.phone}`} className="flex items-center gap-4 hover:bg-white/5 p-2 rounded transition-colors group/p">
                                <div className="p-2 bg-emerald-500/20 rounded text-emerald-400 group-hover/p:scale-110 transition-transform">
                                    <Phone size={16} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t('fields.phone')}</p>
                                    <p className="text-xs font-bold mt-0.5 opacity-90">{driver.phone}</p>
                                </div>
                                <ExternalLink size={12} className="ml-auto opacity-0 group-hover/p:opacity-40 transition-opacity" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Side: Verification Documents & Regions */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Identity Verification */}
                    <DetailCard title={t('delivery.drivers.identity_verification')} icon={ShieldCheck}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-3 group/doc">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{t('delivery.drivers.id_front')}</p>
                                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded opacity-0 group-hover/doc:opacity-100 transition-opacity"><ExternalLink size={10} /></div>
                                </div>
                                <div className="aspect-[3/2] rounded-[4px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center relative shadow-sm group-hover/doc:shadow-md transition-all group-hover/doc:border-indigo-200 dark:group-hover/doc:border-indigo-900/50">
                                    {driver.deliveryProfile?.identityImageFrontUrl ? (
                                        <img src={driver.deliveryProfile.identityImageFrontUrl} alt="Identity Front" className="w-full h-full object-cover transition-transform duration-700 group-hover/doc:scale-110" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <ShieldCheck size={32} strokeWidth={1.5} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">No Document</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 group/doc">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{t('delivery.drivers.id_back')}</p>
                                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded opacity-0 group-hover/doc:opacity-100 transition-opacity"><ExternalLink size={10} /></div>
                                </div>
                                <div className="aspect-[3/2] rounded-[4px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center relative shadow-sm group-hover/doc:shadow-md transition-all group-hover/doc:border-indigo-200 dark:group-hover/doc:border-indigo-900/50">
                                    {driver.deliveryProfile?.identityImageBackUrl ? (
                                        <img src={driver.deliveryProfile.identityImageBackUrl} alt="Identity Back" className="w-full h-full object-cover transition-transform duration-700 group-hover/doc:scale-110" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <ShieldCheck size={32} strokeWidth={1.5} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">No Document</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 group/doc">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{t('delivery.drivers.selfie')}</p>
                                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded opacity-0 group-hover/doc:opacity-100 transition-opacity"><ExternalLink size={10} /></div>
                                </div>
                                <div className="aspect-[3/2] rounded-[4px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center relative shadow-sm group-hover/doc:shadow-md transition-all group-hover/doc:border-indigo-200 dark:group-hover/doc:border-indigo-900/50">
                                    {driver.deliveryProfile?.identityImageSelfieUrl ? (
                                        <img src={driver.deliveryProfile.identityImageSelfieUrl} alt="Selfie" className="w-full h-full object-cover transition-transform duration-700 group-hover/doc:scale-110" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <ShieldCheck size={32} strokeWidth={1.5} />
                                            <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">No Document</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {driver.deliveryProfile?.rejectionReason && (
                            <div className="mt-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-[4px] flex items-start gap-4">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full shrink-0">
                                    <XCircle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase text-rose-800 dark:text-rose-300 tracking-widest mb-1">{t('delivery.drivers.rejection_reason')}</h4>
                                    <p className="text-sm text-rose-700 dark:text-rose-400 font-medium leading-relaxed">{driver.deliveryProfile.rejectionReason}</p>
                                </div>
                            </div>
                        )}
                    </DetailCard>

                    {/* Operating Regions Card */}
                    <DetailCard title={t('delivery.drivers.operating_regions')} icon={Map}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin size={14} className="text-indigo-500" />
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{t('towns')}</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {driver.deliveryProfile?.towns && driver.deliveryProfile.towns.length > 0 ? (
                                        driver.deliveryProfile.towns.map((town: any) => (
                                            <span key={town.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-[4px] shadow-sm hover:border-indigo-300 dark:hover:border-indigo-900/50 transition-all cursor-default group/chip">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover/chip:scale-125 transition-transform" />
                                                {isRTL ? town.arName : town.enName}
                                            </span>
                                        ))
                                    ) : (
                                        <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded text-center">
                                            <span className="text-[10px] text-slate-400 italic font-black uppercase tracking-widest leading-none">{t('notSet')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin size={14} className="text-emerald-500" />
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{t('places')}</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {driver.deliveryProfile?.places && driver.deliveryProfile.places.length > 0 ? (
                                        driver.deliveryProfile.places.map((place: any) => (
                                            <span key={place.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-[4px] shadow-sm hover:border-emerald-300 dark:hover:border-emerald-900/50 transition-all cursor-default group/chip">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/chip:scale-125 transition-transform" />
                                                {isRTL ? place.arName : place.enName}
                                            </span>
                                        ))
                                    ) : (
                                        <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded text-center">
                                            <span className="text-[10px] text-slate-400 italic font-black uppercase tracking-widest leading-none">{t('notSet')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

// Internal Helper Icon
const SmartphoneIcon = ({ size, className }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
);

export default DriverDetail;
