import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Calendar, Hash, DollarSign, Percent, Info, CheckCircle2, AlertCircle, Loader2, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import promoCodesApi from './api/promocodes.api';
import productsApi from '../products/api/products.api';
import clientsApi from '../clients/api/clients.api';
import categoriesApi from '../categories/api/categories.api';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../utils/toast';
import { useCache } from '../../contexts/CacheContext';
import clsx from 'clsx';

const InputGroup = ({ label, children, icon: Icon, required = false, subtitle = '' }: any) => {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {Icon && <Icon size={16} className="text-slate-400" />}
                <span>
                    {label} {required && <span className="text-rose-500 ms-1">*</span>}
                </span>
            </label>
            {children}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
    );
};

const PromoCodeForm = () => {
    const { t } = useTranslation(['promocodes', 'common']);
    const { isRTL } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const { invalidateCache } = useCache();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({
        code: '',
        description: '',
        type: 'percentage', // percentage or fixed_amount (lowercase for backend)
        value: '',
        minOrderAmount: '0',
        maxDiscountAmount: '',
        startsAt: new Date().toISOString().split('T')[0],
        expiresAt: '',
        maxUses: '100',
        isActive: true,
        ruleType: 'none',
        ruleParams: {},
        isAutoApply: false
    });

    const [modalData, setModalData] = useState<any>({
        isOpen: false,
        type: '', // products, customers, categories
        items: [],
        filteredItems: [],
        searchQuery: '',
        loading: false
    });

    useEffect(() => {
        if (isEditMode) {
            fetchPromoCode();
        }
    }, [id]);

    const fetchPromoCode = async () => {
        try {
            setLoading(true);
            const data: any = await promoCodesApi.getPromoCode(id!);
            setFormData({
                code: data.code,
                description: data.description || '',
                type: data.type,
                value: String(data.value),
                minOrderAmount: String(data.minOrderAmount || '0'),
                maxDiscountAmount: data.maxDiscountAmount ? String(data.maxDiscountAmount) : '',
                startsAt: data.startsAt ? data.startsAt.split('T')[0] : '',
                expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
                maxUses: String(data.maxUses || ''),
                isActive: data.isActive,
                ruleType: data.ruleType || 'none',
                ruleParams: data.ruleParams || {},
                isAutoApply: data.isAutoApply || false
            });
        } catch (error) {
            console.error('Failed to fetch promo code', error);
            toast.error(t('common:errorFetchingData'));
            navigate('/promocodes');
        } finally {
            setLoading(false);
        }
    };

    const openSelectionModal = async (type: string) => {
        setModalData({ ...modalData, isOpen: true, type, loading: true, searchQuery: '', items: [], filteredItems: [] });
        try {
            let data: any = [];
            if (type === 'products') {
                const response = await productsApi.getSellerProducts();
                data = response.data || response;
            } else if (type === 'customers') {
                const response = await clientsApi.getStoreClients();
                data = response.data || response;
            } else if (type === 'categories') {
                const response = await categoriesApi.getSellerCategories();
                data = response.data || response;
            }
            // Normalize data for display
            const normalizedItems = data.map((item: any) => {
                let name = item.name || item.nameEn || item.user?.name || item.email || item.client?.name || 'Untitled';
                let subtitle = item.sku || item.category?.name || item.user?.phone || item.client?.phone || item.id.substring(0, 8);

                if (type === 'categories') {
                    name = isRTL && item.nameAr ? item.nameAr : name;
                    subtitle = ''; // Remove ID for categories
                } else if (type === 'customers') {
                    subtitle = ''; // Remove ID for customers
                } else if (type === 'products' && isRTL && item.nameAr) {
                    name = item.nameAr;
                }

                return {
                    id: item.id,
                    name,
                    subtitle,
                    image: item.coverImage || item.client?.profileImage || null,
                    stats: item.stats ? {
                        totalOrders: item.stats.totalOrders,
                        totalSpent: item.stats.totalSpent,
                        lastOrderAt: item.stats.lastOrderAt
                    } : null
                };
            });
            setModalData((prev: any) => ({ ...prev, items: normalizedItems, filteredItems: normalizedItems, loading: false }));
        } catch (error) {
            console.error('Failed to fetch items', error);
            toast.error('Failed to load items');
            setModalData((prev: any) => ({ ...prev, isOpen: false, loading: false }));
        }
    };

    const handleSearch = (query: string) => {
        const filtered = modalData.items.filter((item: any) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase())
        );
        setModalData((prev: any) => ({ ...prev, searchQuery: query, filteredItems: filtered }));
    };

    const toggleSelection = (id: string, paramKey: string) => {
        const currentIds = formData.ruleParams[paramKey] || [];
        const newIds = currentIds.includes(id)
            ? currentIds.filter((cid: string) => cid !== id)
            : [...currentIds, id];

        setFormData({
            ...formData,
            ruleParams: { ...formData.ruleParams, [paramKey]: newIds }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.expiresAt) {
            toast.error(t('expiryRequired'));
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                value: Number(formData.value),
                minOrderAmount: Number(formData.minOrderAmount),
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
                maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
            };

            if (isEditMode) {
                // Remove 'code' from payload for updates, as it's not allowed in UpdatePromoCodeDto
                const { code, ...updatePayload } = payload;
                await promoCodesApi.updatePromoCode(id!, updatePayload);
                toast.success(t('common:success'));
            } else {
                await promoCodesApi.createPromoCode(payload);
                toast.success(t('common:success'));
            }

            // Invalidate cache to refresh list
            invalidateCache('promocodes');

            navigate('/promocodes');
        } catch (error: any) {
            console.error('Failed to save promo code', error);
            const message = error.response?.data?.message || t('common:errorUpdatingData');
            toast.error(Array.isArray(message) ? message[0] : message);
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
        <div className="max-w-5xl mx-auto p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/promocodes')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className={clsx("w-6 h-6 text-slate-500", isRTL && "rotate-180")} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? t('editTitle') : t('createTitle')}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isEditMode ? t('editSubtitle') : t('createSubtitle')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/promocodes')}
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
                            <span>{isEditMode ? t('saveChanges') : t('publishPromoCode')}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Promotional Rules - NOW AT THE TOP */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 bg-gradient-to-br from-indigo-50/30 to-white dark:from-indigo-900/10 dark:to-slate-900">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                {t('promotionalRules')}
                            </h2>
                            <div className="space-y-6">
                                <InputGroup label={t('ruleType')} icon={Info}>
                                    <select
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                        value={formData.ruleType}
                                        onChange={e => setFormData({
                                            ...formData,
                                            ruleType: e.target.value,
                                            ruleParams: e.target.value === 'loyalty_reward' ? { minOrders: 5 } :
                                                e.target.value === 'we_miss_you' ? { inactiveDaysAtLeast: 30 } : {}
                                        })}
                                    >
                                        <option value="none">{t('none')}</option>
                                        <option value="followers_only">{t('followersOnly')}</option>
                                        <option value="new_customer">{t('newCustomer')}</option>
                                        <option value="first_order_reward">{t('firstOrderReward')}</option>
                                        <option value="loyalty_reward">{t('loyaltyReward')}</option>
                                        <option value="we_miss_you">{t('weMissYou')}</option>
                                        <option value="favorite_product">{t('favoriteProduct')}</option>
                                        <option value="category_based">{t('categoryBased')}</option>
                                        <option value="store_customer">{t('storeCustomer')}</option>
                                        <option value="specific_customers">{t('specificCustomers')}</option>
                                        <option value="specific_products">{t('specificProducts')}</option>
                                    </select>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {formData.ruleType === 'none' && t('noneSubtitle')}
                                        {formData.ruleType === 'followers_only' && t('followersOnlySubtitle')}
                                        {formData.ruleType === 'new_customer' && t('newCustomerSubtitle')}
                                        {formData.ruleType === 'first_order_reward' && t('firstOrderRewardSubtitle')}
                                        {formData.ruleType === 'loyalty_reward' && t('loyaltyRewardSubtitle')}
                                        {formData.ruleType === 'we_miss_you' && t('weMissYouSubtitle')}
                                        {formData.ruleType === 'favorite_product' && t('favoriteProductSubtitle')}
                                        {formData.ruleType === 'category_based' && t('categoryBasedSubtitle')}
                                        {formData.ruleType === 'store_customer' && t('storeCustomerSubtitle')}
                                        {formData.ruleType === 'specific_customers' && t('specificCustomersSubtitle')}
                                        {formData.ruleType === 'specific_products' && t('specificProductsSubtitle')}
                                    </p>
                                </InputGroup>

                                {formData.ruleType === 'loyalty_reward' && (
                                    <InputGroup label={t('minOrders')} icon={Hash}>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                            value={formData.ruleParams?.minOrders || ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                ruleParams: { ...formData.ruleParams, minOrders: Number(e.target.value) }
                                            })}
                                            placeholder="e.g. 5"
                                        />
                                    </InputGroup>
                                )}

                                {formData.ruleType === 'we_miss_you' && (
                                    <InputGroup label={t('inactiveDays')} icon={Calendar}>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                            value={formData.ruleParams?.inactiveDaysAtLeast || ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                ruleParams: { ...formData.ruleParams, inactiveDaysAtLeast: Number(e.target.value) }
                                            })}
                                            placeholder="e.g. 30"
                                        />
                                    </InputGroup>
                                )}

                                {formData.ruleType === 'specific_customers' && (
                                    <InputGroup label={t('specificCustomers')} icon={Hash} subtitle={`Selected: ${formData.ruleParams?.userIds?.length || 0}`}>
                                        <button
                                            type="button"
                                            onClick={() => openSelectionModal('customers')}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all text-sm text-slate-600 dark:text-slate-400"
                                        >
                                            <span>{formData.ruleParams?.userIds?.length ? `${formData.ruleParams.userIds.length} Customers Selected` : 'Select Customers...'}</span>
                                            <Search size={16} />
                                        </button>
                                    </InputGroup>
                                )}

                                {formData.ruleType === 'specific_products' && (
                                    <InputGroup label={t('specificProducts')} icon={Hash} subtitle={`Selected: ${formData.ruleParams?.productIds?.length || 0}`}>
                                        <button
                                            type="button"
                                            onClick={() => openSelectionModal('products')}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all text-sm text-slate-600 dark:text-slate-400"
                                        >
                                            <span>{formData.ruleParams?.productIds?.length ? `${formData.ruleParams.productIds.length} Products Selected` : 'Select Products...'}</span>
                                            <Search size={16} />
                                        </button>
                                    </InputGroup>
                                )}

                                {formData.ruleType === 'category_based' && (
                                    <InputGroup label={t('categoryBased')} icon={Hash} subtitle={`Selected: ${formData.ruleParams?.categoryIds?.length || 0}`}>
                                        <button
                                            type="button"
                                            onClick={() => openSelectionModal('categories')}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all text-sm text-slate-600 dark:text-slate-400"
                                        >
                                            <span>{formData.ruleParams?.categoryIds?.length ? `${formData.ruleParams.categoryIds.length} Categories Selected` : 'Select Categories...'}</span>
                                            <Search size={16} />
                                        </button>
                                    </InputGroup>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-indigo-500" />
                                {t('generalInformation')}
                            </h2>
                            <div className="space-y-6">
                                <InputGroup label={t('promoCode')} icon={Tag} required subtitle={t('promoCodeSubtitle')}>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all uppercase font-mono font-bold tracking-wider"
                                        placeholder="e.g. SUMMER2024"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </InputGroup>

                                <InputGroup
                                    label={t('description')}
                                    icon={Info}
                                    required
                                    subtitle={t('descriptionSubtitle')}
                                >
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder="e.g. 20% off for first 100 orders"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            maxLength={255}
                                            required
                                        />
                                        <div className={clsx(
                                            "absolute bottom-2 text-[10px] font-medium transition-colors",
                                            isRTL ? "left-3" : "right-3",
                                            formData.description.length >= 250 ? "text-rose-500" : "text-slate-400"
                                        )}>
                                            {formData.description.length} / 255
                                        </div>
                                    </div>
                                </InputGroup>
                            </div>
                        </div>

                        {/* Discount Configuration */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                {t('discountConfiguration')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label={t('discountType')} icon={formData.type === 'percentage' ? Percent : DollarSign}>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="percentage">{t('percentage')}</option>
                                        <option value="fixed_amount">{t('fixedAmount')}</option>
                                    </select>
                                </InputGroup>

                                <InputGroup label={t('discountValue')} required icon={formData.type === 'percentage' ? Percent : DollarSign}>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ps-4 pe-12"
                                            placeholder={formData.type === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            required
                                        />
                                        <span className="absolute top-1/2 -translate-y-1/2 text-slate-400 font-bold end-4">
                                            {formData.type === 'percentage' ? '%' : t('common:currencySymbol')}
                                        </span>
                                    </div>
                                </InputGroup>

                                <InputGroup label={t('minOrderAmount')} icon={CheckCircle2} subtitle={t('minOrderAmountSubtitle')}>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ps-8 pe-4"
                                            value={formData.minOrderAmount}
                                            onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        />
                                        <span className="absolute top-1/2 -translate-y-1/2 text-slate-400 font-bold start-3">{t('common:currencySymbol')}</span>
                                    </div>
                                </InputGroup>

                                <InputGroup label={t('maxDiscountAmount')} icon={AlertCircle} subtitle={t('maxDiscountAmountSubtitle')}>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            disabled={formData.type !== 'percentage'}
                                            className="w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 ps-8 pe-4"
                                            value={formData.maxDiscountAmount}
                                            onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                        />
                                        <span className="absolute top-1/2 -translate-y-1/2 text-slate-400 font-bold start-3">{t('common:currencySymbol')}</span>
                                    </div>
                                </InputGroup>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t('availability')}</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('activeStatus')}</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <div className={clsx(
                                            "w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500",
                                            "after:start-[2px]",
                                            isRTL ? "peer-checked:after:-translate-x-full" : "peer-checked:after:translate-x-full"
                                        )}></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('autoApply')}</label>
                                        <p className="text-[10px] text-slate-400 max-w-[120px]">{t('autoApplySubtitle')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.isAutoApply}
                                            onChange={e => setFormData({ ...formData, isAutoApply: e.target.checked })}
                                        />
                                        <div className={clsx(
                                            "w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500",
                                            "after:start-[2px]",
                                            isRTL ? "peer-checked:after:-translate-x-full" : "peer-checked:after:translate-x-full"
                                        )}></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Limits Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-amber-500" />
                                {t('usageLimits')}
                            </h2>
                            <InputGroup label={t('maxTotalUses')} subtitle={t('maxTotalUsesSubtitle')}>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. 100"
                                    value={formData.maxUses}
                                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                                />
                            </InputGroup>
                        </div>

                        {/* Schedule Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                {t('validityPeriod')}
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label={t('startsOn')} icon={Calendar}>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.startsAt}
                                        onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                                    />
                                </InputGroup>

                                <InputGroup label={t('expiresOn')} icon={Calendar} required>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        required
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Selection Modal */}
            <Modal
                isOpen={modalData.isOpen}
                onClose={() => setModalData({ ...modalData, isOpen: false })}
                title={t(modalData.type === 'products' ? 'selectProducts' : modalData.type === 'customers' ? 'selectCustomers' : 'selectCategories')}
            >
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-4 py-2 ps-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Search..."
                            value={modalData.searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                        />
                        <Search className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" size={18} />
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {modalData.loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : modalData.filteredItems.length > 0 ? (
                            modalData.filteredItems.map((item: any) => {
                                const paramKey = modalData.type === 'products' ? 'productIds' : modalData.type === 'customers' ? 'userIds' : 'categoryIds';
                                const isSelected = formData.ruleParams[paramKey]?.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => toggleSelection(item.id, paramKey)}
                                        className={clsx(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-start",
                                            isSelected
                                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/20"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800"
                                        )}
                                    >
                                        <div className="flex gap-4 items-center flex-1 min-w-0">
                                            {item.image && (
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                                                            <CheckCircle2 size={12} className="text-indigo-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{item.name}</p>
                                                    {isSelected && !item.image && <CheckCircle2 size={14} className="text-indigo-600" />}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>

                                                {item.stats && (
                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                                                        <span className="flex items-center gap-1 text-slate-500">
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{t('totalOrders')}:</span>
                                                            {item.stats.totalOrders}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-slate-500">
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{t('totalSpent')}:</span>
                                                            {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(item.stats.totalSpent)}
                                                        </span>
                                                        {item.stats.lastOrderAt && (
                                                            <span className="flex items-center gap-1 text-slate-500">
                                                                <span className="font-medium text-slate-700 dark:text-slate-300">{t('lastOrder')}:</span>
                                                                {new Date(item.stats.lastOrderAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && !item.image && !item.stats && <CheckCircle2 size={18} className="text-indigo-600" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Search size={32} className="mx-auto mb-2 opacity-20" />
                                <p>{t('noItemsFound')}</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setModalData({ ...modalData, isOpen: false })}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20"
                        >
                            {t('done')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PromoCodeForm;
