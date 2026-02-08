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

const StatCard = ({ title, value, icon: Icon, color, isRTL }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 rounded-[4px]">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{value}</h3>
            </div>
            <div className={clsx(
                "p-3 rounded-[4px]",
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                        color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                            'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
            )}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
        </div>
    </div>
);

const StoreDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['stores', 'common']);
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
        const baseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[4px]";
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
                        className="flex items-center gap-2 mx-auto text-primary font-black uppercase tracking-widest text-sm hover:underline"
                    >
                        <ChevronLeft size={18} /> {t('common:back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 space-y-10 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/stores')}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 rounded-[4px]"
                    >
                        <ChevronLeft size={24} className="rtl:rotate-180" />
                    </button>
                    <div className="flex items-center gap-4">
                        {store.logo ? (
                            <img src={store.logo} alt="" className="w-20 h-20 object-cover border-4 border-white dark:border-slate-800 shadow-xl rounded-[4px]" />
                        ) : (
                            <div className="w-20 h-20 bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-xl rounded-[4px]">
                                {store.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{store.name}</h1>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {getStatusBadge(store.status)}
                                <span className="bg-primary/10 text-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[4px]">
                                    {isRTL ? store.businessType?.ar_name : store.businessType?.en_name}
                                </span>
                                {store.isVerified && (
                                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 rounded-[4px]">
                                        <CheckCircle size={12} /> {t('common:verified')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Section */}
            {store.banner && (
                <div className="relative w-full h-48 md:h-64 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[4px]">
                    <img src={store.banner} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('revenue')}
                    value={`${Number(store.totalRevenue || 0).toLocaleString()} ${t('common:currencySymbol')}`}
                    icon={DollarSign}
                    color="emerald"
                    isRTL={isRTL}
                />
                <StatCard
                    title={t('orders')}
                    value={store.totalOrders || 0}
                    icon={ShoppingBag}
                    color="orange"
                    isRTL={isRTL}
                />
                <StatCard
                    title={t('products')}
                    value={store.products?.length || 0}
                    icon={Package}
                    color="blue"
                    isRTL={isRTL}
                />
                <StatCard
                    title={t('categories')}
                    value={store.categories?.length || 0}
                    icon={Layers}
                    color="indigo"
                    isRTL={isRTL}
                />
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* description section */}
                    <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6">
                            {t('description')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {isRTL ? store.descriptionAr || store.description : store.description || t('common:noDescription')}
                        </p>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('slug')}</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">/{store.slug}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('plan')}</span>
                                <span className="text-sm font-bold text-primary uppercase">{store.plan}</span>
                            </div>
                        </div>
                    </div>

                    {/* Operating Status & Schedule */}
                    <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                            {t('operationalStatus')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> {t('common:status')}
                                    </span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={clsx("text-xs font-black uppercase tracking-widest", store.isAcceptingOrders ? "text-emerald-600" : "text-rose-600")}>
                                            {store.isAcceptingOrders ? t('common:active') : t('common:inactive')}
                                        </span>
                                        {store.is24Hours && (
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 font-black uppercase rounded-[4px]">
                                                {t('open24Hours')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> {t('openingHours')}
                                    </span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                        {store.is24Hours ? "00:00 - 23:59" : `${store.openingTime || '00:00'} - ${store.closingTime || '00:00'}`}
                                    </span>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> {t('workingDays')}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                                            const isActive = store.workingDays?.includes(idx);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={clsx(
                                                        "w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-[4px] border transition-colors",
                                                        isActive
                                                            ? "bg-primary text-white border-primary shadow-sm"
                                                            : "bg-slate-50 text-slate-300 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600"
                                                    )}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-[4px] text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">{t('acceptOrdersIfOffDay')}</span>
                                        <span className={store.acceptOrdersIfOffDay ? "text-emerald-600" : "text-slate-400"}>{store.acceptOrdersIfOffDay ? t('common:yes') : t('common:no')}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-[4px] text-[10px] font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">{t('acceptOrdersInClosedHours')}</span>
                                        <span className={store.acceptOrdersInClosedHours ? "text-emerald-600" : "text-slate-400"}>{store.acceptOrdersInClosedHours ? t('common:yes') : t('common:no')}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('createdAt')}</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {new Date(store.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('lastOrder')}</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {store.lastOrderAt ? new Date(store.lastOrderAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('never')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar info */}
                <div className="space-y-8">
                    {/* Owner Info Container */}
                    <div className="bg-slate-900 text-white p-8 shadow-2xl relative overflow-hidden group rounded-[4px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -rotate-45 translate-x-16 -translate-y-16 group-hover:bg-primary/20 transition-all duration-700" />

                        <h3 className={clsx("text-lg font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4 relative z-10", isRTL && "text-end")}>
                            {t('legalOwner')}
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-[4px] shrink-0">
                                    <User size={18} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest line-clamp-1">{t('common:name')}</p>
                                    <p className="text-sm font-bold mt-1">{store.owner?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-[4px] shrink-0">
                                    <Mail size={18} strokeWidth={1.5} />
                                </div>
                                <div className={isRTL ? "text-end" : "text-start"}>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest line-clamp-1">{t('common:email')}</p>
                                    <p className="text-sm font-bold mt-1 break-all">{store.owner?.email || store.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/10 rounded-[4px] shrink-0">
                                    <Phone size={18} strokeWidth={1.5} />
                                </div>
                                <div className={isRTL ? "text-end" : "text-start"}>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest line-clamp-1">{t('common:phone')}</p>
                                    <p className="text-sm font-bold mt-1">{store.phone || t('notSet')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social & Contact Presence */}
                    <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                        <h3 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                            {t('socialMedia')}
                        </h3>

                        <div className="space-y-6">
                            {/* WhatsApp High Priority */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-[4px] shrink-0">
                                    <MessageSquare size={18} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('whatsapp')}</p>
                                    <p className="text-sm font-bold mt-1 text-start">{store.whatsapp || t('notSet')}</p>
                                </div>
                            </div>

                            {/* Other Socials */}
                            {store.socialMedia && store.socialMedia.length > 0 ? (
                                store.socialMedia.map((social: any, idx: number) => {
                                    const platform = SOCIAL_PLATFORMS[social.platform];
                                    if (!platform) return null; // Handle cases where platform might not be defined
                                    const Icon = platform.icon;
                                    return (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className={clsx("p-2 bg-slate-50 dark:bg-slate-800 rounded-[4px] shrink-0", platform.color)}>
                                                <Icon size={18} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{social.platform}</p>
                                                <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold mt-1 text-primary hover:underline break-all block">
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

                    {/* Deployment (Moved to Sidebar) */}
                    <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4 text-start">
                            <MapPin size={22} className="text-primary" />
                            {t('deployment')}
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('towns')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {store.towns && store.towns.length > 0 ? (
                                        store.towns.map((town: any) => (
                                            <span key={town.id} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-[4px]">
                                                {isRTL ? town.arName : town.enName}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">{t('notSet')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('places')}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {store.places && store.places.length > 0 ? (
                                        store.places.map((place: any) => (
                                            <span key={place.id} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-[4px]">
                                                {isRTL ? place.arName : place.enName}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">{t('notSet')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Categories (Moved to Sidebar) */}
                    {store.businessCategories && store.businessCategories.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                                {t('businessCategories')}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {store.businessCategories.map((cat: any) => (
                                    <span key={cat.id} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-[4px]">
                                        {isRTL ? cat.nameAr || cat.name : cat.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* System Settings (Moved to Sidebar) */}
                    <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[4px]">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4 text-start">
                            <Settings size={22} className="text-slate-400" />
                            {t('common:settings')}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-[4px]">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-[4px]", store.enableStoreReviews ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        <Star size={16} fill={store.enableStoreReviews ? "currentColor" : "none"} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('enableStoreReviews')}</span>
                                </div>
                                <span className={clsx("text-[10px] font-black uppercase tracking-widest", store.enableStoreReviews ? "text-emerald-600" : "text-slate-400")}>
                                    {store.enableStoreReviews ? t('common:active') : t('common:inactive')}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-[4px]">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("p-2 rounded-[4px]", store.enableProductReviews ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                        <ShoppingBag size={16} fill={store.enableProductReviews ? "currentColor" : "none"} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('enableProductReviews')}</span>
                                </div>
                                <span className={clsx("text-[10px] font-black uppercase tracking-widest", store.enableProductReviews ? "text-emerald-600" : "text-slate-400")}>
                                    {store.enableProductReviews ? t('common:active') : t('common:inactive')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status reasoning if available */}
                    {store.statusReason && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert size={20} className="text-amber-500" />
                                <h4 className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest text-start">
                                    {t('common:statusReason')}
                                </h4>
                            </div>
                            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                {store.statusReason}
                            </p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
};

export default StoreDetail;
