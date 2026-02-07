import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Package, Upload, X, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';
import addonsApi from '../api/addons.api';
import toolsApi from '../../../services/tools.api';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Permissions } from '../../../types/permissions';
import { CreateAddonDto, Addon } from '../models/addon.model';

const AddonForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['addons', 'common']);
    const { isRTL } = useLanguage();
    const { invalidateCache } = useCache();
    const { hasPermission } = useAuth();

    // Permission checks
    const canCreate = hasPermission(Permissions.ADDONS_CREATE);
    const canUpdate = hasPermission(Permissions.ADDONS_UPDATE);
    const canView = hasPermission(Permissions.ADDONS_VIEW);

    const isReadOnly = id ? !canUpdate : !canCreate;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [formData, setFormData] = useState<CreateAddonDto>({
        name: '',
        nameAr: '',
        price: 0,
        inventory: 0,
        trackInventory: false,
        isActive: true,
        image: '',
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (!canView && !(id ? canUpdate : canCreate)) {
            toast.error(t('common:noPermission'));
            navigate('/addons');
            return;
        }

        if (id) {
            fetchAddon();
        }
    }, [id]);

    const fetchAddon = async () => {
        try {
            setFetching(true);
            const res: any = await addonsApi.getAddon(id!);
            const addon = res;
            setFormData({
                name: addon.name,
                nameAr: addon.nameAr || '',
                price: addon.price,
                inventory: addon.inventory,
                trackInventory: addon.trackInventory,
                isActive: addon.isActive,
                image: addon.image || '',
            });
            if (addon.image) {
                setImagePreview(addon.image);
            }
        } catch (error) {
            console.error('Failed to fetch addon', error);
            toast.error(t('loadFailed'));
            navigate('/addons');
        } finally {
            setFetching(false);
        }
    };

    const handleTranslate = async (value: string) => {
        if (!value) return;
        try {
            const res: any = await toolsApi.translate(value, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;

            if (translated && !formData.name) {
                setFormData(prev => ({ ...prev, name: translated }));
                toast.success(t('common:autoTranslated'));
            }
        } catch (error) {
            console.error("Translation error", error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error(t('validation.nameRequired'));
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();
            submitData.append('name', formData.name);
            if (formData.nameAr) submitData.append('nameAr', formData.nameAr);
            submitData.append('price', String(formData.price));
            submitData.append('inventory', String(formData.inventory));
            submitData.append('trackInventory', String(formData.trackInventory));
            submitData.append('isActive', String(formData.isActive));

            if (imageFile) {
                submitData.append('image', imageFile);
            } else if (formData.image) {
                submitData.append('image', formData.image);
            }

            if (id) {
                await addonsApi.updateAddon(id, submitData as any);
            } else {
                await addonsApi.createAddon(submitData as any);
            }
            toast.success(t('saveSuccess'));
            invalidateCache('addons');
            navigate('/addons');
        } catch (error) {
            console.error('Failed to save addon', error);
            toast.error(t('saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/addons')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                    <ArrowLeft className={isRTL ? "rotate-180" : ""} size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {id ? (isReadOnly ? t('viewAddon', { defaultValue: 'View Addon' }) : t('editAddon')) : t('addAddon')}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name AR */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('addonNameAr')} <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-xs text-slate-400">
                                    {formData.nameAr.length}/100
                                </span>
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                disabled={isReadOnly}
                                className={clsx(
                                    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all border",
                                    "text-right",
                                    isReadOnly && "opacity-70 cursor-not-allowed"
                                )}
                                placeholder={t('nameArPlaceholder')}
                                value={formData.nameAr}
                                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                onBlur={() => !isReadOnly && handleTranslate(formData.nameAr || '')}
                            />
                        </div>

                        {/* Name EN */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('addonName')} <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-xs text-slate-400">
                                    {formData.name.length}/100
                                </span>
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                disabled={isReadOnly}
                                className={clsx(
                                    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all border",
                                    isRTL && "text-right",
                                    isReadOnly && "opacity-70 cursor-not-allowed"
                                )}
                                placeholder={t('namePlaceholder')}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('price')} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    disabled={isReadOnly}
                                    className={clsx(
                                        "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all border",
                                        isRTL ? "pr-12" : "pl-12",
                                        isReadOnly && "opacity-70 cursor-not-allowed"
                                    )}
                                    placeholder={t('pricePlaceholder')}
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                                <span className={clsx(
                                    "absolute top-1/2 -translate-y-1/2 text-slate-400 font-medium",
                                    isRTL ? "right-4" : "left-4"
                                )}>
                                    {t('common:currencySymbol')}
                                </span>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('inventory')}
                            </label>
                            <input
                                type="number"
                                disabled={isReadOnly || !formData.trackInventory}
                                className={clsx(
                                    "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all border",
                                    isRTL && "text-right",
                                    (isReadOnly || !formData.trackInventory) && "opacity-50 cursor-not-allowed"
                                )}
                                placeholder={t('inventoryPlaceholder')}
                                value={formData.inventory}
                                onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Toggles Group */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">

                            <label className={clsx("flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors", !isReadOnly ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50" : "cursor-not-allowed")}>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('trackInventory')}</span>
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled={isReadOnly}
                                        checked={formData.trackInventory}
                                        onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                                    />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500"></div>
                                </div>
                            </label>

                            <label className={clsx("flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors", !isReadOnly ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50" : "cursor-not-allowed")}>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('isActive')}</span>
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled={isReadOnly}
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500"></div>
                                </div>
                            </label>
                        </div>

                        {/* Image */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('image')}
                            </label>
                            <div className="flex flex-wrap gap-4 items-start">
                                {imagePreview ? (
                                    <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        {!isReadOnly && (
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <label className={clsx("w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl transition-all group", !isReadOnly ? "cursor-pointer hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800" : "cursor-not-allowed opacity-50")}>
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2" />
                                        <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-500">Upload</span>
                                        {!isReadOnly && <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />}
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 font-bold"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>{id ? t('common:updateChanges') : t('common:save')}</span>
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddonForm;
