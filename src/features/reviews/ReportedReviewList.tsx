import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import reviewsApi from './api/reviews.api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user-role';
import { Star, Loader2, MessageSquare, User, Calendar, Package, Flag, Trash2, AlertCircle, ShieldAlert, BadgeCheck, XCircle, Search, Store, ArrowRight, CheckCircle2, Quote } from 'lucide-react';
import clsx from 'clsx';
import { Pagination } from '../../components/common/Pagination';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { toast } from '../../utils/toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusModal from '../../components/common/StatusModal';

const ReportedReviewList = () => {
    const { t } = useTranslation(['reviews', 'common']);
    const { isRTL, language } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { getCache, setCache, updateCacheItem, invalidateCache } = useCache();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Search State
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [totalItems, setTotalItems] = useState(0);

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const [isUnreportModalOpen, setIsUnreportModalOpen] = useState(false);
    const [reviewToUnreport, setReviewToUnreport] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [page, debouncedSearch]);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params: any = {
                reportedOnly: true,
                includeInactive: true,
                page,
                limit,
                search: debouncedSearch || undefined
            };

            // Check cache first
            const cacheKey = 'reported_reviews';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setReviews(cachedData.data || []);
                setTotalPages(cachedData.meta?.totalPages || 1);
                setTotalItems(cachedData.meta?.total || 0);
                setLoading(false);
                return;
            }

            const response: any = await reviewsApi.getAllReviews(params);

            if (response && response.data) {
                setReviews(response.data);
                setTotalPages(response.meta?.totalPages || 1);
                setTotalItems(response.meta?.total || 0);
                // Cache the response
                setCache(cacheKey, response, params);
            } else {
                setReviews([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Failed to fetch reported reviews', error);
            setReviews([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handleUnreportClick = (reviewId: string) => {
        setReviewToUnreport(reviewId);
        setIsUnreportModalOpen(true);
    };

    const handleConfirmUnreport = async () => {
        if (!reviewToUnreport) return;

        try {
            setActionLoading(reviewToUnreport);
            await reviewsApi.unreportReview(reviewToUnreport);
            toast.success(t('reviewUnreportedSuccessfully'));

            // Remove from list as it's no longer reported
            setReviews(prev => prev.filter(r => r.id !== reviewToUnreport));
            setTotalItems(prev => prev - 1);

            // Invalidate caches
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            console.error('Failed to unreport review', error);
            toast.error(t('failedToUnreportReview'));
        } finally {
            setActionLoading(null);
            setReviewToUnreport(null);
        }
    };

    const handleDeactivate = async (reviewId: string) => {
        try {
            setActionLoading(reviewId);
            const updatedReview = await reviewsApi.deactivateReview(reviewId);
            toast.success(t('reviewDeactivatedSuccessfully'));

            // Update local state
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updatedReview } : r));

            // Update global caches
            updateCacheItem('reported_reviews', reviewId, (old) => ({ ...old, ...updatedReview }));
            updateCacheItem('reviews', reviewId, (old) => ({ ...old, ...updatedReview }));
        } catch (error) {
            console.error('Failed to deactivate review', error);
            toast.error(t('failedToDeactivateReview'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (reviewId: string) => {
        try {
            setActionLoading(reviewId);
            const updatedReview = await reviewsApi.activateReview(reviewId);
            toast.success(t('reviewActivatedSuccessfully'));

            // Update local state
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updatedReview } : r));

            // Update global caches
            updateCacheItem('reported_reviews', reviewId, (old) => ({ ...old, ...updatedReview }));
            updateCacheItem('reviews', reviewId, (old) => ({ ...old, ...updatedReview }));
        } catch (error) {
            console.error('Failed to activate review', error);
            toast.error(t('failedToActivateReview'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteClick = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;

        try {
            setActionLoading(reviewToDelete);
            await reviewsApi.deleteReview(reviewToDelete);
            toast.success(t('reviewDeletedSuccessfully'));

            // Remove from list
            setReviews(prev => prev.filter(r => r.id !== reviewToDelete));
            setTotalItems(prev => prev - 1);

            // Invalidate caches
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            console.error('Failed to delete review', error);
            toast.error(t('failedToDeleteReview'));
        } finally {
            setActionLoading(null);
            setReviewToDelete(null);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={clsx(
                            i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            {t('reportedReviews')}
                        </h1>
                        {!loading && totalItems > 0 && (
                            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-full border border-rose-500/20">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 font-medium text-xs mt-0.5">{t('reportedReviewsSubtitle')}</p>
                </div>

                <div className="relative group/search min-w-[300px]">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within/search:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner fullHeight={false} />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                    <ShieldAlert size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">{t('noReportedReviews')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className={clsx(
                            "group bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 relative flex flex-col shadow-sm hover:shadow-md",
                            !review.isActive ? "opacity-75 border-slate-200 dark:border-slate-800" : "border-rose-100 dark:border-rose-900/30"
                        )}>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-inner">
                                            {review.customer?.profileImage ? (
                                                <ImageWithFallback src={review.customer.profileImage} alt={review.customer.name || 'Customer'} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                                {review.customer?.name || t('common:anonymous')}
                                                {!review.isActive && (
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-widest border border-slate-200 shadow-sm">
                                                        {t('inactive')}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar size={10} className="text-slate-300" />
                                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                <div className="flex items-center gap-1.5">
                                                    {renderStars(review.rating)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {review.store && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            <Store size={12} className="text-primary" />
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {review.store.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {review.product && (
                                    <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 w-fit group/tag cursor-pointer active:scale-95 transition-all" onClick={() => navigate(`/products/${review.product.id}`)}>
                                        <Package size={12} className="text-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter flex items-center gap-1.5">
                                            {language === 'ar' && review.product.nameAr ? review.product.nameAr : review.product.name}
                                            <ArrowRight size={10} className="opacity-0 group-hover/tag:opacity-100 group-hover/tag:translate-x-0.5 transition-all" />
                                        </span>
                                    </div>
                                )}

                                <div className="mb-4 p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 italic text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed relative">
                                    <Quote size={16} className="absolute -top-2 -left-2 text-slate-200 dark:text-slate-700 rotate-180" />
                                    "{review.comment || t('noComment')}"
                                </div>

                                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 px-1.5 bg-rose-500 rounded text-white shadow-sm">
                                            <Flag size={10} />
                                        </div>
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('reportReason')}</span>
                                        {review.reportedAt && (
                                            <span className="ml-auto text-[8px] font-bold text-rose-400 uppercase tracking-widest">
                                                {new Date(review.reportedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
                                        {review.reportReason}
                                    </p>
                                </div>

                                <footer className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
                                    <button
                                        disabled={actionLoading === review.id}
                                        onClick={() => handleUnreportClick(review.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                                        {t('unreport')}
                                    </button>

                                    {review.isActive ? (
                                        <button
                                            disabled={actionLoading === review.id}
                                            onClick={() => handleDeactivate(review.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                            {t('deactivate')}
                                        </button>
                                    ) : (
                                        <button
                                            disabled={actionLoading === review.id}
                                            onClick={() => handleActivate(review.id)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            {t('activate')}
                                        </button>
                                    )}

                                    <button
                                        disabled={actionLoading === review.id}
                                        onClick={() => handleDeleteClick(review.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === review.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        {t('delete')}
                                    </button>
                                </footer>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />

            {/* Deletion Confirmation Modal */}
            <StatusModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                type="confirm"
                title={t('confirmDeleteReview')}
                message={t('deleteReviewConfirmation')}
                onConfirm={handleConfirmDelete}
                confirmText={t('common:delete')}
                cancelText={t('common:cancel')}
            />

            {/* Unreport Confirmation Modal */}
            <StatusModal
                isOpen={isUnreportModalOpen}
                onClose={() => setIsUnreportModalOpen(false)}
                type="confirm"
                title={t('confirmUnreportReview')}
                message={t('unreportReviewConfirmation')}
                onConfirm={handleConfirmUnreport}
                confirmText={t('unreport')}
                cancelText={t('common:cancel')}
            />
        </div>
    );
};

export default ReportedReviewList;
