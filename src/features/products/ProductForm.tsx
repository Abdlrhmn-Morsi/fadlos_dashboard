import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Upload, Save, Image as ImageIcon,
    Box, DollarSign, Layers, Globe, RefreshCcw,
    Loader2, Trash2, Plus, X, Search, CheckCircle2, Package
} from 'lucide-react';
import productsApi from './api/products.api';
import categoriesApi from '../categories/api/categories.api';
import toolsApi from '../../services/tools.api';
import addonsApi from '../addons/api/addons.api';
import CategoryFormModal from '../categories/components/CategoryFormModal';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import clsx from 'clsx';

const InputGroup = ({ label, children, required = false, subtitle = '' }: any) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-rose-500 ms-1">*</span>}
        </label>
        {children}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
);

interface VariantValue {
    id?: string;
    value: string;
    valueAr: string;
    hex?: string;
    price: string;
    sortOrder: string;
    inventory: string;
    trackInventory: boolean;
}

interface Variant {
    id?: string;
    name: string;
    nameAr: string;
    isColor: boolean;
    isRequired: boolean;
    sortOrder: string;
    values: VariantValue[];
}

const generateSKU = (name: string) => {
    if (!name) return '';
    const prefix = name
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, 'X');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
};

const ProductForm = () => {
    const { t } = useTranslation(['products', 'common']);
    const { isRTL } = useLanguage();
    const { invalidateCache } = useCache();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        price: '',
        comparePrice: '',
        categoryId: '',
        sku: '',
        inventory: '0',
        trackInventory: true,
        isAvailable: true,
        isActive: true,
        isOffer: false,
        sortOrder: '0',
        variants: [] as Variant[],
        relatedProductIds: [] as string[],
        addonIds: [] as string[],
        addonsRequired: false
    });

    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [relatedSearchTerm, setRelatedSearchTerm] = useState('');

    const [allAddons, setAllAddons] = useState<any[]>([]);
    const [searchingAddons, setSearchingAddons] = useState(false);
    const [addonSearchTerm, setAddonSearchTerm] = useState('');

    // Media State
    const [currCoverImage, setCurrCoverImage] = useState<string | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    // Gallery State
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);

    useEffect(() => {
        fetchCategories();
        fetchAllProductsForSelection();
        fetchAllAddonsForSelection();
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchAllAddonsForSelection = async () => {
        try {
            setSearchingAddons(true);
            const res: any = await addonsApi.getAddons({ limit: 100, isActive: true });
            setAllAddons(res.data || []);
        } catch (error) {
            console.error('Error fetching addons for selection', error);
        } finally {
            setSearchingAddons(false);
        }
    };

    const fetchAllProductsForSelection = async () => {
        try {
            setSearchingProducts(true);
            const res: any = await productsApi.getSellerProducts({ limit: 100 });
            // Filter out current product from selection if editing
            const list = (res.data || []).filter((p: any) => p.id !== id);
            setAllProducts(list);
        } catch (error) {
            console.error('Error fetching products for selection', error);
        } finally {
            setSearchingProducts(false);
        }
    };

    const fetchCategories = async (selectNewId?: string) => {
        try {
            const res: any = await categoriesApi.getSellerCategories();
            const categoryList = res.data || [];
            setCategories(categoryList);

            if (selectNewId) {
                setFormData(prev => ({ ...prev, categoryId: selectNewId }));
            }
        } catch (error) {
            console.error('Error fetching categories', error);
            toast.error(t('loadFailed'));
        }
    };

    const fetchProduct = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data: any = await productsApi.getProduct(id);
            setFormData({
                name: data.name || '',
                nameAr: data.nameAr || '',
                description: data.description || '',
                descriptionAr: data.descriptionAr || '',
                price: data.price ? String(data.price) : '',
                comparePrice: data.comparePrice ? String(data.comparePrice) : '',
                categoryId: data.categoryId || '',
                sku: data.sku || '',
                inventory: data.inventory ? String(data.inventory) : '0',
                trackInventory: String(data.trackInventory) === 'true',
                isAvailable: data.isAvailable ?? true,
                isActive: data.isActive ?? true,
                isOffer: data.isOffer ?? false,
                sortOrder: data.sort || '0',
                variants: data.variants ? data.variants.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    nameAr: v.nameAr || '',
                    isColor: !!v.isColor,
                    isRequired: !!v.isRequired,
                    sortOrder: String(v.sortOrder || 0),
                    values: v.values ? v.values.map((val: any) => ({
                        id: val.id,
                        value: val.value,
                        valueAr: val.valueAr || '',
                        hex: val.hex || '',
                        price: String(val.price || 0),
                        sortOrder: String(val.sortOrder || 0),
                        inventory: String(val.inventory || 0),
                        trackInventory: !!val.trackInventory
                    })) : []
                })) : [],
                relatedProductIds: data.relatedProducts ? data.relatedProducts.map((p: any) => p.id) : [],
                addonIds: data.addons ? data.addons.map((a: any) => a.id) : [],
                addonsRequired: !!data.addonsRequired
            });
            setCurrCoverImage(data.coverImage);
            setExistingImages(data.images || []);
        } catch (error) {
            console.error('Error fetching product', error);
            toast.error(t('loadFailed'));
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async (field: 'name' | 'description', value: string) => {
        if (!value) return;
        try {
            const res: any = await toolsApi.translate(value, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;

            if (translated && !formData[field]) {
                setFormData(prev => {
                    const newData = { ...prev, [field]: translated };
                    if (field === 'name' && !prev.sku) {
                        newData.sku = generateSKU(translated);
                    }
                    return newData;
                });
                toast.success(t('autoTranslated'));
            }
        } catch (error) {
            console.error("Translation error", error);
        }
    };

    const handleVariantTranslate = async (text: string, callback: (translated: string) => void) => {
        if (!text) return;
        try {
            const res: any = await toolsApi.translate(text, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;
            if (translated) {
                callback(translated);
            }
        } catch (error) {
            console.error("Variant translation error", error);
        }
    };

    const handleImageDelete = (url: string) => {
        setExistingImages(prev => prev.filter(img => img !== url));
        setImagesToDelete(prev => [...prev, url]);
    };

    const handleNewImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    // Variants Logic
    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { name: '', nameAr: '', isColor: false, isRequired: false, sortOrder: '0', values: [] }]
        }));
    };

    const removeVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const updateVariant = (index: number, field: keyof Variant, value: any) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value } as Variant;
        setFormData({ ...formData, variants: newVariants });
    };

    const addVariantValue = (variantIndex: number) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex].values.push({
            value: '',
            valueAr: '',
            hex: '#000000',
            price: '0',
            sortOrder: '0',
            inventory: '0',
            trackInventory: false
        });
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariantValue = (variantIndex: number, valueIndex: number) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex].values = newVariants[variantIndex].values.filter((_, i) => i !== valueIndex);
        setFormData({ ...formData, variants: newVariants });
    };

    const updateVariantValue = (variantIndex: number, valueIndex: number, field: keyof VariantValue, value: any) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex].values[valueIndex] = { ...newVariants[variantIndex].values[valueIndex], [field]: value } as VariantValue;
        setFormData({ ...formData, variants: newVariants });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate comparePrice before submission
        if (formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price || '0')) {
            toast.error(t('comparePriceError'));
            return;
        }

        // Validate variants
        for (const variant of formData.variants) {
            if (!variant.values || variant.values.length === 0) {
                toast.error(isRTL ? 'يجب إضافة قيمة واحدة على الأقل لكل خيار' : 'Each option must have at least one value');
                return;
            }
        }

        setSubmitting(true);
        try {
            const data = new FormData();

            // Append basic fields
            console.log('Final FormData state before appending:', formData);
            Object.keys(formData).forEach(key => {
                if (key === 'variants' || key === 'relatedProductIds' || key === 'addonIds') return; // Handle manually
                const value = (formData as any)[key];
                if (value !== null && value !== undefined && value !== '') {
                    // Start Debug
                    if (['trackInventory', 'isActive', 'isAvailable', 'isOffer'].includes(key)) {
                        console.log(`Appending ${key}:`, value, `(Type: ${typeof value})`);
                    }
                    // End Debug
                    data.append(key, value);
                }
            });

            // Reconstruct variants properly for submission
            // Since backend expects JSON or specific structure, but we are using FormData (multipart) for images.
            // Usually complex objects in FormData need to be stringified or indexed.
            // Backend `CreateProductDto` has `variants` as array of objects. 
            // TypeORM/NestJS with Interceptor might handle indexed fields, but JSON stringify is safer for nested objects in FormData.
            // However, looking at previous code, seems we use standard FormData. 
            // NestJS FileInterceptor often needs manual parsing for nested JSON fields if sending multipart.
            // BUT, `CreateProductDto` expects `variants` as an array.
            // Let's assume we need to send it as a JSON string and parse it on backend, OR use index notation.
            // For now, let's remove `variants` from direct append and verify how backend handles it.
            // Actually, if I look at `UpdateProductDto`, it's PartialType. 
            // IF backend logic assumes `body` is processed by ValidationPipe, it works fine for JSON body.
            // But we are sending `FormData`.
            // Best practice with complex DTOs + Files: stringify specific fields or use a library.
            // I will try ensuring we don't send `variants` because I need to check how backend handles multipart + complex array.
            // Most valid approach: Send `variants` as a JSON string key, and have Backend Parse it, OR send indexed keys `variants[0][name]`.
            // Let's try sending standard indexed keys first or simply...
            // Wait, standard `FormData` does NOT support nested arrays natively.
            // I will filter `variants` from generic loop and try to structure it.
            // Actually, for NestJS with `FileInterceptor`, the body comes as string values.
            // I simply cannot send nested objects cleanly in FormData easily without stringifying.
            // **Correction**: I will use a simple hack: `data.append('variants', JSON.stringify(formData.variants));`
            // But checking Backend `CreateProductDto`... `@Type(() => CreateVariantForProductDto)`.
            // ClassTransformer DOES NOT automatically parse JSON strings from FormData.
            // It expects an object.
            // If I send JSON string, I need a custom internal transform.
            // For now, I will skip complex FormData logic and assume I might need to adjust backend 
            // OR I just stringify it and let's hope I can fix backend to parse it if needed.
            // BUT: If I reuse `productsApi`, it uses `axios`. `axios` handles FormData.

            // Let's try appending indices.
            formData.variants.forEach((variant, vIdx) => {
                data.append(`variants[${vIdx}][name]`, variant.name);
                data.append(`variants[${vIdx}][nameAr]`, variant.nameAr);
                data.append(`variants[${vIdx}][isColor]`, String(variant.isColor));
                data.append(`variants[${vIdx}][isRequired]`, String(variant.isRequired));
                data.append(`variants[${vIdx}][sortOrder]`, variant.sortOrder);
                if (variant.id) data.append(`variants[${vIdx}][id]`, variant.id);

                variant.values.forEach((val, valIdx) => {
                    data.append(`variants[${vIdx}][values][${valIdx}][value]`, val.value);
                    data.append(`variants[${vIdx}][values][${valIdx}][valueAr]`, val.valueAr);
                    if (val.hex) data.append(`variants[${vIdx}][values][${valIdx}][hex]`, val.hex);
                    data.append(`variants[${vIdx}][values][${valIdx}][price]`, val.price);
                    data.append(`variants[${vIdx}][values][${valIdx}][sortOrder]`, val.sortOrder);
                    data.append(`variants[${vIdx}][values][${valIdx}][inventory]`, val.inventory);
                    data.append(`variants[${vIdx}][values][${valIdx}][trackInventory]`, String(val.trackInventory));
                    if (val.id) data.append(`variants[${vIdx}][values][${valIdx}][id]`, val.id);
                });
            });

            // Append related product IDs
            formData.relatedProductIds.forEach((prodId, idx) => {
                data.append(`relatedProductIds[${idx}]`, prodId);
            });

            // Append addon IDs
            formData.addonIds.forEach((addonId, idx) => {
                data.append(`addonIds[${idx}]`, addonId);
            });


            // Append cover image
            if (coverImageFile) {
                data.append('coverImage', coverImageFile);
            }

            // Append new gallery images
            newImages.forEach(file => {
                data.append('images', file);
            });

            // Append images to delete (only in edit mode)
            if (isEditMode && imagesToDelete.length > 0) {
                imagesToDelete.forEach(url => {
                    data.append('imagesToDelete', url);
                });
            }

            if (isEditMode) {
                await productsApi.updateProduct(id, data);
                toast.success(t('updateSuccess'));
            } else {
                await productsApi.createProduct(data);
                toast.success(t('saveSuccess'));
            }

            // Invalidate cache to force refresh on product list
            invalidateCache(['products', 'categories']);

            navigate('/products');
        } catch (error: any) {
            console.error('Error saving product', error);
            const errorMessage = error.response?.data?.message || t('common:error', { defaultValue: 'Failed to save product' });
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className={clsx("w-6 h-6 text-slate-500", isRTL && "rotate-180")} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? t('editProduct') : t('addProduct')}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isEditMode ? t('manageExisting') : t('createNewProduct')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{isEditMode ? t('saveChanges') : t('publishProduct')}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Basic Info Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-500" />
                                {t('productInformation')}
                            </h2>
                            <div className="space-y-6">
                                <InputGroup label={t('productNameAr')} required subtitle={`${formData.nameAr?.length || 0}/50`}>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder={t('placeholderNameAr')}
                                        value={formData.nameAr}
                                        onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                        onBlur={() => handleTranslate('name', formData.nameAr)}
                                        required
                                        maxLength={50}
                                    />
                                </InputGroup>
                                <InputGroup label={t('productNameEn')} required subtitle={`${formData.name?.length || 0}/50`}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full text-left px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all pe-24"
                                            placeholder={t('placeholderNameEn')}
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            onBlur={() => {
                                                if (!formData.sku && formData.name) {
                                                    setFormData(prev => ({ ...prev, sku: generateSKU(formData.name) }));
                                                }
                                            }}
                                            dir="ltr"
                                            maxLength={50}
                                        />
                                    </div>
                                </InputGroup>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label={t('descriptionAr')} subtitle={`${formData.descriptionAr?.length || 0}/255`}>
                                        <textarea
                                            className="w-full h-32 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder={t('placeholderDescAr')}
                                            value={formData.descriptionAr}
                                            onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                                            onBlur={() => handleTranslate('description', formData.descriptionAr)}
                                            maxLength={255}
                                        />
                                    </InputGroup>
                                    <InputGroup label={t('descriptionEn')} subtitle={`${formData.description?.length || 0}/255`}>
                                        <textarea
                                            className="w-full text-left h-32 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder={t('placeholderDescEn')}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            dir="ltr"
                                            maxLength={255}
                                        />
                                    </InputGroup>
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-indigo-500" />
                                    {t('variants')}
                                </h2>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> {t('addOption')}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.variants.map((variant, vIdx) => (
                                    <div key={vIdx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="space-y-4 mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <InputGroup label={t('optionNameAr')} isRTL={isRTL} required>
                                                    <input
                                                        type="text"
                                                        value={variant.nameAr}
                                                        onChange={e => updateVariant(vIdx, 'nameAr', e.target.value)}
                                                        onBlur={() => handleVariantTranslate(variant.nameAr, (trans) => updateVariant(vIdx, 'name', trans))}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                        placeholder={t('optionNameArPlaceholder')}
                                                        required
                                                    />
                                                </InputGroup>
                                                <InputGroup label={t('optionNameEn')} isRTL={isRTL} required>
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={e => updateVariant(vIdx, 'name', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                        placeholder={t('optionNameEnPlaceholder')}
                                                        dir="ltr"
                                                        required
                                                    />
                                                </InputGroup>
                                                <InputGroup label={t('sortOrder')}>
                                                    <input
                                                        type="number"
                                                        value={variant.sortOrder}
                                                        onChange={e => updateVariant(vIdx, 'sortOrder', e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                        placeholder="0"
                                                    />
                                                </InputGroup>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex-1 min-w-[140px] flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('isColor')}</span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={variant.isColor}
                                                            onChange={e => updateVariant(vIdx, 'isColor', e.target.checked)}
                                                        />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                                <div className="flex-1 min-w-[140px] flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('isRequired')}</span>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={variant.isRequired}
                                                            onChange={e => updateVariant(vIdx, 'isRequired', e.target.checked)}
                                                        />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                                <div className="flex items-center justify-center p-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(vIdx)}
                                                        className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                                                        title={t('removeOption')}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Variant Values */}
                                        <div className="border-indigo-200 dark:border-indigo-900 space-y-4 ps-4 border-s-2">
                                            {variant.values.map((val, valIdx) => (
                                                <div key={valIdx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                                    {/* Row 1: Basic Info */}
                                                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                                                        {variant.isColor && (
                                                            <div className="w-[50px] relative">
                                                                <div
                                                                    className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                                                                    style={{ backgroundColor: val.hex || '#000000' }}
                                                                >
                                                                    <input
                                                                        type="color"
                                                                        value={val.hex || '#000000'}
                                                                        onChange={e => updateVariantValue(vIdx, valIdx, 'hex', e.target.value)}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-[120px]">
                                                            <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('valueArLabel')}</label>
                                                            <input
                                                                type="text"
                                                                value={val.valueAr}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'valueAr', e.target.value)}
                                                                onBlur={() => handleVariantTranslate(val.valueAr, (trans) => updateVariantValue(vIdx, valIdx, 'value', trans))}
                                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-[120px]">
                                                            <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('valueEnLabel')}</label>
                                                            <input
                                                                type="text"
                                                                value={val.value}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'value', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                                dir="ltr"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="w-full md:w-[100px]">
                                                            <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('price')}</label>
                                                            <input
                                                                type="number"
                                                                value={val.price}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'price', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="w-full md:w-[80px]">
                                                            <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('sortOrder')}</label>
                                                            <input
                                                                type="number"
                                                                value={val.sortOrder}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'sortOrder', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                                placeholder="0"
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariantValue(vIdx, valIdx)}
                                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors self-end mb-0.5"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Row 2: Inventory */}
                                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={val.trackInventory}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'trackInventory', e.target.checked)}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            {t('trackInventory')}
                                                        </label>

                                                        <div className={clsx("flex items-center gap-2 transition-opacity", !val.trackInventory && "opacity-50")}>
                                                            <span className="text-xs text-slate-400">|</span>
                                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{t('inventory')}:</label>
                                                            <input
                                                                type="number"
                                                                value={val.inventory}
                                                                onChange={e => updateVariantValue(vIdx, valIdx, 'inventory', e.target.value)}
                                                                className="w-24 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:bg-slate-100 dark:disabled:bg-slate-900"
                                                                placeholder="0"
                                                                disabled={!val.trackInventory}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addVariantValue(vIdx)}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-2"
                                            >
                                                <Plus size={14} /> {t('addValue')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                        {t('noVariants')}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Media Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                                {t('media')}
                            </h2>

                            {/* Cover Image */}
                            <div className="mb-8">
                                <InputGroup label={t('coverImage')} subtitle={t('coverImageSubtitle')} required>
                                    <div className="flex items-start gap-4">
                                        {(currCoverImage || coverImageFile) ? (
                                            <div className="relative group w-40 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <img
                                                    src={coverImageFile ? URL.createObjectURL(coverImageFile) : currCoverImage!}
                                                    alt="Cover"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setCoverImageFile(null); setCurrCoverImage(null); }}
                                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                                                    <Upload size={20} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('uploadCover')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => {
                                                        if (e.target.files?.[0]) setCoverImageFile(e.target.files[0]);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </InputGroup>
                            </div>

                            {/* Gallery Images */}
                            <InputGroup label={t('galleryImages')} subtitle={t('galleryImagesSubtitle')}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Existing Images */}
                                    {existingImages.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageDelete(url)}
                                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Selected Images */}
                                    {newImages.map((file, idx) => (
                                        <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={URL.createObjectURL(file)} alt="New upload" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(idx)}
                                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <span className="absolute bottom-1 end-1 px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] uppercase font-bold rounded">New</span>
                                        </div>
                                    ))}

                                    {/* Upload Button */}
                                    {(existingImages.length + newImages.length < 8) && (
                                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all">
                                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-500">{t('addImage')}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                multiple
                                                onChange={handleNewImagesSelect}
                                            />
                                        </label>
                                    )}
                                </div>
                            </InputGroup>
                        </div>

                        {/* Frequently Bought Together Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-500" />
                                {t('frequentlyBoughtTogether')}
                            </h2>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('searchRelatedProducts')}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={relatedSearchTerm}
                                        onChange={(e) => setRelatedSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                                    {allProducts
                                        .filter(p => {
                                            const name = p.name || '';
                                            const nameAr = p.nameAr || '';
                                            const searchLower = relatedSearchTerm.toLowerCase();
                                            return name.toLowerCase().includes(searchLower) || nameAr.toLowerCase().includes(searchLower);
                                        })
                                        .map(p => {
                                            const isSelected = formData.relatedProductIds.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        const newIds = isSelected
                                                            ? formData.relatedProductIds.filter(id => id !== p.id)
                                                            : [...formData.relatedProductIds, p.id];
                                                        setFormData({ ...formData, relatedProductIds: newIds });
                                                    }}
                                                    className={clsx(
                                                        "relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                                        isSelected
                                                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                                                    )}
                                                >
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                                                        {p.coverImage ? (
                                                            <img src={p.coverImage} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ImageIcon className="w-6 h-6 absolute inset-0 m-auto text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {isRTL ? (p.nameAr || p.name) : p.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {p.price.toFixed(2)} {t('common:currencySymbol')}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full text-white shadow-sm">
                                                            <CheckCircle2 size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    {searchingProducts && (
                                        <div className="col-span-full py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-xs">{t('loadingProducts')}</span>
                                        </div>
                                    )}
                                    {!searchingProducts && allProducts.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                            <p>{t('noRelatedProductsFound')}</p>
                                            <p className="text-xs mt-1">{t('common:adjustSearch')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-indigo-500" />
                                    {t('addons:title', { defaultValue: 'Add-ons' })}
                                </h2>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors uppercase tracking-wider">
                                        {t('common:required', { defaultValue: 'Required' })}
                                    </span>
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.addonsRequired}
                                            onChange={e => setFormData({ ...formData, addonsRequired: e.target.checked })}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('addons:searchPlaceholder', { defaultValue: 'Search Add-ons...' })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={addonSearchTerm}
                                        onChange={(e) => setAddonSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                                    {allAddons
                                        .filter(a => {
                                            const name = (isRTL ? a.nameAr : a.name) || a.name || '';
                                            const nameAr = a.nameAr || '';
                                            const searchLower = addonSearchTerm.toLowerCase();
                                            return name.toLowerCase().includes(searchLower) || nameAr.toLowerCase().includes(searchLower);
                                        })
                                        .map(a => {
                                            const isSelected = formData.addonIds.includes(a.id);
                                            const isOutOfStock = a.trackInventory && a.inventory <= 0;
                                            const isDisabled = isOutOfStock;
                                            return (
                                                <div
                                                    key={a.id}
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        const newIds = isSelected
                                                            ? formData.addonIds.filter(id => id !== a.id)
                                                            : [...formData.addonIds, a.id];
                                                        setFormData({ ...formData, addonIds: newIds });
                                                    }}
                                                    className={clsx(
                                                        "relative flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer group",
                                                        isSelected && !isDisabled
                                                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                                                        !isDisabled && !isSelected && "hover:border-indigo-300"
                                                    )}
                                                >
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                                                        {a.image ? (
                                                            <img src={a.image} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Package size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                {isRTL ? (a.nameAr || a.name) : a.name}
                                                            </p>
                                                            {isOutOfStock && (
                                                                <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded uppercase">
                                                                    {t('addons:outOfStock', { defaultValue: 'Out of Stock' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {a.price.toFixed(2)} {t('common:currencySymbol')}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full text-white shadow-sm">
                                                            <CheckCircle2 size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    {searchingAddons && (
                                        <div className="col-span-full py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="text-xs">{t('common:loading')}</span>
                                        </div>
                                    )}
                                    {!searchingAddons && allAddons.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                            <p>{t('addons:noAddonsFound', { defaultValue: 'No add-ons found' })}</p>
                                            <p className="text-xs mt-1">{t('common:adjustSearch')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Status */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className={clsx("text-sm font-bold text-slate-400 uppercase tracking-wider mb-4", isRTL && "text-right")}>{t('status')}</h2>
                            <div className="flex items-center justify-between mb-4">
                                <div className={isRTL ? "text-right" : "text-left"}>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('isOffer')}</label>
                                    <p className="text-[10px] text-slate-400">{t('isOfferSubtitle')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isOffer}
                                        onChange={e => setFormData({ ...formData, isOffer: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <label className={clsx("text-sm font-medium text-slate-700 dark:text-slate-300", isRTL && "text-right")}>{t('active')}</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className={clsx("text-sm font-medium text-slate-700 dark:text-slate-300", isRTL && "text-right")}>{t('available')}</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                {t('organization')}
                            </h2>
                            <div className="space-y-4">
                                <InputGroup
                                    label={
                                        <div className="flex items-center justify-between w-full">
                                            <span>{t('category')}</span>
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoryModalOpen(true)}
                                                className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors uppercase tracking-wider font-bold"
                                            >
                                                {t('newCategory')}
                                            </button>
                                        </div>
                                    }
                                    required
                                >
                                    {categories.length === 0 ? (
                                        <div className="space-y-3">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center">
                                                <p className="text-xs text-slate-500 mb-2">{t('categories:noCategoriesFound')}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCategoryModalOpen(true)}
                                                    className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                                >
                                                    {t('createFirstCategory')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('selectCategory')}</option>
                                            {categories.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </InputGroup>

                                <InputGroup label={t('sortOrder')}>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.sortOrder}
                                        onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                                        placeholder="0"
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-indigo-500" />
                                {t('pricing')}
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label={t('price')} required>
                                    <div className="relative">
                                        <span className="absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 start-3">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ps-8 pe-4"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </InputGroup>
                                <InputGroup label={t('comparePrice')} subtitle={t('comparePriceSubtitle')}>
                                    <div className="relative">
                                        <span className="absolute top-1/2 -translate-y-1/2 text-slate-500 start-3">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={clsx(
                                                "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ps-8 pe-4",
                                                formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price || '0')
                                                    ? "border-rose-500 focus:border-rose-500"
                                                    : "border-slate-200 dark:border-slate-700 focus:border-indigo-500"
                                            )}
                                            value={formData.comparePrice}
                                            onChange={e => setFormData({ ...formData, comparePrice: e.target.value })}
                                        />
                                    </div>
                                    {formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price || '0') && (
                                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                            <X size={12} />
                                            {t('comparePriceError')}
                                        </p>
                                    )}
                                </InputGroup>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Box className="w-5 h-5 text-indigo-500" />
                                {t('inventory')}
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label={t('sku')}>
                                    <div className="relative group/sku">
                                        <input
                                            type="text"
                                            className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase pe-4 ps-10"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                            placeholder="e.g. PIZ-123456"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, sku: generateSKU(formData.name || formData.nameAr) })}
                                            className="absolute top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all opacity-0 group-hover/sku:opacity-100 focus:opacity-100 end-2"
                                            title={t('regenerateSKU')}
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                    </div>
                                </InputGroup>
                                <div className="flex items-center justify-between py-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('trackQuantity')}</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.trackInventory}
                                            onChange={e => setFormData({ ...formData, trackInventory: e.target.checked })}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                {formData.trackInventory && (
                                    <InputGroup label={t('quantity')}>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.inventory}
                                            onChange={e => setFormData({ ...formData, inventory: e.target.value })}
                                        />
                                    </InputGroup>
                                )}
                                {!formData.trackInventory && (
                                    <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                                        {t('unlimitedStockWarning')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {isCategoryModalOpen && (
                <CategoryFormModal
                    onClose={() => setIsCategoryModalOpen(false)}
                    onSuccess={() => {
                        setIsCategoryModalOpen(false);
                        fetchCategories();
                        toast.success(t('categoryCreated'));
                    }}
                />
            )}
        </div>
    );
};

export default ProductForm;
