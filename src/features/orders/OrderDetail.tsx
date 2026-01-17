import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, User, Phone, Save } from 'lucide-react';
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
            alert('Failed to load order details');
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
            alert('Order status updated successfully');
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!order) return <div className="p-6">Order not found</div>;

    const statuses = [
        'PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Order #{order.id.substring(0, 8)}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Order Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="font-bold text-slate-800 dark:text-white">Order Items</h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded flex items-center justify-center text-slate-500 font-bold">
                                            x{item.quantity}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{item.productName}</p>
                                            {item.options && (
                                                <p className="text-sm text-slate-500">{item.options}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-800 dark:text-white">
                                        ${(Number(item.price) * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span className="text-slate-800 dark:text-white">Total Amount</span>
                                <span className="text-primary">${Number(order.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Order Status</h3>
                        <div className="space-y-4">
                            <select
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-primary"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={updating || newStatus === order.status}
                                className="w-full py-2 bg-primary text-white font-bold rounded hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                <span>Update Status</span>
                            </button>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Customer Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {order.customer?.firstName} {order.customer?.lastName}
                                    </p>
                                    <p className="text-sm text-slate-500">{order.customer?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="text-slate-400" size={18} />
                                <p className="text-slate-600 dark:text-slate-400">{order.customer?.phone || 'N/A'}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-slate-400 mt-1" size={18} />
                                <p className="text-slate-600 dark:text-slate-400">
                                    {order.deliveryAddress || 'Pickup Order'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Order Info</h3>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={16} />
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
