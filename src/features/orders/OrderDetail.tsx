import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Clock, MapPin, User, Phone, Save,
    Printer, Mail, AlertCircle, FileText, CheckCircle, Package
} from 'lucide-react';
import ordersApi from './api/orders.api';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');

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

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === order.status) return;

        try {
            setUpdating(true);
            await ordersApi.updateOrderStatus(id!, newStatus);
            setOrder({ ...order, status: newStatus });
            // Ideally show toast
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!order) return <div className="p-6">Order not found</div>;

    const statuses = [
        'PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'PREPARING': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'READY_FOR_PICKUP': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'OUT_FOR_DELIVERY': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'DELIVERED': return 'text-green-600 bg-green-50 border-green-200';
            case 'CANCELLED': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    // Helper to resolve variant names
    const getVariantDetails = (item: any) => {
        if (!item.selectedVariants || !item.product?.variants) return null;

        return item.selectedVariants.map((sv: any) => {
            const variant = item.product.variants.find((v: any) => v.id === sv.variantId);
            if (!variant) return null;
            const value = variant.values.find((val: any) => val.id === sv.valueId);
            if (!value) return null;
            return `${variant.name}: ${value.value}`;
        }).filter(Boolean).join(' | ');
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/orders')}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                            <ArrowLeft size={20} className="text-slate-500" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Order #{order.orderNumber || order.id.substring(0, 8)}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <Clock size={14} />
                                Placed on {new Date(order.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Printer size={16} />
                            Print Invoice
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
                                    Order Items
                                </h2>
                                <span className="text-sm text-slate-500">{order.items.length} Items</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-medium shrink-0 overflow-hidden">
                                            {item.product?.coverImage ? (
                                                <img src={item.product.coverImage} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>x{item.quantity}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate pr-4">
                                                    {item.productName}
                                                </h3>
                                                <p className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    ${(Number(item.price) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm text-slate-500 mb-1">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                    ${Number(item.price).toFixed(2)} each
                                                </span>
                                                <span>x {item.quantity}</span>
                                            </div>
                                            {getVariantDetails(item) && (
                                                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                                    {getVariantDetails(item)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 space-y-3 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span>${Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                {Number(order.deliveryFee) > 0 && (
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Delivery Fee</span>
                                        <span>${Number(order.deliveryFee).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(order.promoDiscount) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>Discount (Promo)</span>
                                        <span>-${Number(order.promoDiscount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">Total</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-2xl">
                                        ${Number(order.totalAmount || order.total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Note */}
                        {order.notes && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <FileText className="text-amber-500" size={20} />
                                    Order Notes
                                </h3>
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 rounded-lg text-sm leading-relaxed border border-amber-100 dark:border-amber-900/30">
                                    {order.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Update */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Update Status</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 dark:text-slate-200"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        {statuses.map(status => (
                                            <option key={status} value={status}>
                                                {status.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <CheckCircle size={16} />
                                    </div>
                                </div>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={updating || newStatus === order.status}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    {updating ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Update Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="text-indigo-500" size={20} />
                                Customer
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                        {order.client?.name?.[0] || order.client?.firstName?.[0] || 'G'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            {order.client?.name || `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || 'Guest'}
                                        </p>
                                        <p className="text-xs text-slate-500">Customer</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 group cursor-pointer hover:text-indigo-600 transition-colors">
                                        <Mail size={16} className="text-slate-400" />
                                        <span>{order.client?.email || 'No email provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 group cursor-pointer hover:text-indigo-600 transition-colors">
                                        <Phone size={16} className="text-slate-400" />
                                        <span>{order.client?.phone || 'No phone provided'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                        <MapPin size={16} className="text-slate-400 mt-0.5" />
                                        <span>
                                            {order.deliveryAddress ?
                                                `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}`
                                                : 'Pickup Order'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
