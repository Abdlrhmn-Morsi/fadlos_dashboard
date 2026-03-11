import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldCheck,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { getVerificationRequests, reviewVerification } from './api/stores.verification.api';
import { StoreVerificationStatus } from './models/store.verification.model';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from '../../utils/toast';
import { Pagination } from '../../components/common/Pagination';
import clsx from 'clsx';

const StoreVerificationRequests = () => {
    const { t } = useTranslation(['stores', 'common']);
    const { isRTL } = useLanguage();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Review Modal State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getVerificationRequests({
                page,
                limit: 10,
                status: statusFilter as any || undefined,
                search: debouncedSearch || undefined
            });
            // Robust data extraction
            const requestsData = data.data || (Array.isArray(data) ? data : []);
            const metaData = data.meta || {};

            setRequests(requestsData);
            setMeta({
                total: metaData.total || requestsData.length,
                totalPages: metaData.totalPages || 1
            });
        } catch (error) {
            console.error('Failed to fetch verification requests:', error);
            toast.error(t('common:errorLoadingData'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, statusFilter, debouncedSearch]);

    const handleReview = async (status: StoreVerificationStatus.APPROVED | StoreVerificationStatus.REJECTED) => {
        if (!selectedRequest) return;

        if (status === StoreVerificationStatus.REJECTED && !rejectionReason.trim()) {
            toast.error(t('rejectionReasonRequired', 'Rejection reason is required'));
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewVerification(selectedRequest.id, {
                status,
                rejectionReason: status === StoreVerificationStatus.REJECTED ? rejectionReason : undefined
            });
            toast.success(status === StoreVerificationStatus.APPROVED ? t('verificationApproved') : t('verificationRejected'));
            setShowReviewModal(false);
            fetchRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common:errorUpdatingData'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border";
        switch (status) {
            case StoreVerificationStatus.PENDING:
                return <span className={clsx(baseClass, "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800")}><Clock size={12} /> {t('common:pending')}</span>;
            case StoreVerificationStatus.APPROVED:
                return <span className={clsx(baseClass, "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800")}><CheckCircle size={12} /> {t('verificationStatus.APPROVED')}</span>;
            case StoreVerificationStatus.REJECTED:
                return <span className={clsx(baseClass, "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800")}><XCircle size={12} /> {t('verificationStatus.REJECTED')}</span>;
            default:
                return <span className={clsx(baseClass, "bg-slate-50 text-slate-600 border-slate-200")}>{status}</span>;
        }
    };

    return (
        <div className="list-page-container p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-primary/10 rounded-2xl text-primary shadow-inner shadow-primary/5">
                        <ShieldCheck size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">{t('verificationRequests', 'Verification Requests')}</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 opacity-70 italic">{t('reviewMerchantSubmissions', 'Review merchant identity submissions')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative group min-w-[240px]">
                        <Search size={18} className="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors start-4" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="py-3.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100 ps-12 pe-4 font-bold placeholder:font-normal"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <Filter size={16} className="absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none start-4" />
                        <select
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl px-10 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer min-w-[160px]"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">{t('common:allStatuses')}</option>
                            <option value={StoreVerificationStatus.PENDING}>{t('common:pending')}</option>
                            <option value={StoreVerificationStatus.APPROVED}>{t('verificationStatus.APPROVED')}</option>
                            <option value={StoreVerificationStatus.REJECTED}>{t('verificationStatus.REJECTED')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden transition-all duration-500">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">{t('common:syncing')}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/10">
                                    <th className="px-6 py-5 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">{t('merchantEntity')}</th>
                                    <th className="px-6 py-5 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">{t('crNumber')}</th>
                                    <th className="px-6 py-5 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">{t('status')}</th>
                                    <th className="px-6 py-5 text-start text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">{t('submittedAt', 'Submitted At')}</th>
                                    <th className="px-6 py-5 text-end text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">{t('common:actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {requests.length > 0 ? (
                                    requests.map((request) => (
                                        <tr key={request.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    {request.store?.logo ? (
                                                        <img src={request.store.logo} alt="" className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-white dark:border-slate-800" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black shadow-inner border border-slate-200 dark:border-slate-700">
                                                            {request.store?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-[14px] font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">
                                                            {isRTL ? (request.store?.nameAr || request.store?.name) : (request.store?.name || request.store?.nameAr)}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">{request.store?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono tracking-tight">{request.commercialRegisterNumber}</div>
                                            </td>
                                            <td className="px-6 py-5">{getStatusBadge(request.status)}</td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">{new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-5 text-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setRejectionReason(request.rejectionReason || '');
                                                        setShowReviewModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary dark:hover:bg-primary transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none group"
                                                >
                                                    <Eye size={14} className="group-hover:rotate-12 transition-transform" /> {t('review', 'Review')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-40">
                                            <div className="flex flex-col items-center justify-center gap-6">
                                                <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-full text-slate-200 dark:text-slate-700">
                                                    <ShieldCheck size={80} strokeWidth={1} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-slate-500 font-black italic text-lg tracking-tight">{t('noVerificationsFound', 'No verification requests found')}</p>
                                                    <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-bold opacity-60">{t('allCaughtUp', 'You are all caught up!')}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />

            {showReviewModal && selectedRequest && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto custom-scrollbar" dir={isRTL ? 'rtl' : 'ltr'} onClick={() => setShowReviewModal(false)}>
                    <div className="min-h-full flex items-start justify-center p-4 sm:p-24">
                        <div
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('reviewVerification')}</h3>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 italic">
                                            {isRTL ? (selectedRequest.store?.nameAr || selectedRequest.store?.name) : (selectedRequest.store?.name || selectedRequest.store?.nameAr)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('crNumber')}</label>
                                            <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-wider">{selectedRequest.commercialRegisterNumber}</div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('submittedAt', 'Submitted At')}</label>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {new Date(selectedRequest.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        {selectedRequest.status !== StoreVerificationStatus.PENDING && (
                                            <div className={clsx(
                                                "rounded-2xl p-6 border",
                                                selectedRequest.status === StoreVerificationStatus.APPROVED ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-900/30" : "bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-900/30"
                                            )}>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('currentStatus', 'Current Status')}</label>
                                                {getStatusBadge(selectedRequest.status)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ps-1">{t('crPhotoLabel', 'Commercial Register Photo')}</label>
                                        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] bg-slate-950 flex items-center justify-center">
                                            {selectedRequest.commercialRegisterPhoto ? (
                                                <>
                                                    <img src={selectedRequest.commercialRegisterPhoto} alt="CR" className="w-full h-full object-contain" />
                                                    <a
                                                        href={selectedRequest.commercialRegisterPhoto}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                                                    >
                                                        <div className="bg-white/10 p-4 rounded-full text-white backdrop-blur-md border border-white/20">
                                                            <ExternalLink size={24} />
                                                        </div>
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-slate-700">
                                                    <AlertTriangle size={48} strokeWidth={1} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('noDocumentAttached', 'No document attached')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Rejection Reason Textarea */}
                                <div className="space-y-4 animate-in slide-in-from-top-4">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ps-1">
                                        <AlertTriangle size={14} className="text-secondary" /> {t('reasonForRejection')}
                                    </label>
                                    <textarea
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 placeholder:opacity-30 min-h-[120px]"
                                        placeholder={t('rejectionReasonPlaceholder', 'State clearly why the request is being rejected...')}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 italic ps-4 font-medium leading-relaxed">{t('rejectionReasonNote', 'Note: This message will be sent to the store owner and should be helpful for them to correct their application.')}</p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-10 py-8 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={() => handleReview(StoreVerificationStatus.REJECTED)}
                                    disabled={isSubmitting || !rejectionReason.trim()}
                                    className="w-full sm:flex-1 py-4.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all active:scale-95 disabled:opacity-30 shadow-sm"
                                >
                                    {isSubmitting ? <Clock size={18} className="animate-spin mx-auto" /> : t('rejectRequest', 'Reject Request')}
                                </button>
                                <button
                                    onClick={() => handleReview(StoreVerificationStatus.APPROVED)}
                                    disabled={isSubmitting}
                                    className="w-full sm:flex-1 py-4.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-primary dark:hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-30 shadow-xl shadow-slate-200 dark:shadow-none"
                                >
                                    {isSubmitting ? <Clock size={18} className="animate-spin mx-auto" /> : t('approveRequest', 'Approve Request')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreVerificationRequests;
