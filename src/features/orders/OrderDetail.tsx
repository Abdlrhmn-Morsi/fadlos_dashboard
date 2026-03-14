import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, User, Phone, Save,
    Printer, Mail, AlertCircle, FileText, CheckCircle, Package, Globe, Truck, Camera,
    Search, X, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, BadgeCheck, DollarSign,
    RefreshCw, UserMinus
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
    const [returnModal, setReturnModal] = useState(false);
    const [assignDriverModal, setAssignDriverModal] = useState(false);
    const [confirmDeliveryModal, setConfirmDeliveryModal] = useState(false);
    const [confirmAssignModal, setConfirmAssignModal] = useState<{isOpen: boolean, driverId: string | null}>({isOpen: false, driverId: null});
    const [confirmUnassignModal, setConfirmUnassignModal] = useState(false);
    const [deliveryPin, setDeliveryPin] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
    const [driverSearch, setDriverSearch] = useState('');
    const [driverPage, setDriverPage] = useState(1);
    const [driverTotal, setDriverTotal] = useState(0);
    const [driverLoading, setDriverLoading] = useState(false);
    const [maxOrdersPerDriver, setMaxOrdersPerDriver] = useState(5);

    const [filterByTown, setFilterByTown] = useState(true);
    const [filterByPlace, setFilterByPlace] = useState(false);

    const [storeReturnModal, setStoreReturnModal] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (assignDriverModal) {
            setDriverPage(1);
            setDriverSearch('');
            const hasTown = !!order?.branch?.town;
            setFilterByTown(hasTown);
            setFilterByPlace(false);
            fetchAvailableDrivers(1, '', hasTown, false);
        }
    }, [assignDriverModal]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (assignDriverModal) fetchAvailableDrivers(1, driverSearch, filterByTown, filterByPlace);
        }, 500);
        return () => clearTimeout(timer);
    }, [driverSearch]);

    useEffect(() => {
        if (assignDriverModal && driverPage > 1) fetchAvailableDrivers(driverPage, driverSearch, filterByTown, filterByPlace);
    }, [driverPage]);

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

    const fetchAvailableDrivers = async (page = 1, search = '', byTown = filterByTown, byPlace = filterByPlace) => {
        try {
            setDriverLoading(true);
            const { getStoreDrivers } = await import('../delivery/api/delivery-drivers.api');
            const params: any = { page, limit: 5, search, storeId: order?.storeId };
            if (byTown && order?.branch?.town?.id) {
                params.townId = order.branch.town.id;
            }
            if (byPlace && order?.branch?.place?.id) {
                params.placeId = order.branch.place.id;
            }
            const response: any = await getStoreDrivers(params);
            const drivers = Array.isArray(response) ? response : (response.data || []);
            const meta = response.meta || {};
            setAvailableDrivers(drivers);
            setDriverTotal(meta.total || drivers.length);
            if (meta.maxOrdersPerDriver) setMaxOrdersPerDriver(meta.maxOrdersPerDriver);
        } catch (error) {
            console.error('Failed to fetch available drivers', error);
        } finally {
            setDriverLoading(false);
        }
    };

    const handleBranchFilterChange = (filter: 'town' | 'place') => {
        const newTown = filter === 'town' ? !filterByTown : filterByTown;
        const newPlace = filter === 'place' ? !filterByPlace : filterByPlace;
        setFilterByTown(newTown);
        setFilterByPlace(newPlace);
        setDriverPage(1);
        fetchAvailableDrivers(1, driverSearch, newTown, newPlace);
    };

    const handleAssignDriver = (driverId: string) => {
        setConfirmAssignModal({ isOpen: true, driverId });
    };

    const confirmAssignDriver = async () => {
        if (!confirmAssignModal.driverId) return;
        try {
            setUpdating(true);
            const method = order.driverId ? ordersApi.reassignDriver : ordersApi.assignDriver;
            await method(id!, confirmAssignModal.driverId);
            setAssignDriverModal(false);
            setConfirmAssignModal({ isOpen: false, driverId: null });
            fetchOrder(); // Refresh order data
            toast.success(t('orders:driverAssigned', 'Driver assigned successfully'));
        } catch (error: any) {
            console.error('Failed to assign driver', error);
            toast.error(error.response?.data?.message || t('common:error', 'Failed to assign driver'));
        } finally {
            setUpdating(false);
        }
    };

    const handleUnassignDriver = async () => {
        try {
            setUpdating(true);
            await ordersApi.unassignDriver(id!);
            setConfirmUnassignModal(false);
            fetchOrder();
            toast.success(t('orders:unassignDriver', 'Driver unassigned successfully'));
        } catch (error: any) {
            console.error('Failed to unassign driver', error);
            toast.error(error.response?.data?.message || t('common:error', 'Failed to unassign driver'));
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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-6 space-y-6">
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
                                                        {getStatusLabel(entry.status)}
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
                                                    <p className="text-xs text-slate-500">
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
                                             <div className="flex items-center gap-4">
                                                 <div className={clsx(
                                                     "w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-2xl shadow-inner border-2",
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
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <p className="font-black text-lg text-slate-900 dark:text-white truncate">{order.driver.name}</p>
                                                         {order.driver.verificationStatus === 'VERIFIED' && (
                                                             <div className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg shadow-sm">
                                                                 <BadgeCheck size={11} />
                                                                 {t('orders:verified', 'Verified')}
                                                             </div>
                                                         )}
                                                     </div>
                                                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                         <div className="flex items-center gap-2">
                                                             <div className={clsx(
                                                                 "w-2.5 h-2.5 rounded-full ring-4",
                                                                 order.driver.deliveryProfile?.isBusy ? "bg-amber-500 ring-amber-500/20 animate-pulse" : "bg-emerald-500 ring-emerald-500/20"
                                                             )} />
                                                             <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                                                 {order.driver.deliveryProfile?.isBusy
                                                                     ? (t('orders:driverStatusBusy', 'Busy') as string)
                                                                     : (t('orders:driverStatusAvailable', 'Available') as string)}
                                                             </span>
                                                         </div>
                                                         <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                             <Phone size={14} className="text-slate-400" />
                                                             <p className="text-sm font-bold">{order.driver.phone}</p>
                                                         </div>
                                                     </div>
                                                    </div>
                                             </div>
                                            </div>

                                            {/* Action Buttons at the bottom of the card */}
                                            {order.status !== OrderStatus.OUT_FOR_DELIVERY &&
                                                order.status !== OrderStatus.DELIVERED &&
                                                order.status !== OrderStatus.CANCELLED && (
                                                    <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAssignDriverModal(true);
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
                                                    onClick={() => setAssignDriverModal(true)}
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

            {/* Custom Assign Driver Modal */}
            {assignDriverModal && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {order.driverId ? t('orders:reassignDriver', 'Reassign Driver') : t('orders:assignDriver', 'Assign Driver')}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">{t('orders:selectDriverMessage', 'Select a driver to handle this delivery:')}</p>
                            </div>
                            <button
                                onClick={() => setAssignDriverModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="relative">
                                <Search className={clsx("absolute top-3 text-slate-400", isRTL ? "right-4" : "left-4")} size={20} />
                                <input
                                    type="text"
                                    placeholder={t('orders:searchDriverPlaceholder', 'Search by name, email or phone...')}
                                    value={driverSearch}
                                    onChange={(e) => setDriverSearch(e.target.value)}
                                    className={clsx(
                                        "w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm",
                                        isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Branch Filter Buttons */}
                        {order.branch && (order.branch.town || order.branch.place) && (
                            <div className="px-4 pb-3 flex gap-2 flex-wrap">
                                {order.branch.town && (
                                    <button
                                        onClick={() => handleBranchFilterChange('town')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                                            filterByTown
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                    >
                                        <Globe size={12} />
                                        {isRTL
                                            ? (order.branch.town?.arName || order.branch.town?.enName)
                                            : (order.branch.town?.enName || order.branch.town?.arName)}
                                    </button>
                                )}
                                {order.branch.place && (
                                    <button
                                        onClick={() => handleBranchFilterChange('place')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                                            filterByPlace
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                    >
                                        <MapPin size={12} />
                                        {isRTL
                                            ? (order.branch.place?.arName || order.branch.place?.enName)
                                            : (order.branch.place?.enName || order.branch.place?.arName)}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Driver List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {driverLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-60">
                                    <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('common:loading', 'Loading...')}</p>
                                </div>
                            ) : availableDrivers.length > 0 ? (
                                availableDrivers.map((driver) => {
                                    const isVerified = ['VERIFIED', 'Verified', 'verified'].includes(driver.deliveryProfile?.verificationStatus);
                                    const isSelected = order.driverId === driver.id;
                                    const isBusy = driver.deliveryProfile?.isBusy
                                        || (driver.activeDeliveriesCount >= maxOrdersPerDriver);
                                    const isOverLimit = (driver as any).isOverLimit === true;
                                    const isDisabled = !isVerified || isBusy || isOverLimit;

                                    return (
                                        <div
                                            key={driver.id}
                                            onClick={() => !isDisabled && handleAssignDriver(driver.id)}
                                            className={clsx(
                                                "relative w-full flex flex-col p-4 rounded-xl border transition-all text-start group",
                                                isDisabled
                                                    ? "opacity-60 bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 cursor-not-allowed grayscale-[0.5]"
                                                    : isSelected
                                                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 ring-1 ring-indigo-500/30 cursor-default"
                                                        : "bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg shadow-inner",
                                                        isVerified ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                                                    )}>
                                                        {driver.deliveryProfile?.avatarUrl ? (
                                                            <ImageWithFallback
                                                                src={driver.deliveryProfile.avatarUrl}
                                                                alt={driver.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            driver.name ? driver.name.charAt(0) : '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900 dark:text-white">{driver.name}</h4>
                                                            {isVerified ? (
                                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                                                    <BadgeCheck size={12} />
                                                                    {t('orders:verified', 'Verified')}
                                                                </div>
                                                            ) : (
                                                                <div className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 dark:bg-slate-700">
                                                                    {driver.deliveryProfile?.verificationStatus || 'Unknown'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={clsx(
                                                                    "w-2 h-2 rounded-full",
                                                                    isBusy ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                                                )} />
                                                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                                    {isBusy
                                                                        ? (t('common:delivery.drivers.status.busy', 'Busy') as string)
                                                                        : (t('common:delivery.drivers.status.available', 'Available') as string)}
                                                                </span>
                                                            </div>
                                                            {(driver.activeDeliveriesCount > 0) && (
                                                                <>
                                                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                                                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                        <Package size={12} />
                                                                        <span>{driver.activeDeliveriesCount} {t('orders:activeTasks', 'Active')}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                                            <span className="text-xs text-slate-500">{driver.phone}</span>
                                                            {driver.deliveryProfile?.vehicleType && (
                                                                <>
                                                                    <span className="text-slate-300 dark:text-slate-700">•</span>
                                                                    <span className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                                                        {t(`common:vehicle_types.${driver.deliveryProfile.vehicleType}`, driver.deliveryProfile.vehicleType) as string}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isSelected ? (
                                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                                        <CheckCircle size={14} />
                                                        {t('orders:selected', 'Selected')}
                                                    </div>
                                                ) : isVerified && !isBusy && !isOverLimit ? (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                                                        {t('orders:assign', 'Assign')}
                                                    </div>
                                                ) : !isOverLimit ? (
                                                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                        <ShieldAlert size={12} />
                                                        {isBusy ? (t('orders:driverStatusBusy', 'Busy') as string) : t('orders:unverified', 'Unverified')}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {isOverLimit && (
                                                <div className="mt-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                                                    <ShieldAlert size={14} />
                                                    {t('common:notAvailableInPlan', 'Not available in your current plan')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <Truck size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">{t('orders:noDriversFound', 'No drivers found')}</p>
                                    <p className="text-xs text-slate-400 mt-1">{t('orders:adjustSearch', 'Try adjusting your search')}</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {driverTotal > 5 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">
                                    {t('orders:showingResults', { start: (driverPage - 1) * 5 + 1, end: Math.min(driverPage * 5, driverTotal), total: driverTotal })}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDriverPage(p => Math.max(1, p - 1))}
                                        disabled={driverPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDriverPage(p => p + 1)}
                                        disabled={driverPage * 5 >= driverTotal}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


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
                isOpen={confirmAssignModal.isOpen}
                title={t('common:confirmAssignTitle', 'Confirm Assignment')}
                message={t('common:confirmAssignMessage', 'Are you sure you want to assign this driver to the order?')}
                onConfirm={confirmAssignDriver}
                onCancel={() => setConfirmAssignModal({ isOpen: false, driverId: null })}
                confirmLabel={t('common:confirm', 'Confirm')}
                isLoading={updating}
            />

            <ConfirmationModal
                isOpen={confirmUnassignModal}
                title={t('orders:unassignDriver', 'Unassign Driver')}
                message={t('common:confirmUnassignMessage', 'Are you sure you want to unassign this driver from the order?')}
                onConfirm={handleUnassignDriver}
                onCancel={() => setConfirmUnassignModal(false)}
                confirmLabel={t('common:confirm', 'Confirm')}
                isLoading={updating}
            />
        </div>
    );
};

export default OrderDetail;
