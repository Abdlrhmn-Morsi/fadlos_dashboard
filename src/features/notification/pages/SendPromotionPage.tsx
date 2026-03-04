import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Megaphone, ArrowLeft, Loader2, CheckCircle2, User, Users, Search,
    Clock, ArrowDown, ArrowUp, UserCheck, Check
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
import { useLanguage } from '../../../contexts/LanguageContext';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type TargetMode = 'all' | 'first_n' | 'last_n' | 'individual';

const SendPromotionPage: React.FC = () => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { user } = useAuth();
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

    const storeId = user?.store?.id;

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
        } catch (err) {
            console.error('Failed to load followers', err);
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

    const toggleFollower = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const resolveTargetType = (): PromotionTargetType => {
        if (targetMode === 'individual') return PromotionTargetType.INDIVIDUALS;
        if (targetMode === 'first_n' || targetMode === 'last_n') return PromotionTargetType.INDIVIDUALS;
        return baseTargetType;
    };

    const handleSend = async () => {
        if (!messageAr || !message) return;
        if (credits && credits.remaining === 0) return;

        setLoading(true);
        try {
            let targetIds: string[] | undefined;

            if (targetMode === 'first_n' || targetMode === 'last_n') {
                // Fetch the specific N followers from the API
                if (!storeId) return;
                const order = targetMode === 'first_n' ? 'ASC' : 'DESC';
                const res = await getFollowersForSelection(storeId, {
                    page: 1,
                    limit: selectCount,
                    order,
                });
                targetIds = res.data.map((f) => f.id);
                if (!targetIds.length) {
                    toast.error(t('promotions.noTargets', 'No followers found'));
                    setLoading(false);
                    return;
                }
            } else if (targetMode === 'individual') {
                if (selectedIds.length === 0) {
                    toast.error(t('promotions.noTargets', 'Select at least one follower'));
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

    const targetModes: { key: TargetMode; icon: any; label: string; desc: string }[] = [
        {
            key: 'all',
            icon: Users,
            label: t('promotions.targetAll', 'All'),
            desc: t('promotions.targetAllDesc', `Send to all ${source}`),
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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {t('promotions.title')}
                    </h1>
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
                {(targetMode === 'first_n' || targetMode === 'last_n') && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            {t('promotions.selectCount', 'Number of followers')}
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
                                {targetMode === 'first_n'
                                    ? t('promotions.firstNHint', 'Oldest {{count}} followers (first to follow)', { count: selectCount })
                                    : t('promotions.lastNHint', 'Newest {{count}} followers (most recent)', { count: selectCount })}
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
                                        const isSelected = selectedIds.includes(follower.id);
                                        return (
                                            <button
                                                key={follower.id}
                                                onClick={() => toggleFollower(follower.id)}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-3 px-4 transition-all",
                                                    isSelected
                                                        ? "bg-primary/5"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                                    isSelected
                                                        ? "bg-primary border-primary"
                                                        : "border-slate-200 dark:border-slate-700"
                                                )}>
                                                    {isSelected && <Check size={12} className="text-white" />}
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
