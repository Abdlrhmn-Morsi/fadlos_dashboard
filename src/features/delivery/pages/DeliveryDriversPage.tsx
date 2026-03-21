import React, { useState, useEffect } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { DeliveryDriversList, FreelancerMarketplace } from '../components';
import { useTranslation } from 'react-i18next';
import { Truck, Globe, Clock, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getSentHiringRequests, getReceivedHiringRequests, respondToHiringRequest, cancelHiringRequest, respondToTransition, getPendingCounts } from '../api/delivery-drivers.api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Permissions } from '../../../types/permissions';
import { getMySubscriptionUsage } from '../../subscriptions/api/subscriptions.api';
import { toast } from '../../../utils/toast';

const DeliveryDriversPage = () => {
    const { t } = useTranslation(['common', 'dashboard', 'delivery']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const mainTabParam = searchParams.get('mainTab');
    const validTabs = ['my-drivers', 'incoming', 'sent', 'marketplace'];
    const activeTab = mainTabParam && validTabs.includes(mainTabParam) 
        ? mainTabParam as 'my-drivers' | 'incoming' | 'sent' | 'marketplace'
        : 'my-drivers';

    const setActiveTab = (tab: 'my-drivers' | 'incoming' | 'sent' | 'marketplace') => {
        setSearchParams(prev => {
            prev.set('mainTab', tab);
            return prev;
        }, { replace: true });
    };

    const [incomingRequestsData, setIncomingRequestsData] = useState<{ requests: any[], totalPages: number, page: number }>({
        requests: [], totalPages: 1, page: 1
    });
    const [sentRequestsData, setSentRequestsData] = useState<{ requests: any[], totalPages: number, page: number }>({
        requests: [], totalPages: 1, page: 1
    });
    const [loading, setLoading] = useState(false);
    const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
    const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
    const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
    const [activeActionRequest, setActiveActionRequest] = useState<any | null>(null);

    const [pendingCounts, setPendingCounts] = useState<{incoming: number, sent: number, resignations: number}>({
        incoming: 0, sent: 0, resignations: 0
    });

    const fetchCounts = async () => {
        try {
            const counts = await getPendingCounts();
            if (counts) setPendingCounts(counts);
        } catch (error) {
            console.error('Failed to fetch pending counts:', error);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchIncomingRequests = async (page: number = incomingRequestsData.page) => {
        setLoading(true);
        try {
            const response = await getReceivedHiringRequests({ page, limit: 10 });
            if (response) {
                setIncomingRequestsData({ requests: response.data || [], totalPages: response.meta?.totalPages || 1, page });
            }
        } catch (error) {
            console.error('Failed to fetch incoming requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSentRequests = async (page: number = sentRequestsData.page) => {
        setLoading(true);
        try {
            const response = await getSentHiringRequests({ page, limit: 10 });
            if (response) {
                setSentRequestsData({ requests: response.data || [], totalPages: response.meta?.totalPages || 1, page });
            }
        } catch (error) {
            console.error('Failed to fetch sent requests:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'incoming') fetchIncomingRequests(1);
        else if (activeTab === 'sent') fetchSentRequests(1);
    }, [activeTab]);

    const handleHiringAction = async (request: any, action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
        const requestId = request.id;
        setActiveActionRequest(request);
        if (action === 'CANCEL') {
            setCancellingRequestId(requestId);
            return;
        }

        if (action === 'REJECT') {
            setRejectingRequestId(requestId);
            return;
        }

        if (action === 'ACCEPT') {
            setAcceptingRequestId(requestId);
            return;
        }
    };

    const confirmCancel = async () => {
        if (!cancellingRequestId) return;
        setLoading(true);
        try {
            await cancelHiringRequest(cancellingRequestId);
            fetchIncomingRequests();
            fetchSentRequests();
            fetchCounts();
        } catch (error) {
            console.error(`Failed to cancel hiring request:`, error);
        } finally {
            setLoading(false);
            setCancellingRequestId(null);
        }
    };

    const [rejectionReason, setRejectionReason] = useState<string>('');

    const confirmReject = async () => {
        if (!rejectingRequestId || !activeActionRequest) return;
        setLoading(true);
        try {
            if (activeActionRequest.status === 'TRANSITION_OFFER') {
                if (!rejectionReason.trim()) {
                    toast.error(t('common:rejection_reason_required'));
                    return;
                }
                await respondToTransition(rejectingRequestId, false, rejectionReason);
            } else {
                if (!rejectionReason.trim()) {
                    toast.error(t('common:rejection_reason_required'));
                    return;
                }
                await respondToHiringRequest(rejectingRequestId, 'REJECTED', rejectionReason);
            }
            fetchIncomingRequests();
            fetchCounts();
        } catch (error) {
            console.error(`Failed to reject request:`, error);
        } finally {
            setLoading(false);
            setRejectingRequestId(null);
            setActiveActionRequest(null);
            setRejectionReason('');
        }
    };

    const confirmAccept = async () => {
        if (!acceptingRequestId || !activeActionRequest) return;
        setLoading(true);
        try {
            if (activeActionRequest.status === 'TRANSITION_OFFER') {
                await respondToTransition(acceptingRequestId, true);
            } else {
                await respondToHiringRequest(acceptingRequestId, 'ACCEPTED');
            }
            fetchIncomingRequests();
            fetchSentRequests();
            fetchCounts();
        } catch (error) {
            console.error(`Failed to accept request:`, error);
        } finally {
            setLoading(false);
            setAcceptingRequestId(null);
            setActiveActionRequest(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">{t('delivery:drivers.title')}</h1>
                {hasPermission(Permissions.DELIVERY_DRIVERS_CREATE) && (
                    <button
                        onClick={async () => {
                            try {
                                const usage = await getMySubscriptionUsage();
                                // We need the current count of drivers. 
                                // Since we don't have it here easily without fetching, 
                                // we might want to just navigate or fetch briefly.
                                // For now, let's just navigate and let the new page handle it or check again.
                                // Alternatively, we can pass a callback to DeliveryDriversList.
                                navigate('/delivery-drivers/new', { state: { from: location.pathname + location.search } });
                            } catch (err) {
                                navigate('/delivery-drivers/new', { state: { from: location.pathname + location.search } });
                            }
                        }}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {t('delivery:drivers.add_new')}
                    </button>
                )}
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('my-drivers')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'my-drivers'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Truck size={18} />
                    {t('delivery:drivers.my_drivers')}
                </button>
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={clsx(
                        "flex items-center justify-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'incoming'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Clock size={18} />
                    {t('dashboard:incomingRequests')}
                    {pendingCounts.incoming > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ml-1">
                            {pendingCounts.incoming}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={clsx(
                        "flex items-center justify-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'sent'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Globe size={18} />
                    {t('dashboard:sentInvitations')}
                    {pendingCounts.sent > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full ml-1">
                            {pendingCounts.sent}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('marketplace')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'marketplace'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Globe size={18} />
                    {t('delivery:drivers.marketplace')}
                </button>
            </div>

            {activeTab === 'my-drivers' && <DeliveryDriversList pendingCounts={pendingCounts} />}
            {activeTab === 'incoming' && (
                <>
                    <HiringRequestsList
                        requests={incomingRequestsData.requests}
                        type="incoming"
                        loading={loading}
                        onAction={handleHiringAction}
                    />
                    {!loading && incomingRequestsData.totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => fetchIncomingRequests(Math.max(1, incomingRequestsData.page - 1))}
                                disabled={incomingRequestsData.page === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {t('common:previous')}
                            </button>
                            <span className="px-4 py-2 flex items-center">
                                {incomingRequestsData.page} / {incomingRequestsData.totalPages}
                            </span>
                            <button
                                onClick={() => fetchIncomingRequests(Math.min(incomingRequestsData.totalPages, incomingRequestsData.page + 1))}
                                disabled={incomingRequestsData.page === incomingRequestsData.totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {t('common:next')}
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'sent' && (
                <>
                    <HiringRequestsList
                        requests={sentRequestsData.requests}
                        type="sent"
                        loading={loading}
                        onAction={handleHiringAction}
                    />
                    {!loading && sentRequestsData.totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => fetchSentRequests(Math.max(1, sentRequestsData.page - 1))}
                                disabled={sentRequestsData.page === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {t('common:previous')}
                            </button>
                            <span className="px-4 py-2 flex items-center">
                                {sentRequestsData.page} / {sentRequestsData.totalPages}
                            </span>
                            <button
                                onClick={() => fetchSentRequests(Math.min(sentRequestsData.totalPages, sentRequestsData.page + 1))}
                                disabled={sentRequestsData.page === sentRequestsData.totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {t('common:next')}
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'marketplace' && <FreelancerMarketplace />}

            <ConfirmModal
                isOpen={!!cancellingRequestId}
                title={t('delivery:drivers.drivers.cancel_hiring_title')}
                message={t('delivery:drivers.drivers.confirm_cancel_hiring')}
                onConfirm={confirmCancel}
                onCancel={() => setCancellingRequestId(null)}
            />

            {rejectingRequestId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {t('delivery:drivers.reject_confirm_title')}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mb-4">
                                {t('delivery:drivers.reject_confirm_message')}
                            </p>
                            
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {t('common:rejection_reason')} <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder={t('common:rejection_reason_placeholder')}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none h-24"
                                    />
                                </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setRejectingRequestId(null);
                                        setActiveActionRequest(null);
                                        setRejectionReason('');
                                    }}
                                    className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-sm transition-colors"
                                >
                                    {t('common:cancel')}
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={!rejectionReason.trim()}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('common:reject')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!acceptingRequestId}
                title={t('delivery:drivers.drivers.accept_confirm_title')}
                message={t('delivery:drivers.drivers.accept_confirm_message')}
                onConfirm={confirmAccept}
                onCancel={() => setAcceptingRequestId(null)}
            />
        </div>
    );
};

const HiringRequestsList = ({ requests, type, loading, onAction }: { requests: any[], type: 'incoming' | 'sent', loading: boolean, onAction: (req: any, action: any) => void }) => {
    const { t } = useTranslation(['common', 'dashboard', 'delivery']);
    const { isRTL } = useLanguage();

    if (loading) return <div className="py-12 text-center text-slate-400">{t('loading')}...</div>;

    if (requests.length === 0) return (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
            <p className="text-slate-400 italic text-sm">{t('common.no_results')}</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider text-start">
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('fields.name')}</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('common.hiringStatus')}</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('fields.notes')}</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('common.driverVerification')}</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('fields.date')}</th>
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {requests.map((req) => {
                                    const avatarUrl = req.delivery?.avatarUrl || req.driver?.deliveryProfile?.avatarUrl;
                                    const driverName = req.delivery?.profile?.user?.name || req.driver?.name || 'Unknown';
                                    const driverUsername = req.delivery?.profile?.user?.username || req.driver?.username || 'unknown';
                                    const verificationStatus = req.delivery?.verificationStatus || req.driver?.deliveryProfile?.verificationStatus || 'Unknown';

                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-start">
                                                <div className="flex items-center gap-3 text-start">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                                                        {avatarUrl ? (
                                                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Truck size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-start">
                                                        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{driverName}</p>
                                                        <p className="text-[10px] text-slate-500 lowercase">@{driverUsername}</p>

                                                        <div className="mt-2 flex items-center gap-2">
                                                            {type === 'incoming' && (req.status === 'PENDING' || req.status === 'TRANSITION_OFFER') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => onAction(req, 'ACCEPT')}
                                                                        className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors rounded shadow-sm"
                                                                    >
                                                                        {t('dashboard:approve')}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onAction(req, 'REJECT')}
                                                                        className="px-3 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors rounded shadow-sm"
                                                                    >
                                                                        {t('common:reject')}
                                                                    </button>
                                                                </>
                                                            )}
                                                            {type === 'sent' && (req.status === 'PENDING' || req.status === 'TRANSITION_OFFER') && (
                                                                <button
                                                                    onClick={() => onAction(req, 'CANCEL')}
                                                                    className="px-3 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-colors rounded"
                                                                >
                                                                    {t('dashboard:cancelInvitation')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-start">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                                        req.status === 'REJECTED' 
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                            : req.status === 'ACCEPTED'
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    )}>
                                                        {String(t(`delivery.drivers.hiring_status.${req.status?.toLowerCase()}`, req.status))}
                                                    </span>
                                                    {req.status === 'REJECTED' && (req.responseReason || req.rejectionReason) && (
                                                        <span className="text-[10px] text-rose-500 max-w-[200px] break-words line-clamp-2" title={req.responseReason || req.rejectionReason}>
                                                            <span className="font-semibold">{t('common:rejection_reason')}:</span> {req.responseReason || req.rejectionReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-start">
                                                <div className="max-w-[300px] whitespace-pre-wrap text-slate-500 italic text-xs" title={req.notes}>
                                                    {req.type === 'TO_FREELANCER' && req.initiatedBy === 'DRIVER' 
                                                        ? t('common:transitionToFreelancerMsg') 
                                                        : (req.notes || '-')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-start">
                                                <span className={clsx(
                                                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                                    verificationStatus === 'VERIFIED'
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                )}>
                                                    {verificationStatus === 'VERIFIED' ? t('common.verified') : verificationStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-start">
                                                {new Date(req.updatedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-start">
                                            </td>
                                        </tr>
                                    )
                                })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeliveryDriversPage;
