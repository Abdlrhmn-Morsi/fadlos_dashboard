import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, ShoppingBag, DollarSign, Calendar,
    Search, ArrowUpDown, ChevronRight, X,
    Loader2, TrendingUp, TrendingDown,
    Clock, Package, ArrowLeft, Mail, Phone, MapPin, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import clientsApi from './api/clients.api';
import ordersApi from '../orders/api/orders.api';
import { toast } from '../../utils/toast';
import { OrderStatus } from '../../types/order-status';
import clsx from 'clsx';

const ClientList = () => {
    const { t } = useTranslation(['clients', 'common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

    // Side panel state
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [clientOrders, setClientOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // In-page Order Detail state
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [sortBy, order]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const params = {
                sortBy,
                order,
                search: searchTerm || undefined
            };
            const response: any = await clientsApi.getStoreClients(params);
            setClients(response.data || response || []);
        } catch (error) {
            console.error('Failed to fetch clients', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchClients();
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(order === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setOrder('DESC');
        }
    };

    const viewClientOrders = async (clientData: any) => {
        setSelectedClient(clientData);
        setViewMode('list');
        setSelectedOrder(null);
        try {
            setLoadingOrders(true);
            const response: any = await clientsApi.getClientOrders(clientData.clientId);
            setClientOrders(response.data || response.orders || []);
        } catch (error) {
            console.error('Failed to fetch client orders', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoadingOrders(false);
        }
    };

    const viewOrderDetailInPage = async (orderId: string) => {
        try {
            setLoadingOrderDetail(true);
            setViewMode('detail');
            const data = await ordersApi.getOrder(orderId);
            setSelectedOrder(data);
        } catch (error) {
            console.error('Failed to fetch order detail', error);
            toast.error(t('common:errorFetchingData'));
            setViewMode('list');
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'delivered') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        if (s === 'pending') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        if (s === 'cancelled') return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
        return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-slate-500 font-medium">{t('subtitle')}</p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-80">
                    <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={18} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className={clsx(
                            "w-full pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm",
                            isRTL ? "pr-10" : "pl-10"
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            {/* Sorting Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => { setSortBy('totalSpent'); setOrder('DESC'); }}
                    className={clsx(
                        "p-4 rounded-xl border transition-all group",
                        isRTL ? "text-right" : "text-left",
                        sortBy === 'totalSpent' ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <DollarSign size={20} className={sortBy === 'totalSpent' ? "text-white/80" : "text-primary"} />
                        {sortBy === 'totalSpent' && (order === 'DESC' ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
                    </div>
                    <p className={clsx("text-xs font-bold uppercase tracking-wider mb-1", sortBy === 'totalSpent' ? "text-white/70" : "text-slate-400")}>{t('highestSpenders')}</p>
                    <p className="text-sm font-black">{t('sortByTotalSpent')}</p>
                </button>

                <button
                    onClick={() => { setSortBy('totalOrders'); setOrder('DESC'); }}
                    className={clsx(
                        "p-4 rounded-xl border transition-all group",
                        isRTL ? "text-right" : "text-left",
                        sortBy === 'totalOrders' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-400"
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <ShoppingBag size={20} className={sortBy === 'totalOrders' ? "text-white/80" : "text-indigo-500"} />
                        {sortBy === 'totalOrders' && (order === 'DESC' ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
                    </div>
                    <p className={clsx("text-xs font-bold uppercase tracking-wider mb-1", sortBy === 'totalOrders' ? "text-white/70" : "text-slate-400")}>{t('mostActive')}</p>
                    <p className="text-sm font-black">{t('sortByTotalOrders')}</p>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4">
                                    <button onClick={() => toggleSort('firstName')} className="flex items-center gap-2 group text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {t('clientInformation')}
                                        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t('clientSince')}</th>
                                <th className="px-6 py-4">
                                    <button onClick={() => toggleSort('totalOrders')} className="flex items-center gap-2 group text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {t('totalOrders')}
                                        <ArrowUpDown size={14} className={clsx("transition-opacity", sortBy === 'totalOrders' ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100")} />
                                    </button>
                                </th>
                                <th className="px-6 py-4">
                                    <button onClick={() => toggleSort('totalSpent')} className="flex items-center gap-2 group text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {t('totalSpent')}
                                        <ArrowUpDown size={14} className={clsx("transition-opacity", sortBy === 'totalSpent' ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100")} />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={32} className="text-primary animate-spin" />
                                            <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('syncingClients')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-tighter">{t('noClientsMatch')}</td>
                                </tr>
                            ) : (
                                clients.map((item) => {
                                    const client = item.client;
                                    const stats = item.stats;
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => viewClientOrders(item)}
                                            className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                        {client?.profileImage ? (
                                                            <img src={client.profileImage} alt={client.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                            {client?.name || t('anonymousUser')}
                                                        </h3>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{client?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                                    <ShoppingBag size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                                    <span className="font-black text-slate-900 dark:text-white">{stats?.totalOrders || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-primary font-black text-lg tracking-tight">
                                                        {Number(stats?.totalSpent || 0).toFixed(2)}$
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t('avg')} {Number(stats?.averageOrderValue || 0).toFixed(2)}$</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right rtl:text-left">
                                                <ChevronRight size={20} className={clsx("text-slate-300 transition-all inline-block", isRTL ? "group-hover:text-primary group-hover:-translate-x-1 rotate-180" : "group-hover:text-primary group-hover:translate-x-1")} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Panel (Contextual View) */}
            <div className={clsx(
                "fixed inset-0 z-[100] transition-opacity duration-300 pointer-events-none",
                selectedClient ? "opacity-100" : "opacity-0"
            )}>
                <div className={clsx(
                    "absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all pointer-events-auto",
                    selectedClient ? "opacity-100" : "opacity-0 invisible"
                )} onClick={() => setSelectedClient(null)} />

                <div className={clsx(
                    "absolute top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 pointer-events-auto",
                    isRTL ? "left-0 border-r border-slate-200 dark:border-slate-800" : "right-0 border-l border-slate-200 dark:border-slate-800",
                    selectedClient ? "translate-x-0" : (isRTL ? "-translate-x-full" : "translate-x-full")
                )}>
                    <div className="flex flex-col h-full">
                        {/* Panel Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-4">
                                {viewMode === 'detail' && (
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-primary"
                                    >
                                        <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                        {viewMode === 'list' ? t('orderHistory') : t('orderDetails')}
                                    </h2>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{selectedClient?.client?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-rose-500"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {viewMode === 'list' ? (
                                // --- LIST VIEW ---
                                loadingOrders ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 size={32} className="text-primary animate-spin" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('retrievingPurchases')}</p>
                                    </div>
                                ) : clientOrders.length === 0 ? (
                                    <div className="text-center py-20">
                                        <ShoppingBag size={48} className="mx-auto text-slate-100 mb-4" />
                                        <p className="font-bold text-slate-400 font-mono text-sm">{t('noRecentOrders')}</p>
                                    </div>
                                ) : (
                                    clientOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => viewOrderDetailInPage(order.id)}
                                            className="p-5 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                            #{order.id.slice(0, 8)}
                                                        </span>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                            getStatusColor(order.status)
                                                        )}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                                        <Clock size={12} />
                                                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className={clsx(isRTL ? "text-left" : "text-right")}>
                                                    <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{Number(order.total).toFixed(2)}$</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{order.items?.length || 0} {t('common:items')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                <div className="flex -space-x-2">
                                                    {order.items?.slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} title={item.productName} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center overflow-hidden">
                                                            {item.product?.coverImage ? (
                                                                <img src={item.product.coverImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package size={14} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 3 && (
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                            +{order.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="flex-1" />
                                                <button className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-2 transition-all">
                                                    {t('common:details')}
                                                    <ChevronRight size={14} className={isRTL ? "rotate-180" : ""} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                // --- DETAIL VIEW ---
                                loadingOrderDetail ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 size={32} className="text-primary animate-spin" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('common:loading')}</p>
                                    </div>
                                ) : selectedOrder && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        {/* Simplified Detail UI */}
                                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('orderStatus')}</p>
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
                                                    getStatusColor(selectedOrder.status)
                                                )}>
                                                    {selectedOrder.status}
                                                </span>
                                            </div>
                                            <div className={clsx(isRTL ? "text-left" : "text-right")}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('placedOn')}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                                                    {new Date(selectedOrder.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('purchasedItems')}</h3>
                                            <div className="space-y-2">
                                                {selectedOrder.items?.map((item: any) => (
                                                    <div key={item.id} className="flex gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                                            {item.product?.coverImage ? (
                                                                <img src={item.product.coverImage} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package size={20} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate uppercase tracking-tighter">{item.productName}</p>
                                                                <p className="font-black text-slate-900 dark:text-white text-sm tracking-tighter">{Number(item.price * item.quantity).toFixed(2)}$</p>
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{t('qty')}: {item.quantity} × {Number(item.price).toFixed(2)}$</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                <span>{t('subtotal')}</span>
                                                <span className="text-slate-900 dark:text-white">{Number(selectedOrder.subtotal).toFixed(2)}$</span>
                                            </div>
                                            {Number(selectedOrder.promoDiscount) > 0 && (
                                                <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-tighter">
                                                    <span>{t('discount')}</span>
                                                    <span>-{Number(selectedOrder.promoDiscount).toFixed(2)}$</span>
                                                </div>
                                            )}
                                            {Number(selectedOrder.deliveryFee) > 0 && (
                                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                    <span>{t('delivery')}</span>
                                                    <span className="text-slate-900 dark:text-white">+{Number(selectedOrder.deliveryFee).toFixed(2)}$</span>
                                                </div>
                                            )}
                                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">{t('totalPaid')}</span>
                                                <span className="text-2xl font-black text-primary tracking-tighter">{Number(selectedOrder.total).toFixed(2)}$</span>
                                            </div>
                                        </div>

                                        {/* Delivery Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('logistics')}</h3>
                                            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    <MapPin size={16} className="text-primary" />
                                                    <span className="uppercase tracking-tighter">{selectedOrder.deliveryAddress ? `${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.city}` : t('pickup')}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    <Phone size={16} className="text-primary" />
                                                    <span className="tracking-tighter">{selectedOrder.client?.phone || t('noPhone')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Panel Footer */}
                        {viewMode === 'list' && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('lifetimeValue')}</p>
                                        <p className="text-xl font-black text-primary">{Number(selectedClient?.stats?.totalSpent || 0).toFixed(2)}$</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalPurchases')}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white uppercase">{selectedClient?.stats?.totalOrders || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {viewMode === 'detail' && selectedOrder && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => navigate(`/orders/${selectedOrder.id}`)}
                                    className="w-full py-3 bg-slate-900 dark:bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} />
                                    {t('goToOrderFulfillment')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientList;
