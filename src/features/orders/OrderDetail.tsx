import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, User, Phone, Save,
    Printer, Mail, AlertCircle, FileText, CheckCircle, Package, Globe
} from 'lucide-react';
import ordersApi from './api/orders.api';
import { OrderStatus } from '../../types/order-status';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputModal from '../../components/ui/InputModal';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Permissions } from '../../types/permissions';
import clsx from 'clsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(['orders', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
    const { hasPermission } = useAuth();
    const { invalidateCache } = useCache();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [newStatus, setNewStatus] = useState('');

    // Modal States
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean; status: string }>({ isOpen: false, status: '' });
    const [cancelModal, setCancelModal] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data: any = await ordersApi.getOrder(id);
            setOrder(data);
            setNewStatus(data.status);
        } catch (error) {
            console.error('Failed to fetch order', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusClick = (status: string) => {
        if (!status || status === order.status) return;
        if (!hasPermission(Permissions.ORDERS_UPDATE)) return;
        setStatusModal({ isOpen: true, status });
    };

    const confirmStatusUpdate = async () => {
        const status = statusModal.status;
        if (!status) return;

        try {
            setUpdating(true);
            setNewStatus(status);
            await ordersApi.updateOrderStatus(id!, status);
            setOrder({ ...order, status: status });
            setStatusModal({ isOpen: false, status: '' });

            // Invalidate orders cache to refresh list
            invalidateCache('orders');
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setUpdating(false);
            setNewStatus('');
        }
    };

    const handleCancelOrder = async (reason: string) => {
        try {
            setUpdating(true);
            await ordersApi.cancelOrder(id!, reason);
            setCancelModal(false);

            // Invalidate orders cache to refresh list
            invalidateCache('orders');

            window.location.reload();
        } catch (error) {
            console.error('Failed to cancel order', error);
            // Ideally toast error
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!order) return <div className={clsx("p-6", isRTL && "text-right")}>{t('noOrdersFound')}</div>;

    const statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.DELIVERED
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case OrderStatus.CONFIRMED: return 'text-blue-600 bg-blue-50 border-blue-200';
            case OrderStatus.PREPARING: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case OrderStatus.READY: return 'text-purple-600 bg-purple-50 border-purple-200';
            case OrderStatus.DELIVERED: return 'text-green-600 bg-green-50 border-green-200';
            case OrderStatus.CANCELLED: return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`dashboard:status.${status.toLowerCase()}`, { defaultValue: status.replace(/_/g, ' ') });
    };

    // Helper to resolve variant names
    const getVariantDetails = (item: any): string[] => {
        if (!item.selectedVariants || item.selectedVariants.length === 0) return [];

        return item.selectedVariants.map((sv: any) => {
            // Use snapshot data if available (this is what the backend currently sends)
            if (sv.variant && sv.variantValue) {
                const vName = isRTL ? sv.variant.nameAr || sv.variant.name : sv.variant.name;
                const valName = isRTL ? sv.variantValue.valueAr || sv.variantValue.value : sv.variantValue.value;
                const price = sv.variantValue.price > 0
                    ? ` (+${Number(sv.variantValue.price).toFixed(2)} ${t('common:currencySymbol')})`
                    : '';
                return `${vName}: ${valName}${price}`;
            }

            // Fallback for older or simpler data structures
            if (sv.variantId && sv.valueId && item.product?.variants) {
                const variant = item.product.variants.find((v: any) => v.id === sv.variantId);
                if (!variant) return null;
                const value = variant.values.find((val: any) => val.id === sv.valueId);
                if (!value) return null;

                const vName = isRTL ? variant.nameAr || variant.name : variant.name;
                const valName = isRTL ? value.valueAr || value.value : value.value;
                const price = value.price > 0
                    ? ` (+${Number(value.price).toFixed(2)} ${t('common:currencySymbol')})`
                    : '';
                return `${vName}: ${valName}${price}`;
            }

            return null;
        }).filter(Boolean);
    };

    // Helper to resolve addon names
    const getAddonDetails = (item: any): string[] => {
        if (!item.selectedAddons || item.selectedAddons.length === 0) return [];

        return item.selectedAddons.map((sa: any) => {
            const name = isRTL ? sa.nameAr || sa.name : sa.name;
            const quantity = sa.quantity > 1 ? ` x${sa.quantity}` : '';
            const price = sa.price > 0
                ? ` (+${(Number(sa.price) * (sa.quantity || 1)).toFixed(2)} ${t('common:currencySymbol')})`
                : '';
            return `${name}${quantity}${price}`;
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/orders')}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                            <ArrowLeft size={20} className={clsx("text-slate-500", isRTL && "rotate-180")} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {t('orderNumber', { number: order.orderNumber || order.id.substring(0, 8) })}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <Clock size={14} />
                                {t('placedOn', { date: new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US') })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Printer size={16} />
                            {t('printInvoice')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <Package className="text-indigo-500" size={20} />
                                    {t('orderItems')}
                                </h2>
                                <span className="text-sm text-slate-500">{t('itemsCount', { count: order.items.length })}</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-medium shrink-0 overflow-hidden">
                                            {item.product?.coverImage ? (
                                                <ImageWithFallback src={item.product.coverImage} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>x{item.quantity}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate pe-4">
                                                    {item.productName}
                                                </h3>
                                                <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    {(Number(item.price) * item.quantity).toFixed(2)} {t('common:currencySymbol')}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm text-slate-500 mb-1">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                    {Number(item.price).toFixed(2)} {t('common:currencySymbol')} {t('each')}
                                                </span>
                                                <span>x {item.quantity}</span>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {getVariantDetails(item).map((detail, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                            {detail}
                                                        </p>
                                                    </div>
                                                ))}
                                                {getAddonDetails(item).map((detail, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="text-emerald-500 font-bold text-xs shrink-0">+</span>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                                                            {detail}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 space-y-3 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t('subtotal')}</span>
                                    <span>{Number(order.subtotal).toFixed(2)} {t('common:currencySymbol')}</span>
                                </div>
                                {Number(order.deliveryFee) > 0 && (
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{t('deliveryFee')}</span>
                                        <span>{Number(order.deliveryFee).toFixed(2)} {t('common:currencySymbol')}</span>
                                    </div>
                                )}
                                {Number(order.promoDiscount) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>{t('discount')}</span>
                                        <span>-{Number(order.promoDiscount).toFixed(2)} {t('common:currencySymbol')}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{t('total')}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl">
                                        {Number(order.totalAmount || order.total).toFixed(2)} {t('common:currencySymbol')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Note */}
                        {order.notes && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <FileText className="text-amber-500" size={20} />
                                    {t('orderNotes')}
                                </h3>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 rounded-lg text-sm leading-relaxed border border-amber-100 dark:border-amber-900/30">
                                    {order.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Stepper */}
                        {order.status !== OrderStatus.CANCELLED && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('orderProgress')}</h3>
                                <div className="relative flex flex-col gap-0">
                                    {statuses.map((status, index) => {
                                        const isCompleted = statuses.indexOf(order.status) >= index;
                                        const isCurrent = order.status === status;
                                        const isFuture = statuses.indexOf(order.status) < index;
                                        const isClickable = statuses.indexOf(order.status) === index - 1 && hasPermission(Permissions.ORDERS_UPDATE); // Can only click direct next step

                                        return (
                                            <div key={status} className="flex gap-4 relative pb-8 last:pb-0">
                                                {index !== statuses.length - 1 && (
                                                    <div className={`absolute top-8 bottom-0 w-0.5 ${isCompleted && !isCurrent ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'} start-[15px]`} />
                                                )}

                                                <button
                                                    onClick={() => isClickable ? handleStatusClick(status) : null}
                                                    disabled={updating || !isClickable}
                                                    className={`
                                                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                                                        ${isCompleted
                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                            : isClickable
                                                                ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600'}
                                                    `}
                                                >
                                                    {updating && isClickable && newStatus === status ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                                                    ) : isCompleted ? (
                                                        <CheckCircle size={14} />
                                                    ) : (
                                                        <span className="text-xs font-bold">{index + 1}</span>
                                                    )}
                                                </button>

                                                <div className={clsx("mt-1 flex-1", isClickable ? "cursor-pointer" : "")} onClick={() => isClickable ? handleStatusClick(status) : null}>
                                                    <h4 className={`font-bold text-sm ${isCompleted || isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                                        {getStatusLabel(status)}
                                                    </h4>
                                                    <p className="text-xs text-slate-500">
                                                        {isCurrent ? t('currentStatus') : isCompleted ? t('completed') : t('pending')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        {/* Customer Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="text-indigo-500" size={20} />
                                {t('customer')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {order.client?.name?.[0] || order.clientInfo?.name?.[0] || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {order.client?.name || order.clientInfo?.name || t('guest')}
                                        </p>
                                        <p className="text-xs text-slate-500">{t('customer')}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 group cursor-pointer hover:text-indigo-600 transition-colors">
                                        <Mail size={16} className="text-slate-400" />
                                        <span>{order.client?.email || order.clientInfo?.email || t('noEmail')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 group cursor-pointer hover:text-indigo-600 transition-colors">
                                        <Phone size={16} className="text-slate-400" />
                                        <span>{order.client?.phone || order.clientInfo?.phone || t('noPhone')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="text-indigo-500" size={20} />
                                {t('deliveryDetails')}
                            </h3>
                            <div className="space-y-4">
                                {order.deliveryAddress ? (
                                    <>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                                <Globe size={16} className="text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {isRTL ?
                                                            `${order.deliveryAddress.townArName} (${order.deliveryAddress.townEnName})` :
                                                            `${order.deliveryAddress.townEnName} (${order.deliveryAddress.townArName})`
                                                        }
                                                    </p>
                                                    <p>
                                                        {isRTL ?
                                                            `${order.deliveryAddress.placeArName} (${order.deliveryAddress.placeEnName})` :
                                                            `${order.deliveryAddress.placeEnName} (${order.deliveryAddress.placeArName})`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                                <MapPin size={16} className="text-slate-400 mt-0.5" />
                                                <span>{order.deliveryAddress.addressDetails}</span>
                                            </div>
                                            {(order.deliveryAddress.phone || order.deliveryAddress.email) && (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('contactForDelivery')}</p>
                                                    {order.deliveryAddress.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <Phone size={14} className="text-slate-400" />
                                                            <span>{order.deliveryAddress.phone}</span>
                                                        </div>
                                                    )}
                                                    {order.deliveryAddress.email && (
                                                        <div className="flex items-center gap-3">
                                                            <Mail size={14} className="text-slate-400" />
                                                            <span>{order.deliveryAddress.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Map */}
                                        {order.deliveryAddress.latitude && order.deliveryAddress.longitude && (
                                            <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-48">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    marginHeight={0}
                                                    marginWidth={0}
                                                    src={`https://maps.google.com/maps?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}&z=15&output=embed`}
                                                ></iframe>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={clsx("flex items-center gap-3 text-slate-600 dark:text-slate-400 italic", isRTL && "flex-row-reverse")}>
                                        <AlertCircle size={16} className="text-amber-500" />
                                        <span>{t('noDeliveryInfo')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cancel Order Section */}
                        {hasPermission(Permissions.ORDERS_CANCEL) && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <AlertCircle className="text-rose-500" size={20} />
                                    {t('cancelOrder')}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {t('cancelOrderWarning')}
                                </p>
                                <button
                                    onClick={() => setCancelModal(true)}
                                    className="w-full py-2.5 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium transition-colors"
                                >
                                    {t('cancelOrder')}
                                </button>
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={statusModal.isOpen}
                title={t('updateStatusTitle')}
                message={t('updateStatusConfirm', { status: getStatusLabel(statusModal.status) })}
                onConfirm={confirmStatusUpdate}
                confirmLabel={t('confirmUpdateLabel')}
                onCancel={() => setStatusModal({ isOpen: false, status: '' })}
                isLoading={updating}
            />

            <InputModal
                isOpen={cancelModal}
                title={t('cancelOrder')}
                message={t('cancelOrderWarning')}
                placeholder={t('cancelReasonPlaceholder')}
                submitLabel={t('cancelOrder')}
                onSubmit={handleCancelOrder}
                onCancel={() => setCancelModal(false)}
                isLoading={updating}
            />
        </div>
    );
};

export default OrderDetail;
