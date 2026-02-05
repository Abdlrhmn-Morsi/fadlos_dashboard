import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Store,
    Image as ImageIcon,
    Save,
    Phone,
    Mail,
    Briefcase,
    MapPin,
    Loader2,
    CheckCircle,
    XCircle,
    Camera,
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
    MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMyStore, updateStore } from '../stores/api/stores.api';
import { getBusinessTypes } from '../business-types/api/business-types.api';
import { getCities } from '../cities/api/cities.api';
import { getTowns } from '../towns/api/towns.api';
import { getBusinessCategories } from '../store-categories/api/business-categories.api';
import { toast } from '../../utils/toast';
import toolsApi from '../../services/tools.api';


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
    const [cities, setCities] = useState<any[]>([]);
    const [towns, setTowns] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        nameAr: '',
        name: '',
        descriptionAr: '',
        description: '',
        phone: '',
        email: '',
        businessTypeId: '',
        townIds: [] as string[],
        placeIds: [] as string[],
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
        enableProductReviews: true
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [store, bTypes, allCities, allTowns, allCategories] = await Promise.all([
                getMyStore(),
                getBusinessTypes(),
                getCities({ limit: 1000 }),
                getTowns({ limit: 1000 }),
                getMyStore().then(store => store.businessType?.id ? getBusinessCategories(store.businessType.id) : [])
            ]);

            setStoreData(store);
            setBusinessTypes(bTypes);
            setCities(allCities);
            setTowns(allTowns);
            setAvailableCategories(allCategories);

            setFormData({
                nameAr: store.nameAr || '',
                name: store.name || '',
                descriptionAr: store.descriptionAr || '',
                description: store.description || '',
                phone: store.phone || '',
                email: store.email || '',
                businessTypeId: store.businessType?.id || '',
                townIds: store.towns?.map((t: any) => t.id) || [],
                placeIds: store.places?.map((p: any) => p.id) || [],
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
                isAcceptingOrders: store.isAcceptingOrders !== undefined ? store.isAcceptingOrders : true,
                enableStoreReviews: store.enableStoreReviews !== undefined ? store.enableStoreReviews : true,
                enableProductReviews: store.enableProductReviews !== undefined ? store.enableProductReviews : true
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

    const handleLocationChange = (type: 'townIds' | 'placeIds', id: string) => {
        setFormData(prev => {
            const current = [...prev[type]];
            const index = current.indexOf(id);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(id);
            }
            return { ...prev, [type]: current };
        });
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

            if (formData.townIds.length > 0) {
                formData.townIds.forEach(id => data.append('townIds', id));
            } else {
                data.append('townIds', '[]');
            }

            if (formData.placeIds.length > 0) {
                formData.placeIds.forEach(id => data.append('placeIds', id));
            } else {
                data.append('placeIds', '[]');
            }

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
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 size={48} className="text-primary animate-spin" />
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common:loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir={isRTL ? 'rtl' : 'ltr'}>
            <form onSubmit={handleSubmit} className="relative">
                {/* Sticky Header */}
                <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3 sm:px-12 transition-all">
                    <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-gradient-to-br from-primary to-primary-focus rounded shadow-lg shadow-primary/20">
                                <Store size={26} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none flex items-center gap-2">
                                    {t('common:settings')}
                                    <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                </h1>
                                <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1.5 opacity-70 italic">{t('updateStoreSettings')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none group"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:rotate-12 transition-transform" />}
                                {t('common:save')}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-screen-2xl mx-auto p-0 sm:py-12 space-y-12 pb-24">
                    {/* Visual Identity Section */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <ImageIcon size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('visualIdentity')}</h3>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Banner */}
                            <div className="relative group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ps-1">{t('banner')}</label>
                                <div
                                    className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative cursor-pointer group shadow-inner"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    {bannerPreview ? (
                                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-slate-400">
                                            <ImageIcon size={48} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera size={32} className="text-white" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={bannerInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'banner')}
                                />
                            </div>

                            {/* Logo */}
                            <div className="relative -mt-24 inline-block group ms-8">
                                <div
                                    className="w-40 h-40 rounded bg-white dark:bg-slate-900 p-3 shadow-2xl border-4 border-white dark:border-slate-800 relative cursor-pointer group-hover:scale-105 transition-transform"
                                    onClick={() => logoInputRef.current?.click()}
                                >
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative flex items-center justify-center">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Store size={40} className="text-slate-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={logoInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'logo')}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Primary Information */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Store size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('primaryInformation')}</h3>
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
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
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
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>

                        </div>
                    </section>

                    {/* Business Classification Section */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Briefcase size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('common:businessTypes')} & {t('common:businessCategories')}</h3>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase size={14} /> {t('common:businessTypes')}
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {businessTypes.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleChange({ target: { name: 'businessTypeId', value: type.id } } as any)}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-6 border transition-all group relative overflow-hidden",
                                                formData.businessTypeId === type.id
                                                    ? "bg-primary/5 border-primary text-primary shadow-sm rounded"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 rounded"
                                            )}
                                        >
                                            <div className={clsx(
                                                "mb-3 p-4 rounded transition-all",
                                                formData.businessTypeId === type.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                            )}>
                                                <Briefcase size={24} />
                                            </div>
                                            <span className="font-bold text-sm">
                                                {localStorage.getItem('i18nextLng') === 'ar' ? type.ar_name : type.en_name}
                                            </span>
                                            {formData.businessTypeId === type.id && (
                                                <div className="mt-2 text-[10px] font-black uppercase tracking-tighter bg-primary text-white px-2 py-0.5">
                                                    {t('common:selected')}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Plus size={14} /> {t('common:businessCategories')}
                                </label>

                                {loadingCategories ? (
                                    <div className="flex items-center gap-2 text-slate-400 py-4">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm font-bold">{t('common:loading')}</span>
                                    </div>
                                ) : availableCategories.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
                                        {availableCategories.map(category => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => handleCategoryChange(category.id)}
                                                className={clsx(
                                                    "flex items-center justify-between p-5 border rounded transition-all font-bold text-sm",
                                                    formData.businessCategoryIds.includes(category.id)
                                                        ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                                                )}
                                            >
                                                <span className="truncate pr-2">
                                                    {currentLng.startsWith('ar') ? category.nameAr || category.name : category.name}
                                                </span>
                                                {formData.businessCategoryIds.includes(category.id) ? (
                                                    <div className="bg-primary text-white p-1 rounded-full"><CheckCircle size={14} /></div>
                                                ) : (
                                                    <div className="text-slate-300"><XCircle size={14} strokeWidth={1} /></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : formData.businessTypeId ? (
                                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        {t('common:noResults')}
                                    </div>
                                ) : (
                                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        {t('selectTypeFirst')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Description & Details Section */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Languages size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('common:description')}</h3>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                    {t('descriptionAr')}
                                </label>
                                <textarea
                                    name="descriptionAr"
                                    value={formData.descriptionAr}
                                    onChange={handleChange}
                                    onBlur={(e) => handleTranslate(e.target.value, 'description')}
                                    rows={3}
                                    className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 text-right resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                    {t('descriptionEn')}
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact & Support */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Phone size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('contactSupport')}</h3>
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
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ps-1">
                                    <Mail size={14} /> {t('common:email')}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
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
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Social Media Links */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Globe size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('socialMedia')}</h3>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={14} /> {t('platforms')}
                                </label>

                                <div className="relative group">
                                    <select
                                        className="appearance-none bg-primary/5 text-primary text-xs font-bold py-2 rounded cursor-pointer focus:outline-none hover:bg-primary/10 transition-colors ps-4 pe-8"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addSocialMedia(e.target.value);
                                                e.target.value = ''; // Reset
                                            }
                                        }}
                                    >
                                        <option value="">{t('addPlatform')}</option>
                                        {SOCIAL_PLATFORMS.map(p => (
                                            <option key={p.name} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                    <Plus size={14} className="absolute top-1/2 -translate-y-1/2 text-primary pointer-events-none end-2" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.socialMedia.map((item, index) => {
                                    const platformInfo = SOCIAL_PLATFORMS.find(p => p.name === item.platform) || { icon: <Globe size={16} /> };
                                    return (
                                        <div key={index} className="flex gap-4 items-center animate-fadeIn">
                                            <div className="w-32 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded font-bold text-sm text-slate-700 dark:text-slate-300">
                                                {platformInfo.icon}
                                                <span className="truncate">{item.platform}</span>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="url"
                                                    value={item.url}
                                                    onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                                                    placeholder={`https://${item.platform.toLowerCase()}.com/...`}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSocialMedia(index)}
                                                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded transition-colors"
                                                title={t('common:delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {formData.socialMedia.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-slate-200 dark:border-slate-800">
                                        {t('noSocialMedia')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <MapPin size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('serviceCoverage')}</h3>
                        </div>

                        <div className="p-8 space-y-8">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">{t('common:cities')}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {cities.map(city => (
                                        <button
                                            key={city.id}
                                            type="button"
                                            onClick={() => handleLocationChange('townIds', city.id)}
                                            className={clsx(
                                                "flex items-center justify-between p-5 border rounded transition-all font-bold text-sm",
                                                formData.townIds.includes(city.id)
                                                    ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                                            )}
                                        >
                                            {currentLng.startsWith('ar') ? city.arName : city.enName}
                                            {formData.townIds.includes(city.id) ? (
                                                <div className="bg-primary text-white p-1 rounded-full"><CheckCircle size={14} /></div>
                                            ) : (
                                                <div className="text-slate-300"><XCircle size={14} strokeWidth={1} /></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">{t('common:towns')}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {towns.filter(t => formData.townIds.includes(t.town?.id)).map(town => (
                                        <button
                                            key={town.id}
                                            type="button"
                                            onClick={() => handleLocationChange('placeIds', town.id)}
                                            className={clsx(
                                                "flex items-center justify-between p-5 border rounded transition-all font-bold text-sm",
                                                formData.placeIds.includes(town.id)
                                                    ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                                            )}
                                        >
                                            {currentLng.startsWith('ar') ? town.arName : town.enName}
                                            {formData.placeIds.includes(town.id) ? (
                                                <div className="bg-primary text-white p-1 rounded-full"><CheckCircle size={14} /></div>
                                            ) : (
                                                <div className="text-slate-300"><XCircle size={14} strokeWidth={1} /></div>
                                            )}
                                        </button>
                                    ))}
                                    {formData.townIds.length === 0 && (
                                        <div className="col-span-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 font-medium">
                                            {t('selectCitiesFirst')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Reviews & Feedback Section */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <MessageSquare size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('reviewsAndFeedback')}</h3>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('enableStoreReviews')}</h4>
                                    <p className="text-slate-500 text-xs">{t('enableStoreReviewsDesc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enableStoreReviews"
                                        className="sr-only peer"
                                        checked={formData.enableStoreReviews}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('enableProductReviews')}</h4>
                                    <p className="text-slate-500 text-xs">{t('enableProductReviewsDesc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="enableProductReviews"
                                        className="sr-only peer"
                                        checked={formData.enableProductReviews}
                                        onChange={handleChange}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Operating Hours & Settings */}
                    <section className="bg-white dark:bg-slate-900 border-y sm:border border-slate-200/60 dark:border-slate-800/60 sm:rounded shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="px-10 py-7 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-800/20 backdrop-blur-sm">
                            <div className="p-2 bg-primary/10 rounded">
                                <Clock size={20} className="text-primary" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] text-[10px]">{t('operatingHours')}</h3>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* 24 Hours Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is24Hours"
                                    name="is24Hours"
                                    checked={formData.is24Hours}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                                <label htmlFor="is24Hours" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    {t('open24Hours')}
                                </label>
                            </div>

                            {/* Opening/Closing Time */}
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
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
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
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                </div>
                            )}

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* Working Days */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} /> {t('workingDays')}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day, index) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleWorkingDay(index)}
                                            className={clsx(
                                                "w-12 h-12 rounded-full font-bold text-sm transition-all flex items-center justify-center border",
                                                formData.workingDays.includes(index)
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                                                    : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                            )}
                                        >
                                            {t(`days.${day}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* Order Acceptance Rules */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                                        {t('orderAcceptance')}
                                    </label>
                                    <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full">
                                        <label htmlFor="isAcceptingOrders" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                            {t('acceptingOrders')}
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isAcceptingOrders"
                                                id="isAcceptingOrders"
                                                className="sr-only peer"
                                                checked={formData.isAcceptingOrders}
                                                onChange={handleChange}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3 opacity-90">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="acceptOrdersIfOffDay"
                                            name="acceptOrdersIfOffDay"
                                            checked={formData.acceptOrdersIfOffDay}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
                                        />
                                        <label htmlFor="acceptOrdersIfOffDay" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
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
                                            className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
                                        />
                                        <label htmlFor="acceptOrdersInClosedHours" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                            {t('acceptClosedHours')}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {!formData.isAcceptingOrders && (
                                <div className="mx-8 mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900 rounded flex items-start gap-3">
                                    <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="font-bold text-rose-700 dark:text-rose-300 text-sm">{t('notAcceptingOrders')}</h4>
                                        <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">
                                            {t('notAcceptingOrdersMsg')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                </div>
            </form>
        </div>
    );
};


export default StoreSettings;
