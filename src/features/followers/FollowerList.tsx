import React, { useState, useEffect } from 'react';
import { User, Loader2, Users, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import followersApi from './api/followers.api';
import clsx from 'clsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { Pagination } from '../../components/common/Pagination';

const FollowerList = () => {
    const { t } = useTranslation(['followers', 'common']);
    const { isRTL } = useLanguage();
    const { user } = useAuth();
    const { getCache, setCache } = useCache();
    const [followers, setFollowers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // Add debounced search state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page when search changes
        }, 2000);
        return () => clearTimeout(timer);
    }, [searchTerm]);



    useEffect(() => {
        if (user) {
            fetchFollowers();
        }
    }, [user, debouncedSearch, page]); // Add page to dependencies

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const storeId = user?.store?.id;

            if (!storeId) {
                setError(t('common:errorFetchingData'));
                setLoading(false);
                return;
            }

            // Check cache first (only if no search)
            const cacheKey = 'followers';
            const params = { page, limit, search: debouncedSearch };

            if (!debouncedSearch) {
                const cachedData = getCache<any>(cacheKey, params);
                if (cachedData) {
                    if (cachedData.data && Array.isArray(cachedData.data)) {
                        setFollowers(cachedData.data);
                        if (cachedData.total) setTotalItems(cachedData.total);
                        if (cachedData.totalPages) setTotalPages(cachedData.totalPages);
                    } else if (Array.isArray(cachedData)) {
                        setFollowers(cachedData);
                        setTotalPages(1);
                        setTotalItems(cachedData.length);
                    }
                    setLoading(false);
                    return;
                }
            }

            // Pass debouncedSearch to API
            const response: any = await followersApi.getStoreFollowers(storeId, debouncedSearch, page, limit);

            if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                setFollowers(response.data);

                // Update pagination from response
                if (response.total !== undefined) setTotalItems(response.total);
                if (response.totalPages !== undefined) {
                    setTotalPages(response.totalPages);
                } else if (response.total !== undefined) {
                    setTotalPages(Math.ceil(response.total / limit));
                }

                // Cache the response only if no search filter
                if (!debouncedSearch) {
                    setCache(cacheKey, response, params);
                }
            } else if (Array.isArray(response)) {
                setFollowers(response);
                setTotalItems(response.length);
                setTotalPages(1);

                if (!debouncedSearch) {
                    setCache(cacheKey, response, params);
                }
            } else {
                setFollowers([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch followers', error);
            setError(t('common:errorFetchingData'));
            setFollowers([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('title')}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                            {totalItems} {t('activeConnections')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isRTL ? "right-3" : "left-3")}>
                            <User size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder') || "Search by name..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx(
                                "w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm font-medium text-sm placeholder:text-slate-400",
                                isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                            )}
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-2 p-2 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                        <Users size={16} className="text-primary" />
                        <span className="font-black text-[10px] uppercase tracking-tight">{t('communityReach')}</span>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-3xl font-bold text-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">!</div>
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={32} className="text-primary animate-spin" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-mono">{t('common:loading')}</span>
                        </div>
                    ) : followers.length === 0 ? (
                        <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none inline-flex items-center justify-center mb-6">
                                <Users size={32} className="text-slate-200" />
                            </div>
                            <h2 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-xl mb-1">{t('evolveTitle')}</h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{t('evolveSubtitle')}</p>
                        </div>
                    ) : (
                        followers.map((followerData: any) => {
                            const user = followerData.user || followerData;
                            const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || t('valuedFollower');

                            return (
                                <div key={user.id} className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden relative active:scale-[0.98]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden group-hover:scale-110 transition-transform duration-500 shrink-0">
                                            {user.profileImage ? (
                                                <ImageWithFallback src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} className="group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover:text-primary transition-colors mb-0.5">
                                                {displayName}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* High-end accent details */}
                                    <div className={clsx("absolute top-2 w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors", isRTL ? "left-2" : "right-2")} />
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {!loading && !error && followers.length > 0 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        isLoading={loading}
                    />
                </div>
            )}
        </div>
    );
};

export default FollowerList;
