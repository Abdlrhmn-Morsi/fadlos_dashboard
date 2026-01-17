import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Tag, Calendar, Check, X } from 'lucide-react';
import promoCodesApi from './api/promocodes.api';

const PromoCodeList = () => {
    const navigate = useNavigate();
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            const data: any = await promoCodesApi.getPromoCodes();
            setPromoCodes(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch promo codes', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            await promoCodesApi.togglePromoCodeStatus(id);
            fetchPromoCodes(); // Refresh
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this promo code?')) {
            try {
                await promoCodesApi.deletePromoCode(id);
                fetchPromoCodes();
            } catch (error) {
                console.error('Failed to delete promo code', error);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Promo Codes</h1>
                <Link
                    to="/promocodes/new"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
                >
                    <Plus size={20} />
                    <span>Create New</span>
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Code</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Discount</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Expiry</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Usage</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading promo codes...</td>
                                </tr>
                            ) : promoCodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No promo codes found.</td>
                                </tr>
                            ) : (
                                promoCodes.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-primary" />
                                                <span className="font-mono font-bold text-slate-800 dark:text-white">{promo.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `$${Number(promo.value).toFixed(2)}`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>{new Date(promo.expiryDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {promo.currentUsage} / {promo.maxUsage}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(promo.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${promo.isActive
                                                    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                                                    : 'text-slate-600 bg-slate-100 dark:bg-slate-800'
                                                    }`}
                                            >
                                                {promo.isActive ? <Check size={12} /> : <X size={12} />}
                                                {promo.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/promocodes/edit/${promo.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(promo.id)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PromoCodeList;
