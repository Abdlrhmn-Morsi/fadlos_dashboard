import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlans, getMySubscriptionUsage, Plan, SubscriptionUsage, createCheckoutSession, cancelSubscription, syncSubscription } from '../api/subscriptions.api';
import { Shield, Check, X, CreditCard, Clock, Zap, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { toast } from '../../../utils/toast';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Modal from '../../../components/common/Modal';
import { usePaddle } from '../../../hooks/usePaddle';
import { useLanguage } from '../../../contexts/LanguageContext';

const SubscriptionSettings = () => {
    const { t } = useTranslation(['common', 'stores', 'subscriptions']);
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const { openCheckout } = usePaddle();

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            const [plansData, usageData] = await Promise.all([
                getPlans(),
                getMySubscriptionUsage()
            ]);
            setPlans(Array.isArray(plansData) ? plansData : []);
            setUsage(usageData);
            console.log('DEBUG: plansData:', plansData);
            console.log('DEBUG: usageData:', usageData);
            console.log('DEBUG: current plans state:', Array.isArray(plansData) ? plansData : []);
        } catch (error) {
            console.error('Failed to fetch subscription data:', error);
            toast.error(t('subscriptions:errorLoadingPlans', { defaultValue: 'Failed to load subscription information' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        if (planId === usage?.plan) {
            setCancelModalOpen(true);
            return;
        }

        setProcessingId(planId);

        try {
            const session = await createCheckoutSession(planId, billingCycle);

            if (session.checkoutId) {
                openCheckout(session.checkoutId);
            } else {
                toast.error(t('subscriptions:checkoutError', { defaultValue: 'Failed to initialize checkout session' }));
            }

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(t('subscriptions:checkoutError', { defaultValue: 'Could not initialize checkout' }));
        } finally {
            setProcessingId(null);
        }
    };

    const confirmCancel = async () => {
        setProcessingId('cancel');
        setCancelModalOpen(false);
        try {
            await cancelSubscription();
            toast.success(t('subscriptions:cancelSuccess', { defaultValue: 'Successfully cancelled subscription' }));
            await fetchSubscriptionData();
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error(t('subscriptions:cancelError', { defaultValue: 'Could not cancel subscription' }));
        } finally {
            setProcessingId(null);
        }
    };

    const handleSync = async () => {
        try {
            setSyncLoading(true);
            const updatedUsage = await syncSubscription();
            setUsage(updatedUsage);
            toast.success(t('subscriptions:syncSuccess'));
            // Also refresh plans just in case
            const plansData = await getPlans();
            setPlans(Array.isArray(plansData) ? plansData : []);
        } catch (error) {
            console.error('Sync error:', error);
            toast.error(t('subscriptions:syncError'));
        } finally {
            setSyncLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        {t('subscriptions:title')}
                        {usage?.plan !== 'free' && usage?.currentPeriodEnd && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold mt-1">
                                <Clock size={14} />
                                {t('subscriptions:renewsOn', { date: new Date(usage.currentPeriodEnd).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) })}
                            </span>
                        )}
                        {usage?.plan !== 'free' && (
                            <button
                                onClick={handleSync}
                                disabled={syncLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm font-bold mt-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                title={t('subscriptions:syncStatus')}
                            >
                                <RefreshCw size={14} className={clsx(syncLoading && "animate-spin")} />
                                {t('subscriptions:syncStatus')}
                            </button>
                        )}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('subscriptions:description')}
                    </p>
                    {usage?.cancelAtPeriodEnd && usage?.currentPeriodEnd && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[4px] flex items-start gap-3">
                            <div className="mt-0.5 text-red-600 dark:text-red-400">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-red-800 dark:text-red-300">
                                    {t('subscriptions:subscriptionCancelledTitle')}
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                    {t('subscriptions:subscriptionCancelledDesc', {
                                        date: new Date(usage.currentPeriodEnd).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' })
                                    })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-12">

                {/* Billing Cycle Toggle */}
                <div className="flex items-center justify-center gap-4">
                    <span className={clsx("text-sm font-bold", billingCycle === 'monthly' ? "text-slate-900 dark:text-white" : "text-slate-400")}>{t('subscriptions:monthly')}</span>
                    <button
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className="relative w-14 h-7 bg-slate-200 dark:bg-slate-700 rounded-full p-1 transition-colors hover:bg-slate-300 dark:hover:bg-slate-600 outline-none"
                    >
                        <div className={clsx(
                            "w-5 h-5 bg-white dark:bg-slate-200 rounded-full shadow-md transition-transform duration-300",
                            billingCycle === 'yearly' ? (isRTL ? "-translate-x-7" : "translate-x-7") : "translate-x-0"
                        )} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={clsx("text-sm font-bold", billingCycle === 'yearly' ? "text-slate-900 dark:text-white" : "text-slate-400")}>{t('subscriptions:yearly')}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] rounded-[4px] uppercase tracking-wider font-black whitespace-nowrap">
                            {t('subscriptions:save')} 17%
                        </span>
                    </div>
                </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {Array.isArray(plans) && plans.length > 0 ? (
                    plans.map((plan) => {
                        const isCurrentPlan = usage?.plan === plan.id;
                        const isMax = plan.id === 'premium';
                        const isPro = plan.id === 'pro';

                        const planName = t(`subscriptions:plans.${plan.id}.name`, { defaultValue: plan.name });
                        const planDesc = t(`subscriptions:plans.${plan.id}.description`, { defaultValue: plan.description });

                        return (
                            <div
                                key={plan.id}
                                className={clsx(
                                    "flex flex-col p-8 rounded-[4px] border-2 transition-all duration-500",
                                    isMax
                                        ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white shadow-2xl shadow-slate-900/10" :
                                        isPro
                                            ? "bg-orange-50/50 dark:bg-orange-500/5 border-orange-100/50 dark:border-orange-500/10 text-slate-900 dark:text-white" :
                                            "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                                )}
                            >
                                <div className="mb-10 space-y-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-[4px] flex items-center justify-center mb-6",
                                        isMax ? "bg-white/10" : "bg-slate-100 dark:bg-slate-800"
                                    )}>
                                        <Shield size={24} className={isMax ? "text-white" : (isPro ? "text-orange-500" : "text-primary")} />
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tight">{planName}</h3>
                                    <p className={clsx("text-sm font-medium leading-relaxed opacity-80", isMax ? "text-slate-300" : "text-slate-500")}>
                                        {planDesc}
                                    </p>
                                </div>

                                <div className="mb-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tighter">
                                            {billingCycle === 'yearly' ? (plan.pricing.yearly / 12).toFixed(2).replace(/\.00$/, '') : plan.pricing.monthly}
                                        </span>
                                        <span className={clsx("text-sm font-bold opacity-70", isMax ? "text-slate-400" : "text-slate-500 uppercase")}>
                                            {t('common:currencySymbol')}/{t('subscriptions:monthly')}
                                        </span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.pricing.monthly > 0 && (
                                        <p className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-60">{t('subscriptions:billedAnnually')}</p>
                                    )}
                                </div>

                                {plan.id === 'free' && !isCurrentPlan ? (
                                    <div className="w-full h-[60px] rounded-[4px] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 mb-12">
                                        {t('subscriptions:defaultPlan')}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={processingId === plan.id || processingId === 'cancel' || (isCurrentPlan && usage?.cancelAtPeriodEnd) || (isCurrentPlan && plan.id === 'free')}
                                        className={clsx(
                                            "w-full h-[60px] rounded-[4px] font-black uppercase tracking-[0.15em] text-xs transition-all duration-300 flex items-center justify-center gap-2 mb-12",
                                            isCurrentPlan && plan.id !== 'free' && usage?.cancelAtPeriodEnd ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700 cursor-default" :
                                                isCurrentPlan && plan.id !== 'free' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-xl shadow-red-500/5" :
                                                    isCurrentPlan && plan.id === 'free' ? "bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 cursor-default" :
                                                        isMax ? "bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5" :
                                                            isPro ? "bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20" :
                                                                "bg-primary text-white hover:bg-primary/90"
                                        )}
                                    >
                                        {processingId === plan.id || (isCurrentPlan && plan.id !== 'free' && processingId === 'cancel') ? (
                                            <LoadingSpinner size="sm" fullHeight={false} />
                                        ) : isCurrentPlan && plan.id !== 'free' && usage?.cancelAtPeriodEnd ? (
                                            <>
                                                <X size={16} /> {t('subscriptions:cancelledStatus')}
                                            </>
                                        ) : isCurrentPlan && plan.id !== 'free' ? (
                                            <>
                                                <X size={16} /> {t('subscriptions:cancelSubscription', { defaultValue: 'Cancel Subscription' })}
                                            </>
                                        ) : isCurrentPlan && plan.id === 'free' ? (
                                            <>
                                                <Check size={16} /> {t('subscriptions:currentPlan')}
                                            </>
                                        ) : (
                                            <>{t('subscriptions:getPlan', { name: planName })}</>
                                        )}
                                    </button>
                                )}

                                <div className="space-y-6 flex-1">
                                    <div className={clsx(
                                        "text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40",
                                        isMax ? "text-slate-400" : "text-slate-500"
                                    )}>
                                        {isPro ? t('subscriptions:everythingIn', { name: t('subscriptions:plans.free.name') }) : isMax ? t('subscriptions:everythingIn', { name: t('subscriptions:plans.pro.name') }) : t('subscriptions:includes')}
                                    </div>

                                    <ul className="space-y-4">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className={clsx(
                                                    "mt-1 p-0.5 rounded-full shrink-0",
                                                    isMax ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                )}>
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                <span className="text-[13px] font-bold leading-tight line-clamp-2">
                                                    {(() => {
                                                        if (feature.startsWith('limit:')) {
                                                            const [, resource, value] = feature.split(':');
                                                            const resourceLabel = t(`subscriptions:resource_names.${resource}`);

                                                            if (value === 'unlimited') {
                                                                return t('subscriptions:limit_unlimited', { resource: resourceLabel });
                                                            } else if (parseInt(value) === 1) {
                                                                return t('subscriptions:limit_1', { resource: resourceLabel });
                                                            } else {
                                                                return t('subscriptions:limit_up_to', { count: Number(value), resource: resourceLabel });
                                                            }
                                                        }
                                                        return t(`subscriptions:features.${feature}`, { defaultValue: feature });
                                                    })()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className={clsx(
                                        "pt-6 mt-8 border-t",
                                        isMax ? "border-white/10" : "border-slate-100 dark:border-slate-800"
                                    )}>
                                        <div className="grid grid-cols-2 gap-y-4">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('subscriptions:branches')}</div>
                                                <div className="text-sm font-black">{plan.limits.branches === -1 ? t('subscriptions:unlimited') : plan.limits.branches}</div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('subscriptions:products')}</div>
                                                <div className="text-sm font-black">{plan.limits.products === -1 ? t('subscriptions:unlimited') : plan.limits.products}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('subscriptions:orders')}</div>
                                                <div className="text-sm font-black">{plan.limits.orders_per_month === -1 ? t('subscriptions:unlimited') : plan.limits.orders_per_month}</div>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('subscriptions:drivers')}</div>
                                                <div className="text-sm font-black">{plan.limits.drivers === -1 ? t('subscriptions:unlimited') : plan.limits.drivers}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('subscriptions:categories')}</div>
                                                <div className="text-sm font-black">{plan.limits.categories === -1 ? t('subscriptions:unlimited') : plan.limits.categories}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20 px-8 bg-white dark:bg-slate-900 rounded-[4px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('subscriptions:noPlans')}</h3>
                        <p className="text-slate-500 font-medium">{t('subscriptions:noPlansDesc')}</p>
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            <Modal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                title={t('subscriptions:cancelConfirmationTitle')}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 rounded-[4px] leading-relaxed font-medium">
                        {t('subscriptions:cancelConfirmationDescription')}
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            onClick={() => setCancelModalOpen(false)}
                            className="px-5 py-2.5 rounded-[4px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {t('subscriptions:keepSubscription')}
                        </button>
                        <button
                            onClick={confirmCancel}
                            className="px-5 py-2.5 rounded-[4px] font-bold bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 transition-all"
                        >
                            {t('subscriptions:confirmCancel')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SubscriptionSettings;
