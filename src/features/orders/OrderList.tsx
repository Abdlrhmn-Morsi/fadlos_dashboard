import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Search, Filter, Clock, CheckCircle, Package, Truck, AlertTriangle } from 'lucide-react';
import ordersApi from './api/orders.api';
import { OrderStatus } from '../../types/order-status';

const OrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (statusFilter) params.status = statusFilter;

            const response: any = await ordersApi.getOrders(params);

            // Handle paginated response { data: [...], meta: {...} } or plain array
            if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                setOrders(response.data);
            } else if (response && typeof response === 'object' && 'orders' in response && Array.isArray(response.orders)) {
                setOrders(response.orders);
            } else if (Array.isArray(response)) {
                setOrders(response);
            } else {
                console.warn('Unexpected response format:', response);
                setOrders([]);
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.PENDING: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
            case OrderStatus.PREPARING: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
            case OrderStatus.READY_FOR_PICKUP: return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
            case OrderStatus.OUT_FOR_DELIVERY: return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
            case OrderStatus.DELIVERED: return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case OrderStatus.CANCELLED: return 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Orders</h1>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-primary"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value={OrderStatus.PENDING}>Pending</option>
                        <option value={OrderStatus.PREPARING}>Preparing</option>
                        <option value={OrderStatus.READY_FOR_PICKUP}>Ready for Pickup</option>
                        <option value={OrderStatus.OUT_FOR_DELIVERY}>Out for Delivery</option>
                        <option value={OrderStatus.DELIVERED}>Delivered</option>
                        <option value={OrderStatus.CANCELLED}>Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Customer</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Total</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No orders found.</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500">
                                            #{order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            {order.client?.name || `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || 'Guest'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            ${Number(order.total || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
