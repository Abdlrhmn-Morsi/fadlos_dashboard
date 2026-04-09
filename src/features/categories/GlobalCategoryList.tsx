import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Tag, LayoutGrid, ArrowUpDown, MoreHorizontal, Store, Eye } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import categoriesApi from './api/categories.api';
import CategoryFormModal from './components/CategoryFormModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { AdminPermissions } from '../../types/admin-permissions';
import { Pagination } from '../../components/common/Pagination';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const GlobalCategoryList = () => {
    const { t } = useTranslation(['categories', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
    const { hasAdminPermission, user } = useAuth();
    const navigate = useNavigate();
    const { getCache, setCache, invalidateCache } = useCache();
    
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Delete confirmation state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [statusToggleItem, setStatusToggleItem] = useState<any>(null);

    // Search Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch when params change
    useEffect(() => {
        fetchCategories();
    }, [page, debouncedSearch]);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const params: any = {
                page,
                limit,
                search: debouncedSearch || undefined
            };

            // Check cache first
            const cacheKey = 'global_categories';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setCategories(cachedData.data || []);
                setTotalPages(cachedData.meta?.totalPages || 1);
                setLoading(false);
                return;
            }

            // Fetch globally using the seller categories endpoint (which admin can access for all stores)
            const response: any = await categoriesApi.getSellerCategories(params);

            if (response && response.data) {
                setCategories(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.totalPages || 1);
                }
                setCache(cacheKey, response, params);
            } else {
                setCategories([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
            toast.error(t('loadFailed'));
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await categoriesApi.deleteCategory(deleteId);
            toast.success(t('deleteSuccess'));
            setCategories(prev => prev.filter(cat => cat.id !== deleteId));
            invalidateCache('global_categories');
        } catch (error: any) {
            console.error('Failed to delete category', error);
            const errorMsg = error.response?.data?.message || t('common:error');
            toast.error(errorMsg);
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const confirmStatusToggle = async () => {
        if (!statusToggleItem) return;
        try {
            await categoriesApi.toggleStatus(statusToggleItem.id, !statusToggleItem.isActive);
            toast.success(t('common:success', { defaultValue: 'Status updated via toggle' }));
            setCategories(prev => prev.map(c => c.id === statusToggleItem.id ? { ...c, isActive: !statusToggleItem.isActive } : c));
            invalidateCache('global_categories');
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error(t('common:error'));
        } finally {
            setStatusToggleItem(null);
        }
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const canManage = hasAdminPermission(AdminPermissions.STORES_CATEGORIES_UPDATE);
    const isSystemAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = user?.role === 'super_admin';

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('globalTitle', { defaultValue: 'All Category Management' })}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('globalSubtitle', { defaultValue: 'Manage product categories across all stores' })}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative max-w-md">
                    <Search className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-3" size={20} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 rounded-xl transition-all duration-200 outline-none ps-10 pe-4"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">
                                    {t('name')}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">
                                    {t('dashboard:store', { defaultValue: 'Store' })}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">
                                    {t('dashboard:totalProducts', { ns: 'dashboard' })}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-start">
                                    {t('status')}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-end">
                                    {t('actions')}
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
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <LayoutGrid size={48} strokeWidth={1} />
                                            <p className="mt-4 text-lg font-medium">{t('noCategoriesFound')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                                    <Tag size={18} />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {isRTL ? category.nameAr || category.name : category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div 
                                                onClick={() => navigate(`/stores/${category.store?.id}`)}
                                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium text-sm"
                                            >
                                                <Store size={14} />
                                                {isRTL ? category.store?.nameAr || category.store?.name : category.store?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            {category.productCount || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                category.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                            )}>
                                                {category.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center gap-2 justify-end">
                                                {canManage && (
                                                    <button
                                                        onClick={() => isSystemAdmin ? setStatusToggleItem(category) : handleEdit(category)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title={isSystemAdmin ? t('toggleStatus', { defaultValue: 'Toggle Status' }) : t('common:edit')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {(!isSystemAdmin && hasPermission(Permissions.CATEGORIES_DELETE)) && (
                                                    <button
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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

            {/* Modal */}
            {isModalOpen && (
                <CategoryFormModal
                    category={editingCategory}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchCategories();
                        invalidateCache('global_categories');
                    }}
                />
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                title={t('deleteCategory')}
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

export default GlobalCategoryList;
