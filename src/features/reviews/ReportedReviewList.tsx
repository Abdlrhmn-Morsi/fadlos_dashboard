import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import reviewsApi from './api/reviews.api';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user-role';
import { Star, Loader2, MessageSquare, User, Calendar, Package, Flag, Trash2, AlertCircle, ShieldAlert, BadgeCheck, XCircle, Search, Store, ArrowRight, CheckCircle2, Quote, Clock, Ban } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'reported' | 'banned'>('reported');
    const [reviews, setReviews] = useState<any[]>([]);
    const [bans, setBans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [bansPage, setBansPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [totalItems, setTotalItems] = useState(0);
    const [totalBans, setTotalBans] = useState(0);
    const [totalBansPages, setTotalBansPages] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [moderatorNotes, setModeratorNotes] = useState('');
    const [banStatuses, setBanStatuses] = useState<Record<string, boolean>>({});

    // Modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const [isUnreportModalOpen, setIsUnreportModalOpen] = useState(false);
    const [reviewToUnreport, setReviewToUnreport] = useState<string | null>(null);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [reviewToBan, setReviewToBan] = useState<string | null>(null);
    const [isUnbanByIdModalOpen, setIsUnbanByIdModalOpen] = useState(false);
    const [banIdToUnban, setBanIdToUnban] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'reported') {
            fetchReviews();
        } else {
            fetchBans();
        }
    }, [page, bansPage, debouncedSearch, activeTab]);

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
                fetchBanStatuses(cachedData.data || []);
                return;
            }

            const response: any = await reviewsApi.getAllReviews(params);

            if (response && response.data) {
                setReviews(response.data);
                setTotalPages(response.meta?.totalPages || 1);
                setTotalItems(response.meta?.total || 0);
                setCache(cacheKey, response, params);
                fetchBanStatuses(response.data);
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

    const fetchBans = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: bansPage,
                limit,
            };

            if (debouncedSearch) {
                params.search = debouncedSearch;
            }
            const response: any = await reviewsApi.getAllBans(params);

            if (response && response.data) {
                setBans(response.data);
                setTotalBansPages(response.meta?.totalPages || 1);
                setTotalBans(response.meta?.total || 0);
            } else {
                setBans([]);
                setTotalBansPages(1);
                setTotalBans(0);
            }
        } catch (error) {
            console.error('Failed to fetch banned customers', error);
            setBans([]);
            setTotalBansPages(1);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanStatuses = async (reviewList: any[]) => {
        const statuses: Record<string, boolean> = {};
        await Promise.all(
            reviewList.map(async (review) => {
                try {
                    const response: any = await reviewsApi.getBanStatus(review.id);
                    statuses[review.id] = response?.isBanned || false;
                } catch {
                    statuses[review.id] = false;
                }
            })
        );
        setBanStatuses(statuses);
    };

    const handleConfirmUnreport = async () => {
        if (!reviewToUnreport) return;
        try {
            setActionLoading(reviewToUnreport);
            await reviewsApi.unreportReview(reviewToUnreport, moderatorNotes);
            toast.success(t('reviews:reviewUnreportedSuccessfully'));
            
            // Re-activate since dismiss always unbans
            setReviews(prev => prev.filter(r => r.id !== reviewToUnreport));
            setTotalItems(prev => prev - 1);
            
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            console.error('Dismiss failed:', error);
            toast.error(t('reviews:failedToUnreportReview'));
        } finally {
            setActionLoading(null);
            setReviewToUnreport(null);
            setIsUnreportModalOpen(false);
            setModeratorNotes('');
        }
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;
        console.log('[ReportedReviewList] Attempting to delete review:', reviewToDelete);
        try {
            setActionLoading(reviewToDelete);
            const response = await reviewsApi.deleteReview(reviewToDelete);
            console.log('[ReportedReviewList] Delete response:', response);
            toast.success(t('reviews:reviewDeletedSuccessfully'));
            
            setReviews(prev => {
                const updated = prev.filter(r => r.id !== reviewToDelete);
                console.log(`[ReportedReviewList] Local state update: ${prev.length} -> ${updated.length} items`);
                return updated;
            });
            setTotalItems(prev => prev - 1);
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error: any) {
            console.error('[ReportedReviewList] Delete failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'unknown error';
            toast.error(`${t('reviews:failedToDeleteReview')}: ${errorMessage}`);
        } finally {
            console.log('[ReportedReviewList] Cleaning up after delete attempt');
            setActionLoading(null);
            setReviewToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleConfirmBan = async () => {
        if (!reviewToBan) return;
        try {
            setActionLoading(reviewToBan);
            const isBanned = banStatuses[reviewToBan] || false;

            if (!isBanned) {
                // Ban: store-wide ban
                await reviewsApi.banFromStore(reviewToBan);
                toast.success(t('reviews:reviewBannedSuccessfully'));
                // Mark all reviews from this customer for this store as inactive
                const bannedReview = reviews.find(r => r.id === reviewToBan);
                if (bannedReview) {
                    setReviews(prev => prev.map(r => {
                        if (r.customerId === bannedReview.customerId) {
                            // Check if same store
                            const sameStore = 
                                (r.storeId && bannedReview.storeId && r.storeId === bannedReview.storeId) ||
                                (r.store?.id && bannedReview.store?.id && r.store.id === bannedReview.store.id);
                            if (sameStore) return { ...r, isActive: false };
                        }
                        return r;
                    }));
                }
                setBanStatuses(prev => ({ ...prev, [reviewToBan]: true }));
            } else {
                // Unban: remove store-wide ban
                await reviewsApi.unbanFromStore(reviewToBan);
                toast.success(t('reviews:reviewUnbannedSuccessfully'));
                setBanStatuses(prev => ({ ...prev, [reviewToBan]: false }));
            }
            
            invalidateCache('reported_reviews');
            invalidateCache('reviews');
        } catch (error) {
            console.error('Action failed:', error);
            toast.error(t('reviews:failedToDeactivateReview'));
        } finally {
            setActionLoading(null);
            setReviewToBan(null);
            setIsBanModalOpen(false);
        }
    };

    const handleConfirmUnbanById = async () => {
        if (!banIdToUnban) return;
        try {
            setActionLoading(`unban-${banIdToUnban}`);
            await reviewsApi.unbanCustomerById(banIdToUnban);
            toast.success(t('reviews:reviewUnbannedSuccessfully'));
            
            setBans(prev => prev.filter(b => b.id !== banIdToUnban));
            setTotalBans(prev => prev - 1);
        } catch (error) {
            toast.error(t('reviews:failedToDeactivateReview'));
        } finally {
            setActionLoading(null);
            setBanIdToUnban(null);
            setIsUnbanByIdModalOpen(false);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 stagger-1 my-6">
                <div className="bg-white dark:bg-slate-900 px-6 py-6 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm flex flex-col justify-between active-push hover:border-rose-200 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{activeTab === 'reported' ? t('reviews:totalReported') : t('reviews:bannedCustomersTab')}</span>
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-none border border-rose-100 dark:border-rose-800/30">
                            {activeTab === 'reported' ? <Flag size={18} /> : <Ban size={18} />}
                        </div>
                    </div>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{activeTab === 'reported' ? totalItems : totalBans}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('reported')}
                    className={clsx(
                        "px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all rounded-none border-b-2",
                        activeTab === 'reported' 
                            ? "border-primary text-primary bg-primary/5" 
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    {t('reviews:reportedContentTab')}
                </button>
                <button
                    onClick={() => setActiveTab('banned')}
                    className={clsx(
                        "px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all rounded-none border-b-2",
                        activeTab === 'banned' 
                            ? "border-primary text-primary bg-primary/5" 
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                >
                    {t('reviews:bannedCustomersTab')}
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner fullHeight={false} />
                </div>
            ) : activeTab === 'reported' && reviews.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-none border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-700 stagger-2">
                    <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[0.625rem]">{t('reviews:noReportedReviews')}</p>
                </div>
            ) : activeTab === 'reported' ? (
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
                                                    {banStatuses[review.id] && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[8px] font-extrabold rounded-none uppercase tracking-widest border border-rose-200 dark:border-rose-800 shadow-sm ml-2 flex items-center gap-1">
                                                            <Ban size={8} />
                                                            {t('reviews:banned')}
                                                        </span>
                                                    )}
                                                    {!review.isActive && !banStatuses[review.id] && (
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
                                                        {language === 'ar' && review.store.nameAr ? review.store.nameAr : review.store.name}
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
                                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                                        <button 
                                            onClick={() => {
                                                setReviewToUnreport(review.id);
                                                setIsUnreportModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className="flex-1 min-w-[120px] px-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.1em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                            title={t('reviews:dismissReport')}
                                        >
                                            <BadgeCheck size={14} className="text-emerald-500" />
                                            {t('reviews:dismissReport')}
                                        </button>
                                        
                                        <button 
                                            onClick={() => {
                                                setReviewToBan(review.id);
                                                setIsBanModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className={clsx(
                                                "flex-1 min-w-[120px] px-3 py-3 border rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50",
                                                !banStatuses[review.id]
                                                    ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 hover:bg-slate-800" 
                                                    : "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                            )}
                                            title={!banStatuses[review.id] ? t('reviews:banUser') : t('reviews:unbanUser')}
                                        >
                                            {!banStatuses[review.id] ? (
                                                <>
                                                    <ShieldAlert size={14} className="text-rose-400" />
                                                    {t('reviews:banUser')}
                                                </>
                                            ) : (
                                                <>
                                                    <BadgeCheck size={14} className="text-emerald-300" />
                                                    {t('reviews:unbanUser')}
                                                </>
                                            )}
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setReviewToDelete(review.id);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className="flex-1 min-w-[120px] px-3 py-3 bg-rose-600 dark:bg-rose-700 text-white rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.1em] hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm"
                                            title={t('reviews:deleteReview')}
                                        >
                                            <Trash2 size={14} />
                                            {t('reviews:deleteReview')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            ) : bans.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-none border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-700 stagger-2">
                    <Ban size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[0.625rem]">{t('reviews:noBannedCustomers')}</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 stagger-2">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {bans.map((ban, index) => (
                            <div 
                                key={ban.id} 
                                className="group bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 rounded-none overflow-hidden transition-all duration-300 relative flex flex-col shadow-sm active-push cursor-default hover:border-rose-200 dark:hover:border-rose-800"
                                style={{ animationDelay: `${(index % 10) * 50 + 200}ms` }}
                            >
                                <div className="absolute top-0 right-0 w-1 h-full bg-rose-500/10" />
                                <div className="p-6 flex flex-col flex-1 relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 shadow-inner">
                                                {ban.customer?.profile?.user?.profileImage || ban.customer?.profile?.profileImage || ban.customer?.profileImage ? (
                                                    <ImageWithFallback src={ban.customer?.profile?.user?.profileImage || ban.customer?.profile?.profileImage || ban.customer?.profileImage} alt={ban.customer?.profile?.user?.name || 'Customer'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                                    {ban.customer?.profile?.user?.name || ban.customer?.name || t('common:anonymous')}
                                                    <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[8px] font-extrabold rounded-none uppercase tracking-widest border border-rose-200 dark:border-rose-800 shadow-sm ml-2 flex items-center gap-1">
                                                        <Ban size={8} />
                                                        {t('reviews:banned')}
                                                    </span>
                                                </h3>
                                                <div className="flex items-center gap-3 text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                                                    <span className="flex items-center gap-1.5"><Calendar size={10} className="text-slate-300" /> {t('reviews:bannedDate')}: {new Date(ban.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 text-right">
                                            {ban.store && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-none shadow-sm">
                                                    <Store size={12} className="text-primary" />
                                                    <span className="text-[0.625rem] font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {language === 'ar' && ban.store.nameAr ? ban.store.nameAr : ban.store.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-6 p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-none border border-rose-100 dark:border-rose-800/30 italic text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed relative">
                                        <Quote size={20} className="absolute -top-3 -left-3 text-rose-200 dark:text-rose-700/30 rotate-180" />
                                        "{ban.reason || t('reviews:noReasonProvided')}"
                                    </div>
                                    
                                    {ban.bannedBy && (
                                        <div className="flex items-center gap-1.5 mb-4 text-[0.625rem] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            <ShieldAlert size={10} className="text-rose-400" />
                                            <span>{t('reviews:bannerAdmin')}: {ban.bannedBy.name}</span>
                                        </div>
                                    )}

                                    {/* Global Actions */}
                                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end">
                                        <button 
                                            onClick={() => {
                                                setBanIdToUnban(ban.id);
                                                setIsUnbanByIdModalOpen(true);
                                            }}
                                            disabled={!!actionLoading}
                                            className="min-w-[120px] px-3 py-3 border rounded-none text-[0.625rem] font-extrabold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-500 dark:hover:bg-emerald-900/20"
                                        >
                                            {actionLoading === `unban-${ban.id}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            {t('reviews:unbanUser')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalBansPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination
                                currentPage={bansPage}
                                totalPages={totalBansPages}
                                onPageChange={setBansPage}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <StatusModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={t('reviews:deleteReportedTitle')}
                message={t('reviews:deleteReportedMessage')}
                type="confirm"
                confirmText={t('common:delete')}
            />

            <StatusModal
                isOpen={isUnreportModalOpen}
                onClose={() => setIsUnreportModalOpen(false)}
                onConfirm={handleConfirmUnreport}
                title={t('reviews:dismissReportTitle')}
                message={t('reviews:dismissReportMessage')}
                type="confirm"
                confirmText={t('reviews:dismissReport')}
            >
                <div className="space-y-4">
                    <label className="block text-[0.625rem] font-bold text-slate-500 uppercase tracking-widest">
                        {t('reviews:moderatorNotes')}
                    </label>
                    <textarea
                        value={moderatorNotes}
                        onChange={(e) => setModeratorNotes(e.target.value)}
                        placeholder={t('reviews:moderatorNotesPlaceholder')}
                        className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                </div>
            </StatusModal>

            <StatusModal
                isOpen={isBanModalOpen}
                onClose={() => {
                    if (!actionLoading) {
                        setIsBanModalOpen(false);
                        setReviewToBan(null);
                    }
                }}
                onConfirm={handleConfirmBan}
                title={reviewToBan && banStatuses[reviewToBan] ? t('reviews:unbanUserTitle') : t('reviews:banUserTitle')}
                message={reviewToBan && banStatuses[reviewToBan] ? t('reviews:unbanUserMessage') : t('reviews:banUserMessage')}
                type="confirm"
                confirmText={reviewToBan && banStatuses[reviewToBan] ? t('reviews:unbanUser') : t('reviews:banUser')}
                isLoading={!!actionLoading}
            />

            <StatusModal
                isOpen={isUnbanByIdModalOpen}
                onClose={() => {
                    if (!actionLoading) {
                        setIsUnbanByIdModalOpen(false);
                        setBanIdToUnban(null);
                    }
                }}
                onConfirm={handleConfirmUnbanById}
                title={t('reviews:unbanUserTitle')}
                message={t('reviews:unbanUserMessage')}
                type="confirm"
                confirmText={t('reviews:unbanUser')}
                isLoading={!!actionLoading}
            />
        </div>
    );
};

export default ReportedReviewList;
