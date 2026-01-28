import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Search, Filter, Clock, CheckCircle, Package, Truck, AlertTriangle } from 'lucide-react';
import ordersApi from './api/orders.api';
import { OrderStatus } from '../../types/order-status';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';

const OrderList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['orders', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
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
            case OrderStatus.CONFIRMED: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
            case OrderStatus.PREPARING: return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
            case OrderStatus.READY: return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
            case OrderStatus.DELIVERED: return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case OrderStatus.CANCELLED: return 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const getLocalizedStatus = (status: string) => {
        // Assume keys like "pending", "confirmed" exist in common or dashboard
        return t(`dashboard:status.${status.toLowerCase()}`, { defaultValue: status.replace(/_/g, ' ') });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
                <div className="flex gap-2">
                    <select
                        className={clsx(
                            "px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-primary outline-none",
                            isRTL && "text-right"
                        )}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">{t('common:allStatuses', { defaultValue: 'All Statuses' })}</option>
                        <option value={OrderStatus.PENDING}>{getLocalizedStatus(OrderStatus.PENDING)}</option>
                        <option value={OrderStatus.CONFIRMED}>{getLocalizedStatus(OrderStatus.CONFIRMED)}</option>
                        <option value={OrderStatus.PREPARING}>{getLocalizedStatus(OrderStatus.PREPARING)}</option>
                        <option value={OrderStatus.READY}>{getLocalizedStatus(OrderStatus.READY)}</option>
                        <option value={OrderStatus.DELIVERED}>{getLocalizedStatus(OrderStatus.DELIVERED)}</option>
                        <option value={OrderStatus.CANCELLED}>{getLocalizedStatus(OrderStatus.CANCELLED)}</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full", isRTL ? "text-right" : "text-left")}>
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('orderId')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('customer')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('date')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('total')}</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('status')}</th>
                                <th className={clsx("px-6 py-4 font-semibold text-slate-600 dark:text-slate-400", isRTL ? "text-left" : "text-right")}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">{t('common:loading')}</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">{t('noOrdersFound')}</td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500">
                                            #{order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            {order.client?.name || `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || t('common:guest', { defaultValue: 'Guest' })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            ${Number(order.total || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {getLocalizedStatus(order.status)}
                                            </span>
                                        </td>
                                        <td className={clsx("px-6 py-4", isRTL ? "text-left" : "text-right")}>
                                            <button
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                                title={t('viewDetails')}
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
