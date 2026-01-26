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
    AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { getMyStore, updateStore } from '../stores/api/stores.api';
import { getBusinessTypes } from '../business-types/api/business-types.api';
import { getCities } from '../cities/api/cities.api';
import { getTowns } from '../towns/api/towns.api';
import { toast } from '../../utils/toast';


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
    const { t } = useTranslation(['stores', 'common']);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeData, setStoreData] = useState<any>(null);
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [towns, setTowns] = useState<any[]>([]);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone: '',
        email: '',
        businessTypeId: '',
        townIds: [] as string[],
        placeIds: [] as string[],
        whatsapp: '',
        socialMedia: [] as { platform: string; url: string }[],
        openingTime: '',
        closingTime: '',
        is24Hours: false,
        workingDays: [] as number[],
        acceptOrdersIfOffDay: false,
        acceptOrdersInClosedHours: false,
        isAcceptingOrders: true
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [store, bTypes, allCities, allTowns] = await Promise.all([
                getMyStore(),
                getBusinessTypes(),
                getCities({ limit: 1000 }),
                getTowns({ limit: 1000 })
            ]);

            setStoreData(store);
            setBusinessTypes(bTypes);
            setCities(allCities);
            setTowns(allTowns);

            setFormData({
                name: store.name || '',
                description: store.description || '',
                phone: store.phone || '',
                email: store.email || '',
                businessTypeId: store.businessType?.id || '',
                townIds: store.towns?.map((t: any) => t.id) || [],
                placeIds: store.places?.map((p: any) => p.id) || [],
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
                isAcceptingOrders: store.isAcceptingOrders !== undefined ? store.isAcceptingOrders : true
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
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
        } catch (error) {
            console.error('Failed to update store:', error);
            toast.error(t('common:errorUpdatingData'));
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
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-primary-light rounded-none animate-float">
                    <Store size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('common:settings')}</h2>
                    <p className="text-slate-500 font-medium">{t('updateStoreSettings', { defaultValue: 'Manage your store operational details' })}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Visual Identity Section */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <ImageIcon size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('visualIdentity', { defaultValue: 'Visual Identity' })}</h3>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Banner */}
                        <div className="relative group">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t('banner', { defaultValue: 'Store Banner' })}</label>
                            <div
                                className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden relative cursor-pointer group"
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
                        <div className="relative -mt-20 ml-8 inline-block group">
                            <div
                                className="w-32 h-32 rounded-none bg-white dark:bg-slate-900 p-2 shadow-xl border-4 border-white dark:border-slate-700 relative cursor-pointer"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden relative flex items-center justify-center">
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
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Store size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('primaryInformation', { defaultValue: 'Primary Information' })}</h3>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Store size={14} /> {t('storeName', { defaultValue: 'Store Name' })}
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase size={14} /> {t('common:businessTypes')}
                            </label>
                            <select
                                name="businessTypeId"
                                value={formData.businessTypeId}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 appearance-none"
                            >
                                <option value="">Select Type</option>
                                {businessTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {localStorage.getItem('i18nextLng') === 'ar' ? type.ar_name : type.en_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                {t('common:description', { defaultValue: 'Description' })}
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100 resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Contact & Support */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Phone size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('contactSupport', { defaultValue: 'Contact & Support' })}</h3>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} /> {t('common:phone', { defaultValue: 'Public Phone' })}
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={14} /> {t('common:email', { defaultValue: 'Public Email' })}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone size={14} /> WhatsApp
                            </label>
                            <input
                                type="tel"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                                placeholder="+1234567890"
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                </section>

                {/* Social Media Links */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Globe size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">Social Media</h3>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Globe size={14} /> Platforms
                            </label>

                            <div className="relative group">
                                <select
                                    className="appearance-none bg-primary/5 text-primary text-xs font-bold px-4 py-2 pr-8 rounded-none cursor-pointer focus:outline-none hover:bg-primary/10 transition-colors"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addSocialMedia(e.target.value);
                                            e.target.value = ''; // Reset
                                        }
                                    }}
                                >
                                    <option value="">+ Add Platform</option>
                                    {SOCIAL_PLATFORMS.map(p => (
                                        <option key={p.name} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                                <Plus size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {formData.socialMedia.map((item, index) => {
                                const platformInfo = SOCIAL_PLATFORMS.find(p => p.name === item.platform) || { icon: <Globe size={16} /> };
                                return (
                                    <div key={index} className="flex gap-4 items-center animate-fadeIn">
                                        <div className="w-32 flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300">
                                            {platformInfo.icon}
                                            <span className="truncate">{item.platform}</span>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="url"
                                                value={item.url}
                                                onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                                                placeholder={`https://${item.platform.toLowerCase()}.com/...`}
                                                className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSocialMedia(index)}
                                            className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-none transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}

                            {formData.socialMedia.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-800/30 rounded-none border border-dashed border-slate-200 dark:border-slate-800">
                                    No social media links added. Select a platform to add one.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Service Coverage Area */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <MapPin size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">{t('serviceCoverage', { defaultValue: 'Service Coverage' })}</h3>
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
                                            "flex items-center justify-between p-4 border rounded-none transition-all font-bold text-sm",
                                            formData.townIds.includes(city.id)
                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                                        )}
                                    >
                                        {localStorage.getItem('i18nextLng') === 'ar' ? city.arName : city.enName}
                                        {formData.townIds.includes(city.id) ? <CheckCircle size={14} /> : <XCircle size={14} className="opacity-20" />}
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
                                            "flex items-center justify-between p-4 border rounded-none transition-all font-bold text-sm",
                                            formData.placeIds.includes(town.id)
                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50"
                                        )}
                                    >
                                        {localStorage.getItem('i18nextLng') === 'ar' ? town.arName : town.enName}
                                        {formData.placeIds.includes(town.id) ? <CheckCircle size={14} /> : <XCircle size={14} className="opacity-20" />}
                                    </button>
                                ))}
                                {formData.townIds.length === 0 && (
                                    <div className="col-span-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 font-medium">
                                        {t('selectCitiesFirst', { defaultValue: 'Select cities first to see available towns' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Operating Hours & Settings */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Clock size={20} className="text-primary" />
                        <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-sm">Operating Hours & Settings</h3>
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
                                Open 24 Hours
                            </label>
                        </div>

                        {/* Opening/Closing Time */}
                        {!formData.is24Hours && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Opening Time
                                    </label>
                                    <input
                                        type="time"
                                        name="openingTime"
                                        value={formData.openingTime}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Closing Time
                                    </label>
                                    <input
                                        type="time"
                                        name="closingTime"
                                        value={formData.closingTime}
                                        onChange={handleChange}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                            </div>
                        )}

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Working Days */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Working Days
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
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
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Order Acceptance Rules */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                                    Order Acceptance Rules
                                </label>
                                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full">
                                    <label htmlFor="isAcceptingOrders" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                        Accepting Orders
                                    </label>
                                    <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            name="isAcceptingOrders"
                                            id="isAcceptingOrders"
                                            checked={formData.isAcceptingOrders}
                                            onChange={handleChange}
                                            className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 top-1 checked:translate-x-5 checked:border-primary transition-transform duration-200"
                                        />
                                        <label htmlFor="isAcceptingOrders" className={clsx("toggle-label block overflow-hidden h-6 rounded-full cursor-pointer border-2", formData.isAcceptingOrders ? "bg-primary border-primary" : "bg-slate-300 border-slate-300")}></label>
                                    </div>
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
                                        Accept orders even on off days
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
                                        Accept orders even during closed hours
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!formData.isAcceptingOrders && (
                        <div className="mx-8 mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900 rounded-none flex items-start gap-3">
                            <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-rose-700 dark:text-rose-300 text-sm">Not Accepting Orders</h4>
                                <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">
                                    Your store is currently set to not accept any orders. Customers will successfully browse your menu but cannot add items to cart or place orders.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Submit Action */}
                <div className="flex justify-end pt-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-3 px-12 py-5 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-none shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {t('common:save')}
                    </button>
                </div>
            </form>
        </div>
    );
};


export default StoreSettings;
