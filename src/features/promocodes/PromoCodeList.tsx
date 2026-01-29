import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Edit, Trash2, Tag, Calendar,
    Check, X, Search, Percent, DollarSign,
    MoreVertical, Power, PowerOff, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import promoCodesApi from './api/promocodes.api';
import { toast } from '../../utils/toast';
import clsx from 'clsx';

const PromoCodeList = () => {
    const { t } = useTranslation(['promocodes', 'common']);
    const { isRTL } = useLanguage();
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
            toast.success(t(currentStatus ? 'deactivated' : 'activated', { defaultValue: `Promo code ${!currentStatus ? 'activated' : 'deactivated'}` }));
        } catch (error) {
            console.error('Failed to toggle status', error);
            toast.error(t('common:errorUpdatingData'));
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('deleteConfirmation'))) {
            try {
                await promoCodesApi.deletePromoCode(id);
                setPromoCodes(prev => prev.filter(p => p.id !== id));
                toast.success(t('common:success'));
            } catch (error) {
                console.error('Failed to delete promo code', error);
                toast.error(t('common:errorUpdatingData'));
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
                </div>
                <Link
                    to="/promocodes/new"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 dark:shadow-none font-semibold text-sm"
                >
                    <Plus size={18} />
                    <span>{t('createCampaign')}</span>
                </Link>
            </div>

            {/* Content Control */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className={clsx(
                        "absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none",
                        isRTL ? "right-3" : "left-3"
                    )} size={18} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className={clsx(
                            "w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                        )}
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rtl:text-right ltr:text-left">{t('campaign')}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rtl:text-right ltr:text-left">{t('discount')}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rtl:text-right ltr:text-left">{t('validityPeriod')}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rtl:text-right ltr:text-left">{t('performance')}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right rtl:text-right ltr:text-left">{t('status')}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-end">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                                            <span className="text-sm text-slate-500">{t('retrievingCampaigns')}</span>
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
                                            <p className="text-slate-900 dark:text-white font-bold">{t('noPromoCodesFound')}</p>
                                            <p className="text-sm text-slate-500">{t('launchNewCampaign')}</p>
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="block font-black font-mono text-slate-900 dark:text-white tracking-widest">{promo.code}</span>
                                                        {promo.isAutoApply && (
                                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                                {t('autoApply')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 block uppercase font-bold truncate max-w-[150px]">
                                                            {promo.description || t('common:noDescription')}
                                                        </span>
                                                        {promo.ruleType && promo.ruleType !== 'none' && (
                                                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 rounded border border-slate-200 dark:border-slate-700">
                                                                {t(promo.ruleType.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase()))}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    {promo.type === 'percentage' ? `${promo.value}%` : `${Number(promo.value).toFixed(2)}$`}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 block">{t('minOrder')}: {Number(promo.minOrderAmount || 0)}$</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    <Calendar size={12} />
                                                    <span>{promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : t('immediate')}</span>
                                                    <span className="text-slate-300">→</span>
                                                    <span>{promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : t('never')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-32">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{t('usage')}</span>
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
                                                {new Date(promo.expiresAt) < new Date() ? t('expired') : promo.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-1 translate-x-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                <button
                                                    onClick={() => toggleStatus(promo.id, promo.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${promo.isActive ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={promo.isActive ? t('deactivate') : t('activate')}
                                                >
                                                    {promo.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/promocodes/edit/${promo.id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title={t('edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(promo.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title={t('delete')}
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
