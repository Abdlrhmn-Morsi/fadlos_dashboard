import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Search, Filter, Clock, CheckCircle, Package, Truck, AlertTriangle, Calendar, Hash, User } from 'lucide-react';
import ordersApi from './api/orders.api';
import { OrderStatus } from '../../types/order-status';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import clsx from 'clsx';
import { Pagination } from '../../components/common/Pagination';

const OrderList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['orders', 'common', 'dashboard']);
    const { isRTL } = useLanguage();
    const { getCache, setCache } = useCache();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // New Filters
    const [orderNumberFilter, setOrderNumberFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    // Load cached data immediately on mount
    useEffect(() => {
        const params: any = { page, limit };
        if (statusFilter) params.status = statusFilter;
        if (orderNumberFilter) params.orderNumber = orderNumberFilter;
        if (customerNameFilter) params.customerName = customerNameFilter;
        if (dateFilter) {
            params.startDate = `${dateFilter}T00:00:00`;
            params.endDate = `${dateFilter}T23:59:59`;
        }

        const cachedData = getCache<any>('orders', params);
        if (cachedData) {
            if (cachedData.data && Array.isArray(cachedData.data)) {
                setOrders(cachedData.data);
                if (cachedData.meta) {
                    setTotalPages(cachedData.meta.totalPages || 1);
                }
            } else if (Array.isArray(cachedData)) {
                setOrders(cachedData);
            }
        }
    }, []);

    useEffect(() => {
        fetchStatusCounts();
    }, []);

    const fetchStatusCounts = async () => {
        try {
            // Check cache first
            const cachedCounts = getCache<Record<string, number>>('order-status-counts');
            if (cachedCounts) {
                setStatusCounts(cachedCounts);
                return;
            }

            const counts: any = await ordersApi.getStatusCounts();
            setStatusCounts(counts);
            // Cache the status counts
            setCache('order-status-counts', counts);
        } catch (error) {
            console.error('Failed to fetch status counts', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [statusFilter, page, orderNumberFilter, dateFilter, customerNameFilter]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            const params: any = {
                page,
                limit
            };
            if (statusFilter) params.status = statusFilter;
            if (orderNumberFilter) params.orderNumber = orderNumberFilter;
            if (customerNameFilter) params.customerName = customerNameFilter;
            if (dateFilter) {
                params.startDate = `${dateFilter}T00:00:00`;
                params.endDate = `${dateFilter}T23:59:59`;
            }

            // Check cache first
            const cacheKey = 'orders';
            const cachedData = getCache<any>(cacheKey, params);
            if (cachedData) {
                if (cachedData.data && Array.isArray(cachedData.data)) {
                    setOrders(cachedData.data);
                    if (cachedData.meta) {
                        setTotalPages(cachedData.meta.totalPages || 1);
                    }
                } else if (Array.isArray(cachedData)) {
                    setOrders(cachedData);
                }
                // Don't show loading if we have cached data
                return;
            }

            // Only show loading if we need to fetch from API
            setLoading(true);

            const response: any = await ordersApi.getOrders(params);

            // Handle paginated response { data: [...], meta: {...} } or plain array
            if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                setOrders(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.totalPages || 1);
                }
                // Cache the response
                setCache(cacheKey, response, params);
            } else if (response && typeof response === 'object' && 'orders' in response && Array.isArray(response.orders)) {
                setOrders(response.orders);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                }
                // Cache the response
                setCache(cacheKey, response, params);
            } else if (Array.isArray(response)) {
                setOrders(response);
                // Cache the response
                setCache(cacheKey, response, params);
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
            {/* Status Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                <div
                    onClick={() => setStatusFilter('')}
                    className={clsx(
                        "p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center gap-1 transition-all hover:shadow-md cursor-pointer",
                        statusFilter === ''
                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 ring-2 ring-indigo-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    )}
                >
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('total')}</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {Object.values(statusCounts).reduce((a, b) => a + b, 0)}
                    </span>
                </div>
                {[
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,
                    OrderStatus.PREPARING,
                    OrderStatus.READY,
                    OrderStatus.DELIVERED,
                    OrderStatus.CANCELLED
                ].map(status => (
                    <div
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={clsx(
                            "p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center gap-1 transition-all hover:shadow-md cursor-pointer",
                            getStatusColor(status).replace('text-', 'border-').replace('bg-', 'bg-opacity-10 bg-') + ' border bg-opacity-5',
                            statusFilter === status && getStatusColor(status).split(' ')[0], // Add text color class when active
                            statusFilter === status && "ring-2 ring-offset-2 dark:ring-offset-slate-950 ring-current shadow-lg scale-[1.02]"
                        )}
                    >
                        <span className={clsx("text-xs font-bold uppercase tracking-wider opacity-80", statusFilter !== status && getStatusColor(status).split(' ')[0])}>
                            {getLocalizedStatus(status)}
                        </span>
                        <span className={clsx("text-2xl font-black", statusFilter !== status && getStatusColor(status).split(' ')[0])}>
                            {statusCounts[status] || 0}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={t('orderNumberPlaceholder')}
                            className={clsx(
                                "pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-primary outline-none w-48",
                                isRTL && "text-right"
                            )}
                            value={orderNumberFilter}
                            onChange={(e) => setOrderNumberFilter(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={t('customerNamePlaceholder')}
                            className={clsx(
                                "pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-primary outline-none w-40",
                                isRTL && "text-right"
                            )}
                            value={customerNameFilter}
                            onChange={(e) => setCustomerNameFilter(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="date"
                            className={clsx(
                                "px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:ring-primary outline-none",
                                isRTL && "text-right"
                            )}
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
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
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{t('orderNo')}</th>
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
                                            {order.orderNumber || order.id?.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            {order.client?.name || `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || t('common:guest', { defaultValue: 'Guest' })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {Number(order.total || 0).toFixed(2)} {t('common:currencySymbol')}
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

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />
        </div>
    );
};

export default OrderList;
