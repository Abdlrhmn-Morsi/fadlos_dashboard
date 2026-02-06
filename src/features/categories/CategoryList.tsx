import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, LayoutGrid, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import categoriesApi from './api/categories.api';
import CategoryFormModal from './components/CategoryFormModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Permissions } from '../../types/permissions';
import { Pagination } from '../../components/common/Pagination';
import clsx from 'clsx';

const CategoryList = () => {
    const { t } = useTranslation(['categories', 'common']);
    const { isRTL } = useLanguage();
    const { hasPermission } = useAuth();
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

    // Refetch data when component becomes visible (e.g., navigating back from modal)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchCategories();
            }
        };

        const handleFocus = () => {
            fetchCategories();
        };

        // Listen for visibility changes and window focus
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [page, debouncedSearch]);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const params: any = {
                page,
                limit,
                search: debouncedSearch || undefined
            };

            // Check cache first
            const cacheKey = 'categories';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                if (cachedData.data) {
                    setCategories(cachedData.data);
                    setTotalPages(cachedData.meta?.totalPages || 1);
                } else if (Array.isArray(cachedData)) {
                    // Fallback for array cache
                    setCategories(cachedData);
                    setTotalPages(1);
                }
                setLoading(false);
                return;
            }

            // Fetch from API if not cached
            const response: any = await categoriesApi.getSellerCategories(params);

            if (response && response.data) {
                setCategories(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.totalPages || 1);
                } else if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                }

                // Cache the data
                setCache(cacheKey, response, params);
            } else if (Array.isArray(response)) {
                setCategories(response);
                setTotalPages(1);
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

            // Immediately remove from local state
            setCategories(prevCategories => prevCategories.filter(cat => cat.id !== deleteId));

            // Invalidate cache
            invalidateCache('categories');
        } catch (error) {
            console.error('Failed to delete category', error);
            toast.error(t('common:error', { defaultValue: 'Error' }));
            // Refetch on error to restore correct state
            fetchCategories();
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                {hasPermission(Permissions.CATEGORIES_CREATE) && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                        <Plus size={20} />
                        <span>{t('addCategory')}</span>
                    </button>
                )}
            </div>

            {/* Search and Filter Bar */}
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



            {/* Categories Grid/Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {t('name')}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {t('common:sortOrder')}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {t('status')}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-end">
                                    {t('actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <LayoutGrid size={48} strokeWidth={1} />
                                            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-300">{t('noCategoriesFound')}</p>
                                            <p className="text-sm">{t('common:adjustSearch')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform duration-200">
                                                    <Tag size={18} />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {isRTL ? category.nameAr || category.name : category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit text-sm font-medium">
                                                <ArrowUpDown size={14} />
                                                {category.sort}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${category.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full me-1.5", category.isActive ? 'bg-emerald-500' : 'bg-slate-400')}></span>
                                                {category.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center gap-2 transition-opacity duration-200 justify-end">
                                                {hasPermission(Permissions.CATEGORIES_UPDATE) && (
                                                    <button
                                                        onClick={() => handleEdit(category)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                        title={t('common:edit')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {hasPermission(Permissions.CATEGORIES_DELETE) && (
                                                    <button
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
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
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />

            {/* Modals */}
            {isModalOpen && (
                <CategoryFormModal
                    category={editingCategory}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={(savedCategory) => {
                        setIsModalOpen(false);

                        if (editingCategory) {
                            // Update: Replace the existing category in the list
                            setCategories(prevCategories =>
                                prevCategories.map(cat =>
                                    cat.id === savedCategory.id ? savedCategory : cat
                                )
                            );
                            toast.success(t('saveSuccess'));
                        } else {
                            // Create: Add the new category to the list
                            setCategories(prevCategories => [...prevCategories, savedCategory]);
                            toast.success(t('saveSuccess'));
                        }

                        // Invalidate cache
                        invalidateCache('categories');
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
        </div>
    );
};

export default CategoryList;

