import React, { useEffect, useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    Map,
    ArrowRightLeft,
    UserMinus,
    UserPlus,
    MessageSquare,
    ShieldAlert,
    X
} from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import {
    getDriverById,
    adminToggleDriverAvailability,
    cancelHiringRequest,
    respondToResignation,
    initiateTransition,
    respondToTransition,
    verifyDriver
} from '../api/delivery-drivers.api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/user-role';
import { Permissions } from '../../../types/permissions';
import { AdminPermissions } from '../../../types/admin-permissions';
import { toast } from '../../../utils/toast';
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
            "relative overflow-hidden bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all   group rounded-[4px]",
        )}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[0.6875rem] font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">{value}</h3>
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
    const { t } = useTranslation(['common', 'delivery']);
    const { isRTL } = useLanguage();
    const { user: authUser, hasPermission, hasAdminPermission } = useAuth();
    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const backUrl = location.state?.from || '/delivery-drivers';

    const isSystemAdmin = authUser?.role === UserRole.ADMIN || authUser?.role === UserRole.SUPER_ADMIN;

    // Store levels can only edit store drivers. System admins can edit both.
    const canEdit = hasPermission(Permissions.DELIVERY_DRIVERS_UPDATE) &&
        (isSystemAdmin || driver?.deliveryProfile?.driverType === 'STORE_DRIVER');


    const canToggleAvailability = hasPermission(Permissions.DELIVERY_DRIVERS_UPDATE) &&
        driver?.deliveryProfile?.driverType === 'STORE_DRIVER';

    const handleToggleAvailability = async () => {
        if (!id) return;
        setToggling(true);
        try {
            await adminToggleDriverAvailability(id);
            const response: any = await getDriverById(id, isSystemAdmin);
            setDriver(response.data || response);
            toast.success(t('statusUpdated', 'Status updated successfully'));
        } catch (err) {
            console.error("Failed to toggle availability status:", err);
            toast.error(t('errorUpdatingStatus', 'Failed to update status'));
        } finally {
            setToggling(false);
        }
    };

    const [cancelling, setCancelling] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: 'CONVERT_TO_STORE_DRIVER' | 'CONVERT_TO_FREELANCER' | 'APPROVE_RESIGNATION' | 'REJECT_RESIGNATION' | null;
        notes?: string;
        rejectionReason?: string;
    }>({ isOpen: false, type: null });

    const [verificationModal, setVerificationModal] = useState<{
        isOpen: boolean;
        status: string;
        rejectionReason: string;
        notes: string;
    }>({ isOpen: false, status: '', rejectionReason: '', notes: '' });

    const [verifying, setVerifying] = useState(false);

    const confirmVerification = async () => {
        if (!id) return;
        setVerifying(true);
        try {
            const reason = verificationModal.status === 'REJECTED' ? verificationModal.rejectionReason : undefined;
            await verifyDriver(id, verificationModal.status, verificationModal.notes, reason);
            toast.success(t('verificationSuccess', 'Driver verification updated successfully'));
            setVerificationModal({ ...verificationModal, isOpen: false });

            // Refresh driver data
            const response: any = await getDriverById(id, isSystemAdmin);
            setDriver(response.data || response);
        } catch (error) {
            console.error('Failed to verify driver', error);
            toast.error(t('verificationError', 'Failed to update verification status'));
        } finally {
            setVerifying(false);
        }
    };

    const handleTransition = async () => {
        if (!id || !actionModal.type) return;
        setTransitioning(true);
        try {
            if (actionModal.type === 'CONVERT_TO_STORE_DRIVER') {
                await initiateTransition({ deliveryId: id, type: 'TO_STORE_DRIVER', notes: actionModal.notes });
                toast.success(t('delivery:drivers.transition.offer_sent', 'Store driver offer sent successfully'));
            } else if (actionModal.type === 'CONVERT_TO_FREELANCER') {
                await initiateTransition({ deliveryId: id, type: 'TO_FREELANCER', notes: actionModal.notes });
                toast.success(t('delivery:drivers.transition.request_sent', 'Request to become freelancer sent'));
            } else if (actionModal.type === 'APPROVE_RESIGNATION') {
                await respondToResignation(id, true);
                toast.success(t('delivery:drivers.resignation.approved', 'Resignation approved'));
                navigate(backUrl);
                return;
            } else if (actionModal.type === 'REJECT_RESIGNATION') {
                await respondToResignation(id, false, actionModal.rejectionReason);
                toast.success(t('delivery:drivers.resignation.rejected', 'Resignation rejected'));
            }

            // Refresh driver data
            const response: any = await getDriverById(id, isSystemAdmin);
            setDriver(response.data || response);
        } catch (err: any) {
            console.error("Transition action failed:", err);
            toast.error(err.response?.data?.message || t('common.error'));
        } finally {
            setTransitioning(false);
            setActionModal({ isOpen: false, type: null });
        }
    };

    const handleCancelHiringRequest = async () => {
        if (!driver?.storeDriverRequestId) return;

        setIsCancelModalOpen(true);
    };

    const confirmCancelHiring = async () => {
        if (!driver?.storeDriverRequestId) return;
        setIsCancelModalOpen(false);
        setCancelling(true);
        try {
            await cancelHiringRequest(driver.storeDriverRequestId);
            toast.success(t('delivery:drivers.drivers.cancel_hiring_success', 'Hiring request cancelled successfully'));
            navigate(backUrl);
        } catch (err: any) {
            console.error("Failed to cancel hiring request:", err);
            toast.error(t('delivery:drivers.drivers.cancel_hiring_failed', 'Failed to cancel hiring request'));
        } finally {
            setCancelling(false);
        }
    };

    useEffect(() => {
        const fetchDriverDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await getDriverById(id, isSystemAdmin);
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
        const baseClass = "inline-flex items-center gap-1.5 px-3 py-1 text-[0.625rem] font-bold uppercase tracking-widest rounded-[4px] border transition-all";
        switch (status) {
            case 'VERIFIED':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50`}><ShieldCheck size={12} strokeWidth={2.5} /> {t('delivery:drivers.verification.verified')}</span>;
            case 'UNDER_REVIEW':
                return <span className={`${baseClass} bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50`}><Clock size={12} strokeWidth={2.5} /> {t('delivery:drivers.verification.under_review')}</span>;
            case 'REJECTED':
                return <span className={`${baseClass} bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50`}><XCircle size={12} strokeWidth={2.5} /> {t('delivery:drivers.verification.rejected')}</span>;
            case 'PENDING':
                return <span className={`${baseClass} bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50`}><Clock size={12} strokeWidth={2.5} /> {t('delivery:drivers.hiring_status.pending', 'Pending')}</span>;
            case 'ACCEPTED':
                return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50`}><CheckCircle size={12} strokeWidth={2.5} /> {t('verificationStatuses.ACCEPTED', 'Accepted')}</span>;
            case 'REMOVED':
                return <span className={`${baseClass} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}><XCircle size={12} strokeWidth={2.5} /> {t('verificationStatuses.REMOVED', 'Removed')}</span>;
            case 'CANCELLED':
            case 'RESIGNATION_PENDING':
                return <span className={`${baseClass} bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50`}><Clock size={12} strokeWidth={2.5} /> {t('delivery:drivers.hiring_status.resignation_pending', 'Resignation Pending')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}>{status}</span>;
        }
    };

    if (loading) return <LoadingSpinner fullHeight={false} />;

    if (error || !driver) {
        return (
            <div className="p-10 text-center">
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 border border-rose-100 dark:border-rose-900/30 font-bold inline-block rounded-[4px]">
                    {error || t('noDataAvailable')}
                </div>
                <div className="mt-6">
                    <button
                        onClick={() => navigate(backUrl)}
                        className="flex items-center gap-2 mx-auto text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-sm hover:translate-x-[-4px] transition-transform duration-200"
                    >
                        <ChevronLeft size={18} className="rtl:rotate-180" /> {t('back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(backUrl)}
                    className="group flex items-center gap-3 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all"
                >
                    <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 group- group-hover:shadow-indigo-500/10 transition-all">
                        <ChevronLeft size={20} className="rtl:rotate-180" />
                    </div>
                    <div>
                        <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.2em] block leading-none mb-1 opacity-50">{t('back')}</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{t('delivery:drivers.verification.title', 'Verification Audit')}</span>
                    </div>
                </button>

            </div>

            {/* Main Audit Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Audit Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Critical Alerts - e.g. Resignation */}
                    {driver.storeDriverStatus === 'RESIGNATION_PENDING' && (
                        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-[4px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full shadow-inner">
                                    <ShieldAlert size={28} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold uppercase tracking-[0.1em] text-rose-800 dark:text-rose-300">{t('delivery:drivers.resignation.request_received')}</h4>
                                    {driver.resignationReason && (
                                        <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">"{driver.resignationReason}"</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => setActionModal({ isOpen: true, type: 'APPROVE_RESIGNATION' })}
                                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[0.625rem] font-extrabold uppercase tracking-widest rounded-[4px] shadow-lg shadow-rose-500/20 transition-all active:translate-y-0.5"
                                >
                                    {t('accept')}
                                </button>
                                <button
                                    onClick={() => setActionModal({ isOpen: true, type: 'REJECT_RESIGNATION', rejectionReason: '' })}
                                    className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[0.625rem] font-extrabold uppercase tracking-widest rounded-[4px] hover:bg-slate-50 transition-all active:translate-y-0.5"
                                >
                                    {t('reject')}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Identity Verification Section - Hero of the page */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] shadow-sm overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800/50">
                        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-600 text-white rounded shadow-lg shadow-indigo-500/20">
                                    <ShieldCheck size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-100">{t('delivery:drivers.identity_verification')}</h2>
                                    <p className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t('delivery:authenticityCheck', 'Document Authenticity Check')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(driver.verificationStatus)}
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Large Format Images */}
                                <div className="space-y-6 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: t('delivery:drivers.id_front'), url: driver.identityImageFrontUrl, icon: ShieldCheck },
                                            { label: t('delivery:drivers.id_back'), url: driver.identityImageBackUrl, icon: ShieldCheck },
                                            { label: t('delivery:drivers.selfie'), url: driver.identityImageSelfieUrl, icon: User }
                                        ].map((doc, idx) => (
                                            <div key={idx} className="space-y-3 group/doc">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.15em] text-slate-400">{doc.label}</span>
                                                    {doc.url && <ExternalLink size={12} className="text-slate-300 group-hover/doc:text-indigo-500 transition-colors" />}
                                                </div>
                                                <div className="relative aspect-[4/3] rounded-[4px] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden group-hover/doc:border-indigo-500/50 transition-all shadow-sm active:scale-[0.98]">
                                                    {doc.url ? (
                                                        <>
                                                            <img
                                                                src={doc.url}
                                                                alt={doc.label}
                                                                className="w-full h-full object-cover cursor-zoom-in group-hover/doc:scale-105 transition-transform duration-500"
                                                                onClick={() => window.open(doc.url, '_blank')}
                                                            />
                                                            <div className="absolute inset-0 bg-black/5 group-hover/doc:bg-transparent transition-colors pointer-events-none" />
                                                        </>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                                                            <doc.icon size={32} className="text-slate-200 dark:text-slate-800" strokeWidth={1.5} />
                                                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-300 dark:text-slate-700">{t('noDocument')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Persistent Audit Controls */}
                                {hasAdminPermission(AdminPermissions.DRIVER_VERIFICATION_MANAGE) && (
                                    <div className="md:col-span-2 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[4px] border border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div>
                                                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-1">{t('delivery:finalAuditDecision', 'Final Audit Decision')}</h3>
                                                    <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400 font-medium">{t('delivery:auditInstruction', 'Evaluate the documentation and update the driver verification status.')}</p>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <button
                                                        onClick={() => setVerificationModal({ isOpen: true, status: 'REJECTED', rejectionReason: '', notes: '' })}
                                                        className="px-8 py-3 bg-white dark:bg-slate-900 text-rose-600 border border-rose-200 dark:border-rose-900/50 text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] rounded-[4px] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center gap-3 shadow-sm active:translate-y-0.5"
                                                    >
                                                        <XCircle size={16} strokeWidth={2.5} />
                                                        {t('reject', 'Reject Access')}
                                                    </button>
                                                    <button
                                                        onClick={() => setVerificationModal({ isOpen: true, status: 'VERIFIED', rejectionReason: '', notes: '' })}
                                                        className="px-8 py-3 bg-emerald-600 text-white text-[0.6875rem] font-extrabold uppercase tracking-[0.1em] rounded-[4px] hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 active:translate-y-0.5 ring-2 ring-emerald-500/10 ring-offset-2 dark:ring-offset-slate-900"
                                                    >
                                                        <CheckCircle size={16} strokeWidth={2.5} />
                                                        {t('delivery:verifyPersonnel', 'Verify Personnel')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Operating Regions Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] shadow-sm">
                        <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3">
                            <div className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                <Map size={16} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('delivery:drivers.operating_regions')}</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
                                        <MapPin size={16} className="text-indigo-500" />
                                        <h4 className="text-[0.625rem] font-extrabold uppercase text-slate-400 tracking-widest">{t('towns')}</h4>
                                        <span className="ml-auto text-[0.625rem] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-extrabold text-slate-500">{driver.towns?.length || 0}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {driver.towns && driver.towns.length > 0 ? (
                                            driver.towns.map((town: any) => (
                                                <span key={town.id} className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[0.6875rem] font-bold text-slate-700 dark:text-slate-300 rounded-[4px] hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group/chip">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    {isRTL ? town.arName : town.enName}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-wider italic">{t('notSet')}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
                                        <MapPin size={16} className="text-emerald-500" />
                                        <h4 className="text-[0.625rem] font-extrabold uppercase text-slate-400 tracking-widest">{t('places')}</h4>
                                        <span className="ml-auto text-[0.625rem] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-extrabold text-slate-500">{driver.places?.length || 0}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {driver.places && driver.places.length > 0 ? (
                                            driver.places.map((place: any) => (
                                                <span key={place.id} className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[0.6875rem] font-bold text-slate-700 dark:text-slate-300 rounded-[4px] hover:border-emerald-400 dark:hover:border-emerald-50 transition-all group/chip">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {isRTL ? place.arName : place.enName}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-wider italic">{t('notSet')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {driver.verificationStatus === 'REJECTED' && driver.rejectionReason && (
                        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-[4px] flex items-center gap-5">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center shrink-0 shadow-sm ring-4 ring-rose-50 dark:ring-rose-900/10">
                                <XCircle size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-[0.625rem] font-extrabold uppercase text-rose-800 dark:text-rose-300 tracking-[0.2em] mb-1">{t('delivery:drivers.rejection_reason')}</h4>
                                <p className="text-sm text-rose-700 dark:text-rose-400 font-bold leading-tight uppercase tracking-tight">{driver.rejectionReason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info & Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Compact Profile Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full blur-3xl -z-0 -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex items-center gap-5 mb-8 relative z-10">
                            <div className="w-20 h-20 rounded-[4px] border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800 shadow-sm relative group/avatar">
                                <div className="w-full h-full rounded-[2px] overflow-hidden bg-slate-100 dark:bg-slate-900">
                                    {driver.avatarUrl ? (
                                        <img src={driver.avatarUrl} alt={driver.profile?.user?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-extrabold">{driver.profile?.user?.name?.charAt(0)}</div>
                                    )}
                                </div>
                                <div className={clsx(
                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900",
                                    driver.isAvailableForWork ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                )} />
                            </div>
                            <div>
                                <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight uppercase tracking-tight">{driver.profile?.user?.name}</h1>
                                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                                    <span className="opacity-40">@</span>{driver.profile?.user?.username}
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    <span className="text-[0.625rem] text-indigo-500 font-extrabold tracking-widest uppercase">{t('driverTypes.' + (driver.deliveryProfile?.driverType || 'FREELANCER'))}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-[4px]">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t('fields.phone')}</span>
                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 font-mono tracking-tight">{driver.profile?.user?.phone}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-[4px]">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t('fields.joined_at')}</span>
                                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 tracking-tight">
                                    {new Date(driver.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Metadata */}
                    <div className="bg-slate-900 dark:bg-black border border-slate-800 rounded-[4px] p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="flex items-center gap-3 mb-6 relative z-10 pb-4 border-b border-white/5">
                            <div className="p-1.5 bg-white/5 rounded text-emerald-400 border border-white/10 shadow-inner shadow-black">
                                <Truck size={16} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xs font-extrabold uppercase tracking-widest">{t('delivery:drivers.vehicle_details')}</h3>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-[0.2em] mb-1.5">{t('delivery:drivers.vehicle_type')}</p>
                                <p className="text-sm font-extrabold tracking-tight uppercase text-emerald-400">
                                    {driver.vehicleType ? t('vehicle_types.' + driver.vehicleType) : '--'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-[0.2em] mb-1.5">{t('delivery:drivers.plate_number')}</p>
                                <p className="text-xl font-extrabold tracking-tight tabular-nums text-slate-100 flex items-center justify-between">
                                    {driver.vehiclePlateNumber || '--'}
                                    <ShieldCheck size={16} className="text-white/10" />
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Summary & Quick Stats */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4px] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">{t('delivery:performanceSummary', 'Performance Summary')}</h3>
                            <ChevronLeft size={14} className="text-slate-300 -rotate-90" />
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
                            {[
                                { label: t('delivery:onTheWay', 'On the way'), value: driver.onTheWayOrdersCount || 0, icon: Package, color: 'text-amber-500' },
                                { label: t('delivered'), value: driver.deliveredOrdersCount || 0, icon: CheckCircle, color: 'text-emerald-500' },
                                { label: t('returned'), value: driver.returnedOrdersCount || 0, icon: MapPin, color: 'text-blue-500' },
                                { label: t('cancelled'), value: driver.cancelledOrdersCount || 0, icon: XCircle, color: 'text-rose-500' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-4 flex flex-col items-center justify-center gap-1 group/stat hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <stat.icon size={14} className={clsx(stat.color, "group-hover/stat:scale-110 transition-transform")} />
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{stat.value}</span>
                                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-tight">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[0.625rem] font-extrabold text-slate-500 uppercase tracking-widest">{t('delivery:totalOrders', 'Total Orders')}</span>
                                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 underline-offset-4">{driver.totalOrdersCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    <DetailCard title={t('fields.status')} icon={Clock} className="!p-0 h-auto">
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest">{t('fields.availability')}</span>
                                <div className={clsx(
                                    "px-2.5 py-1 rounded-[4px] text-[0.625rem] font-extrabold uppercase tracking-widest",
                                    driver.isAvailableForWork ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                )}>
                                    {driver.isAvailableForWork ? t('delivery:status.online') : t('delivery:status.offline')}
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest">{t('delivery:status.busy')}</span>
                                <div className={clsx(
                                    "px-2.5 py-1 rounded-[4px] text-[0.625rem] font-extrabold uppercase tracking-widest",
                                    driver.isBusy ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                                )}>
                                    {driver.isBusy ? t('delivery:status.busy') : t('delivery:status.available')}
                                </div>
                            </div>
                        </div>
                    </DetailCard>
                </div>
            </div>
            {isCancelModalOpen && (
                <ConfirmModal
                    isOpen={isCancelModalOpen}
                    title={t('delivery:drivers.drivers.cancel_hiring_title', 'Cancel Hiring Request')}
                    message={t('delivery:drivers.drivers.confirm_cancel_hiring', 'Are you sure you want to cancel this hiring request?')}
                    onConfirm={confirmCancelHiring}
                    onCancel={() => setIsCancelModalOpen(false)}
                />
            )}

            {actionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <ArrowRightLeft size={16} className="text-indigo-500" />
                                {actionModal.type?.includes('RESIGNATION') ? t('delivery:drivers.resignation.title', 'Resignation Action') : t('delivery:drivers.transition.title', 'Transition Action')}
                            </h3>
                            <button onClick={() => setActionModal({ isOpen: false, type: null })} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
                                {actionModal.type === 'CONVERT_TO_STORE_DRIVER' && t('delivery:drivers.transition.make_store_driver_confirm', 'Are you sure you want to invite this driver to become a Store Driver? They will be exclusive to your store once they accept.')}
                                {actionModal.type === 'CONVERT_TO_FREELANCER' && t('delivery:drivers.transition.convert_to_freelancer_confirm', 'Are you sure you want to transition this store driver to freelancer status? They will be able to work with other stores.')}
                                {actionModal.type === 'APPROVE_RESIGNATION' && t('delivery:drivers.drivers.accept_resignation_confirm')}
                                {actionModal.type === 'REJECT_RESIGNATION' && t('delivery:drivers.drivers.reject_resignation_confirm')}
                            </p>

                            {(actionModal.type === 'CONVERT_TO_STORE_DRIVER' || actionModal.type === 'CONVERT_TO_FREELANCER') && (
                                <div className="space-y-2 mb-6">
                                    <label className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MessageSquare size={12} /> {t('fields.notes', 'Notes')}
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[4px] text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                        rows={3}
                                        placeholder={t('fields.notes_placeholder', 'Add any additional notes...')}
                                        onChange={(e) => setActionModal(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                            )}

                            {actionModal.type === 'REJECT_RESIGNATION' && (
                                <div className="space-y-2 mb-6">
                                    <label className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MessageSquare size={12} /> {t('rejection_reason', 'Reason for rejection')} <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[4px] text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400"
                                        rows={3}
                                        placeholder={t('rejection_reason_placeholder', 'Please provide a reason...')}
                                        value={actionModal.rejectionReason || ''}
                                        onChange={(e) => setActionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={() => setActionModal({ isOpen: false, type: null })}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[4px] font-extrabold uppercase tracking-widest text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleTransition}
                                    disabled={transitioning || (actionModal.type === 'REJECT_RESIGNATION' && !actionModal.rejectionReason)}
                                    className={clsx(
                                        "flex-[2] py-3 px-4 text-white rounded-[4px] font-extrabold uppercase tracking-widest text-xs transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2",
                                        actionModal.type?.includes('REJECT') ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                                    )}
                                >
                                    {transitioning ? <LoadingSpinner size="sm" fullHeight={false} /> : t('common.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {verificationModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-500" />
                                {verificationModal.status === 'VERIFIED' ? t('approve', 'Approve') : t('reject', 'Reject')} {driver?.name}
                            </h3>
                            <button onClick={() => setVerificationModal({ ...verificationModal, isOpen: false })} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
                                {verificationModal.status === 'VERIFIED'
                                    ? t('approve_confirm_msg', 'Are you sure you want to verify this driver? They will be able to start accepting orders immediately.')
                                    : t('reject_confirm_msg', 'Please provide a reason for rejecting this driver\'s application.')}
                            </p>

                            {verificationModal.status === 'REJECTED' && (
                                <div className="space-y-2 mb-4">
                                    <label className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-400">{t('rejection_reason', 'Rejection Reason')}</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[4px] text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400"
                                        rows={3}
                                        placeholder={t('provide_rejection_reason', 'Provide a reason for rejection (required)')}
                                        value={verificationModal.rejectionReason}
                                        onChange={(e) => setVerificationModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 mb-6">
                                <label className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-400">{t('admin_notes', 'Admin Notes')} ({t('optional', 'Optional')})</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[4px] text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    rows={2}
                                    placeholder={t('provide_notes', 'Internal notes (optional)')}
                                    value={verificationModal.notes}
                                    onChange={(e) => setVerificationModal(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setVerificationModal({ ...verificationModal, isOpen: false })}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[4px] font-extrabold uppercase tracking-widest text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
                                >
                                    {t('cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={confirmVerification}
                                    disabled={verifying || (verificationModal.status === 'REJECTED' && !verificationModal.rejectionReason)}
                                    className={clsx(
                                        "flex-[2] py-3 px-4 text-white rounded-[4px] font-extrabold uppercase tracking-widest text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2",
                                        verificationModal.status === 'VERIFIED'
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                            : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                    )}
                                >
                                    {verifying ? <LoadingSpinner size="sm" fullHeight={false} /> : t('confirm', 'Confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverDetail;
