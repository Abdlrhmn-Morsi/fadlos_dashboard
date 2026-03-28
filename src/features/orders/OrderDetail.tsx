import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, User, Phone, Save,
    Printer, Mail, AlertCircle, FileText, CheckCircle, Package, Globe, Truck, Camera,
    Search, X, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, BadgeCheck, DollarSign,
    RefreshCw, UserMinus, Sparkles
} from 'lucide-react';
import ordersApi from './api/orders.api';
import settlementsApi from './api/settlements.api';
import { OrderStatus } from '../../types/order-status';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputModal from '../../components/ui/InputModal';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import { Permissions } from '../../types/permissions';
import { UserRole } from '../../types/user-role';
import clsx from 'clsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { toast } from '../../utils/toast';

const OrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation(['orders', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
    const { user, hasPermission } = useAuth();
    const { invalidateCache, updateCacheItem, getCache, setCache } = useCache();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [newStatus, setNewStatus] = useState('');

    // Modal States
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean; status: string }>({ isOpen: false, status: '' });
    const [cancelModal, setCancelModal] = useState(false);
    const [returnModal, setReturnModal] = useState(false);
    const [storeReturnModal, setStoreReturnModal] = useState(false);
    const [confirmDeliveryModal, setConfirmDeliveryModal] = useState(false);
    const [confirmUnassignModal, setConfirmUnassignModal] = useState(false);
    const [mustConfirmOrderModal, setMustConfirmOrderModal] = useState(false);
    const [deliveryPin, setDeliveryPin] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);

    useEffect(() => {
        fetchOrder();
    }, [id]);



    const fetchOrder = async () => {
        try {
            if (!id) return;
            
            // Check cache first to avoid flicker
            const cachedOrder = getCache<any>(`order-${id}`);
            if (cachedOrder) {
                setOrder(cachedOrder);
                setNewStatus(cachedOrder.status);
                // Don't return, still fetch fresh data in background
                setLoading(false);
            } else {
                setLoading(true);
            }

            const data: any = await ordersApi.getOrder(id);
            setOrder(data);
            setNewStatus(data.status);
            // Cache with persistence
            setCache(`order-${id}`, data, undefined, true);
        } catch (error) {
            console.error('Failed to fetch order', error);
        } finally {
            setLoading(false);
        }
    };



    const handleUnassignDriver = async () => {
        try {
            setUpdating(true);
            const response = await ordersApi.unassignDriver(id!);
            setConfirmUnassignModal(false);
            fetchOrder();
            const msgKey = response?.data?.message || response?.message;
            const successMsg = msgKey ? String(t(`common:${msgKey}`, msgKey)) : t('common:driverUnassignedSuccessfully', 'Driver unassigned successfully');
            toast.success(successMsg);
        } catch (error: any) {
            console.error('Failed to unassign driver', error);
            const errorData = error?.response?.data?.message;
            const errorKey = typeof errorData === 'string' ? errorData : Array.isArray(errorData) ? errorData[0] : null;
            const message = errorKey ? String(t(`common:${errorKey}`, errorKey)) : t('common:error', 'Failed to unassign driver');
            toast.error(message);
        } finally {
            setUpdating(false);
        }
    };

    const handleConfirmDelivery = async () => {
        if (!deliveryPin) return;
        try {
            setUpdating(true);
            await ordersApi.confirmDelivery(id!, deliveryPin, proofImage || undefined);
            setConfirmDeliveryModal(false);
            setDeliveryPin('');
            setProofImage(null);
            fetchOrder();
            toast.success(t('orders:orderDelivered', 'Order marked as delivered'));
        } catch (error: any) {
            console.error('Failed to confirm delivery', error);
            toast.error(error.response?.data?.message || t('common:error', 'Invalid PIN or error confirming delivery'));
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            setUpdating(true);
            await ordersApi.updateOrderStatus(id!, status);

            // Update local state and cache
            const oldStatus = order.status;
            const updatedOrder = { ...order, status: status };
            setOrder(updatedOrder);

            // Update order detail cache
            setCache(`order-${id}`, updatedOrder, undefined, true);

            // Update list cache
            updateCacheItem('orders', id!, (o: any) => ({ ...o, status }), 'id', true);

            // Update status counts
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                const updatedCounts = { ...cachedCounts };
                if (updatedCounts[oldStatus]) updatedCounts[oldStatus] = Math.max(0, updatedCounts[oldStatus] - 1);
                updatedCounts[status] = (updatedCounts[status] || 0) + 1;
                setCache('order-status-counts', updatedCounts, undefined, true);
            }

            fetchOrder(); // Full refresh to be safe
            toast.success(t('orders:orderUpdated', 'Order status updated successfully'));
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error(t('common:error', 'Failed to update order status'));
        } finally {
            setUpdating(false);
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

        const oldStatus = order.status; // Store old status for cache update

        try {
            setUpdating(true);
            setNewStatus(status);
            await ordersApi.updateOrderStatus(id!, status);
            
            // Set local status immediately for UI response
            const updatedOrder = { ...order, status: status };
            setOrder(updatedOrder);
            setStatusModal({ isOpen: false, status: '' });

            // Update order detail cache
            setCache(`order-${id}`, updatedOrder, undefined, true);

            // Update list cache
            updateCacheItem('orders', id!, (o: any) => ({ ...o, status }), 'id', true);

            // Update status counts cache
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                const updatedCounts = { ...cachedCounts };
                if (updatedCounts[oldStatus]) {
                    updatedCounts[oldStatus] = Math.max(0, updatedCounts[oldStatus] - 1);
                }
                updatedCounts[status] = (updatedCounts[status] || 0) + 1;
                setCache('order-status-counts', updatedCounts, undefined, true);
            }

            // Invalidate dashboard cache to refresh stats
            invalidateCache('dashboard-stats');
            
            // Fetch fresh order data to get the new status history
            fetchOrder();
        } catch (error: any) {
            console.error('Failed to update status', error);
            const errorMessage = error.response?.data?.message || t('common:error', 'Failed to update order status');
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
            setNewStatus('');
        }
    };

    const handleCancelOrder = async (reason: string) => {
        const oldStatus = order.status; // Store old status for cache update

        try {
            setUpdating(true);
            await ordersApi.cancelOrder(id!, reason);
            setCancelModal(false);

            // Update the order in cache
            updateCacheItem('orders', id!, (order: any) => ({
                ...order,
                status: OrderStatus.CANCELLED
            }), 'id', true);

            // Update status counts cache
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                const updatedCounts = { ...cachedCounts };
                // Decrease old status count
                if (updatedCounts[oldStatus]) {
                    updatedCounts[oldStatus] = Math.max(0, updatedCounts[oldStatus] - 1);
                }
                // Increase cancelled count
                updatedCounts[OrderStatus.CANCELLED] = (updatedCounts[OrderStatus.CANCELLED] || 0) + 1;
                setCache('order-status-counts', updatedCounts, undefined, true);
            }

            // Invalidate dashboard cache to refresh stats
            invalidateCache('dashboard-stats');

            // Update local state and reload to show cancelled status
            window.location.reload();
        } finally {
            setUpdating(false);
        }
    };

    const handleReturnOrder = async (reason: string) => {
        try {
            setUpdating(true);
            await ordersApi.returnOrder(id!, reason);
            setReturnModal(false);

            // Update the order in cache
            updateCacheItem('orders', id!, (order: any) => ({
                ...order,
                status: OrderStatus.RETURNED
            }), 'id', true);

            // Invalidate dashboard cache to refresh stats
            invalidateCache('dashboard-stats');

            // Update local state and reload to show returned status
            window.location.reload();
        } catch (error) {
            console.error('Failed to return order', error);
            toast.error(t('common:error', 'Failed to return order'));
        } finally {
            setUpdating(false);
        }
    };

    const handleStoreReturnOrder = async (reason: string) => {
        try {
            setUpdating(true);
            await ordersApi.storeReturnOrder(id!, reason);
            setStoreReturnModal(false);

            updateCacheItem('orders', id!, (order: any) => ({
                ...order,
                status: OrderStatus.RETURNED
            }), 'id', true);

            invalidateCache('dashboard-stats');
            window.location.reload();
        } catch (error) {
            console.error('Failed to return order', error);
            toast.error(t('common:error', 'Failed to return order'));
        } finally {
            setUpdating(false);
        }
    };

    const handleResetReturnedOrder = async () => {
        try {
            setUpdating(true);
            await ordersApi.resetReturnedOrder(id!);

            updateCacheItem('orders', id!, (order: any) => ({
                ...order,
                status: OrderStatus.PENDING,
                driverId: null,
                driver: null
            }), 'id', true);

            invalidateCache('dashboard-stats');
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset order', error);
            toast.error(t('common:error', 'Failed to reset order'));
        } finally {
            setUpdating(false);
        }
    };

    const handleSettleOrder = async () => {
        try {
            setUpdating(true);
            await settlementsApi.createSettlement(order.driverId, [id!]);
            toast.success(t('orders:collectionSuccess', 'Order settled successfully'));
            fetchOrder();
        } catch (error) {
            console.error('Failed to settle order', error);
            toast.error(t('common:error', 'Failed to settle order'));
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!order) return <div className={clsx("p-6", isRTL && "text-right")}>{t('orders:noOrdersFound')}</div>;

    const statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY,
        order.status === OrderStatus.RETURNED ? OrderStatus.RETURNED : OrderStatus.DELIVERED
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case OrderStatus.CONFIRMED: return 'text-blue-600 bg-blue-50 border-blue-200';
            case OrderStatus.PREPARING: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case OrderStatus.READY: return 'text-purple-600 bg-purple-50 border-purple-200';
            case OrderStatus.OUT_FOR_DELIVERY: return 'text-orange-600 bg-orange-50 border-orange-200';
            case OrderStatus.DELIVERED: return 'text-green-600 bg-green-50 border-green-200';
            case OrderStatus.CANCELLED: return 'text-rose-600 bg-rose-50 border-rose-200';
            case OrderStatus.RETURNED: return 'text-slate-600 bg-slate-100 border-slate-300';
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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 print:bg-white print:p-0" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 space-y-6 print:hidden">
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
                                    {t('orders:orderNumber', { number: order.orderNumber || order.id.substring(0, 8) })}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <Clock size={14} />
                                {t('orders:placedOn', { date: new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US') })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Printer size={16} />
                            {t('orders:printInvoice')}
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
                                    {t('orders:orderItems')}
                                </h2>
                                <span className="text-sm text-slate-500">{t('orders:itemsCount', { count: order.items.length })}</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-medium shrink-0 overflow-hidden">
                                            {item.product?.coverImage ? (
                                                <ImageWithFallback src={item.product.coverImage} alt={item.productName || item.product?.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>x{item.quantity}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate pe-4">
                                                    {isRTL ? (item.product?.nameAr || item.product?.name || item.productName) : (item.product?.name || item.product?.nameAr || item.productName)}
                                                </h3>
                                                <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    {(Number(item.price) * item.quantity).toFixed(2)} {t('common:currencySymbol')}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm text-slate-500 mb-1">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                    {Number(item.price).toFixed(2)} {t('common:currencySymbol')} {t('orders:each')}
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
                                    <span>{t('orders:subtotal')}</span>
                                    <span>{Number(order.subtotal).toFixed(2)} {t('common:currencySymbol')}</span>
                                </div>
                                {Number(order.deliveryFee) > 0 && (
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>{t('orders:deliveryFee')}</span>
                                        <span>{Number(order.deliveryFee).toFixed(2)} {t('common:currencySymbol')}</span>
                                    </div>
                                )}
                                {Number(order.promoDiscount) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>{t('orders:discount')}</span>
                                        <span>-{Number(order.promoDiscount).toFixed(2)} {t('common:currencySymbol')}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{t('orders:total')}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl">
                                        {Number(order.totalAmount || order.total).toFixed(2)} {t('common:currencySymbol')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {order.notes && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <FileText className="text-amber-500" size={20} />
                                    {t('orders:orderNotes')}
                                </h3>
                                <div className={clsx(
                                    "p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 rounded-lg text-sm leading-relaxed border border-amber-100 dark:border-amber-900/30 break-words overflow-wrap-anywhere",
                                    isRTL && "text-right"
                                )}>
                                    {order.notes}
                                </div>
                            </div>
                        )}

                        {/* Cancellation Note */}
                        {order.status === OrderStatus.CANCELLED && order.statusNote && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-rose-200 dark:border-rose-800 p-6">
                                <h3 className="font-bold text-rose-900 dark:text-rose-200 mb-3 flex items-center gap-2">
                                    <AlertCircle className="text-rose-500" size={20} />
                                    {t('orders:cancellationReason')}
                                </h3>
                                <div className={clsx(
                                    "p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200 rounded-lg text-sm leading-relaxed border border-rose-100 dark:border-rose-900/30 break-words overflow-wrap-anywhere",
                                    isRTL && "text-right"
                                )}>
                                    {order.statusNote}
                                </div>
                            </div>
                        )}

                        {/* Status History */}
                        {order.statusHistory && order.statusHistory.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="text-indigo-500" size={20} />
                                    {t('orders:statusHistory')}
                                </h3>
                                <div className="space-y-3">
                                    {order.statusHistory.map((entry: any, index: number) => (
                                        <div key={index} className="flex gap-3 pb-3 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                                            <div className="shrink-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(entry.status)}`}>
                                                    <CheckCircle size={14} />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                                        {(() => {
                                                            try {
                                                                if (entry.notes) {
                                                                    const parsed = JSON.parse(entry.notes);
                                                                    if (parsed.type === 'driver_rejected') return t('orders:driverRejected');
                                                                    if (parsed.type === 'driver_unassigned') return t('orders:driverUnassigned');
                                                                }
                                                            } catch (e) { }
                                                            return getStatusLabel(entry.status);
                                                        })()}
                                                    </h4>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                                        {new Date(entry.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {entry.notes && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 break-words mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700/50">
                                                        {(() => {
                                                            try {
                                                                const parsed = JSON.parse(entry.notes);
                                                                return isRTL ? (parsed.ar || parsed.en) : (parsed.en || parsed.ar);
                                                            } catch (e) {
                                                                if (entry.notes === 'Order placed - Cash on Delivery') {
                                                                    return isRTL ? 'تم تقديم الطلب - الدفع عند الاستلام' : 'Order placed - Cash on Delivery';
                                                                }
                                                                return entry.notes;
                                                            }
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Stepper */}
                        {order.status !== OrderStatus.CANCELLED && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('orders:orderProgress')}</h3>
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
                                                    <p className="text-xs text-slate-500 mb-1">
                                                        {t(`orders:statusDesc.${status.toLowerCase()}`)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-medium">
                                                        {isCurrent ? t('orders:currentStatus') : isCompleted ? t('orders:completed') : t('orders:pending')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}


                        {/* Branch Details */}
                        {order.branch && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Package className="text-indigo-500" size={20} />
                                    {t('orders:branch')}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    {(order.branch.town?.enName || order.branch.town?.arName) && (
                                        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                            <Globe size={16} className="text-slate-400 mt-0.5" />
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {isRTL
                                                    ? (order.branch.town?.arName || order.branch.town?.enName)
                                                    : (order.branch.town?.enName || order.branch.town?.arName)}
                                            </p>
                                        </div>
                                    )}
                                    {(order.branch.place?.enName || order.branch.place?.arName) && (
                                        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                            <MapPin size={16} className="text-slate-400 mt-0.5" />
                                            <p>
                                                {isRTL
                                                    ? (order.branch.place?.arName || order.branch.place?.enName)
                                                    : (order.branch.place?.enName || order.branch.place?.arName)}
                                            </p>
                                        </div>
                                    )}
                                    {(order.branch.addressEn || order.branch.addressAr) && (
                                        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                            <MapPin size={16} className="text-slate-400 mt-0.5" />
                                            <p>
                                                {isRTL
                                                    ? (order.branch.addressAr || order.branch.addressEn)
                                                    : (order.branch.addressEn || order.branch.addressAr)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Customer Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="text-indigo-500" size={20} />
                                {t('orders:customer')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-800">
                                        {(order.clientInfo?.profileImage || order.client?.profileImage) ? (
                                            <ImageWithFallback
                                                src={order.clientInfo?.profileImage || order.client?.profileImage!}
                                                alt={order.clientInfo?.name || order.client?.name || ''}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                {(order.clientInfo?.name || order.client?.name || 'G')[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                            {order.clientInfo?.name || order.client?.name || t('orders:guest')}
                                        </p>
                                        <p className="text-xs text-slate-500">{t('orders:customer')}</p>
                                    </div>
                                </div>


                            </div>
                        </div>


                        {/* Delivery Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MapPin className="text-indigo-500" size={20} />
                                {t('orders:deliveryDetails')}
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
                                                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('orders:contactForDelivery')}</p>
                                                     {order.deliveryAddress.phone && (
                                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                                            <Phone size={14} className="text-slate-400" />
                                                            <span>{order.deliveryAddress.phone}</span>
                                                        </div>
                                                    )}
                                                    {order.deliveryAddress.email && (
                                                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
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
                                        <span>{t('orders:noDeliveryInfo')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Settlement Info Section */}
                        {order.paymentMethod === 'CASH_ON_DELIVERY' && order.status === OrderStatus.DELIVERED && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="text-emerald-500" size={20} />
                                    {t('orders:settlementStatus')}
                                </h3>

                                {order.isSettled ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg font-bold">
                                            <CheckCircle size={18} />
                                            <span>{t('orders:isSettled')}</span>
                                        </div>
                                        {order.settlement && (
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('orders:settlementReference')}</p>
                                                <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{order.settlement.settlementNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg font-bold">
                                            <AlertCircle size={18} />
                                            <span>{t('orders:notSettled')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {t('settlePrompt')}
                                        </p>
                                        <button
                                            onClick={handleSettleOrder}
                                            disabled={updating || !order.driverId}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none"
                                        >
                                            <CheckCircle size={18} />
                                            {t('settleNow')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Logistics Section */}
                        {((user?.role === UserRole.STORE_OWNER) || (user?.role === UserRole.EMPLOYEE && hasPermission('orders.assign_driver'))) && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Truck className="text-indigo-500" size={20} />
                                    {t('logistics', 'Logistics')}
                                </h3>



                                {order.driver ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-100 dark:hover:border-indigo-900/30">
                                            {/* Driver Info */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={clsx(
                                                    "w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-2xl shadow-inner border-2",
                                                    order.driver.verificationStatus === 'VERIFIED' ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 text-indigo-600" : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-400"
                                                )}>
                                                    {order.driver.deliveryProfile?.avatarUrl ? (
                                                        <ImageWithFallback
                                                            src={order.driver.deliveryProfile.avatarUrl}
                                                            alt={order.driver.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        (order.driver.name || '?').charAt(0)
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <p className="font-black text-lg text-slate-900 dark:text-white truncate">{order.driver.name}</p>
                                                        {order.driver.verificationStatus && (
                                                            <div className={clsx(
                                                                "flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap",
                                                                order.driver.verificationStatus === 'VERIFIED'
                                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                            )}>
                                                                {order.driver.verificationStatus === 'VERIFIED' ? <BadgeCheck size={11} /> : <Clock size={11} />}
                                                                {t(`common:verificationStatuses.${order.driver.verificationStatus}`, order.driver.verificationStatus) as string}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={clsx(
                                                                "w-2.5 h-2.5 rounded-full ring-4",
                                                                (order.status === OrderStatus.DRIVER_ASSIGNED || order.status === OrderStatus.OUT_FOR_DELIVERY) ? "bg-amber-500 ring-amber-500/20 animate-pulse" : "bg-emerald-500 ring-emerald-500/20"
                                                            )} />
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                                                {(order.status === OrderStatus.DRIVER_ASSIGNED || order.status === OrderStatus.OUT_FOR_DELIVERY)
                                                                    ? (t('common:driver_status.busy', 'Busy') as string)
                                                                    : (t('common:driver_status.available', 'Available') as string)}
                                                            </span>
                                                        </div>
                                                        {(order.driver.phone || order.driver.deliveryProfile?.profile?.user?.phone) && (
                                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                            <Phone size={14} className="text-slate-400" />
                                                            <p className="text-sm font-bold">{order.driver.phone || order.driver.deliveryProfile?.profile?.user?.phone}</p>
                                                        </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Commission & Earnings (Freelancer) */}
                                            {order.driverCommissionType && (
                                                <div className="flex items-center justify-between p-3 mt-1 mb-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                            {t('orders:storeCommission', 'Store Commission')}
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                {order.driverCommissionType === 'fixed' 
                                                                    ? `${Number(order.driverCommissionValue || 0).toFixed(2)} ${t('common:currencySymbol')}`
                                                                    : order.driverCommissionType === 'none'
                                                                        ? '0%'
                                                                        : `${order.driverCommissionValue || 0}%`}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                {order.driverCommissionType === 'fixed' 
                                                                    ? t('orders:commissionFixed', 'Fixed')
                                                                    : order.driverCommissionType === 'none'
                                                                        ? t('orders:commissionNone', 'None')
                                                                        : t('orders:commissionPercentage', 'Percentage')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider mb-0.5">
                                                            {t('orders:driverProfit', 'Driver Profit')}
                                                        </div>
                                                        <div className="flex items-baseline gap-1 justify-end text-emerald-600 dark:text-emerald-400">
                                                            <span className="font-black">
                                                                {Number(order.driverNetEarnings ?? 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-xs font-bold opacity-80">{t('common:currencySymbol')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons at the bottom of the card */}
                                            {order.status !== OrderStatus.OUT_FOR_DELIVERY &&
                                                order.status !== OrderStatus.DELIVERED &&
                                                order.status !== OrderStatus.CANCELLED && (
                                                    <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/orders/batch-assign?orderId=${id}`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-xl transition-all active:scale-95 border border-indigo-100 dark:border-indigo-800/50"
                                                        >
                                                            <RefreshCw size={14} />
                                                            {t('orders:reassignDriver', 'Reassign Driver')}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmUnassignModal(true);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl transition-all active:scale-95 border border-rose-100 dark:border-rose-800/50"
                                                        >
                                                            <UserMinus size={14} />
                                                            {t('orders:unassignDriver', 'Unassign Driver')}
                                                        </button>
                                                    </div>
                                                )}
                                        </div>

                                        {order.deliveryPin && (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE || user?.role === UserRole.CUSTOMER) && (
                                            <div className="p-3 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                                                <span className="text-sm text-slate-500">{t('orders:deliveryPin', 'Delivery PIN')}</span>
                                                <span className="text-lg font-black tracking-widest text-indigo-600">{order.deliveryPin}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) ? (
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-1">
                                                    <AlertCircle size={18} />
                                                    {t('common:assignmentDisabled', 'Assignment Disabled')}
                                                </div>
                                                <p className="text-sm text-amber-600/80">
                                                    {t('common:cannotAssignCompletedOrCancelledOrder', 'You cannot assign a driver to an order that has already been completed or cancelled.')}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-500">{t('orders:noDriverAssigned', 'No driver assigned to this order yet.')}</p>
                                                <button
                                                    onClick={() => {
                                                        if (order.status === OrderStatus.PENDING) {
                                                            setMustConfirmOrderModal(true);
                                                        } else {
                                                            navigate(`/orders/batch-assign?orderId=${id}`);
                                                        }
                                                    }}
                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Truck size={18} />
                                                    {t('orders:assignDriver', 'Assign Driver')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Driver Actions Section */}
                        {user?.role === UserRole.DELIVERY && order.driverId === user.id && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />

                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                                    <Truck className="text-indigo-500" size={20} />
                                    {t('orders:driverActions', 'Delivery Actions')}
                                </h3>

                                {order.status === OrderStatus.DRIVER_ASSIGNED && (
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-sm text-slate-500">{t('orders:pickupPrompt', 'Have you picked up the order from the store?')}</p>
                                        <button
                                            onClick={() => handleUpdateStatus(OrderStatus.OUT_FOR_DELIVERY)}
                                            disabled={updating}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                        >
                                            {updating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={20} />}
                                            {t('orders:pickupOrder', 'Start Delivery')}
                                        </button>
                                    </div>
                                )}

                                {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                                    <div className="space-y-4 relative z-10">
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                                            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                                {t('orders:deliveryInProgress', 'Delivery In Progress')}
                                            </p>
                                            <p className="text-xs text-amber-600/80 mt-1">
                                                {t('orders:deliveryInstructions', 'Navigate to the customer and collect the PIN to confirm delivery.')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setConfirmDeliveryModal(true)}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            {t('orders:confirmDelivery', 'Confirm Delivery')}
                                        </button>
                                    </div>
                                )}

                                {order.status === OrderStatus.DELIVERED && (
                                    <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400">{t('orders:orderDelivered', 'Delivered Successfully')}</p>
                                    </div>
                                )}

                                {order.status === OrderStatus.RETURNED && (
                                    <div className="text-center py-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                                        <ArrowLeft size={40} className={clsx("text-slate-500 mx-auto mb-2", isRTL && "rotate-180")} />
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{t('orders:orderReturned', 'Order Returned')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reset Returned Order Section */}
                        {hasPermission(Permissions.ORDERS_UPDATE) &&
                            order.status === OrderStatus.RETURNED &&
                            (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <ArrowLeft className={clsx("text-indigo-500", isRTL && "rotate-180")} size={20} />
                                        {t('orders:resetOrder', 'Reset Order')}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        {t('orders:resetOrderDescription', 'Reset this returned order back to pending to process it again.')}
                                    </p>
                                    <button
                                        onClick={handleResetReturnedOrder}
                                        disabled={updating}
                                        className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium transition-colors"
                                    >
                                        {t('orders:resetOrderButton', 'Reset to Pending')}
                                    </button>
                                </div>
                            )}

                        {/* Return Order Section (Delivery Driver) */}
                        {user?.role === UserRole.DELIVERY &&
                            order.driverId === user.id &&
                            order.status === OrderStatus.OUT_FOR_DELIVERY && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <ArrowLeft className={clsx("text-amber-500", isRTL && "rotate-180")} size={20} />
                                        {t('orders:orders:returnOrder')}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        {t('orders:orders:returnOrderWarning', 'If the delivery cannot be completed, you can return the order to the store.')}
                                    </p>
                                    <button
                                        onClick={() => setReturnModal(true)}
                                        className="w-full py-2.5 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium transition-colors"
                                    >
                                        {t('orders:orders:returnOrder')}
                                    </button>
                                </div>
                            )}

                        {/* Cancel / Return Order Section (Admin/Employee) */}
                        {hasPermission(Permissions.ORDERS_CANCEL) &&
                            order.status !== OrderStatus.DELIVERED &&
                            order.status !== OrderStatus.CANCELLED &&
                            order.status !== OrderStatus.RETURNED &&
                            (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE || (user?.role === UserRole.CUSTOMER && order.status === OrderStatus.PENDING)) && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-rose-200 dark:border-slate-800 p-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <AlertCircle className="text-rose-500" size={20} />
                                        {t('orders:cancelOrder', 'Cancel Order')}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        {t('orders:cancelOrderWarning', 'Cancelling an order will refund the customer and mark the order as cancelled.')}
                                    </p>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setCancelModal(true)}
                                            className="w-full py-2.5 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium transition-colors"
                                        >
                                            {t('orders:cancelOrder')}
                                        </button>

                                        {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                                            <button
                                                onClick={() => setStoreReturnModal(true)}
                                                className="w-full py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors flex justify-center items-center gap-2"
                                            >
                                                <ArrowLeft size={16} className={clsx(isRTL && "rotate-180")} />
                                                {t('orders:returnOrder')}
                                            </button>
                                        )}
                                    </div>
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
                title={t('orders:cancelOrder')}
                message={t('orders:cancelOrderWarning')}
                placeholder={t('orders:cancelReasonPlaceholder')}
                submitLabel={t('orders:cancelOrder')}
                onSubmit={handleCancelOrder}
                onCancel={() => setCancelModal(false)}
                isLoading={updating}
            />

            <InputModal
                isOpen={returnModal}
                title={t('orders:returnOrder')}
                message={t('orders:returnOrderWarning')}
                placeholder={t('orders:returnReasonPlaceholder')}
                submitLabel={t('orders:returnOrder')}
                onSubmit={handleReturnOrder}
                onCancel={() => setReturnModal(false)}
                isLoading={updating}
            />

            <InputModal
                isOpen={storeReturnModal}
                title={t('orders:returnOrder')}
                message={t('orders:returnOrderWarning')}
                placeholder={t('returnReasonPlaceholder')}
                submitLabel={t('orders:returnOrder')}
                onSubmit={handleStoreReturnOrder}
                onCancel={() => setStoreReturnModal(false)}
                isLoading={updating}
            />



            {/* Print-Only Invoice Layout */}
            <div className="hidden print:block bg-white text-black p-8 w-full max-w-4xl mx-auto font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-1">
                            {t('orders:invoice', 'Invoice')}
                        </h1>
                        <p className="text-sm text-slate-600 font-medium">
                            {t('orders:orderNumber', { number: order?.orderNumber || order?.id?.substring(0, 8) })}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                            {new Date(order?.createdAt || new Date()).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-slate-900 text-xl uppercase tracking-wide">
                            {(isRTL ? (order?.store?.nameAr || order?.store?.name) : (order?.store?.name || order?.store?.nameAr)) || t('orders:store', 'Store')}
                        </div>
                        {order?.branch && (
                            <div className="text-sm text-slate-600 mt-1 max-w-[200px] ms-auto">
                                <p>
                                    {isRTL
                                    ? (order.branch.town?.arName || order.branch.town?.enName)
                                    : (order.branch.town?.enName || order.branch.town?.arName)}
                                </p>
                                <p>
                                    {isRTL
                                    ? (order.branch.place?.arName || order.branch.place?.enName)
                                    : (order.branch.place?.enName || order.branch.place?.arName)}
                                </p>
                                {(order.branch.addressEn || order.branch.addressAr) && (
                                    <p className="mt-1">
                                        {isRTL ? (order.branch.addressAr || order.branch.addressEn) : (order.branch.addressEn || order.branch.addressAr)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                    {/* Customer Info */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                            {t('orders:billTo', 'Bill To')}
                        </h2>
                        <div className="text-sm text-slate-800 space-y-1.5">
                            <p className="font-bold text-lg text-slate-900">{order?.clientInfo?.name || order?.client?.name || t('orders:guest', 'Guest')}</p>
                            {order?.clientInfo?.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {order.clientInfo.phone}</p>}
                            {order?.clientInfo?.email && <p className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {order.clientInfo.email}</p>}
                            
                            {/* Payment Method nested here if present */}
                            {order?.paymentMethod && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('orders:paymentMethod', 'Payment Method')}</p>
                                    <p className="font-medium text-slate-700">{t(`orders:${order.paymentMethod.toLowerCase()}`, { defaultValue: order.paymentMethod.replace(/_/g, ' ') })}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                            {t('orders:deliveryTo', 'Delivery To')}
                        </h2>
                        {order?.deliveryAddress ? (
                            <div className="text-sm text-slate-800 space-y-1.5">
                                <p className="font-bold text-slate-900">
                                    {isRTL ? 
                                        `${order.deliveryAddress.townArName} (${order.deliveryAddress.townEnName})` : 
                                        `${order.deliveryAddress.townEnName} (${order.deliveryAddress.townArName})`}
                                </p>
                                <p className="text-slate-700">
                                    {isRTL ? 
                                        `${order.deliveryAddress.placeArName} (${order.deliveryAddress.placeEnName})` : 
                                        `${order.deliveryAddress.placeEnName} (${order.deliveryAddress.placeArName})`}
                                </p>
                                <p className="text-slate-600 leading-relaxed mt-2 p-3 bg-slate-50 rounded-lg">{order.deliveryAddress.addressDetails}</p>
                                {order.deliveryAddress.phone && <p className="mt-3 font-medium flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {order.deliveryAddress.phone}</p>}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic py-2">{t('orders:noDeliveryInfo', 'No Delivery Info')}</p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-10">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200 bg-slate-50/50">
                                <th className="py-3 px-4 text-center font-black text-slate-500 uppercase tracking-widest">{t('orders:item', 'Item')}</th>
                                <th className="py-3 px-4 text-center font-black text-slate-500 uppercase tracking-widest">{t('orders:qty', 'Qty')}</th>
                                <th className="py-3 px-4 text-center font-black text-slate-500 uppercase tracking-widest">{t('orders:price', 'Price')}</th>
                                <th className="py-3 px-4 text-center font-black text-slate-500 uppercase tracking-widest">{t('orders:total', 'Total')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order?.items?.map((item: any, idx: number) => (
                                <tr key={item.id || idx} className="hover:bg-slate-50/30">
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col items-center gap-3">
                                            {/* Product Image */}
                                            <div className="w-14 h-14 rounded-md border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center mx-auto">
                                                {item.product?.coverImage ? (
                                                    <ImageWithFallback src={item.product.coverImage} alt={item.productName || item.product?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-6 h-6 text-slate-300" />
                                                )}
                                            </div>
                                            
                                            {/* Product Details */}
                                            <div className="text-center w-full">
                                                <p className="font-bold text-slate-900 text-base">
                                                    {isRTL ? (item.product?.nameAr || item.product?.name || item.productName) : (item.product?.name || item.product?.nameAr || item.productName)}
                                                </p>
                                                <div className="mt-1 space-y-1 flex flex-col items-center justify-center">
                                                    {getVariantDetails(item).map((detail, i) => (
                                                        <p key={i} className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span> {detail}
                                                        </p>
                                                    ))}
                                                    {getAddonDetails(item).map((detail, i) => (
                                                        <p key={i} className="text-xs text-slate-500 italic flex items-center justify-center gap-1.5">
                                                            <span className="text-slate-400">+</span> {detail}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-slate-700">{item.quantity}</td>
                                    <td className="py-4 px-4 text-center text-slate-600 font-medium">
                                        {Number(item.price).toFixed(2)}
                                    </td>
                                    <td className="py-4 px-4 text-center font-black text-slate-900 text-base">
                                        {(Number(item.price) * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-between items-start">
                    {/* Driver & Notes area */}
                    <div className="w-1/2 pr-8">
                        {order?.driver && (
                            <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Truck size={14}/> {t('orders:driver', 'Driver')}
                                </h3>
                                <p className="font-bold text-slate-800">{order.driver.name}</p>
                                {order.driver.phone && <p className="text-sm text-slate-600">{order.driver.phone}</p>}
                            </div>
                        )}
                        {order?.notes && (
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {t('orders:notes', 'Notes')}
                                </h3>
                                <p className="text-sm text-slate-600 italic leading-relaxed whitespace-pre-wrap p-4 bg-amber-50 rounded-lg text-amber-900 border border-amber-100">"{order.notes}"</p>
                            </div>
                        )}
                    </div>

                    {/* Calculations area */}
                    <div className="w-5/12 space-y-3 text-sm">
                        <div className="flex justify-between text-slate-600 py-1">
                            <span>{t('orders:subtotal', 'Subtotal')}</span>
                            <span className="font-medium">{Number(order?.subtotal || 0).toFixed(2)} {t('common:currencySymbol')}</span>
                        </div>
                        {Number(order?.deliveryFee) > 0 && (
                            <div className="flex justify-between text-slate-600 py-1">
                                <span>{t('orders:deliveryFee', 'Delivery Fee')}</span>
                                <span className="font-medium">{Number(order?.deliveryFee).toFixed(2)} {t('common:currencySymbol')}</span>
                            </div>
                        )}
                        {Number(order?.promoDiscount) > 0 && (
                            <div className="flex justify-between text-emerald-600 py-1">
                                <span>{t('orders:discount', 'Discount')}</span>
                                <span className="font-medium">-{Number(order?.promoDiscount).toFixed(2)} {t('common:currencySymbol')}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-900">
                            <span className="font-black text-slate-900 uppercase tracking-widest text-lg">{t('orders:total', 'Total')}</span>
                            <span className="text-2xl font-black text-slate-900">
                                {Number(order?.totalAmount || order?.total || 0).toFixed(2)} {t('common:currencySymbol')}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-16 text-center text-xs text-slate-400 font-bold tracking-widest uppercase">
                    *** {t('orders:thankYou', 'Thank you for your business!')} ***
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmDeliveryModal}
                title={t('orders:confirmDelivery', 'Confirm Delivery')}
                message={t('orders:deliveryInstructions', 'Please enter the delivery PIN provided by the customer.')}
                onConfirm={handleConfirmDelivery}
                onCancel={() => setConfirmDeliveryModal(false)}
                confirmLabel={t('common:confirm', 'Confirm')}
                isLoading={updating}
            >
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            {t('orders:deliveryPin', 'Delivery PIN')}
                        </label>
                        <input
                            type="text"
                            maxLength={4}
                            value={deliveryPin}
                            onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="0000"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center text-2xl font-black tracking-[0.5em]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            {t('orders:proofImage', 'Proof of Delivery (Optional)')}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                </div>
            </ConfirmationModal>



            <ConfirmationModal
                isOpen={confirmUnassignModal}
                title={t('orders:unassignDriver', 'Unassign Driver')}
                message={t('common:confirmUnassignMessage', 'Are you sure you want to unassign this driver from the order?')}
                onConfirm={handleUnassignDriver}
                onCancel={() => setConfirmUnassignModal(false)}
                confirmLabel={t('orders:unassignDriver', 'Unassign Driver')}
                isLoading={updating}
                type="danger"
            />

            <ConfirmationModal
                isOpen={mustConfirmOrderModal}
                title={t('orders:mustConfirmFirst', 'Confirm Order First')}
                message={t('orders:mustConfirmFirstMessage', 'You must confirm the order before assigning a driver.')}
                onConfirm={() => {
                    setMustConfirmOrderModal(false);
                    setStatusModal({ isOpen: true, status: OrderStatus.CONFIRMED });
                }}
                confirmLabel={t('orders:confirmOrderNow', 'Confirm Order Now')}
                onCancel={() => setMustConfirmOrderModal(false)}
                type="warning"
            />
        </div>
    );
};

export default OrderDetail;
