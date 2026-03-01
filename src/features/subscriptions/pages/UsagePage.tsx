import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, Package, MapPin, Layers, Truck, Users, ShoppingBag,
    Crown, Zap, Shield, Loader2, ArrowUpRight, Infinity, CheckCircle2, Lock, Sparkles
} from 'lucide-react';
import { getMySubscriptionUsage, SubscriptionUsage } from '../api/subscriptions.api';
import { useLanguage } from '../../../contexts/LanguageContext';
import clsx from 'clsx';

const RESOURCE_CONFIG: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
    products: { icon: Package, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500' },
    branches: { icon: MapPin, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500' },
    categories: { icon: Layers, colorClass: 'text-amber-500', bgClass: 'bg-amber-500' },
    drivers: { icon: Truck, colorClass: 'text-blue-500', bgClass: 'bg-blue-500' },
    staff_accounts: { icon: Users, colorClass: 'text-violet-500', bgClass: 'bg-violet-500' },
    orders_per_month: { icon: ShoppingBag, colorClass: 'text-rose-500', bgClass: 'bg-rose-500' },
};

const ALL_FEATURES = [
    'basic_dashboard',
    'order_management',
    'promocodes',
    'advanced_analytics',
    'reviews_management',
    'store_clients_management',
    'custom_roles',
    'product_discounts_offers',
    'frequently_bought_together',
    'priority_support',
];

const UsagePage: React.FC = () => {
    const { t } = useTranslation(['subscriptions', 'common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [data, setData] = useState<SubscriptionUsage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const result = await getMySubscriptionUsage();
                setData(result);
            } catch (err) {
                console.error('Failed to load usage data', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-slate-400 font-medium">{t('common:loading')}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const planKey = data.plan?.toLowerCase() || 'free';
    const isPremium = planKey === 'premium';
    const isPro = planKey === 'pro';
    const PlanIcon = isPremium ? Crown : isPro ? Zap : Shield;

    const planGradient = isPremium
        ? 'from-amber-500 to-orange-600'
        : isPro
            ? 'from-indigo-500 to-purple-600'
            : 'from-slate-600 to-slate-700';

    const limitEntries = Object.entries(data.limits || {});

    return (
        <div className={clsx("p-6 md:p-8 space-y-8", isRTL && "text-right")}>
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('usage.title')}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('usage.description')}
                </p>
            </div>

            {/* Current Plan Banner */}
            <div className={clsx(
                "relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br",
                planGradient
            )}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                            <PlanIcon size={28} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">
                                {t('usage.currentPlan')}
                            </p>
                            <p className="text-2xl font-black text-white uppercase tracking-tight">
                                {t(`plans.${planKey}.name`, data.plan)}
                            </p>
                        </div>
                    </div>

                    {!isPremium && (
                        <button
                            onClick={() => navigate('/subscription')}
                            className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center gap-2"
                        >
                            {t('usage.upgradeForMore')}
                            <ArrowUpRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Resource Usage Grid */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {t('usage.resourceUsage')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {limitEntries.map(([key, limit]) => {
                        const config = RESOURCE_CONFIG[key];
                        if (!config) return null;

                        const Icon = config.icon;
                        const used = data.usage?.[key] ?? 0;
                        const isUnlimited = limit === -1;
                        const percentage = isUnlimited ? 100 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                        const isNearLimit = !isUnlimited && percentage >= 80;
                        const isAtLimit = !isUnlimited && percentage >= 100;

                        return (
                            <div
                                key={key}
                                className={clsx(
                                    "bg-white dark:bg-slate-900 rounded-xl border p-5 transition-all hover:shadow-md",
                                    isAtLimit
                                        ? "border-rose-200 dark:border-rose-800"
                                        : isNearLimit
                                            ? "border-amber-200 dark:border-amber-800"
                                            : "border-slate-200 dark:border-slate-800"
                                )}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isAtLimit ? "bg-rose-50 dark:bg-rose-900/20" : `${config.bgClass}/10`
                                        )}>
                                            <Icon size={20} className={isAtLimit ? "text-rose-500" : config.colorClass} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {t(`admin.limitKeys.${key}`, key)}
                                            </p>
                                            {key === 'orders_per_month' && (
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                    {t('usage.ordersThisMonth')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className={clsx("text-end")}>
                                        {isUnlimited ? (
                                            <div className="flex items-center gap-1.5 text-emerald-500">
                                                <Infinity size={18} />
                                                <span className="text-xs font-black uppercase tracking-wider">
                                                    {t('usage.unlimited')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className={clsx(
                                                    "text-lg font-black",
                                                    isAtLimit ? "text-rose-500" : isNearLimit ? "text-amber-500" : "text-slate-900 dark:text-white"
                                                )}>
                                                    {used}
                                                </span>
                                                <span className="text-sm text-slate-400 font-bold"> / {limit}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all duration-700 ease-out",
                                            isUnlimited
                                                ? "bg-emerald-400"
                                                : isAtLimit
                                                    ? "bg-rose-500"
                                                    : isNearLimit
                                                        ? "bg-amber-400"
                                                        : config.bgClass
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                {!isUnlimited && (
                                    <p className={clsx(
                                        "text-[10px] font-bold mt-2 uppercase tracking-wider",
                                        isAtLimit ? "text-rose-500" : isNearLimit ? "text-amber-500" : "text-slate-400"
                                    )}>
                                        {Math.round(percentage)}% {t('usage.used', { count: used })}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Unlocked Features */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t('usage.unlockedFeatures')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {ALL_FEATURES.map((feature) => {
                        const isUnlocked = data.features?.includes(feature);
                        return (
                            <div
                                key={feature}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all",
                                    isUnlocked
                                        ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60"
                                )}
                            >
                                {isUnlocked ? (
                                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                ) : (
                                    <Lock size={16} className="text-slate-400 shrink-0" />
                                )}
                                <span className={clsx(
                                    "text-sm font-semibold",
                                    isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                )}>
                                    {t(`admin.featureKeys.${feature}`, feature)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UsagePage;
