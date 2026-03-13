import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Megaphone, ArrowLeft, Loader2, CheckCircle2, User, Users, Search,
    Clock, ArrowDown, ArrowUp, UserCheck, Check, ImagePlus, X
} from 'lucide-react';
import {
    getPromotionCredits,
    sendPromotionAd,
    getFollowersForSelection,
    PromotionTargetType,
    PromotionCredits,
    FollowerItem,
} from '../api/promotions.api';
import toolsApi from '../../../services/tools.api';
import { useAuth } from '../../../contexts/AuthContext';
import { Permissions } from '../../../types/permissions';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import clientsApi from '../../clients/api/clients.api';

type TargetMode = 'all' | 'first_n' | 'last_n' | 'individual' | 'first_n_spent' | 'last_n_spent' | 'first_n_orders' | 'last_n_orders' | 'first_n_delivered' | 'last_n_delivered';

const SendPromotionPage: React.FC = () => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { user, hasPermission } = useAuth();
    const [searchParams] = useSearchParams();
    const source = searchParams.get('source') || 'followers';


    // Determine base target type from source
    const baseTargetType = source === 'clients'
        ? PromotionTargetType.ALL_CLIENTS
        : PromotionTargetType.ALL_FOLLOWERS;

    // Credits
    const [credits, setCredits] = useState<PromotionCredits | null>(null);
    const [fetchingCredits, setFetchingCredits] = useState(false);

    // Message / Title fields
    const [title, setTitle] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [message, setMessage] = useState('');
    const [messageAr, setMessageAr] = useState('');

    // Targeting
    const [targetMode, setTargetMode] = useState<TargetMode>('all');
    const [selectCount, setSelectCount] = useState(50);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Followers list for individual selection
    const [followers, setFollowers] = useState<FollowerItem[]>([]);
    const [followerSearch, setFollowerSearch] = useState('');
    const [debouncedFollowerSearch, setDebouncedFollowerSearch] = useState('');
    const [followerPage, setFollowerPage] = useState(1);
    const [followerTotal, setFollowerTotal] = useState(0);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sending
    const [loading, setLoading] = useState(false);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const storeId = user?.store?.id;

    useEffect(() => {
        if (!hasPermission(Permissions.PROMOTION_ADS_SEND)) {
            navigate('/');
        }
    }, [hasPermission, navigate]);

    useEffect(() => {
        loadCredits();
    }, []);

    // Debounce follower search — reset list on new search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFollowerSearch(followerSearch);
            setFollowerPage(1);
            setFollowers([]);
            setHasMoreFollowers(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [followerSearch]);

    // Load followers for individual selection
    useEffect(() => {
        if (targetMode === 'individual' && storeId) {
            loadFollowers();
        }
    }, [targetMode, debouncedFollowerSearch, followerPage, storeId]);

    const loadCredits = async () => {
        setFetchingCredits(true);
        try {
            const result = await getPromotionCredits();
            setCredits(result);
        } catch (err) {
            console.error('Failed to load credits', err);
        } finally {
            setFetchingCredits(false);
        }
    };

    const loadFollowers = async () => {
        if (!storeId) return;
        setLoadingFollowers(true);
        try {
            if (source === 'clients') {
                const res: any = await clientsApi.getStoreClients({
                    page: followerPage,
                    limit: 10,
                    search: debouncedFollowerSearch || undefined,
                    order: 'DESC',
                });
                const newData = (res.data || []).map((c: any) => ({
                    id: c.clientId,
                    userId: c.client?.userId || c.userId, // Ensure userId is captured
                    name: c.client?.name,
                    username: c.client?.username,
                    email: c.client?.email,
                    profileImage: c.client?.profileImage,
                    followedAt: c.createdAt,
                }));
                setFollowers((prev) => followerPage === 1 ? newData : [...prev, ...newData]);
                if (res.pagination) {
                    setFollowerTotal(res.pagination.totalItems || 0);
                } else if (res.meta) {
                    setFollowerTotal(res.meta.totalItems || 0);
                }
                setHasMoreFollowers(newData.length === 10);
            } else {
                const res = await getFollowersForSelection(storeId, {
                    page: followerPage,
                    limit: 10,
                    search: debouncedFollowerSearch || undefined,
                    order: 'DESC',
                });
                const newData = res.data || [];
                setFollowers((prev) => followerPage === 1 ? newData : [...prev, ...newData]);
                setFollowerTotal(res.total || 0);
                setHasMoreFollowers(newData.length === 10);
            }
        } catch (err) {
            console.error(`Failed to load ${source}`, err);
        } finally {
            setLoadingFollowers(false);
        }
    };

    const handleFollowerScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            if (!loadingFollowers && hasMoreFollowers) {
                setFollowerPage((p) => p + 1);
            }
        }
    }, [loadingFollowers, hasMoreFollowers]);

    const handleTranslate = async (
        sourceText: string,
        targetSetter: (val: string) => void,
        currentTargetValue: string,
    ) => {
        if (!sourceText) return;
        try {
            const res: any = await toolsApi.translate(sourceText, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;
            if (translated && !currentTargetValue) {
                targetSetter(translated);
            }
        } catch (error) {
            console.error('Translation error', error);
        }
    };

    const toggleFollower = (userId: string) => {
        setSelectedIds((prev) =>
            prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
        );
    };

    const resolveTargetType = (): PromotionTargetType => {
        if (source === 'followers') {
            if (targetMode === 'all') return PromotionTargetType.ALL_FOLLOWERS;
            if (targetMode === 'individual') return PromotionTargetType.INDIVIDUAL_FOLLOWERS;
            return PromotionTargetType.FOLLOWERS_SEGMENT;
        } else {
            if (targetMode === 'all') return PromotionTargetType.ALL_CLIENTS;
            if (targetMode === 'individual') return PromotionTargetType.INDIVIDUAL_CLIENTS;
            return PromotionTargetType.CLIENTS_SEGMENT;
        }
    };


    const handleSend = async () => {
        if (!messageAr || !message) return;
        if (credits && credits.remaining === 0) return;

        setLoading(true);
        try {
            let targetIds: string[] = [];

            if (targetMode === 'first_n' || targetMode === 'last_n') {
                // Fetch the specific N followers from the API
                if (!storeId) return;
                const order = targetMode === 'first_n' ? 'ASC' : 'DESC';
                const res = await getFollowersForSelection(storeId, {
                    page: 1,
                    limit: selectCount,
                    order,
                });
                targetIds = res.data.map((f) => f.userId);
                if (!targetIds.length) {
                    toast.error(t('promotions.noTargets', 'No followers found'));
                    setLoading(false);
                    return;
                }
            } else if (targetMode === 'first_n_spent' || targetMode === 'last_n_spent') {
                if (!storeId) return;
                const order = targetMode === 'first_n_spent' ? 'DESC' : 'ASC';
                const res: any = await clientsApi.getStoreClients({
                    page: 1,
                    limit: selectCount,
                    sortBy: 'totalSpent',
                    order,
                });
                targetIds = (res.data || []).map((c: any) => c.client?.userId || c.userId);
                if (!targetIds.length) {
                    toast.error(t('promotions.noTargets', 'No clients found'));
                    setLoading(false);
                    return;
                }
            } else if (targetMode === 'first_n_orders' || targetMode === 'last_n_orders') {
                if (!storeId) return;
                const order = targetMode === 'first_n_orders' ? 'DESC' : 'ASC';
                const res: any = await clientsApi.getStoreClients({
                    page: 1,
                    limit: selectCount,
                    sortBy: 'totalOrders',
                    order,
                });
                targetIds = (res.data || []).map((c: any) => c.client?.userId || c.userId);
                if (!targetIds.length) {
                    toast.error(t('promotions.noTargets', 'No clients found'));
                    setLoading(false);
                    return;
                }
            } else if (targetMode === 'first_n_delivered' || targetMode === 'last_n_delivered') {
                if (!storeId) return;
                const order = targetMode === 'first_n_delivered' ? 'DESC' : 'ASC';
                const res: any = await clientsApi.getStoreClients({
                    page: 1,
                    limit: selectCount,
                    sortBy: 'deliveredOrders',
                    order,
                });
                targetIds = (res.data || []).map((c: any) => c.client?.userId || c.userId);
                if (!targetIds.length) {
                    toast.error(t('promotions.noTargets', 'No clients found'));
                    setLoading(false);
                    return;
                }
            } else if (targetMode === 'individual') {
                if (selectedIds.length === 0) {
                    toast.error(t('promotions.noTargets', 'Select at least one user'));
                    setLoading(false);
                    return;
                }
                targetIds = selectedIds;
            }

            await sendPromotionAd({
                title,
                titleAr,
                message,
                messageAr,
                targetType: resolveTargetType(),
                targetIds,
                criteria: targetMode,
                coverImage: coverImage || undefined,
            });
            toast.success(t('promotions.success'));
            await loadCredits();
            navigate(-1);
        } catch (err: any) {
            console.error('Failed to send promotion', err);
            toast.error(err.response?.data?.message || t('promotions.error'));
        } finally {
            setLoading(false);
        }
    };

    const isAtLimit = credits?.remaining === 0;

    const targetModes: { key: TargetMode; icon: any; label: string; desc: string }[] = source === 'clients' ? [
        {
            key: 'all',
            icon: Users,
            label: t('promotions.targetAll', 'All'),
            desc: t('promotions.targetAllDesc', `Send to all clients`),
        },
        {
            key: 'first_n_spent',
            icon: ArrowUp,
            label: t('promotions.targetFirstNSpent', 'Top Spenders'),
            desc: t('promotions.targetFirstNSpentDesc', 'Highest lifetime value'),
        },
        {
            key: 'last_n_spent',
            icon: ArrowDown,
            label: t('promotions.targetLastNSpent', 'Lowest Spenders'),
            desc: t('promotions.targetLastNSpentDesc', 'Lowest lifetime value'),
        },
        {
            key: 'first_n_orders',
            icon: ArrowUp,
            label: t('promotions.targetFirstNOrders', 'Most Active'),
            desc: t('promotions.targetFirstNOrdersDesc', 'Highest number of orders'),
        },
        {
            key: 'last_n_orders',
            icon: ArrowDown,
            label: t('promotions.targetLastNOrders', 'Least Active'),
            desc: t('promotions.targetLastNOrdersDesc', 'Lowest number of orders'),
        },
        {
            key: 'first_n_delivered',
            icon: ArrowUp,
            label: t('promotions.targetFirstNDelivered', 'Most Delivered'),
            desc: t('promotions.targetFirstNDeliveredDesc', 'Highest delivered orders'),
        },
        {
            key: 'last_n_delivered',
            icon: ArrowDown,
            label: t('promotions.targetLastNDelivered', 'Least Delivered'),
            desc: t('promotions.targetLastNDeliveredDesc', 'Lowest delivered orders'),
        },
        {
            key: 'individual',
            icon: UserCheck,
            label: t('promotions.targetIndividual', 'Individual'),
            desc: t('promotions.targetIndividualDesc', 'Pick one by one'),
        },
    ] : [
        {
            key: 'all',
            icon: Users,
            label: t('promotions.targetAll', 'All'),
            desc: t('promotions.targetAllDesc', `Send to all followers`),
        },
        {
            key: 'first_n',
            icon: ArrowUp,
            label: t('promotions.targetFirstN', 'First N'),
            desc: t('promotions.targetFirstNDesc', 'Earliest followers'),
        },
        {
            key: 'last_n',
            icon: ArrowDown,
            label: t('promotions.targetLastN', 'Last N'),
            desc: t('promotions.targetLastNDesc', 'Most recent followers'),
        },
        {
            key: 'individual',
            icon: UserCheck,
            label: t('promotions.targetIndividual', 'Individual'),
            desc: t('promotions.targetIndividualDesc', 'Pick one by one'),
        },
    ];

    const canSend = message && messageAr && !isAtLimit && !loading;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/50 transition-all"
                >
                    <ArrowLeft size={20} className={clsx("text-slate-600 dark:text-slate-400", isRTL && "rotate-180")} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {t('promotions.title')}
                        </h1>
                        <button
                            onClick={() => navigate('/promotions/history')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/50 transition-all shadow-sm hover:shadow text-primary font-bold text-xs uppercase"
                        >
                            <Clock size={16} />
                            {t('promotions.history', 'History')}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={clsx(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            source === 'followers'
                                ? "bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        )}>
                            {source === 'followers'
                                ? t('promotions.sourceFollowers', 'Store Followers')
                                : t('promotions.sourceClients', 'Store Clients')}
                        </span>
                    </div>
                </div>

            </div>

            <div className="space-y-6">
                {/* Credits Status */}
                <div className={clsx(
                    "p-4 rounded-xl flex items-center justify-between border",
                    isAtLimit
                        ? "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20"
                        : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isAtLimit ? "bg-rose-500" : "bg-emerald-500"
                        )}>
                            <Megaphone className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <p className={clsx(
                                "text-xs font-bold uppercase tracking-wider",
                                isAtLimit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                                {t('promotions.usage')}
                            </p>
                            {fetchingCredits ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            ) : (
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('promotions.count', {
                                        used: credits?.used ?? 0,
                                        total: credits?.total === -1 ? '∞' : credits?.total || 0
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    {isAtLimit && (
                        <div className="text-end">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">
                                {t('promotions.noCredits')}
                            </p>
                            <button
                                onClick={() => navigate('/subscription')}
                                className="text-[10px] font-black text-rose-600 underline uppercase mt-0.5"
                            >
                                {t('promotions.upgrade')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Target Mode Selection */}
                <div className="space-y-3">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.target')}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {targetModes.map(({ key, icon: Icon, label, desc }) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setTargetMode(key);
                                    setSelectedIds([]);
                                }}
                                className={clsx(
                                    "p-4 rounded-xl border-2 transition-all text-start",
                                    targetMode === key
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/30"
                                )}
                            >
                                <Icon size={20} className={clsx(
                                    "mb-2",
                                    targetMode === key ? "text-primary" : "text-slate-400"
                                )} />
                                <p className={clsx(
                                    "text-sm font-black uppercase tracking-tight",
                                    targetMode === key ? "text-primary" : "text-slate-900 dark:text-white"
                                )}>
                                    {label}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Count Input for First N / Last N */}
                {['first_n', 'last_n', 'first_n_spent', 'last_n_spent', 'first_n_orders', 'last_n_orders', 'first_n_delivered', 'last_n_delivered'].includes(targetMode) && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            {source === 'clients' ? t('promotions.selectCountClients', 'Number of clients') : t('promotions.selectCount', 'Number of followers')}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={selectCount}
                                onChange={(e) => setSelectCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 50)))}
                                className="w-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center text-lg font-black focus:border-primary focus:ring-0 transition-all"
                            />
                            <p className="text-sm text-slate-500 font-medium">
                                {targetMode === 'first_n' && t('promotions.firstNHint', 'Oldest {{count}} followers (first to follow)', { count: selectCount })}
                                {targetMode === 'last_n' && t('promotions.lastNHint', 'Newest {{count}} followers (most recent)', { count: selectCount })}
                                {targetMode === 'first_n_spent' && t('promotions.firstNSpentHint', 'Top {{count}} spenders', { count: selectCount })}
                                {targetMode === 'last_n_spent' && t('promotions.lastNSpentHint', 'Lowest {{count}} spenders', { count: selectCount })}
                                {targetMode === 'first_n_orders' && t('promotions.firstNOrdersHint', 'Top {{count}} most active clients', { count: selectCount })}
                                {targetMode === 'last_n_orders' && t('promotions.lastNOrdersHint', 'Lowest {{count}} least active clients', { count: selectCount })}
                                {targetMode === 'first_n_delivered' && t('promotions.firstNDeliveredHint', 'Top {{count}} clients by delivered orders', { count: selectCount })}
                                {targetMode === 'last_n_delivered' && t('promotions.lastNDeliveredHint', 'Lowest {{count}} clients by delivered orders', { count: selectCount })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Individual Selection */}
                {targetMode === 'individual' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {/* Search bar */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <Search size={16} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="text"
                                    placeholder={t('promotions.searchFollowers', 'Search followers...')}
                                    value={followerSearch}
                                    onChange={(e) => setFollowerSearch(e.target.value)}
                                    className={clsx(
                                        "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                            {selectedIds.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                                        {t('promotions.selectedCount', '{{count}} selected', { count: selectedIds.length })}
                                    </span>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                    >
                                        {t('common:clearAll', 'Clear all')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Followers list — infinite scroll */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleFollowerScroll}
                            className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800"
                        >
                            {followers.length === 0 && !loadingFollowers ? (
                                <div className="p-8 text-center">
                                    <Users size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                                    <p className="text-sm font-bold text-slate-400">{t('promotions.noFollowersFound', 'No followers found')}</p>
                                </div>
                            ) : (
                                <>
                                    {followers.map((follower) => {
                                        return (
                                            <button
                                                key={follower.id}
                                                onClick={() => toggleFollower(follower.userId)}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3 px-4 transition-all",
                                                    selectedIds.includes(follower.userId)
                                                        ? "bg-primary/5"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                                    selectedIds.includes(follower.userId)
                                                        ? "bg-primary border-primary"
                                                        : "border-slate-200 dark:border-slate-700"
                                                )}>
                                                    {selectedIds.includes(follower.userId) && <Check size={12} className="text-white" />}
                                                </div>
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                                    {follower.profileImage ? (
                                                        <ImageWithFallback src={follower.profileImage} alt={follower.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 text-start">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {follower.name || follower.username || t('common:unnamed', 'Unnamed')}
                                                    </p>
                                                    {follower.followedAt && (
                                                        <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(follower.followedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {loadingFollowers && (
                                        <div className="p-4 flex justify-center">
                                            <Loader2 size={20} className="text-primary animate-spin" />
                                        </div>
                                    )}
                                    {!hasMoreFollowers && followers.length > 0 && (
                                        <div className="p-3 text-center">
                                            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                                                {followerTotal} {t('promotions.sourceFollowers', 'followers')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Promotional Images Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            {t('promotions.promoImages', 'Promotional Images')}
                        </h2>
                    </div>
                    <div className="p-4 space-y-6">
                        {/* 1. Large Icon (Store Logo) - Automatic */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-1 shrink-0 overflow-hidden">
                                <ImageWithFallback
                                    src={user?.store?.logo}
                                    alt="Store Logo"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {t('promotions.largeIcon', 'Large Icon')}
                                </h3>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                                    {t('promotions.logoHint', 'Your store logo is used automatically')}
                                </p>
                            </div>
                        </div>

                        {/* 2. Cover Image (Big Picture) - Custom Upload */}
                        <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {t('promotions.coverImage', 'Cover Image (Big Picture)')}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {t('promotions.coverImageDesc', 'Shown when notification is expanded')}
                                    </p>
                                </div>
                            </div>

                            {coverPreview ? (
                                <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-primary/30 bg-primary/5">
                                    <img
                                        src={coverPreview}
                                        alt="Cover"
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCoverImage(null);
                                            setCoverPreview(null);
                                            if (coverInputRef.current) coverInputRef.current.value = '';
                                        }}
                                        disabled={loading}
                                        className="absolute top-3 end-3 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all active:scale-95"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => coverInputRef.current?.click()}
                                    disabled={loading || isAtLimit}
                                    className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm group-hover:shadow group-hover:text-primary transition-all">
                                        <ImagePlus size={32} className="text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                                        {t('promotions.addCoverImage', 'Choose Cover Image')}
                                    </span>
                                </button>
                            )}
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setCoverImage(file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => setCoverPreview(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Title Input (Arabic) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.titleAr', 'Title (Arabic)')}
                    </label>
                    <input
                        type="text"
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value.slice(0, 50))}
                        onBlur={(e) => handleTranslate(e.target.value, setTitle, title)}
                        placeholder={t('promotions.titleArPlaceholder', 'Enter Arabic title...')}
                        disabled={loading || isAtLimit}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all disabled:opacity-50"
                    />
                </div>

                {/* Title Input (English) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.titleEn', 'Title (English)')}
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                        placeholder={t('promotions.titleEnPlaceholder', 'Enter English title...')}
                        disabled={loading || isAtLimit}
                        className="w-full text-left bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all disabled:opacity-50"
                        dir="ltr"
                    />
                </div>


                {/* Message Input (Arabic) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.messageAr')}
                    </label>
                    <div className="relative">
                        <textarea
                            value={messageAr}
                            onChange={(e) => setMessageAr(e.target.value.slice(0, 200))}
                            onBlur={(e) => handleTranslate(e.target.value, setMessage, message)}
                            placeholder={t('promotions.messageArPlaceholder')}
                            rows={3}
                            disabled={loading || isAtLimit}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all resize-none disabled:opacity-50"
                        />
                        <div className={clsx(
                            "absolute bottom-3 end-3 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border shadow-sm",
                            messageAr.length >= 180 ? "text-rose-500 border-rose-100" : "text-slate-400 border-slate-100"
                        )}>
                            {t('promotions.characterLimit', { count: messageAr.length })}
                        </div>
                    </div>
                </div>

                {/* Message Input (English) */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                        {t('promotions.messageEn')}
                    </label>
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                            placeholder={t('promotions.messageEnPlaceholder')}
                            rows={3}
                            disabled={loading || isAtLimit}
                            className="w-full text-left bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm focus:border-primary focus:ring-0 transition-all resize-none disabled:opacity-50"
                            dir="ltr"
                        />
                        <div className={clsx(
                            "absolute bottom-3 end-3 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border shadow-sm",
                            message.length >= 180 ? "text-rose-500 border-rose-100" : "text-slate-400 border-slate-100"
                        )}>
                            {t('promotions.characterLimit', { count: message.length })}
                        </div>
                    </div>
                </div>


                {/* Summary & Send */}
                <div className="space-y-4">
                    {/* Target summary */}
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                        <CheckCircle2 size={16} className="text-primary" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {t('promotions.target')}: {' '}
                            <span className="font-bold text-slate-900 dark:text-white uppercase">
                                {targetMode === 'all' && t(`promotions.${source === 'followers' ? 'all_followers' : 'all_clients'}`)}
                                {targetMode === 'first_n' && t('promotions.targetFirstN', 'First') + ` ${selectCount}`}
                                {targetMode === 'last_n' && t('promotions.targetLastN', 'Last') + ` ${selectCount}`}
                                {targetMode === 'individual' && `${selectedIds.length} ${t('promotions.targetIndividual', 'Individual')}`}
                            </span>
                        </p>
                    </div>

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className={clsx(
                            "w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0",
                            !canSend
                                ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                                : "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Megaphone size={16} />
                        )}
                        {loading ? t('promotions.sending') : t('promotions.send')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendPromotionPage;
