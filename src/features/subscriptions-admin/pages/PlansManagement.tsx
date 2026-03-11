import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CreditCard,
    Save,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    ChevronRight,
    Shield,
    Zap
} from 'lucide-react';
import { getAdminPlans, updateAdminPlan, getPlanMetadata, Plan, PlanMetadata } from '../api/plans.api';
import { toast } from '../../../utils/toast';
import clsx from 'clsx';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

const PlansManagement: React.FC = () => {
    const { t, i18n } = useTranslation(['subscriptions', 'common']);
    const isRtl = i18n.dir() === 'rtl';
    const [plans, setPlans] = useState<Plan[]>([]);
    const [metadata, setMetadata] = useState<PlanMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; plan: Plan | null }>({
        isOpen: false,
        plan: null
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [plansData, metadataData] = await Promise.all([
                    getAdminPlans(),
                    getPlanMetadata()
                ]);
                if (Array.isArray(plansData)) setPlans(plansData);
                setMetadata(metadataData);
            } catch (error) {
                console.error('Error loading initial data:', error);
                setError(t('admin.loadError'));
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const fetchPlans = async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        try {
            setError(null);
            const data = await getAdminPlans();
            if (Array.isArray(data)) {
                setPlans(data);
                if (isManual) {
                    toast.success(t('admin.refreshSuccess'));
                }
            } else {
                console.error('Data is not an array:', data);
                setPlans([]);
                setError(t('admin.connectError'));
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            setError(t('admin.loadError'));
            toast.error(t('admin.loadError'));
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleUpdatePlan = async (id: string, updateData: Partial<Plan>) => {
        setSavingPlanId(id);
        try {
            const updated = await updateAdminPlan(id, updateData);
            setPlans(plans.map(p => p.id === id ? updated : p));
            toast.success(t('admin.updateSuccess'));
        } catch (error) {
            console.error('Error updating plan:', error);
            toast.error(t('admin.updateError'));
        } finally {
            setSavingPlanId(null);
        }
    };

    const toggleFeature = (planId: string, feature: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const newFeatures = plan.features.includes(feature)
            ? plan.features.filter(f => f !== feature)
            : [...plan.features, feature];

        setPlans(plans.map(p => p.id === planId ? { ...p, features: newFeatures } : p));
    };

    const handleLimitChange = (planId: string, limitKey: string, value: string) => {
        const numValue = parseInt(value);
        setPlans(plans.map(p => {
            if (p.id === planId) {
                return {
                    ...p,
                    limits: {
                        ...p.limits,
                        [limitKey]: isNaN(numValue) ? 0 : Math.max(-1, numValue)
                    }
                };
            }
            return p;
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {t('admin.title').split(' ')[0]} <span className="text-primary italic">{t('admin.title').split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('admin.description')}</p>
                </div>
                <button
                    onClick={() => fetchPlans(true)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    {isRefreshing ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Plus size={20} className="rotate-45" />
                    )}
                    {t('admin.refreshPlans')}
                </button>
            </div>

            {error && (
                <div className="p-12 bg-rose-50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-[2.5rem] flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">{error}</h3>
                    <p className="text-slate-500 font-medium mb-6">{t('admin.connectError')}</p>
                    <button
                        onClick={() => fetchPlans(true)}
                        disabled={isRefreshing}
                        className="px-8 py-3 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-600/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isRefreshing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : t('admin.tryAgain')}
                    </button>
                </div>
            )}

            {!error && Array.isArray(plans) && plans.length === 0 && (
                <div className="p-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-slate-300 mb-6">
                        <CreditCard size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">{t('admin.noBundles')}</h3>
                    <p className="text-slate-500 font-medium max-w-sm">
                        {t('admin.noBundlesDesc')}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
                {Array.isArray(plans) && plans.map((plan) => {
                    const isPremium = plan.name === 'premium';
                    const isPro = plan.name === 'pro';

                    return (
                        <div
                            key={plan.id}
                            className={clsx(
                                "rounded-3xl border-2 transition-all duration-500 flex flex-col overflow-hidden h-full",
                                isPremium
                                    ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white shadow-2xl shadow-slate-900/10 z-10"
                                    : isPro
                                        ? "bg-orange-50/50 dark:bg-orange-500/5 border-orange-100/50 dark:border-orange-500/10 text-slate-900 dark:text-slate-100 shadow-xl shadow-orange-500/5"
                                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl shadow-slate-200/50 dark:shadow-none"
                            )}
                        >
                            {/* Plan Header */}
                            <div className={clsx(
                                "p-8 border-b",
                                isPremium ? "border-white/10 bg-white/5" : isPro ? "border-orange-100/50 dark:border-orange-500/10 bg-orange-100/10 dark:bg-orange-500/5" : "border-slate-100 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-800/10"
                            )}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={clsx(
                                        "p-3 rounded-2xl",
                                        isPremium ? "bg-white/10 text-white" : isPro ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                                    )}>
                                        <Shield size={24} />
                                    </div>
                                    <span className={clsx(
                                        "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                                        isPremium ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                                    )}>
                                        {t(`plans.${plan.name}.name`)}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="group relative">
                                        <label className={clsx(
                                            "text-[10px] font-black uppercase tracking-widest mb-1 block",
                                            isPremium ? "text-slate-400" : "text-slate-400"
                                        )}>{t('admin.monthlyPrice')}</label>
                                        <div className="relative">
                                            <span className={clsx("absolute start-4 top-1/2 -translate-y-1/2 font-bold", isPremium ? "text-slate-500" : "text-slate-400")}>{t('common:currencySymbol')}</span>
                                            <input
                                                type="number"
                                                value={plan.priceMonthly}
                                                onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? { ...p, priceMonthly: parseFloat(e.target.value) } : p))}
                                                className={clsx(
                                                    "w-full border-2 rounded-2xl py-3 ps-10 pe-4 font-black transition-all outline-none",
                                                    isPremium ? "bg-slate-800/50 border-slate-700 text-white focus:border-white" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="group relative">
                                        <label className={clsx(
                                            "text-[10px] font-black uppercase tracking-widest mb-1 block",
                                            isPremium ? "text-slate-400" : "text-slate-400"
                                        )}>{t('admin.yearlyPrice')}</label>
                                        <div className="relative">
                                            <span className={clsx("absolute start-4 top-1/2 -translate-y-1/2 font-bold", isPremium ? "text-slate-500" : "text-slate-400")}>{t('common:currencySymbol')}</span>
                                            <input
                                                type="number"
                                                value={plan.priceYearly}
                                                onChange={(e) => setPlans(plans.map(p => p.id === plan.id ? { ...p, priceYearly: parseFloat(e.target.value) } : p))}
                                                className={clsx(
                                                    "w-full border-2 rounded-2xl py-3 ps-10 pe-4 font-black transition-all outline-none",
                                                    isPremium ? "bg-slate-800/50 border-slate-700 text-white focus:border-white" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-primary"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features Section */}
                            <div className="p-8 flex-1 space-y-6">
                                <div>
                                    <h3 className={clsx(
                                        "text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2",
                                        isPremium ? "text-slate-400" : "text-slate-400"
                                    )}>
                                        <Zap size={14} className={isPremium ? "text-amber-400" : "text-amber-500"} />
                                        {t('admin.unlockedFeatures')}
                                    </h3>
                                    <div className="space-y-3">
                                        {metadata?.features.map((key) => (
                                            <label
                                                key={key}
                                                className={clsx(
                                                    "flex items-center gap-3 p-3 rounded-2xl transition-colors group cursor-pointer",
                                                    isPremium ? "hover:bg-white/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={plan.features.includes(key)}
                                                    onChange={() => toggleFeature(plan.id, key)}
                                                    className={clsx(
                                                        "w-5 h-5 rounded-lg border-2 cursor-pointer",
                                                        isPremium ? "bg-slate-700 border-slate-600 text-white focus:ring-white/20" : "border-slate-200 dark:border-slate-700 text-primary focus:ring-primary/20"
                                                    )}
                                                />
                                                <span className={clsx(
                                                    "text-sm font-bold capitalize",
                                                    isPremium ? "text-slate-200" : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    {t(`admin.featureKeys.${key}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className={clsx(
                                    "pt-6 border-t",
                                    isPremium ? "border-white/10" : "border-slate-100 dark:border-slate-800"
                                )}>
                                    <h3 className={clsx(
                                        "text-xs font-black uppercase tracking-[0.2em] mb-4",
                                        isPremium ? "text-slate-400" : "text-slate-400"
                                    )}>{t('admin.resourceLimits')}</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {metadata?.limits.map((key) => (
                                            <div key={key} className="flex items-center justify-between gap-4">
                                                <span className={clsx(
                                                    "text-sm font-bold capitalize",
                                                    isPremium ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                                                )}>
                                                    {t(`admin.limitKeys.${key}`)}
                                                </span>
                                                <div className="flex items-center gap-2 w-24 justify-end">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="number"
                                                            min="-1"
                                                            value={plan.limits[key]}
                                                            onChange={(e) => handleLimitChange(plan.id, key, e.target.value)}
                                                            className={clsx(
                                                                "w-16 border-none rounded-xl py-2 px-2 text-center font-black transition-all outline-none",
                                                                isPremium ? "bg-slate-800 text-white focus:ring-2 focus:ring-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                                                            )}
                                                        />
                                                        {plan.limits[key] === -1 && (
                                                            <span className={clsx(
                                                                "absolute text-lg font-black",
                                                                isRtl ? "-right-6" : "-left-6",
                                                                isPremium ? "text-white" : "text-primary"
                                                            )}>
                                                                ∞
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-slate-500 font-medium italic mt-2">{t('admin.unlimitedHint')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-8 pt-0 mt-auto">
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, plan })}
                                    disabled={savingPlanId === plan.id}
                                    className={clsx(
                                        "w-full flex items-center justify-center gap-2 font-black py-4 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50",
                                        isPremium
                                            ? "bg-white text-slate-900 hover:bg-slate-100 shadow-white/5"
                                            : isPro
                                                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
                                                : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                    )}
                                >
                                    {savingPlanId === plan.id ? (
                                        <div className={clsx("w-5 h-5 border-2 border-t-transparent rounded-full animate-spin", isPremium ? "border-slate-900" : "border-white")}></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            {t('admin.updateBundle')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={t('admin.updateConfirmationTitle')}
                message={t('admin.updateConfirmationDescription', { name: t(`plans.${confirmModal.plan?.name}.name`) })}
                confirmLabel={t('admin.confirmUpdate')}
                cancelLabel={t('admin.cancelUpdate')}
                onConfirm={() => {
                    if (confirmModal.plan) {
                        handleUpdatePlan(confirmModal.plan.id, {
                            priceMonthly: confirmModal.plan.priceMonthly,
                            priceYearly: confirmModal.plan.priceYearly,
                            features: confirmModal.plan.features,
                            limits: confirmModal.plan.limits
                        });
                    }
                    setConfirmModal({ isOpen: false, plan: null });
                }}
                onCancel={() => setConfirmModal({ isOpen: false, plan: null })}
                isLoading={savingPlanId === confirmModal.plan?.id}
            />
        </div>
    );
};

export default PlansManagement;
