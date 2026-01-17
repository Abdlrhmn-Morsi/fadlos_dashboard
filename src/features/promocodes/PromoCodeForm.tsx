import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import promoCodesApi from './api/promocodes.api';

const PromoCodeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'PERCENTAGE', // PERCENTAGE or FIXED_AMOUNT
        value: '',
        minOrderAmount: '0',
        maxDiscountAmount: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        maxUsage: '100',
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
                type: data.type,
                value: data.value,
                minOrderAmount: data.minOrderAmount || '0',
                maxDiscountAmount: data.maxDiscountAmount || '',
                startDate: data.startDate?.split('T')[0],
                expiryDate: data.expiryDate?.split('T')[0],
                maxUsage: data.maxUsage,
                isActive: data.isActive
            });
        } catch (error) {
            console.error('Failed to fetch promo code', error);
            navigate('/promocodes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                value: Number(formData.value),
                minOrderAmount: Number(formData.minOrderAmount),
                maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
                maxUsage: Number(formData.maxUsage),
                // Ensure dates are properly formatted if needed, backend looks for Date object or ISO string usually
                startDate: new Date(formData.startDate).toISOString(),
                expiryDate: new Date(formData.expiryDate).toISOString(),
            };

            if (isEditMode) {
                await promoCodesApi.updatePromoCode(id!, payload);
            } else {
                await promoCodesApi.createPromoCode(payload);
            }
            navigate('/promocodes');
        } catch (error) {
            console.error('Failed to save promo code', error);
            alert('Failed to save promo code');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/promocodes')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isEditMode ? 'Edit Promo Code' : 'Create Promo Code'}
                </h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Code</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary uppercase font-mono"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Type</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Value</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Max Usage Count</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.maxUsage}
                                onChange={e => setFormData({ ...formData, maxUsage: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Expiry Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Min Order Amount</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.minOrderAmount}
                                onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Max Discount Amount (Optional)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={formData.maxDiscountAmount}
                                onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded hover:bg-primary-hover transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            <span>{submitting ? 'Saving...' : 'Save Promo Code'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoCodeForm;
