import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, Package, DollarSign, Loader2, AlertCircle, Eye } from 'lucide-react';
import settlementsApi from './api/settlements.api';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';
import { toast } from '../../utils/toast';

const CashSettlement = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['orders', 'common', 'products']);
    const { isRTL } = useLanguage();
    const [pendingCollections, setPendingCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [settling, setSettling] = useState<string | null>(null);

    // New states for order selection
    const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
    const [driverOrders, setDriverOrders] = useState<any[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        fetchPendingCollections();
    }, []);

    const fetchPendingCollections = async () => {
        try {
            setLoading(true);
            const data: any = await settlementsApi.getPendingCollections();
            setPendingCollections(data);
        } catch (error) {
            console.error('Failed to fetch pending collections', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    const handleDriverClick = async (driver: any) => {
        if (selectedDriver?.driverId === driver.driverId) {
            setSelectedDriver(null);
            setDriverOrders([]);
            setSelectedOrderIds([]);
            return;
        }

        try {
            setSelectedDriver(driver);
            setLoadingOrders(true);
            const data: any = await settlementsApi.getPendingOrdersByDriver(driver.driverId);
            setDriverOrders(data);
            // Default to selecting all orders
            setSelectedOrderIds(data.map((o: any) => o.id));
        } catch (error) {
            console.error('Failed to fetch driver orders', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoadingOrders(false);
        }
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSettle = async () => {
        if (!selectedDriver || selectedOrderIds.length === 0) return;

        try {
            setSettling(selectedDriver.driverId);
            await settlementsApi.createSettlement(selectedDriver.driverId, selectedOrderIds);

            toast.success(t('updateSuccess', 'Collection confirmed successfully'));

            // Reset state
            setSelectedDriver(null);
            setDriverOrders([]);
            setSelectedOrderIds([]);

            // Refresh list
            fetchPendingCollections();
        } catch (error) {
            console.error('Settlement failed', error);
            toast.error('Settlement failed');
        } finally {
            setSettling(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-slate-500">{t('common:loading')}</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {t('cashSettlement', 'Cash Settlement')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('settlementDescription', 'Collect cash from drivers for delivered orders')}
                    </p>
                </div>
            </div>

            {pendingCollections.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-500 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        {t('allSettled', 'Everything is settled!')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {t('noPendingCollections', 'No drivers have outstanding cash to collect.')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Drivers List */}
                    <div className={clsx(
                        "grid gap-4",
                        selectedDriver ? "lg:col-span-4" : "lg:col-span-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    )}>
                        {pendingCollections.map((collection) => (
                            <div
                                key={collection.driverId}
                                onClick={() => handleDriverClick(collection)}
                                className={clsx(
                                    "bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer overflow-hidden p-6 shadow-sm hover:shadow-md",
                                    selectedDriver?.driverId === collection.driverId
                                        ? "border-primary ring-1 ring-primary"
                                        : "border-slate-200 dark:border-slate-800"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Truck className="text-primary w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">
                                            {collection.driverName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <Package size={14} />
                                            <span>{collection.orderCount} {t('common:orders')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        {t('totalCashInHand', 'Total Cash in Hand')}
                                    </div>
                                    <div className="text-2xl font-black text-primary flex items-baseline gap-1">
                                        {Number(collection.totalAmount).toFixed(2)}
                                        <span className="text-sm font-bold opacity-70">{t('common:currencySymbol')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Selected Driver Orders */}
                    {selectedDriver && (
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                        {selectedDriver.driverName} - {t('common:orders')}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {selectedOrderIds.length} {t('common:selected')} / {driverOrders.length} {t('common:total')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={clsx(isRTL ? 'text-left' : 'text-right')}>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalSelected', 'Selected Total')}</div>
                                        <div className="text-xl font-black text-primary">
                                            {driverOrders
                                                .filter(o => selectedOrderIds.includes(o.id))
                                                .reduce((sum, o) => sum + Number(o.total), 0)
                                                .toFixed(2)}
                                            <span className="text-xs ml-1 opacity-70">{t('common:currencySymbol')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSettle}
                                        disabled={settling === selectedDriver.driverId || selectedOrderIds.length === 0}
                                        className={clsx(
                                            "px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                            "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
                                            "disabled:opacity-50 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        {settling === selectedDriver.driverId ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <CheckCircle size={18} />
                                        )}
                                        {t('markAsSettled', 'Confirm Collection')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {loadingOrders ? (
                                    <div className="flex flex-col items-center justify-center h-full py-12">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                        <p className="text-slate-500">{t('common:loading')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {driverOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                onClick={() => toggleOrderSelection(order.id)}
                                                className={clsx(
                                                    "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
                                                    selectedOrderIds.includes(order.id)
                                                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                                    selectedOrderIds.includes(order.id)
                                                        ? "bg-primary border-primary text-white"
                                                        : "border-slate-300 dark:border-slate-600"
                                                )}>
                                                    {selectedOrderIds.includes(order.id) && <CheckCircle size={14} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-400">#{order.orderNumber}</span>
                                                            <h4 className="font-bold text-slate-800 dark:text-white leading-none mt-1">
                                                                {order.client?.name || order.clientInfo?.name || t('orders:guest')}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={clsx(isRTL ? 'text-left' : 'text-right')}>
                                                                <div className="font-bold text-slate-800 dark:text-white">
                                                                    {Number(order.total).toFixed(2)} {t('common:currencySymbol')}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/orders/${order.id}`);
                                                                }}
                                                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                                                                title={t('common:viewDetails')}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CashSettlement;
