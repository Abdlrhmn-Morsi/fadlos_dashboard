import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import reviewsApi from './api/reviews.api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user-role';
import { Star, Loader2, MessageSquare, User, Calendar, Package, Flag, Trash2, AlertCircle, ShieldAlert, BadgeCheck, XCircle, Search, Store, ArrowRight, CheckCircle2, Quote, Clock } from 'lucide-react';
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
    
    // State
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const [isUnreportModalOpen, setIsUnreportModalOpen] = useState(false);
    const [reviewToUnreport, setReviewToUnreport] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [page, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

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

    const handleConfirmUnreport = async () => {
        if (!reviewToUnreport) return;
        try {
            setActionLoading(reviewToUnreport);
            await reviewsApi.unreportReview(reviewToUnreport);
            toast.success(t('reviews:reviewUnreportedSuccessfully'));
            setReviews(prev => prev.filter(r => r.id !== reviewToUnreport));
            setTotalItems(prev => prev - 1);
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            toast.error(t('reviews:failedToUnreportReview'));
        } finally {
            setActionLoading(null);
            setReviewToUnreport(null);
            setIsUnreportModalOpen(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;
        try {
            setActionLoading(reviewToDelete);
            await reviewsApi.deleteReview(reviewToDelete);
            toast.success(t('reviews:reviewDeletedSuccessfully'));
            setReviews(prev => prev.filter(r => r.id !== reviewToDelete));
            setTotalItems(prev => prev - 1);
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            toast.error(t('reviews:failedToDeleteReview'));
        } finally {
            setActionLoading(null);
            setReviewToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={10}
                        className={clsx(
                            "transition-all",
                            star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-800"
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={clsx(
            "list-page-container p-6 max-w-full mx-auto animate-in fade-in duration-700",
            isRTL && "font-cairo"
        )}>
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        {t('reviews:reportedReviews')}
                    </h1>
                    <p className="text-sm font-semibold text-rose-500 uppercase tracking-widest">
                        {t('reviews:manageReportedContent')}
                    </p>
                </div>
                
                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder={t('reviews:searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Metric Blocks - Stagger 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-1">
                <div className="bg-white dark:bg-slate-900 px-6 py-6 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm flex flex-col justify-between active-push hover:border-rose-200 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{t('reviews:totalReported')}</span>
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-none border border-rose-100 dark:border-rose-800/30">
                            <Flag size={18} />
                        </div>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{totalItems}</span>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner fullHeight={false} />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-none border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-700 stagger-2">
                    <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[0.625rem]">{t('reviews:noReportedReviews')}</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 stagger-2">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {reviews.map((review, index) => (
                            <div 
                                key={review.id} 
                                className={clsx(
                                    "group bg-white dark:bg-slate-900 border rounded-none overflow-hidden transition-all duration-300 relative flex flex-col shadow-sm active-push cursor-default hover:border-slate-300 dark:hover:border-slate-700",
                                    !review.isActive ? "opacity-75 border-slate-200 dark:border-slate-800" : "border-slate-100 dark:border-slate-800"
                                )}
                                style={{ animationDelay: `${(index % 10) * 50 + 200}ms` }}
                            >
                                <div className="p-6 flex flex-col flex-1 relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* CIRCULAR Avatar preservation */}
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-inner">
                                                {review.customer?.profileImage ? (
                                                    <ImageWithFallback src={review.customer.profileImage} alt={review.customer.name || 'Customer'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                                    {review.customer?.name || t('common:anonymous')}
                                                    {!review.isActive && (
                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-extrabold rounded-none uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm ml-2">
                                                            {t('reviews:inactive')}
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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

                                        <div className="flex flex-col items-end gap-2 text-right">
                                            {review.store && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-none shadow-sm">
                                                    <Store size={12} className="text-primary" />
                                                    <span className="text-[0.625rem] font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {review.store.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {review.product && (
                                        <div className="mb-4 flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-none border border-primary/10 w-fit group/tag cursor-pointer active:scale-95 transition-all" onClick={() => navigate(`/products/${review.product.id}`)}>
                                            <Package size={12} className="text-primary" />
                                            <span className="text-[0.625rem] font-extrabold text-primary uppercase tracking-tight">
                                                {language === 'ar' && review.product.nameAr ? review.product.nameAr : review.product.name}
                                            </span>
                                            <ArrowRight size={10} className="text-primary/40 group-hover/tag:text-primary transition-colors ml-1" />
                                        </div>
                                    )}

                                    <div className="mb-6 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-none border border-slate-100 dark:border-slate-800/60 italic text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed relative">
                                        <Quote size={20} className="absolute -top-3 -left-3 text-slate-200 dark:text-slate-700/50 rotate-180" />
                                        "{review.comment || t('reviews:noComment')}"
                                    </div>

                                    {/* Report Context Card - Restrained Red */}
                                    <div className="p-5 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 rounded-none shadow-sm mt-auto relative overflow-hidden group/report">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-rose-500/10" />
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-none text-rose-500 border border-rose-100 dark:border-rose-800/40">
                                                <Flag size={12} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[0.625rem] font-extrabold text-rose-500 uppercase tracking-[0.15em]">{t('reviews:reportReason')}</span>
                                            {review.reportedAt && (
                                                <span className="ml-auto text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                                    {new Date(review.reportedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                            {review.reportReason || t('reviews:noReasonProvided')}
                                        </p>
                                    </div>

                                    {/* Global Actions */}
                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                                        <button 
                                            onClick={() => {
                                                setReviewToUnreport(review.id);
                                                setIsUnreportModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            <BadgeCheck size={14} className="text-emerald-500" />
                                            {t('reviews:dismissReport')}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setReviewToDelete(review.id);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className="flex-1 px-4 py-3 bg-rose-600 dark:bg-rose-700 text-white rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.2em] hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                            {t('reviews:deleteReview')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination - Rounded none */}
                    {totalPages > 1 && (
                        <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800/50">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={(p) => setPage(p)}
                             />
                        </div>
                    )}
                </div>
            )}

            {/* Modals - Simplified */}
            <StatusModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('reviews:deleteReportedTitle')}
                message={t('reviews:deleteReportedMessage')}
                type="danger"
                loading={!!actionLoading}
                confirmText={t('common:delete')}
            />

            <StatusModal
                isOpen={isUnreportModalOpen}
                onClose={() => setIsUnreportModalOpen(false)}
                onConfirm={handleConfirmUnreport}
                title={t('reviews:dismissReportTitle')}
                message={t('reviews:dismissReportMessage')}
                type="primary"
                loading={!!actionLoading}
                confirmText={t('reviews:dismissReport')}
            />
        </div>
    );
};

export default ReportedReviewList;
