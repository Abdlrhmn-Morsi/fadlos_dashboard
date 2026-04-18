import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Store,
    ChevronLeft,
    DollarSign,
    ShoppingBag,
    Package,
    Layers,
    MapPin,
    User,
    Mail,
    Phone,
    Clock,
    CheckCircle,
    XCircle,
    ShieldAlert,
    ExternalLink,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Youtube,
    Globe,
    MessageSquare,
    Calendar,
    Settings,
    Star
} from 'lucide-react';
import { getStoreById } from './api/stores.api';
import AdminBillingTransactions from '../analytics/pages/AdminBillingTransactions';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import clsx from 'clsx';
import { toast } from '../../utils/toast';

const SOCIAL_PLATFORMS: Record<string, any> = {
    Facebook: { icon: Facebook, color: 'text-blue-600' },
    Instagram: { icon: Instagram, color: 'text-pink-600' },
    Twitter: { icon: Twitter, color: 'text-sky-500' },
    LinkedIn: { icon: Linkedin, color: 'text-blue-700' },
    YouTube: { icon: Youtube, color: 'text-red-600' },
    TikTok: { icon: Globe, color: 'text-black' },
    Snapchat: { icon: Globe, color: 'text-yellow-400' },
    Website: { icon: Globe, color: 'text-slate-500' }
};

const StatCard = ({ title, value, icon: Icon, color, isRTL, onClick }: any) => (
    <div 
        className={clsx(
            "bg-white dark:bg-slate-900 p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all rounded-2xl",
            onClick && "cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98] group"
        )}
        onClick={onClick}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-[0.625rem] font-extrabold uppercase tracking-widest mb-2 opacity-70 group-hover:text-primary transition-colors">{title}</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{value}</h3>
            </div>
            <div className={clsx(
                "p-3 rounded-xl transition-transform group-hover:scale-110",
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                        color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                            color === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                                'bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400'
            )}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
        </div>
    </div>
);

const StoreDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['stores', 'common', 'subscriptions']);
    const { isRTL } = useLanguage();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStoreDetail = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await getStoreById(id);
                setStore(data);
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch store details:", err);
                setError(t('common:failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        fetchStoreDetail();
    }, [id, t]);

    const getStatusBadge = (status: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-extrabold uppercase tracking-widest rounded-[4px]";
        const s = status?.toUpperCase();
        switch (s) {
            case 'ACTIVE':
                return <span className={`${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`}><CheckCircle size={12} /> {t('common:active')}</span>;
            case 'INACTIVE':
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><XCircle size={12} /> {t('common:inactive')}</span>;
            case 'PENDING':
                return <span className={`${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`}><Clock size={12} /> {t('common:pending')}</span>;
            case 'SUSPENDED':
                return <span className={`${baseClass} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400`}><ShieldAlert size={12} /> {t('common:suspended')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>{status}</span>;
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error || !store) {
        return (
            <div className="p-10 text-center">
                <div className="bg-rose-50 text-rose-600 p-6 border border-rose-100 font-bold inline-block">
                    {error || t('common:noDataAvailable')}
                </div>
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/stores')}
                        className="flex items-center gap-2 mx-auto text-primary font-extrabold uppercase tracking-widest text-sm hover:underline"
                    >
                        <ChevronLeft size={18} /> {t('common:back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            {/* Unified Hero Header */}
            <div className="relative mb-16 lg:mb-20">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/stores')}
                    className={clsx(
                        "absolute top-4 z-10 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition shadow-sm",
                        isRTL ? "right-4" : "left-4"
                    )}
                >
                    <ChevronLeft size={20} className="rtl:rotate-180" />
                </button>

                {/* Banner */}
                <div className="w-full h-48 md:h-64 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200/60 dark:border-slate-800/60 shadow-sm relative">
                    {store.banner ? (
                        <img src={store.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Overlapping Logo */}
                <div className={clsx("absolute -bottom-10", isRTL ? "right-6 md:right-10" : "left-6 md:left-10")}>
                    {store.logo ? (
                        <img src={store.logo} alt="Logo" className="w-24 h-24 md:w-32 md:h-32 object-cover border-4 border-white dark:border-slate-900 shadow-xl rounded-2xl bg-white dark:bg-slate-800" />
                    ) : (
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white text-4xl font-extrabold border-4 border-white dark:border-slate-900 shadow-xl rounded-2xl">
                            {store.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Badges / Header Info */}
                <div className={clsx("absolute -bottom-12 md:-bottom-8 flex flex-col md:flex-row md:items-center gap-3", isRTL ? "right-36 md:right-48" : "left-36 md:left-48")}>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate max-w-xs md:max-w-md">{store.name}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(store.status)}
                        <span className="bg-primary/10 text-primary px-3 py-1.5 text-[0.625rem] font-extrabold uppercase tracking-widest rounded-lg border border-primary/20 shadow-sm">
                            {isRTL ? store.businessType?.ar_name : store.businessType?.en_name}
                        </span>
                        {store.isVerified && (
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 text-[0.625rem] font-extrabold uppercase tracking-widest flex items-center gap-1 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                                <CheckCircle size={12} /> {t('common:verified')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 pt-4">
                <StatCard title={t('revenue')} value={`${Number(store.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`} icon={DollarSign} color="emerald" isRTL={isRTL} />
                <StatCard title={t('orders')} value={store.totalOrders || 0} icon={ShoppingBag} color="orange" isRTL={isRTL} />
                <StatCard title={t('products')} value={store.products?.length || 0} icon={Package} color="blue" isRTL={isRTL} onClick={() => navigate(`/products?storeId=${store.id}`)} />
                <StatCard title={t('categories')} value={store.categories?.length || 0} icon={Layers} color="indigo" isRTL={isRTL} onClick={() => navigate(`/categories?storeId=${store.id}`)} />
                <StatCard title={t('common:addons', { defaultValue: 'Add-ons' })} value={store.addons?.length || 0} icon={Package} color="rose" isRTL={isRTL} onClick={() => navigate(`/addons?storeId=${store.id}`)} />
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Sidebar info */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Owner Info Container */}
                    <div className="bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden group rounded-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-primary/20 transition-all duration-700" />
                        <h3 className="text-lg font-extrabold uppercase tracking-widest mb-6 border-b border-white/10 pb-4 relative z-10 text-start">
                            {t('legalOwner')}
                        </h3>
                        <div className="space-y-5 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-lg shrink-0"><User size={18} strokeWidth={1.5} /></div>
                                <div><p className="text-[0.625rem] font-extrabold text-white/40 uppercase tracking-widest line-clamp-1 text-start">{t('common:name')}</p><p className="text-sm font-bold mt-1 text-start">{store.owner?.name}</p></div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-lg shrink-0"><Mail size={18} strokeWidth={1.5} /></div>
                                <div><p className="text-[0.625rem] font-extrabold text-white/40 uppercase tracking-widest line-clamp-1 text-start">{t('common:email')}</p><p className="text-sm font-bold mt-1 break-all text-start">{store.owner?.email || store.email}</p></div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-lg shrink-0"><Phone size={18} strokeWidth={1.5} /></div>
                                <div><p className="text-[0.625rem] font-extrabold text-white/40 uppercase tracking-widest line-clamp-1 text-start">{t('common:phone')}</p><p className="text-sm font-bold mt-1 text-start">{store.phone || t('notSet')}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Social & Contact Presence */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                        <h3 className="text-base font-extrabold uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-start">
                            {t('socialMedia')}
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg shrink-0">
                                    <MessageSquare size={18} strokeWidth={1.5} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest text-start">{t('whatsapp')}</p>
                                    <p className="text-sm font-bold mt-1 text-start truncate" dir="ltr">{store.whatsapp || t('notSet')}</p>
                                </div>
                            </div>
                            {store.socialMedia && store.socialMedia.length > 0 ? (
                                store.socialMedia.map((social: any, idx: number) => {
                                    const platform = SOCIAL_PLATFORMS[social.platform];
                                    if (!platform) return null;
                                    const Icon = platform.icon;
                                    return (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className={clsx("p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0", platform.color)}><Icon size={18} strokeWidth={1.5} /></div>
                                            <div className="overflow-hidden">
                                                <p className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest text-start">{social.platform}</p>
                                                <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold mt-1 text-primary hover:underline truncate block text-start">
                                                    {social.url}
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">{t('common:noResults')}</p>
                            )}
                        </div>
                    </div>

                    {/* Deployment */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                        <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4 text-start">
                            <MapPin size={20} className="text-primary" /> {t('deployment')}
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[0.625rem] font-extrabold text-start uppercase text-slate-400 tracking-widest">{t('common:towns')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {store.towns && store.towns.length > 0 ? store.towns.map((town: any) => (
                                        <span key={town.id} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 rounded-md">
                                            {isRTL ? town.arName : town.enName}
                                        </span>
                                    )) : <span className="text-xs text-slate-400 italic">{t('notSet')}</span>}
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <h4 className="text-[0.625rem] font-extrabold text-start uppercase text-slate-400 tracking-widest">{t('common:places')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {store.places && store.places.length > 0 ? store.places.map((place: any) => (
                                        <span key={place.id} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[0.625rem] font-bold text-slate-600 dark:text-slate-400 rounded-md">
                                            {isRTL ? place.arName : place.enName}
                                        </span>
                                    )) : <span className="text-xs text-slate-400 italic">{t('notSet')}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Business Categories */}
                    {store.businessCategories && store.businessCategories.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                            <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4 text-start">
                                {t('businessCategories')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {store.businessCategories.map((cat: any) => (
                                    <span key={cat.id} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[0.625rem] font-extrabold uppercase tracking-widest rounded-lg">
                                        {isRTL ? cat.nameAr || cat.name : cat.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Essential Info */}
                <div className="space-y-6 lg:col-span-2">
                    {/* description section */}
                    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                        <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-4 text-start">
                            {t('description')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-start">
                            {isRTL ? store.descriptionAr || store.description : store.description || t('common:noDescription')}
                        </p>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-1 text-start">
                                <span className="text-[0.625rem] font-extrabold uppercase text-slate-400 tracking-widest">{t('slug')}</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300" dir="ltr">/{store.slug}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-start">
                                <span className="text-[0.625rem] font-extrabold text-start uppercase text-slate-400 tracking-widest">{t('common:plan', { defaultValue: 'Plan' })}</span>
                                <span className="text-sm font-bold text-primary uppercase">
                                    {t(`subscriptions:plans.${store.plan?.toLowerCase()}.name`, { defaultValue: store.plan })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operating Status & Schedule */}
                    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                        <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800 text-start">
                            {t('operationalStatus')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> {t('common:status')}</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={clsx("text-xs font-extrabold uppercase tracking-widest", store.isAcceptingOrders ? "text-emerald-600" : "text-rose-600")}>
                                            {store.isAcceptingOrders ? t('common:active') : t('common:inactive')}
                                        </span>
                                        {store.is24Hours && <span className="text-[0.625rem] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 font-extrabold uppercase rounded-md">{t('open24Hours')}</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> {t('openingHours')}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                        {store.is24Hours ? "00:00 - 23:59" : `${store.openingTime || '00:00'} - ${store.closingTime || '00:00'}`}
                                    </span>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> {t('workingDays')}</span>
                                    <div className="flex flex-wrap justify-between gap-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                            const isActive = store.workingDays?.includes(idx);
                                            return (
                                                <div key={idx} className={clsx(
                                                    "w-8 h-8 flex items-center justify-center text-[0.625rem] font-extrabold rounded-lg border transition-colors",
                                                    isActive ? "bg-primary text-white border-primary shadow-sm" : "bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600"
                                                )}>
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between items-center p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl text-[0.625rem] font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">{t('acceptOrdersIfOffDay')}</span>
                                        <span className={store.acceptOrdersIfOffDay ? "text-emerald-600" : "text-slate-400"}>{store.acceptOrdersIfOffDay ? t('common:yes') : t('common:no')}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl text-[0.625rem] font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">{t('acceptOrdersInClosedHours')}</span>
                                        <span className={store.acceptOrdersInClosedHours ? "text-emerald-600" : "text-slate-400"}>{store.acceptOrdersInClosedHours ? t('common:yes') : t('common:no')}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest">{t('createdAt')}</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-end">
                                            {new Date(store.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest">{t('lastOrder')}</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-end">
                                            {store.lastOrderAt ? new Date(store.lastOrderAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('never')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Settings */}
                    <div className="bg-white dark:bg-slate-900 p-6 lg:p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl">
                        <h3 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4 text-start">
                            <Settings size={20} className="text-slate-400" /> {t('common:settings')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-lg", store.enableStoreReviews ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        <Star size={16} fill={store.enableStoreReviews ? "currentColor" : "none"} />
                                    </div>
                                    <span className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('enableStoreReviews')}</span>
                                </div>
                                <span className={clsx("text-[0.625rem] font-extrabold uppercase tracking-widest", store.enableStoreReviews ? "text-emerald-600" : "text-slate-400")}>
                                    {store.enableStoreReviews ? t('common:active') : t('common:inactive')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-lg", store.enableProductReviews ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        <ShoppingBag size={16} fill={store.enableProductReviews ? "currentColor" : "none"} />
                                    </div>
                                    <span className="text-[0.625rem] font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('enableProductReviews')}</span>
                                </div>
                                <span className={clsx("text-[0.625rem] font-extrabold uppercase tracking-widest", store.enableProductReviews ? "text-emerald-600" : "text-slate-400")}>
                                    {store.enableProductReviews ? t('common:active') : t('common:inactive')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status reasoning */}
                    {store.statusReason && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/30 p-6 lg:p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert size={20} className="text-amber-500" />
                                <h4 className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-widest text-start">
                                    {t('common:statusReason')}
                                </h4>
                            </div>
                            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed text-start">
                                {store.statusReason}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Billing Transactions Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 py-6 shadow-sm rounded-2xl overflow-hidden mt-6">
                <h3 className="px-6 md:px-8 pb-6 text-lg font-extrabold uppercase tracking-tight text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/50 text-start">
                    {t('dashboard:billingTransactions')}
                </h3>
                <div className="pt-2 px-2 md:px-4">
                    <AdminBillingTransactions storeId={store.id} compact={true} />
                </div>
            </div>

        </div>
    );
}

export default StoreDetail;
