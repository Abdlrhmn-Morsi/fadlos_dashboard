import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Calendar, Hash, DollarSign, Percent, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import promoCodesApi from './api/promocodes.api';
import { toast } from '../../utils/toast';
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
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'percentage', // percentage or fixed_amount (lowercase for backend)
        value: '',
        minOrderAmount: '0',
        maxDiscountAmount: '',
        startsAt: new Date().toISOString().split('T')[0],
        expiresAt: '',
        maxUses: '100',
        isActive: true
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
                isActive: data.isActive
            });
        } catch (error) {
            console.error('Failed to fetch promo code', error);
            toast.error(t('common:errorFetchingData'));
            navigate('/promocodes');
        } finally {
            setLoading(false);
        }
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

            // Fix for the error: backend wants maxUses, not maxUsage
            // And type is already lowercase in state

            if (isEditMode) {
                await promoCodesApi.updatePromoCode(id!, payload);
                toast.success(t('common:success'));
            } else {
                await promoCodesApi.createPromoCode(payload);
                toast.success(t('common:success'));
            }
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

                                <InputGroup label={t('description')} icon={Info} subtitle={t('descriptionSubtitle')}>
                                    <textarea
                                        className="w-full h-24 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                        placeholder="e.g. 20% off for first 100 orders"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
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
        </div>
    );
};

export default PromoCodeForm;
