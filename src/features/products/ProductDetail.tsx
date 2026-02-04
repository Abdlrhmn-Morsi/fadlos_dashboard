import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Edit, Tag, DollarSign, Package, CheckCircle, XCircle } from 'lucide-react';
import productsApi from './api/products.api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { t } = useTranslation(['products', 'common', 'addons']);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const data: any = await productsApi.getProduct(id!);
            setProduct(data);
        } catch (error) {
            console.error('Failed to fetch product', error);
            alert(t('common:loadFailed'));
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-slate-500">{t('common:loading')}</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-slate-500">{t('noProductsFound')}</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('productDetails')}</h1>
                </div>
                <button
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                >
                    <Edit size={18} />
                    <span>{t('editProduct')}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Product Image / Media */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t('media')}</h4>
                        {product.coverImage ? (
                            <img
                                src={product.coverImage}
                                alt={product.name}
                                className="w-full h-80 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-80 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Tag size={64} className="text-slate-400" />
                            </div>
                        )}

                        {/* Additional Images */}
                        {product.images && product.images.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('galleryImages')}
                                </h5>
                                <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                                    {t('galleryImagesSubtitle')}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((img: string, idx: number) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`${product.name} ${idx + 1}`}
                                            className="w-full h-20 object-cover rounded"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                                    {product.name}
                                </h2>
                                {product.isOffer && (
                                    <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider animate-pulse">
                                        {t('offer')}
                                    </span>
                                )}
                            </div>
                            {product.nameAr && (
                                <h3 className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                                    {product.nameAr}
                                </h3>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                                    <DollarSign size={28} />
                                    <span>{Number(product.price).toFixed(2)}</span>
                                </div>
                                {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                    <div className="text-sm text-slate-400 line-through mt-1">
                                        {t('originalPrice')}: {Number(product.comparePrice).toFixed(2)}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {product.isAvailable ? (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-semibold">
                                        <CheckCircle size={16} />
                                        {t('common:available')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-full text-sm font-semibold">
                                        <XCircle size={16} />
                                        {t('common:unavailable')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className={clsx("flex items-center gap-2 text-slate-600 dark:text-slate-400", isRTL && "flex-row-reverse text-right")}>
                                <Package size={20} />
                                <span className="font-semibold">{t('category')}:</span>
                                <span>{(isRTL ? product.category?.nameAr || product.category?.name : product.category?.name) || t('uncategorized')}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t('description')}</h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {product.description || t('noDescription')}
                            </p>
                            {product.descriptionAr && (
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-3 text-right" dir="rtl">
                                    {product.descriptionAr}
                                </p>
                            )}
                        </div>

                        {/* Product Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h4 className="font-bold text-slate-800 dark:text-white mb-3">{t('variants')}</h4>
                                <div className="space-y-3">
                                    {product.variants.map((variant: any) => (
                                        <div key={variant.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {isRTL ? variant.nameAr || variant.name : variant.name}
                                                </div>
                                                {variant.isRequired && (
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                                        {t('common:required')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.values?.map((value: any) => (
                                                    <span
                                                        key={value.id}
                                                        className="px-3 py-1 bg-white dark:group-hover:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-600 dark:text-slate-400"
                                                    >
                                                        {isRTL ? value.valueAr || value.value : value.value}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Add-ons */}
                        {product.addons && product.addons.length > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{t('addons:title')}</h4>
                                    {product.addonsRequired && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm transition-all animate-pulse">
                                            {t('common:required')}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.addons.map((addon: any) => (
                                        <div key={addon.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                                {addon.image ? (
                                                    <img src={addon.image} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Package size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                        {isRTL ? addon.nameAr || addon.name : addon.name}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {Number(addon.price).toFixed(2)} {isRTL ? 'د.ك' : 'KWD'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
