import React, { useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { DeliveryDriversList, FreelancerMarketplace } from '../components';
import { useTranslation } from 'react-i18next';
import { Truck, Globe, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getSentHiringRequests, getReceivedHiringRequests, respondToHiringRequest, cancelHiringRequest } from '../api/delivery-drivers.api';

const DeliveryDriversPage = () => {
    const { t } = useTranslation(['common', 'dashboard']);
    const { isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<'my-drivers' | 'incoming' | 'sent' | 'marketplace'>('my-drivers');
    const [incomingRequestsData, setIncomingRequestsData] = useState<{ requests: any[], totalPages: number, page: number }>({
        requests: [], totalPages: 1, page: 1
    });
    const [sentRequestsData, setSentRequestsData] = useState<{ requests: any[], totalPages: number, page: number }>({
        requests: [], totalPages: 1, page: 1
    });
    const [loading, setLoading] = useState(false);
    const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

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

    const handleHiringAction = async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'CANCEL') => {
        if (action === 'CANCEL') {
            setCancellingRequestId(requestId);
            return;
        }

        setLoading(true);
        try {
            await respondToHiringRequest(requestId, action === 'ACCEPT' ? 'ACTIVE' : 'REJECTED');
            fetchIncomingRequests();
            fetchSentRequests();
        } catch (error) {
            console.error(`Failed to ${action} hiring request:`, error);
        } finally {
            setLoading(false);
        }
    };

    const confirmCancel = async () => {
        if (!cancellingRequestId) return;
        setLoading(true);
        try {
            await cancelHiringRequest(cancellingRequestId);
            fetchIncomingRequests();
            fetchSentRequests();
        } catch (error) {
            console.error(`Failed to cancel hiring request:`, error);
        } finally {
            setLoading(false);
            setCancellingRequestId(null);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold mb-4">{t('delivery.drivers.title', 'Store Drivers')}</h1>

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
                    {t('delivery.drivers.my_drivers')}
                </button>
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'incoming'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Clock size={18} />
                    {t('dashboard:incomingRequests')}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
                        activeTab === 'sent'
                            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    <Globe size={18} />
                    {t('dashboard:sentInvitations')}
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
                    {t('delivery.drivers.marketplace')}
                </button>
            </div>

            {activeTab === 'my-drivers' && <DeliveryDriversList />}
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
                                {isRTL ? 'التالي' : 'Previous'}
                            </button>
                            <span className="px-4 py-2 flex items-center">
                                {incomingRequestsData.page} / {incomingRequestsData.totalPages}
                            </span>
                            <button
                                onClick={() => fetchIncomingRequests(Math.min(incomingRequestsData.totalPages, incomingRequestsData.page + 1))}
                                disabled={incomingRequestsData.page === incomingRequestsData.totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {isRTL ? 'السابق' : 'Next'}
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
                                {isRTL ? 'التالي' : 'Previous'}
                            </button>
                            <span className="px-4 py-2 flex items-center">
                                {sentRequestsData.page} / {sentRequestsData.totalPages}
                            </span>
                            <button
                                onClick={() => fetchSentRequests(Math.min(sentRequestsData.totalPages, sentRequestsData.page + 1))}
                                disabled={sentRequestsData.page === sentRequestsData.totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                {isRTL ? 'السابق' : 'Next'}
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'marketplace' && <FreelancerMarketplace />}

            <ConfirmModal
                isOpen={!!cancellingRequestId}
                title={t('delivery.drivers.drivers.cancel_hiring_title', 'Cancel Hiring Request')}
                message={t('delivery.drivers.drivers.confirm_cancel_hiring', 'Are you sure you want to cancel this hiring request?')}
                onConfirm={confirmCancel}
                onCancel={() => setCancellingRequestId(null)}
            />
        </div>
    );
};

const HiringRequestsList = ({ requests, type, loading, onAction }: { requests: any[], type: 'incoming' | 'sent', loading: boolean, onAction: (id: string, action: any) => void }) => {
    const { t } = useTranslation(['common', 'dashboard']);
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
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('common.driverVerification')}</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('fields.date')}</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-start">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 text-start">
                                    <div className="flex items-center gap-3 text-start">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                                            {req.driver?.deliveryProfile?.avatarUrl ? (
                                                <img src={req.driver.deliveryProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Truck size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-start">
                                            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{req.driver?.name}</p>
                                            <p className="text-[10px] text-slate-500 lowercase">@{req.driver?.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded">
                                        {String(t(`delivery.drivers.hiring_status.${req.status?.toLowerCase()}`, req.status))}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <span className={clsx(
                                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded",
                                        req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED'
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                    )}>
                                        {req.driver?.deliveryProfile?.verificationStatus === 'VERIFIED' ? t('common.verified') : (req.driver?.deliveryProfile?.verificationStatus || 'Unknown')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-start">
                                    {new Date(req.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-start">
                                    <div className="flex justify-start gap-2 text-start">
                                        {type === 'incoming' && req.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => onAction(req.id, 'ACCEPT')}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors rounded shadow-lg shadow-emerald-600/20"
                                                >
                                                    {t('dashboard:approve')}
                                                </button>
                                                <button
                                                    onClick={() => onAction(req.id, 'REJECT')}
                                                    className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors rounded shadow-lg shadow-rose-600/20"
                                                >
                                                    {t('common:reject')}
                                                </button>
                                            </>
                                        )}
                                        {type === 'sent' && req.status === 'PENDING' && (
                                            <button
                                                onClick={() => onAction(req.id, 'CANCEL')}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-colors rounded"
                                            >
                                                {t('dashboard:cancelInvitation')}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeliveryDriversPage;
