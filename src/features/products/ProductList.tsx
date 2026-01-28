import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Package, PackageOpen, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import productsApi from './api/products.api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { toast } from '../../utils/toast';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

const ProductList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['products', 'common']);
    const { isRTL } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data: any = await productsApi.getSellerProducts();
            setProducts(data.data || []);
        } catch (error) {
            console.error('Failed to fetch products', error);
            toast.error(t('loadFailed'));
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
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
            toast.error(t('deleteFailed'));
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Link
                    to="/products/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>{t('addProduct')}</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative max-w-md">
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

            {/* Products Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('product')}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('sku')}</th>
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
                            ) : filteredProducts.length === 0 ? (
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
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {product.coverImage ? (
                                                    <img src={product.coverImage} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-200" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-200">
                                                        <Package size={20} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                                                    <div className="flex items-center text-xs text-slate-500 mt-0.5">
                                                        <Tag size={12} className={isRTL ? "ml-1" : "mr-1"} />
                                                        {product.category?.name || t('uncategorized')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                            {product.sku || '—'}
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
                                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                            ${Number(product.price).toFixed(2)}
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
                                        <td className="px-6 py-4 text-right">
                                            <div className={clsx("flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200", isRTL ? "justify-start" : "justify-end")}>
                                                <button
                                                    onClick={() => navigate(`/products/edit/${product.id}`)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                    title={t('common:edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                    title={t('common:delete')}
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
