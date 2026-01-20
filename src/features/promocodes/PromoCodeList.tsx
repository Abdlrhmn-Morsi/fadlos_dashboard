import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Edit, Trash2, Tag, Calendar,
    Check, X, Search, Percent, DollarSign,
    MoreVertical, Power, PowerOff, Loader2
} from 'lucide-react';
import promoCodesApi from './api/promocodes.api';
import { toast } from '../../utils/toast';

const PromoCodeList = () => {
    const navigate = useNavigate();
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            toast.error('Failed to load promo codes');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await promoCodesApi.togglePromoCodeStatus(id);
            setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
            toast.success(`Promo code ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            console.error('Failed to toggle status', error);
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this promo code? This action cannot be undone.')) {
            try {
                await promoCodesApi.deletePromoCode(id);
                setPromoCodes(prev => prev.filter(p => p.id !== id));
                toast.success('Promo code deleted');
            } catch (error) {
                console.error('Failed to delete promo code', error);
                toast.error('Failed to delete promo code');
            }
        }
    };

    const filteredCodes = promoCodes.filter(promo =>
        promo.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (isActive: boolean, expiresAt: string) => {
        const isExpired = expiresAt && new Date(expiresAt) < new Date();
        if (isExpired) return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30';
        if (isActive) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30';
        return 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800';
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Promo Codes</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your discount campaigns and promotional offers</p>
                </div>
                <Link
                    to="/promocodes/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 dark:shadow-none font-semibold text-sm"
                >
                    <Plus size={18} />
                    <span>Create Campaign</span>
                </Link>
            </div>

            {/* Content Control */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                        type="text"
                        placeholder="Search codes..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Validity Period</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                                            <span className="text-sm text-slate-500">Retrieving campaigns...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Tag className="text-slate-400" size={24} />
                                            </div>
                                            <p className="text-slate-900 dark:text-white font-bold">No promo codes found</p>
                                            <p className="text-sm text-slate-500">Launch a new campaign to boost your sales.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCodes.map((promo) => (
                                    <tr key={promo.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600">
                                                    <Tag size={20} />
                                                </div>
                                                <div>
                                                    <span className="block font-black font-mono text-slate-900 dark:text-white tracking-widest">{promo.code}</span>
                                                    <span className="text-[10px] text-slate-400 block uppercase font-bold truncate max-w-[150px]">
                                                        {promo.description || 'No description'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5">
                                                {promo.type === 'percentage' ? (
                                                    <Percent size={14} className="text-emerald-500" />
                                                ) : (
                                                    <DollarSign size={14} className="text-emerald-500" />
                                                )}
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    {promo.type === 'percentage' ? `${promo.value}%` : `$${Number(promo.value).toFixed(2)}`}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 block">Min. Order: ${Number(promo.minOrderAmount || 0)}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    <Calendar size={12} />
                                                    <span>{promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : 'Immediate'}</span>
                                                    <span className="text-slate-300">→</span>
                                                    <span>{promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : 'Never'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-32">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Usage</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {promo.currentUses} / {promo.maxUses || '∞'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all"
                                                        style={{ width: `${Math.min((promo.currentUses / (promo.maxUses || 100)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(promo.isActive, promo.expiresAt)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${promo.isActive ? 'bg-current' : 'bg-slate-400'}`} />
                                                {new Date(promo.expiresAt) < new Date() ? 'Expired' : promo.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-1 translate-x-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                <button
                                                    onClick={() => toggleStatus(promo.id, promo.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${promo.isActive ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={promo.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {promo.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/promocodes/edit/${promo.id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(promo.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
