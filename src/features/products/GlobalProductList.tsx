import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Package, PackageOpen, Star, Eye, ShieldAlert, MoreVertical, Store } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import productsApi from './api/products.api';
import categoriesApi from '../categories/api/categories.api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { AdminPermissions } from '../../types/admin-permissions';
import { Pagination } from '../../components/common/Pagination';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

const GlobalProductList = () => {
    const navigate = useNavigate();
    const { hasAdminPermission, user } = useAuth();
    const { t } = useTranslation(['products', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
    
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Filters & Sorting State
    const [isOfferFilter, setIsOfferFilter] = useState<boolean | undefined>(undefined);
    const [hasDiscountFilter, setHasDiscountFilter] = useState<boolean | undefined>(undefined);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [statusToggleItem, setStatusToggleItem] = useState<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, searchTerm ? 300 : 0);
        return () => clearTimeout(timer);
    }, [page, searchTerm, isOfferFilter, hasDiscountFilter, sortBy, sortOrder]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                limit,
                sortBy,
                sort: sortOrder
            };
            if (searchTerm) params.search = searchTerm;
            if (isOfferFilter !== undefined) params.isOffer = isOfferFilter;
            if (hasDiscountFilter !== undefined) params.hasDiscount = hasDiscountFilter;

            // Cache key for global products
            const cacheKey = 'global_products';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setProducts(cachedData.data || []);
                setTotalPages(cachedData.meta?.totalPages || 1);
                setLoading(false);
                return;
            }

            // Fetch globally using the seller products endpoint (which admin can access for all stores)
            const data: any = await productsApi.getSellerProducts(params);

            if (data && data.data) {
                setProducts(data.data);
                if (data.meta) {
                    setTotalPages(data.meta.totalPages || 1);
                }
                setCache(cacheKey, data, params);
            } else {
                setProducts([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch global products', error);
            toast.error(t('loadFailed'));
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await productsApi.deleteProduct(deleteId);
            toast.success(t('deleteSuccess'));
            setProducts(prev => prev.filter(p => p.id !== deleteId));
            invalidateCache('global_products');
        } catch (error: any) {
            console.error('Failed to delete product', error);
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
            await productsApi.toggleStatus(statusToggleItem.id, !statusToggleItem.isActive);
            toast.success(t('common:success', { defaultValue: 'Status updated successfully' }));
            setProducts(prev => prev.map(p => p.id === statusToggleItem.id ? { ...p, isActive: !statusToggleItem.isActive } : p));
            invalidateCache('global_products');
        } catch (error: any) {
            console.error('Failed to update status', error);
            toast.error(t('common:error', { defaultValue: 'Failed to update status' }));
        } finally {
            setStatusToggleItem(null);
        }
    };

    const canManage = hasAdminPermission(AdminPermissions.STORES_PRODUCTS_UPDATE);
    const isSystemAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    return (
        <div className="p-6 max-w-full mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('globalTitle', { defaultValue: 'All Product Management' })}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('globalSubtitle', { defaultValue: 'Search and manage products across all stores' })}
                    </p>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
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

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsOfferFilter(isOfferFilter === true ? undefined : true)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                isOfferFilter === true
                                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                            )}
                        >
                            <Tag size={16} className={isOfferFilter === true ? "fill-amber-500" : ""} />
                            <span>{t('isOffer')}</span>
                        </button>

                        <button
                            onClick={() => setHasDiscountFilter(hasDiscountFilter === true ? undefined : true)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                hasDiscountFilter === true
                                    ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                            )}
                        >
                            <Tag size={16} className={hasDiscountFilter === true ? "fill-rose-500" : ""} />
                            <span>{t('hasDiscount')}</span>
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                        <select
                            value={`${sortBy}:${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split(':');
                                setSortBy(field);
                                setSortOrder(order as any);
                            }}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="createdAt:DESC">{t('common:newest')}</option>
                            <option value="price:ASC">{t('lowToHigh')}</option>
                            <option value="price:DESC">{t('highToLow')}</option>
                            <option value="orderCount:DESC">{t('topSelling')}</option>
                            <option value="averageRating:DESC">{t('topRated')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('product')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard:store', { defaultValue: 'Store' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('price')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stock')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('orderCount')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('unitsSold')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <PackageOpen size={48} strokeWidth={1} />
                                            <p className="mt-2 text-lg font-medium">{t('noProductsFound')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <ImageWithFallback src={product.coverImage} alt={isRTL ? product.nameAr || product.name : product.name} className="w-12 h-12 rounded-lg object-cover" />
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white">
                                                        {isRTL ? product.nameAr || product.name : product.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {(isRTL ? product.category?.nameAr || product.category?.name : product.category?.name) || t('uncategorized')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div 
                                                onClick={() => navigate(`/stores/${product.store?.id}`)}
                                                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                                            >
                                                <Store size={14} />
                                                {isRTL ? product.store?.nameAr || product.store?.name : product.store?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold">
                                            {Number(product.price).toFixed(2)} {t('common:currencySymbol')}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {product.trackInventory ? product.inventory : t('unlimited')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium tabular-nums">
                                            {product.orderCount || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium tabular-nums">
                                            {product.unitsSold || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                product.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                            )}>
                                                {product.isActive ? t('active') : t('draft')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <MenuButton className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                                    <MoreVertical size={18} />
                                                </MenuButton>
                                                <MenuItems anchor="bottom end" className="z-50 w-48 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 focus:outline-none">
                                                    <MenuItem>
                                                        {({ focus }) => (
                                                            <button 
                                                                onClick={() => navigate(`/products/${product.id}`)}
                                                                className={clsx("w-full px-4 py-2 text-sm flex items-center gap-2", focus && "bg-slate-50 dark:bg-slate-700")}
                                                            >
                                                                <Eye size={16} /> {t('common:view')}
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                    {canManage && (
                                                        <MenuItem>
                                                            {({ focus }) => (
                                                                <button 
                                                                    onClick={() => {
                                                                        if (isSystemAdmin) {
                                                                            setStatusToggleItem(product);
                                                                        } else {
                                                                            navigate(`/products/edit/${product.id}`);
                                                                        }
                                                                    }}
                                                                    className={clsx("w-full px-4 py-2 text-sm flex items-center gap-2", focus && "bg-slate-50 dark:bg-slate-700")}
                                                                >
                                                                    <Edit size={16} /> {isSystemAdmin ? t('toggleStatus', { defaultValue: 'Toggle Status' }) : t('common:edit')}
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                    {(!isSystemAdmin && hasPermission(Permissions.PRODUCTS_DELETE)) && (
                                                         <MenuItem>
                                                            {({ focus }) => (
                                                                <button 
                                                                    onClick={() => handleDelete(product.id)}
                                                                    className={clsx("w-full px-4 py-2 text-sm flex items-center gap-2 text-rose-600", focus && "bg-rose-50 dark:bg-rose-900/20")}
                                                                >
                                                                    <Trash2 size={16} /> {t('common:delete')}
                                                                </button>
                                                            )}
                                                        </MenuItem>
                                                    )}
                                                </MenuItems>
                                            </Menu>
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
                title={t('deleteProduct')}
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

export default GlobalProductList;
