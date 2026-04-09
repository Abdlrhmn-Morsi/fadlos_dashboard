import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Package, PackageOpen, Store, MoreVertical } from 'lucide-react';

import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import addonsApi from '../api/addons.api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useCache } from '../../../contexts/CacheContext';
import { AdminPermissions } from '../../../types/admin-permissions';
import { Permissions } from '../../../types/permissions';
import { Pagination } from '../../../components/common/Pagination';
import { Addon } from '../models/addon.model';

const GlobalAddonsList = () => {
    const { hasAdminPermission, hasPermission, user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(['addons', 'common', 'dashboard']);
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

    const [statusToggleItem, setStatusToggleItem] = useState<any>(null);

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

            const cacheKey = 'global_addons';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setAddons(cachedData.data || []);
                setTotalPages(cachedData.meta?.totalPages || 1);
                setLoading(false);
                return;
            }

            const res: any = await addonsApi.getAddons(params);
            if (res && res.data) {
                setAddons(res.data);
                if (res.meta) {
                    setTotalPages(res.meta.totalPages || 1);
                }
                setCache(cacheKey, res, params);
            } else {
                setAddons([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch global addons', error);
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
            invalidateCache('global_addons');
        } catch (error: any) {
            console.error('Failed to delete addon', error);
            const errorMsg = error.response?.data?.message || t('deleteFailed');
            toast.error(errorMsg);
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const confirmStatusToggle = async () => {
        if (!statusToggleItem) return;
        try {
            await addonsApi.toggleStatus(statusToggleItem.id, !statusToggleItem.isActive);
            toast.success(t('common:success', { defaultValue: 'Status updated via toggle' }));
            setAddons(prev => prev.map(a => a.id === statusToggleItem.id ? { ...a, isActive: !statusToggleItem.isActive } : a));
            invalidateCache('global_addons');
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error(t('common:error', { defaultValue: 'Failed to update status' }));
        } finally {
            setStatusToggleItem(null);
        }
    };

    const canManage = hasAdminPermission(AdminPermissions.STORES_ADDONS_UPDATE);
    const isSystemAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = user?.role === 'super_admin';

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('globalTitle', { defaultValue: 'All Add-on Management' })}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('globalSubtitle', { defaultValue: 'Manage store add-ons across the entire system' })}
                    </p>
                </div>
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
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard:store', { defaultValue: 'Store' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard:totalProducts')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('price')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                                    {t('common:actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : addons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <PackageOpen size={48} strokeWidth={1} />
                                            <p className="mt-4 text-lg font-medium">{t('noAddonsFound')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                addons.map((addon) => (
                                    <tr key={addon.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {addon.image ? (
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                        <img src={addon.image} alt="Addon" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                                <span className="font-semibold text-slate-800 dark:text-white">
                                                    {isRTL ? addon.nameAr || addon.name : addon.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div 
                                                onClick={() => navigate(`/stores/${addon.store?.id}`)}
                                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium text-sm"
                                            >
                                                <Store size={14} />
                                                {isRTL ? addon.store?.nameAr || addon.store?.name : addon.store?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            {(addon as any).productCount || 0}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {addon.price.toFixed(2)} {t('common:currencySymbol')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                addon.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                            )}>
                                                {addon.isActive ? t('common:active') : t('common:inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                {canManage && (
                                                    <button
                                                        onClick={() => isSystemAdmin ? setStatusToggleItem(addon) : navigate(`/addons/edit/${addon.id}`)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title={isSystemAdmin ? t('toggleStatus', { defaultValue: 'Toggle Status' }) : t('common:edit')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {(!isSystemAdmin && hasPermission(Permissions.ADDONS_DELETE)) && (
                                                    <button
                                                        onClick={() => handleDelete(addon.id)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        title={t('common:delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} />
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title={t('deleteAddon')}
                message={t('deleteConfirmation')}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />

            <ConfirmModal
                isOpen={!!statusToggleItem}
                title={t('toggleStatus', { defaultValue: 'Toggle Status' })}
                message={t('statusToggleConfirmation', { defaultValue: 'Are you sure you want to toggle the active status of this item?' })}
                onConfirm={confirmStatusToggle}
                onCancel={() => setStatusToggleItem(null)}
            />
        </div>
    );
};

export default GlobalAddonsList;
