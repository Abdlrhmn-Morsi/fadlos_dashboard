import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Store,
    Image as ImageIcon,
    Save,
    Phone,
    Mail,
    Briefcase,
    Loader2,
    CheckCircle,
    XCircle,
    Camera,
    CreditCard,
    Truck,
    Plus,
    Trash2,
    Globe,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Youtube,
    Clock,
    Calendar,
    AlertTriangle,
    Languages,
    MessageSquare,
    Users,
    Layout,
    ChevronRight,
    AtSign
} from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMyStore, updateStore } from '../stores/api/stores.api';
import { getBusinessTypes } from '../business-types/api/business-types.api';
import { getBusinessCategories } from '../store-categories/api/business-categories.api';
import { toast } from '../../utils/toast';
import toolsApi from '../../services/tools.api';
import { useAuth } from '../../contexts/AuthContext';
import { Permissions } from '../../types/permissions';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';



const SOCIAL_PLATFORMS = [
    { name: 'Facebook', icon: <Facebook size={16} className="text-blue-600" /> },
    { name: 'Instagram', icon: <Instagram size={16} className="text-pink-600" /> },
    { name: 'Twitter', icon: <Twitter size={16} className="text-sky-500" /> },
    { name: 'LinkedIn', icon: <Linkedin size={16} className="text-blue-700" /> },
    { name: 'YouTube', icon: <Youtube size={16} className="text-red-600" /> },
    { name: 'TikTok', icon: <Globe size={16} className="text-black" /> },
    { name: 'Snapchat', icon: <Globe size={16} className="text-yellow-400" /> },
    { name: 'Website', icon: <Globe size={16} className="text-slate-500" /> }
];

const StoreSettings = () => {
    const { t, i18n } = useTranslation(['stores', 'common']);
    const { isRTL } = useLanguage();
    const currentLng = i18n.language;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeData, setStoreData] = useState<any>(null);
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const TABS = [
        { id: 'branding', label: t('branding'), icon: ImageIcon, desc: t('brandingDesc', 'Logo and banner') },
        { id: 'business', label: t('business'), icon: Briefcase, desc: t('businessDesc', 'Name, type and description') },
        { id: 'contact', label: t('contact'), icon: Phone, desc: t('contactDesc', 'Phones, email and social') },
        { id: 'availability', label: t('availability'), icon: Clock, desc: t('availabilityDesc', 'Hours and order rules') },
        { id: 'management', label: t('management'), icon: Users, desc: t('managementDesc', 'Hiring and reviews') },
    ] as const;
    const canViewStore = hasPermission(Permissions.STORE_VIEW);
    const canUpdateStore = hasPermission(Permissions.STORE_UPDATE);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'business' | 'contact' | 'availability' | 'management'>('branding');

    // Form states
    const [formData, setFormData] = useState({
        nameAr: '',
        name: '',
        descriptionAr: '',
        description: '',
        phone: '',
        email: '',
        businessTypeId: '',
        businessCategoryIds: [] as string[],
        whatsapp: '',
        socialMedia: [] as { platform: string; url: string }[],
        openingTime: '',
        closingTime: '',
        is24Hours: false,
        workingDays: [] as number[],
        acceptOrdersIfOffDay: false,
        acceptOrdersInClosedHours: false,
        isAcceptingOrders: true,
        enableStoreReviews: true,
        enableProductReviews: true,
        maxOrdersPerDriver: 5,
        isHiringDrivers: false
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [store, bTypes, allCategories] = await Promise.all([
                getMyStore(),
                getBusinessTypes(),
                getMyStore().then(store => store.businessType?.id ? getBusinessCategories(store.businessType.id) : [])
            ]);

            setStoreData(store);
            setBusinessTypes(bTypes);
            setAvailableCategories(allCategories);

            setFormData({
                nameAr: store.nameAr || '',
                name: store.name || '',
                descriptionAr: store.descriptionAr || '',
                description: store.description || '',
                phone: store.phone || '',
                email: store.email || '',
                businessTypeId: store.businessType?.id || '',
                businessCategoryIds: store.businessCategories?.map((c: any) => c.id) || [],
                whatsapp: store.whatsapp || '',
                socialMedia: Array.isArray(store.socialMedia)
                    ? store.socialMedia
                    : (store.socialMedia && typeof store.socialMedia === 'string')
                        ? JSON.parse(store.socialMedia)
                        : [],
                openingTime: store.openingTime || '',
                closingTime: store.closingTime || '',
                is24Hours: store.is24Hours || false,
                workingDays: store.workingDays || [],
                acceptOrdersIfOffDay: store.acceptOrdersIfOffDay || false,
                acceptOrdersInClosedHours: store.acceptOrdersInClosedHours || false,
                isAcceptingOrders: store.isAcceptingOrders === false ? false : true,
                enableStoreReviews: store.enableStoreReviews === false ? false : true,
                enableProductReviews: store.enableProductReviews === false ? false : true,
                maxOrdersPerDriver: store.maxOrdersPerDriver || 5,
                isHiringDrivers: store.isHiringDrivers || false
            });

            setLogoPreview(store.logo);
            setBannerPreview(store.banner);
        } catch (error) {
            console.error('Failed to fetch settings data:', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            if (formData.businessTypeId && !loading) {
                setLoadingCategories(true);
                try {
                    const cats = await getBusinessCategories(formData.businessTypeId);
                    setAvailableCategories(cats);
                } catch (error) {
                    console.error('Failed to fetch categories:', error);
                } finally {
                    setLoadingCategories(false);
                }
            } else if (!formData.businessTypeId && !loading) {
                setAvailableCategories([]);
            }
        };

        fetchCategories();
    }, [formData.businessTypeId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'businessTypeId') {
            const isOriginalType = storeData?.businessType?.id === value;
            setFormData(prev => ({
                ...prev,
                businessTypeId: value,
                businessCategoryIds: isOriginalType
                    ? (storeData?.businessCategories?.map((c: any) => c.id) || [])
                    : [] // Clear categories for new types
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };


    const handleCategoryChange = (id: string) => {
        setFormData(prev => {
            const current = [...prev.businessCategoryIds];
            const index = current.indexOf(id);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(id);
            }
            return { ...prev, businessCategoryIds: current };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'logo') setLogoPreview(reader.result as string);
                else setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addSocialMedia = (platform: string) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: [...prev.socialMedia, { platform, url: '' }]
        }));
    };

    const removeSocialMedia = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.filter((_, i) => i !== index)
        }));
    };

    const updateSocialMedia = (index: number, field: 'platform' | 'url', value: string) => {
        const newSocialMedia = [...formData.socialMedia];
        newSocialMedia[index] = { ...newSocialMedia[index], [field]: value };
        setFormData({ ...formData, socialMedia: newSocialMedia });
    };

    const toggleWorkingDay = (dayIndex: number) => {
        setFormData(prev => {
            const currentDays = [...prev.workingDays];
            const index = currentDays.indexOf(dayIndex);
            if (index > -1) {
                currentDays.splice(index, 1);
            } else {
                currentDays.push(dayIndex);
            }
            return { ...prev, workingDays: currentDays };
        });
    };

    const handleTranslate = async (value: string, field: 'name' | 'description') => {
        const targetField = field === 'name' ? 'name' : 'description';
        if (!value || formData[targetField]) return;
        try {
            let translated = '';
            if (field === 'name') {
                const res: any = await toolsApi.transliterate(value, 'ar');
                translated = typeof res === 'string' ? res : res.translatedText;
            } else {
                const res: any = await toolsApi.translate(value, 'ar', 'en');
                translated = typeof res === 'string' ? res : res.translatedText;
            }

            if (translated) {
                setFormData(prev => ({ ...prev, [targetField]: translated }));
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} ${field === 'name' ? 'Romanized' : 'translated to English'}`);
            }
        } catch (error) {
            console.error("Translation error", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('nameAr', formData.nameAr);
            data.append('name', formData.name);
            data.append('descriptionAr', formData.descriptionAr);
            data.append('description', formData.description);
            data.append('phone', formData.phone);
            data.append('email', formData.email);
            data.append('businessTypeId', formData.businessTypeId);


            if (formData.businessCategoryIds.length > 0) {
                formData.businessCategoryIds.forEach(id => data.append('businessCategoryIds', id));
            } else {
                data.append('businessCategoryIds', '[]');
            }

            if (formData.whatsapp) data.append('whatsapp', formData.whatsapp);
            if (formData.socialMedia.length > 0) {
                data.append('socialMedia', JSON.stringify(formData.socialMedia));
            } else {
                data.append('socialMedia', '[]');
            }


            // Operating Hours & Settings
            if (formData.openingTime) data.append('openingTime', formData.openingTime);
            if (formData.closingTime) data.append('closingTime', formData.closingTime);
            data.append('is24Hours', String(formData.is24Hours));
            data.append('acceptOrdersIfOffDay', String(formData.acceptOrdersIfOffDay));
            data.append('acceptOrdersInClosedHours', String(formData.acceptOrdersInClosedHours));
            data.append('isAcceptingOrders', String(formData.isAcceptingOrders));
            data.append('enableStoreReviews', String(formData.enableStoreReviews));
            data.append('enableProductReviews', String(formData.enableProductReviews));
            data.append('maxOrdersPerDriver', String(formData.maxOrdersPerDriver));
            data.append('isHiringDrivers', String(formData.isHiringDrivers));

            if (formData.workingDays.length > 0) {
                data.append('workingDays', JSON.stringify(formData.workingDays));
            } else {
                data.append('workingDays', '[]');
            }

            if (logoInputRef.current?.files?.[0]) {
                data.append('logo', logoInputRef.current.files[0]);
            }
            if (bannerInputRef.current?.files?.[0]) {
                data.append('banner', bannerInputRef.current.files[0]);
            }

            await updateStore(data);
            toast.success(t('common:success'));
            fetchData(); // Refresh data
        } catch (error: any) {
            console.error('Failed to update store:', error);
            const errorMessage = error.response?.data?.message || t('common:errorUpdatingData');
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!canViewStore) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-full text-rose-500">
                    <XCircle size={64} strokeWidth={1.5} />
                </div>
                <div className="text-center px-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{t('common:accessDenied')}</h2>
                    <p className="text-slate-500 font-medium mt-2">{t('common:noPermissionViewStore')}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded font-bold uppercase tracking-widest text-[10px]"
                >
                    {t('common:goBack')}
                </button>
            </div>
        );
    }

    const isReadOnly = !canUpdateStore;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-4 h-24 flex items-center shrink-0">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-gradient-to-br from-primary to-primary-focus rounded-xl shadow-lg shadow-primary/20 shrink-0">
                                <Store size={26} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                    {t('common:settings')}
                                </h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-2 opacity-70 italic">
                                    {t('updateStoreSettings')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {canUpdateStore && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 group"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:rotate-12 transition-transform" />}
                                    {t('common:save')}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col lg:flex-row w-full p-6 gap-8">
                    {/* Sidebar / Tabs */}
                    <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-36 self-start">
                        <div className="bg-white dark:bg-slate-900 lg:rounded-2xl border-y lg:border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 dark:shadow-none overflow-hidden">
                            <div className="hidden lg:block p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('menu', 'Navigation')}</h2>
                            </div>
                            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar p-2 lg:p-3 gap-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={clsx(
                                            "flex lg:items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all relative shrink-0",
                                            activeTab === tab.id
                                                ? "bg-primary/10 text-primary shadow-sm"
                                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <tab.icon size={20} className={clsx("shrink-0 transition-transform", activeTab === tab.id ? "scale-110" : "grayscale opacity-70")} />
                                        <div className="hidden lg:block text-start">
                                            <div className="text-sm leading-none">{tab.label}</div>
                                            <div className="text-[10px] font-medium opacity-50 mt-1 lines-1">{tab.desc}</div>
                                        </div>
                                        {activeTab === tab.id && (
                                            <div className="lg:hidden absolute bottom-0 inset-x-5 h-0.5 bg-primary rounded-t-full" />
                                        )}
                                        <ChevronRight size={14} className={clsx(
                                            "hidden lg:block absolute end-4 opacity-0 transition-all",
                                            isRTL && "rotate-180",
                                            activeTab === tab.id && "opacity-40 animate-in slide-in-from-start-2"
                                        )} />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 space-y-8 px-4 lg:px-0 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
                        {activeTab === 'branding' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Visual Identity Section */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <ImageIcon size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('visualIdentity')}</h3>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        {/* Banner */}
                                        <div className="relative group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ps-1">{t('banner')}</label>
                                            <div
                                                className={clsx(
                                                    "w-full h-64 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative shadow-inner",
                                                    !isReadOnly ? "cursor-pointer group" : "cursor-default"
                                                )}
                                                onClick={() => !isReadOnly && bannerInputRef.current?.click()}
                                            >
                                                {bannerPreview ? (
                                                    <img src={bannerPreview} alt={t('banner')} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                        <ImageIcon size={48} strokeWidth={1} />
                                                    </div>
                                                )}
                                                {!isReadOnly && (
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                            <div className="p-3 bg-white/20 rounded-full border border-white/30">
                                                                <Camera className="text-white" size={24} />
                                                            </div>
                                                            <span className="text-white font-black text-xs uppercase tracking-widest">{t('changeBanner')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                                            </div>
                                        </div>

                                        {/* Logo */}
                                        <div className="flex flex-col md:flex-row items-start gap-10">
                                            <div className="relative group/logo">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ps-1">{t('logo')}</label>
                                                <div
                                                    className={clsx(
                                                        "w-32 h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative",
                                                        !isReadOnly ? "cursor-pointer" : "cursor-default"
                                                    )}
                                                    onClick={() => !isReadOnly && logoInputRef.current?.click()}
                                                >
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt={t('logo')} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                                                            <Store size={32} />
                                                        </div>
                                                    )}
                                                    {!isReadOnly && (
                                                        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Camera className="text-white" size={20} />
                                                        </div>
                                                    )}
                                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-4 pt-10">
                                                <h4 className="font-black text-slate-800 dark:text-slate-200 text-lg">{t('brandAesthetics')}</h4>
                                                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                                                    {t('brandAestheticsDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'business' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Primary Information */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Store size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('primaryInformation')}</h3>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <Store size={14} /> {t('storeNameAr')}
                                            </label>
                                            <input
                                                type="text"
                                                name="nameAr"
                                                value={formData.nameAr}
                                                onChange={handleChange}
                                                onBlur={(e) => handleTranslate(e.target.value, 'name')}
                                                required
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <Store size={14} /> {t('storeNameEn')}
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Description & Details Section */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Languages size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('common:description')}</h3>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ps-1">
                                                {t('descriptionAr')}
                                            </label>
                                            <textarea
                                                name="descriptionAr"
                                                value={formData.descriptionAr}
                                                onChange={handleChange}
                                                onBlur={(e) => handleTranslate(e.target.value, 'description')}
                                                rows={3}
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 text-right resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ps-1">
                                                {t('descriptionEn')}
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Business Classification Section - Moved to Last */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Briefcase size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('common:businessTypes')} & {t('common:businessCategories')}</h3>
                                    </div>

                                    <div className="p-8 space-y-12">
                                        {/* Redesigned Business Types Selection */}
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Layout size={14} className="text-primary" /> {t('common:businessTypes')}
                                                </label>
                                                <p className="text-[10px] text-slate-500 font-medium">{t('selectType', 'Select your primary business model')}</p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {businessTypes.map(type => (
                                                    <div
                                                        key={type.id}
                                                        onClick={() => !isReadOnly && handleChange({ target: { name: 'businessTypeId', value: type.id } } as any)}
                                                        className={clsx(
                                                            "relative p-1 rounded-2xl transition-all duration-300 group cursor-pointer",
                                                            formData.businessTypeId === type.id
                                                                ? "bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 scale-[1.02]"
                                                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.01]",
                                                            isReadOnly && "pointer-events-none opacity-80"
                                                        )}
                                                    >
                                                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 h-full flex flex-col items-center text-center gap-4">
                                                            <div className={clsx(
                                                                "p-4 rounded-xl transition-all duration-500",
                                                                formData.businessTypeId === type.id
                                                                    ? "bg-primary text-white rotate-6"
                                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110"
                                                            )}>
                                                                <Briefcase size={32} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className={clsx(
                                                                    "font-black text-sm transition-colors",
                                                                    formData.businessTypeId === type.id ? "text-primary dark:text-white" : "text-slate-700 dark:text-slate-300"
                                                                )}>
                                                                    {localStorage.getItem('i18nextLng') === 'ar' ? type.ar_name : type.en_name}
                                                                </h4>
                                                            </div>
                                                            {formData.businessTypeId === type.id && (
                                                                <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full shadow-lg animate-in zoom-in-50">
                                                                    <CheckCircle size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Redesigned Business Categories Selection */}
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800/50 pt-8">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Plus size={14} className="text-secondary" /> {t('common:businessCategories')}
                                                </label>
                                                <p className="text-[10px] text-slate-500 font-medium">{t('selectCategoriesDesc')}</p>
                                            </div>

                                            {loadingCategories ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                    <div className="relative w-12 h-12">
                                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('common:loading')}</span>
                                                </div>
                                            ) : availableCategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-3 animate-fadeIn">
                                                    {availableCategories.map(category => (
                                                        <button
                                                            key={category.id}
                                                            type="button"
                                                            onClick={() => !isReadOnly && handleCategoryChange(category.id)}
                                                            className={clsx(
                                                                "group flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all duration-300 font-bold text-sm select-none",
                                                                formData.businessCategoryIds.includes(category.id)
                                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 -translate-y-0.5"
                                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-primary",
                                                                isReadOnly && "pointer-events-none opacity-80"
                                                            )}
                                                        >
                                                            <span>
                                                                {currentLng.startsWith('ar') ? category.nameAr || category.name : category.name}
                                                            </span>
                                                            <div className={clsx(
                                                                "transition-all duration-300",
                                                                formData.businessCategoryIds.includes(category.id)
                                                                    ? "bg-white/20 text-white rounded-full p-0.5"
                                                                    : "text-slate-300 group-hover:text-primary"
                                                            )}>
                                                                {formData.businessCategoryIds.includes(category.id) ? <CheckCircle size={14} /> : <Plus size={14} />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : formData.businessTypeId ? (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                    <XCircle size={32} className="text-slate-300 mb-2" />
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common:noResults')}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                    <Layout size={32} className="text-slate-300 mb-2" />
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('selectTypeFirst')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Contact & Support */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Phone size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('contactSupport')}</h3>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <Phone size={14} /> {t('common:phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <AtSign size={14} /> {t('common:email')}
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <Phone size={14} /> {t('whatsapp')}
                                            </label>
                                            <input
                                                type="tel"
                                                name="whatsapp"
                                                value={formData.whatsapp}
                                                onChange={handleChange}
                                                placeholder="+1234567890"
                                                disabled={isReadOnly}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Social Media Links */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm sm:rounded-t">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-primary/10 rounded-lg">
                                                <Globe size={24} className="text-primary" />
                                            </div>
                                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('socialMedia')}</h3>
                                        </div>

                                        {!isReadOnly && (
                                            <div className="relative group/social-add">
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    {t('addPlatform')}
                                                </button>
                                                <div className="absolute top-full end-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-2xl overflow-hidden opacity-0 invisible group-hover/social-add:opacity-100 group-hover/social-add:visible transition-all z-10">
                                                    {SOCIAL_PLATFORMS.map(platform => (
                                                        <button
                                                            key={platform.name}
                                                            type="button"
                                                            onClick={() => addSocialMedia(platform.name)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-600 dark:text-slate-300"
                                                        >
                                                            {platform.icon}
                                                            {platform.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 sm:rounded-b">
                                        {formData.socialMedia.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {formData.socialMedia.map((social, index) => {
                                                    const platformInfo = SOCIAL_PLATFORMS.find(p => p.name === social.platform);
                                                    return (
                                                        <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 group/social transition-all hover:border-primary/30">
                                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                                                                {platformInfo?.icon || <Globe size={18} className="text-slate-400" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="url"
                                                                    value={social.url}
                                                                    onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                                                                    disabled={isReadOnly}
                                                                    placeholder={`${social.platform} URL (https://...)`}
                                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                                />
                                                            </div>
                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSocialMedia(index)}
                                                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/social:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <Globe size={40} className="text-slate-200 mb-4" />
                                                <p className="text-sm font-bold text-slate-400 max-w-[240px] text-center mb-6">{t('noSocialMedia')}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'availability' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Operating Hours */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Clock size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('operatingHours')}</h3>
                                    </div>

                                    <div className="p-8 space-y-8">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="is24Hours"
                                                name="is24Hours"
                                                checked={formData.is24Hours}
                                                onChange={handleChange}
                                                disabled={isReadOnly}
                                                className="w-5 h-5 text-emerald-600 dark:text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                                            />
                                            <label htmlFor="is24Hours" className={clsx("text-sm font-bold text-slate-700 dark:text-slate-300 select-none", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                {t('open24Hours')}
                                            </label>
                                        </div>

                                        {!formData.is24Hours && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={14} /> {t('openingTime')}
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="openingTime"
                                                        value={formData.openingTime}
                                                        onChange={handleChange}
                                                        disabled={isReadOnly}
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock size={14} /> {t('closingTime')}
                                                    </label>
                                                    <input
                                                        type="time"
                                                        name="closingTime"
                                                        value={formData.closingTime}
                                                        onChange={handleChange}
                                                        disabled={isReadOnly}
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <hr className="border-slate-100 dark:border-slate-800" />

                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar size={14} /> {t('workingDays')}
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day, index) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => !isReadOnly && toggleWorkingDay(index)}
                                                        className={clsx(
                                                            "w-12 h-12 rounded-full font-bold text-sm transition-all flex items-center justify-center border",
                                                            formData.workingDays.includes(index)
                                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                                                                : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50",
                                                            isReadOnly && "cursor-default opacity-80"
                                                        )}
                                                    >
                                                        {t(`days.${day}`)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Order Acceptance Rules */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-primary/10 rounded-lg">
                                                <CheckCircle size={24} className="text-primary" />
                                            </div>
                                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('orderAcceptance')}</h3>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "text-[10px] font-bold uppercase tracking-tight",
                                                formData.isAcceptingOrders ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                            )}>
                                                {formData.isAcceptingOrders ? t('acceptingOrders') : t('notAcceptingOrders')}
                                            </span>
                                            <label className={clsx("relative inline-flex items-center", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                <input
                                                    type="checkbox"
                                                    name="isAcceptingOrders"
                                                    id="isAcceptingOrders"
                                                    className="sr-only peer"
                                                    checked={formData.isAcceptingOrders}
                                                    onChange={handleChange}
                                                    disabled={isReadOnly}
                                                />
                                                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 shadow-sm disabled:opacity-50"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        <div className="space-y-3 opacity-90">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="acceptOrdersIfOffDay"
                                                    name="acceptOrdersIfOffDay"
                                                    checked={formData.acceptOrdersIfOffDay}
                                                    onChange={handleChange}
                                                    disabled={isReadOnly}
                                                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500 border-slate-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                                                />
                                                <label htmlFor="acceptOrdersIfOffDay" className={clsx("text-sm font-bold text-slate-700 dark:text-slate-300 select-none", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                    {t('acceptOffDay')}
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="acceptOrdersInClosedHours"
                                                    name="acceptOrdersInClosedHours"
                                                    checked={formData.acceptOrdersInClosedHours}
                                                    onChange={handleChange}
                                                    disabled={isReadOnly}
                                                    className="w-5 h-5 text-emerald-600 dark:text-emerald-500 border-slate-300 rounded focus:ring-emerald-300 disabled:opacity-50"
                                                />
                                                <label htmlFor="acceptOrdersInClosedHours" className={clsx("text-sm font-bold text-slate-700 dark:text-slate-300 select-none", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                    {t('acceptClosedHours')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'management' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                {/* Reviews & Feedback */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <MessageSquare size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('reviewsAndFeedback')}</h3>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-colors">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('enableStoreReviews')}</h4>
                                                <p className="text-slate-500 text-xs">{t('enableStoreReviewsDesc')}</p>
                                            </div>
                                            <label className={clsx("relative inline-flex items-center", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                <input
                                                    type="checkbox"
                                                    name="enableStoreReviews"
                                                    className="sr-only peer"
                                                    checked={formData.enableStoreReviews}
                                                    onChange={handleChange}
                                                    disabled={isReadOnly}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 disabled:opacity-50"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-colors">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('enableProductReviews')}</h4>
                                                <p className="text-slate-500 text-xs">{t('enableProductReviewsDesc')}</p>
                                            </div>
                                            <label className={clsx("relative inline-flex items-center", !isReadOnly ? "cursor-pointer" : "cursor-default")}>
                                                <input
                                                    type="checkbox"
                                                    name="enableProductReviews"
                                                    className="sr-only peer"
                                                    checked={formData.enableProductReviews}
                                                    onChange={handleChange}
                                                    disabled={isReadOnly}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 disabled:opacity-50"></div>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                {/* Delivery Settings */}
                                <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                                    <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                                        <div className="p-2.5 bg-primary/10 rounded-lg">
                                            <Truck size={24} className="text-primary" />
                                        </div>
                                        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.15em] text-sm">{t('deliverySettings')}</h3>
                                    </div>

                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                                <Truck size={14} /> {t('maxOrdersPerDriver')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="maxOrdersPerDriver"
                                                    value={formData.maxOrdersPerDriver}
                                                    onChange={handleChange}
                                                    min={1}
                                                    max={50}
                                                    disabled={isReadOnly}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-6 h-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-between transition-all">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('isHiringDrivers')}</h4>
                                                    <p className="text-slate-500 text-[10px] italic leading-relaxed pr-8">
                                                        {t('isHiringDriversDesc')}
                                                    </p>
                                                </div>
                                                <label className={"relative inline-flex items-center cursor-pointer"}>
                                                    <input
                                                        type="checkbox"
                                                        name="isHiringDrivers"
                                                        className="sr-only peer"
                                                        checked={formData.isHiringDrivers}
                                                        onChange={handleChange}
                                                        disabled={isReadOnly}
                                                    />
                                                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:peer-checked:bg-primary shadow-sm disabled:opacity-50"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </main >
            </form >
        </div >
    );
};

export default StoreSettings;
