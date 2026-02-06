import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import reviewsApi from './api/reviews.api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user-role';
import { Star, Loader2, MessageSquare, User, Calendar, Package, Quote, Flag, Trash2, AlertCircle, ShieldAlert, BadgeCheck, XCircle, Search } from 'lucide-react';
import clsx from 'clsx';
import { Pagination } from '../../components/common/Pagination';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { toast } from '../../utils/toast';

const ReviewList = () => {
    const { t } = useTranslation(['reviews', 'common']);
    const { isRTL, language } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { getCache, setCache } = useCache();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('STORE'); // STORE or PRODUCT

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Search State
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Reporting & Moderation State
    const [reportingId, setReportingId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [type, page, debouncedSearch]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset to page 1 when type or search changes
    useEffect(() => {
        setPage(1);
    }, [type, debouncedSearch]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params: any = {
                type,
                page,
                limit,
                search: debouncedSearch || undefined
            };

            // Check cache first
            const cacheKey = 'reviews';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                if (cachedData.data) {
                    setReviews(cachedData.data);
                    if (cachedData.meta) {
                        setTotalPages(cachedData.meta.totalPages || 1);
                    }
                } else if (Array.isArray(cachedData)) {
                    setReviews(cachedData);
                    setTotalPages(1);
                }
                setLoading(false);
                return;
            }

            const response: any = await reviewsApi.getStoreManagementReviews(params);

            if (response && response.data) {
                setReviews(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.totalPages || 1);
                }
                // Cache the response
                setCache(cacheKey, response, params);
            } else if (Array.isArray(response)) {
                setReviews(response);
                setTotalPages(1);
                // Cache the response
                setCache(cacheKey, response, params);
            } else {
                setReviews([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            setReviews([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };
    const handleReport = async (reviewId: string) => {
        if (!reportReason.trim()) {
            toast.error(t('pleaseEnterReason'));
            return;
        }

        try {
            setIsSubmittingReport(true);
            await reviewsApi.reportReview(reviewId, reportReason);
            toast.success(t('reviewReportedSuccessfully'));
            setReportingId(null);
            setReportReason('');
            fetchReviews();
        } catch (error) {
            console.error('Failed to report review', error);
            toast.error(t('failedToReportReview'));
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const handleDeactivate = async (reviewId: string) => {
        try {
            setActionLoading(reviewId);
            await reviewsApi.updateReview(reviewId, { isActive: false });
            toast.success(t('reviewDeactivatedSuccessfully'));
            fetchReviews();
        } catch (error) {
            console.error('Failed to deactivate review', error);
            toast.error(t('failedToDeactivateReview'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!window.confirm(t('confirmDeleteReview'))) return;

        try {
            setActionLoading(reviewId);
            await reviewsApi.deleteReview(reviewId);
            toast.success(t('reviewDeletedSuccessfully'));
            fetchReviews();
        } catch (error) {
            console.error('Failed to delete review', error);
            toast.error(t('failedToDeleteReview'));
        } finally {
            setActionLoading(null);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={clsx(
                            "transition-all duration-300",
                            i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8">
            {/* Header section with high-contrast tab switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-slate-400 font-medium text-xs mt-0.5">{t('subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group/search min-w-[280px]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400 group-focus-within/search:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all"
                        />
                    </div>

                    <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                        <button
                            onClick={() => setType('STORE')}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                type === 'STORE'
                                    ? "bg-white dark:bg-slate-700 text-primary shadow-xl shadow-primary/5 active:scale-95"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            {t('storeOverall')}
                        </button>
                        <button
                            onClick={() => setType('PRODUCT')}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                type === 'PRODUCT'
                                    ? "bg-white dark:bg-slate-700 text-primary shadow-xl shadow-primary/5 active:scale-95"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            {t('specificProducts')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{t('loadingImpressions')}</span>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">{t('noFeedbackYet')}</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative flex flex-col">
                            {/* Reported Status Badge */}
                            {/* Reported Status Badge - Removed from top to avoid overlap */}

                            {reportingId === review.id ? (
                                <div className="p-6 bg-rose-50/30 dark:bg-rose-900/5 animate-fadeIn">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                            <Flag size={18} />
                                        </div>
                                        <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">{t('reportingReview')}</h4>
                                    </div>
                                    <p className="text-slate-500 text-xs mb-4 font-medium leading-relaxed">{t('reportInstruction')}</p>
                                    <textarea
                                        autoFocus
                                        rows={5}
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        placeholder={t('reportReasonPlaceholder')}
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 mb-6 text-sm overflow-y-auto"
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={isSubmittingReport}
                                            onClick={() => handleReport(review.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all disabled:opacity-50"
                                        >
                                            {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                                            {t('submitReport')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReportingId(null);
                                                setReportReason('');
                                            }}
                                            className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                        >
                                            {t('common:cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 flex flex-col flex-1">
                                    <div className={clsx("flex flex-col mb-4", isRTL ? "items-start" : "items-start")}>
                                        <div className="flex items-center gap-2.5 w-full">
                                            <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                                {review.customer?.profileImage ? (
                                                    <ImageWithFallback src={review.customer.profileImage} alt={review.customer.name || 'Customer'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                    {review.customer?.name || t('common:anonymous')}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar size={9} className="text-slate-300" />
                                                    <span>{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>

                                    {review.product && (
                                        <div className={clsx("flex mb-3", isRTL ? "justify-start" : "justify-start")}>
                                            <button
                                                onClick={() => navigate(`/products/${review.product.id}`)}
                                                className="flex items-center gap-2 p-1.5 pr-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700/50 group/tag hover:border-primary/40 hover:bg-primary/5 transition-all"
                                            >
                                                <Package size={11} className="text-primary" />
                                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter group-hover/tag:text-primary transition-colors">
                                                    {language === 'ar' && review.product.nameAr ? review.product.nameAr : review.product.name}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative mb-4">
                                        <p className="text-slate-600 dark:text-slate-400 font-medium text-[13px] italic leading-relaxed">
                                            "{review.comment || t('noComment')}"
                                        </p>
                                    </div>

                                    {/* Reported Reason Display */}
                                    {review.isReported && review.reportReason && (
                                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <AlertCircle size={12} className="text-rose-500" />
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{t('reportReason')}</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                                                {review.reportReason}
                                            </p>
                                        </div>
                                    )}

                                    <footer className={clsx("flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto", isRTL ? "justify-end" : "justify-end")}>
                                        <div className="flex items-center gap-4">
                                            {!review.isReported ? (
                                                <button
                                                    onClick={() => setReportingId(review.id)}
                                                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                                >
                                                    <Flag size={14} />
                                                    {t('report')}
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest shadow-md shadow-rose-500/10">
                                                        <ShieldAlert size={12} />
                                                        {t('reported')}
                                                    </div>

                                                    {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                                                        <>
                                                            <button
                                                                disabled={actionLoading === review.id}
                                                                onClick={() => handleDeactivate(review.id)}
                                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-lg transition-all border border-yellow-200 dark:border-yellow-900/30 disabled:opacity-50"
                                                            >
                                                                {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                                                {t('deactivate')}
                                                            </button>
                                                            <button
                                                                disabled={actionLoading === review.id}
                                                                onClick={() => handleDelete(review.id)}
                                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-200 dark:border-rose-900/30 disabled:opacity-50"
                                                            >
                                                                {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                {t('delete')}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </footer>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />
        </div>
    );
};

export default ReviewList;
