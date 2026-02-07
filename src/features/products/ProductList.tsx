import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Package, PackageOpen, Star, Eye } from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import productsApi from './api/products.api';
import categoriesApi from '../categories/api/categories.api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Permissions } from '../../types/permissions';
import { Pagination } from '../../components/common/Pagination';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

const ProductList = () => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(['products', 'common']);
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
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isOfferFilter, setIsOfferFilter] = useState<boolean | undefined>(undefined);
    const [hasDiscountFilter, setHasDiscountFilter] = useState<boolean | undefined>(undefined);
    const [sortBy, setSortBy] = useState('sortOrder');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [categories, setCategories] = useState<any[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, searchTerm ? 300 : 0); // Debounce search
        return () => clearTimeout(timer);
    }, [page, searchTerm, selectedCategory, isOfferFilter, hasDiscountFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            // Check cache first
            const cachedCategories = getCache<any[]>('categories');
            if (cachedCategories) {
                setCategories(cachedCategories);
                return;
            }

            // Fetch from API if not cached
            const res: any = await categoriesApi.getSellerCategories();
            const categoriesData = res.data || [];
            setCategories(categoriesData);

            // Cache the data
            setCache('categories', categoriesData);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

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
            if (selectedCategory) params.categoryId = selectedCategory;
            if (isOfferFilter !== undefined) params.isOffer = isOfferFilter;
            if (hasDiscountFilter !== undefined) params.hasDiscount = hasDiscountFilter;

            // Check cache first
            const cacheKey = 'products';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                setProducts(cachedData.data || []);
                setTotalPages(cachedData.meta?.totalPages || 1);
                setLoading(false);
                return;
            }

            // Fetch from API if not cached
            const data: any = await productsApi.getSellerProducts(params);

            if (data && data.data) {
                setProducts(data.data);
                if (data.meta) {
                    setTotalPages(data.meta.totalPages || 1);
                }

                // Cache the data
                setCache(cacheKey, data, params);
            } else {
                setProducts([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
            toast.error(t('loadFailed'));
            setProducts([]);
            setTotalPages(1);
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

            // Immediately remove the product from the list for better UX
            setProducts(prevProducts => prevProducts.filter(p => p.id !== deleteId));

            // Invalidate products cache to force refresh on next load
            invalidateCache('products');
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error(t('deleteFailed'));
            // Refetch to restore the list if deletion failed
            fetchProducts();
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                {hasPermission(Permissions.PRODUCTS_CREATE) && (
                    <Link
                        to="/products/new"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    >
                        <Plus size={20} />
                        <span>{t('addProduct')}</span>
                    </Link>
                )}
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
                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">{t('category')}</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {isRTL ? (cat.nameAr || cat.name) : cat.name}
                                </option>
                            ))}
                        </select>

                        {/* Offer Filter */}
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

                        {/* Discount Filter */}
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

                        {/* Sort By */}
                        <select
                            value={`${sortBy}:${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split(':');
                                setSortBy(field);
                                setSortOrder(order as any);
                            }}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="sortOrder:ASC">{t('sortOrder')}</option>
                            <option value="price:ASC">{t('lowToHigh')}</option>
                            <option value="price:DESC">{t('highToLow')}</option>
                            <option value="orderCount:DESC">{t('topSelling')}</option>
                            <option value="orderCount:ASC">{t('lowSelling')}</option>
                            <option value="averageRating:DESC">{t('topRated')}</option>
                            <option value="averageRating:ASC">{t('lowRated')}</option>
                            <option value="createdAt:DESC">{t('common:newest')}</option>
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
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('sku')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('sortOrder')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('rating', { defaultValue: 'Rating' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stock')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('price')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                                                <PackageOpen size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('noProductsFound')}</p>
                                            <p className="text-sm mt-1">{t('getStarted')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {product.coverImage ? (
                                                        <ImageWithFallback src={product.coverImage} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-200" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-200">
                                                            <Package size={20} strokeWidth={1.5} />
                                                        </div>
                                                    )}
                                                    {product.isOffer && (
                                                        <div className={clsx(
                                                            "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm border",
                                                            "bg-amber-500 text-white border-amber-400 animate-pulse"
                                                        )}>
                                                            {t('isOffer')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3
                                                            onClick={() => navigate(`/products/${product.id}`)}
                                                            className="font-semibold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                                        >
                                                            {isRTL ? product.nameAr || product.name : product.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                                        <Tag size={12} className={isRTL ? "ml-1" : "mr-1"} />
                                                        {(isRTL ? product.category?.nameAr || product.category?.name : product.category?.name) || t('uncategorized')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                            {product.sku || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    #{product.sort || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md w-fit border border-yellow-100 dark:border-yellow-900/40">
                                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                                                    {Number(product.averageRating || 0).toFixed(1)}
                                                </span>
                                                <span className="text-[10px] text-yellow-600/60 dark:text-yellow-400/50 uppercase font-medium">
                                                    ({product.totalReviews || 0})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.trackInventory ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.inventory > 10 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                    product.inventory > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                        'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                                                    }`}>
                                                    {product.inventory} {t('inStock')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">{t('unlimited')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {Number(product.price).toFixed(2)} {t('common:currencySymbol')}
                                                </span>
                                                {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                                    <span className="text-xs text-slate-400 line-through decoration-rose-400/50">
                                                        {Number(product.comparePrice).toFixed(2)} {t('common:currencySymbol')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full", isRTL ? "ml-1.5" : "mr-1.5", product.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                                                {product.isActive ? t('active') : t('draft')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx("flex items-center gap-2 transition-opacity duration-200", isRTL ? "justify-start" : "justify-end")}>
                                                <button
                                                    onClick={() => navigate(`/products/${product.id}`)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                    title={t('common:view')}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasPermission(Permissions.PRODUCTS_UPDATE) && (
                                                    <button
                                                        onClick={() => navigate(`/products/edit/${product.id}`)}
                                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                        title={t('common:edit')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {hasPermission(Permissions.PRODUCTS_DELETE) && (
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
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

            <ConfirmModal
                isOpen={confirmOpen}
                title={t('deleteProduct')}
                message={t('deleteConfirmation')}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default ProductList;
