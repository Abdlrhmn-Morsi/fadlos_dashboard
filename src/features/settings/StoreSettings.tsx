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
    Truck
} from 'lucide-react';
import clsx from 'clsx';
import { getMyStore, updateStore } from '../stores/api/stores.api';
import { getBusinessTypes } from '../business-types/api/business-types.api';
import { getCities } from '../cities/api/cities.api';
import { getTowns } from '../towns/api/towns.api';
import { toast } from '../../utils/toast';


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
        placeIds: [] as string[]
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
                placeIds: store.places?.map((p: any) => p.id) || []
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
