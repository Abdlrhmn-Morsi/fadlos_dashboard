import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, User, Phone, Save,
    Printer, Mail, AlertCircle, FileText, CheckCircle, Package, Globe, Truck, Camera
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
import { UserRole } from '../../types/user-role';
import clsx from 'clsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { toast } from '../../utils/toast';

const OrderDetail = () => {
    const { id } = useParams();
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
    const [assignDriverModal, setAssignDriverModal] = useState(false);
    const [confirmDeliveryModal, setConfirmDeliveryModal] = useState(false);
    const [deliveryPin, setDeliveryPin] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

    useEffect(() => {
        fetchOrder();
        fetchAvailableDrivers();
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

    const fetchAvailableDrivers = async () => {
        try {
            // Import dynamically or ensure it's available
            const { getStoreDrivers } = await import('../delivery/api/delivery-drivers.api');
            const drivers = await getStoreDrivers();
            setAvailableDrivers(drivers);
        } catch (error) {
            console.error('Failed to fetch available drivers', error);
        }
    };

    const handleAssignDriver = async (driverId: string) => {
        try {
            setUpdating(true);
            const method = order.driverId ? ordersApi.reassignDriver : ordersApi.assignDriver;
            await method(id!, driverId);
            setAssignDriverModal(false);
            fetchOrder(); // Refresh order data
        } catch (error) {
            console.error('Failed to assign driver', error);
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
            toast.success(t('orderDelivered', 'Order marked as delivered'));
        } catch (error: any) {
            console.error('Failed to confirm delivery', error);
            toast.error(error.response?.data?.message || t('common.error', 'Invalid PIN or error confirming delivery'));
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
            setOrder({ ...order, status: status });

            updateCacheItem('orders', id!, (o: any) => ({ ...o, status }));

            // Optional: Update status counts
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                const updatedCounts = { ...cachedCounts };
                if (updatedCounts[oldStatus]) updatedCounts[oldStatus] = Math.max(0, updatedCounts[oldStatus] - 1);
                updatedCounts[status] = (updatedCounts[status] || 0) + 1;
                setCache('order-status-counts', updatedCounts);
            }

            fetchOrder(); // Full refresh to be safe
            toast.success(t('orderUpdated', 'Order status updated successfully'));
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error(t('common.error', 'Failed to update order status'));
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
            setOrder({ ...order, status: status });
            setStatusModal({ isOpen: false, status: '' });

            // Update the order in cache instead of invalidating
            updateCacheItem('orders', id!, (order: any) => ({
                ...order,
                status: status
            }));

            // Update status counts cache
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                const updatedCounts = { ...cachedCounts };
                // Decrease old status count
                if (updatedCounts[oldStatus]) {
                    updatedCounts[oldStatus] = Math.max(0, updatedCounts[oldStatus] - 1);
                }
                // Increase new status count
                updatedCounts[status] = (updatedCounts[status] || 0) + 1;
                setCache('order-status-counts', updatedCounts);
            }

            // Invalidate dashboard cache to refresh stats
            invalidateCache('dashboard-stats');
        } catch (error) {
            console.error('Failed to update status', error);
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
            }));

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
                setCache('order-status-counts', updatedCounts);
            }

            // Invalidate dashboard cache to refresh stats
            invalidateCache('dashboard-stats');

            // Update local state and reload to show cancelled status
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
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                                        {(order.client?.profileImage || order.clientInfo?.profileImage) ? (
                                            <ImageWithFallback src={order.client?.profileImage || order.clientInfo?.profileImage} alt={order.client?.name || order.clientInfo?.name} className="w-full h-full object-cover" />
                                        ) : (
                                            order.client?.name?.[0] || order.clientInfo?.name?.[0] || 'G'
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {order.client?.name || order.clientInfo?.name || t('guest')}
                                        </p>
                                        <p className="text-xs text-slate-500">{t('customer')}</p>
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

                        {/* Logistics Section */}
                        {(user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Truck className="text-indigo-500" size={20} />
                                    {t('logistics', 'Logistics')}
                                </h3>

                                {order.driver ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                    {order.driver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{order.driver.name}</p>
                                                    <p className="text-xs text-slate-500">{order.driver.phone}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setAssignDriverModal(true)}
                                                className="text-xs font-bold text-indigo-600 hover:underline"
                                            >
                                                {t('changeDriver', 'Change')}
                                            </button>
                                        </div>

                                        {order.deliveryPin && (
                                            <div className="p-3 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                                                <span className="text-sm text-slate-500">{t('deliveryPin', 'Delivery PIN')}</span>
                                                <span className="text-lg font-black tracking-widest text-indigo-600">{order.deliveryPin}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-500">{t('noDriverAssigned', 'No driver assigned to this order yet.')}</p>
                                        <button
                                            onClick={() => setAssignDriverModal(true)}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Truck size={18} />
                                            {t('assignDriver', 'Assign Driver')}
                                        </button>
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
                                    {t('driverActions', 'Delivery Actions')}
                                </h3>

                                {order.status === OrderStatus.DRIVER_ASSIGNED && (
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-sm text-slate-500">{t('pickupPrompt', 'Have you picked up the order from the store?')}</p>
                                        <button
                                            onClick={() => handleUpdateStatus(OrderStatus.OUT_FOR_DELIVERY)}
                                            disabled={updating}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                        >
                                            {updating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Package size={20} />}
                                            {t('pickupOrder', 'Start Delivery')}
                                        </button>
                                    </div>
                                )}

                                {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                                    <div className="space-y-4 relative z-10">
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                                            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                                {t('deliveryInProgress', 'Delivery In Progress')}
                                            </p>
                                            <p className="text-xs text-amber-600/80 mt-1">
                                                {t('deliveryInstructions', 'Navigate to the customer and collect the PIN to confirm delivery.')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setConfirmDeliveryModal(true)}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            {t('confirmDelivery', 'Confirm Delivery')}
                                        </button>
                                    </div>
                                )}

                                {order.status === OrderStatus.DELIVERED && (
                                    <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400">{t('orderDelivered', 'Delivered Successfully')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cancel Order Section */}
                        {hasPermission(Permissions.ORDERS_CANCEL) &&
                            order.status !== OrderStatus.DELIVERED &&
                            order.status !== OrderStatus.CANCELLED &&
                            (user?.role !== UserRole.CUSTOMER || order.status === OrderStatus.PENDING) && (
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

            <ConfirmationModal
                isOpen={assignDriverModal}
                title={order.driverId ? t('reassignDriver', 'Reassign Driver') : t('assignDriver', 'Assign Driver')}
                message={t('selectDriverMessage', 'Select a driver to handle this delivery:')}
                onConfirm={() => { }} // Not used for this type of modal
                onCancel={() => setAssignDriverModal(false)}
                confirmLabel="" // Hidden
            >
                <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {availableDrivers.length > 0 ? (
                        availableDrivers.map((driver) => (
                            <button
                                key={driver.id}
                                onClick={() => handleAssignDriver(driver.id)}
                                disabled={updating}
                                className={clsx(
                                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-start group",
                                    order.driverId === driver.id
                                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                                        : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {driver.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{driver.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                driver.deliveryProfile?.isBusy ? "bg-amber-500" : "bg-emerald-500"
                                            )} />
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {driver.deliveryProfile?.isBusy ? t('status.busy', 'Busy') : t('status.available', 'Available')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {order.driverId === driver.id && (
                                    <CheckCircle size={20} className="text-indigo-600" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">
                            {t('noDriversFound', 'No drivers available. Add drivers in the Delivery section first.')}
                        </div>
                    )}
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={confirmDeliveryModal}
                title={t('confirmDelivery', 'Confirm Delivery')}
                message={t('deliveryPinMessage', 'Please enter the delivery PIN provided by the customer.')}
                onConfirm={handleConfirmDelivery}
                onCancel={() => setConfirmDeliveryModal(false)}
                confirmLabel={t('confirm', 'Confirm')}
                isLoading={updating}
            >
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            {t('deliveryPin', 'Delivery PIN')}
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
                            {t('proofImage', 'Proof of Delivery (Optional)')}
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
        </div>
    );
};

export default OrderDetail;
