import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import reviewsApi from './api/reviews.api';
import { Star, Loader2, MessageSquare, User, Calendar, Package, Quote } from 'lucide-react';
import clsx from 'clsx';
import { Pagination } from '../../components/common/Pagination';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

const ReviewList = () => {
    const { t } = useTranslation(['reviews', 'common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache } = useCache();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('STORE'); // STORE or PRODUCT

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchReviews();
    }, [type, page]);

    // Reset to page 1 when type changes
    useEffect(() => {
        setPage(1);
    }, [type]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params: any = {
                type,
                page,
                limit
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
        <div className="max-w-4xl mx-auto p-6 space-y-10">
            {/* Header section with high-contrast tab switcher */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('title')}</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">{t('subtitle')}</p>
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

            <div className="grid grid-cols-1 gap-6">
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
                        <div key={review.id} className="group bg-white dark:bg-slate-900 p-1 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden relative">
                            {/* Accent line for top reviews */}
                            {review.rating >= 4 && (
                                <div className={clsx(
                                    "absolute top-0 w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-full shadow-lg shadow-amber-400/20",
                                    isRTL ? "left-10" : "right-10"
                                )} />
                            )}

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden ring-4 ring-transparent group-hover:ring-primary/5 transition-all">
                                            {review.customer?.profileImage ? (
                                                <ImageWithFallback src={review.customer.profileImage} alt={review.customer.name || 'Customer'} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                {review.customer?.name || t('anonymousUser')}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span>{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>

                                {review.product && (
                                    <div className="flex items-center gap-2 mb-6 p-2 pr-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/50 w-fit group/tag">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                            <Package size={14} className="text-primary" />
                                        </div>
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter transition-colors group-hover/tag:text-primary">
                                            {review.product.name}
                                        </span>
                                    </div>
                                )}

                                <div className="relative ps-6">
                                    <Quote className={clsx(
                                        "absolute top-0 text-slate-100 dark:text-slate-800 w-10 h-10 -z-0",
                                        isRTL ? "right-0 scale-x-[-1]" : "left-0"
                                    )} />
                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-base relative z-10 italic">
                                        {review.comment || (
                                            <span className="text-slate-400 font-normal">{t('noComment')}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
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
