import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, PackageOpen } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import addonsApi from '../api/addons.api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useCache } from '../../../contexts/CacheContext';
import { Permissions } from '../../../types/permissions';
import { Pagination } from '../../../components/common/Pagination';
import { Addon } from '../models/addon.model';

const AddonsList = () => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(['addons', 'common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();

    const [addons, setAddons] = useState<Addon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAddons();
        }, searchTerm ? 300 : 0);
        return () => clearTimeout(timer);
    }, [page, searchTerm]);

    const fetchAddons = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                limit,
                search: searchTerm || undefined,
            };

            const cacheKey = 'addons';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setAddons(cachedData.data || []);
                setLoading(false);
                return;
            }

            const res: any = await addonsApi.getAddons(params);
            const data = res.data || [];
            const meta = res.meta;

            setAddons(data);
            if (meta) {
                setTotalPages(meta.totalPages || 1);
            }
            setCache(cacheKey, res, params);
        } catch (error) {
            console.error('Failed to fetch addons', error);
            toast.error(t('loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await addonsApi.deleteAddon(deleteId);
            toast.success(t('deleteSuccess'));
            setAddons(prev => prev.filter(a => a.id !== deleteId));
            invalidateCache('addons');
        } catch (error) {
            console.error('Failed to delete addon', error);
            toast.error(t('deleteFailed'));
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/addons/new')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>{t('addAddon')}</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative flex-1">
                    <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={20} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className={clsx(
                            "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 rounded-xl transition-all duration-200 outline-none",
                            isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Addons Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('addonName')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('price')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('inventory')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('isActive')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t('common:actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : addons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                                                <PackageOpen size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('noAddonsFound')}</p>
                                            <p className="text-sm mt-1">{t('getStarted')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                addons.map((addon) => (
                                    <tr key={addon.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {addon.image ? (
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0">
                                                        <img src={addon.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    {isRTL ? addon.nameAr || addon.name : addon.name}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {addon.price.toFixed(2)} {t('common:currencySymbol')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {addon.trackInventory ? (
                                                <span className={clsx(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    addon.inventory > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-700 dark:bg-rose-900/20"
                                                )}>
                                                    {addon.inventory} {t('inStock')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">{t('unlimited')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                addon.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                            )}>
                                                {addon.isActive ? t('common:active') : t('common:inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx("flex items-center gap-2", isRTL ? "justify-start" : "justify-end")}>
                                                <button
                                                    onClick={() => navigate(`/addons/edit/${addon.id}`)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(addon.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
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

            {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                title={t('deleteAddon')}
                message={t('deleteConfirmation')}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default AddonsList;
