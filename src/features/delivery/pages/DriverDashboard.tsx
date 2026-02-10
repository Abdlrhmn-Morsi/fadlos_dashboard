import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Truck,
    Power,
    Package,
    MapPin,
    Clock,
    ChevronRight,
    Map
} from 'lucide-react';
import { getDriverProfile, toggleDriverAvailability } from '../api/delivery-drivers.api';
import { ordersApi } from '../../orders/api/orders.api';
import { OrderStatus } from '../../../types/order-status';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from '../../../utils/toast';

const DriverDashboard = () => {
    const { t } = useTranslation(['common', 'orders']);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const [profileData, ordersData] = await Promise.all([
                getDriverProfile(),
                ordersApi.getOrders({
                    driverId: user.id,
                    status: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY].join(',')
                })
            ]);
            setProfile(profileData);
            setOrders(ordersData.data || []);
        } catch (error) {
            console.error('Failed to fetch driver data', error);
            toast.error(t('common.error_fetching_data', 'Failed to load dashboard data'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async () => {
        try {
            setTogglingStatus(true);
            const updatedProfile = await toggleDriverAvailability();
            setProfile(updatedProfile);
            toast.success(updatedProfile.isAvailableForWork
                ? t('delivery.status.online', 'You are now online')
                : t('delivery.status.offline', 'You are now offline')
            );
        } catch (error) {
            console.error('Failed to toggle availability', error);
            toast.error(t('common.error', 'Failed to update status'));
        } finally {
            setTogglingStatus(false);
        }
    };

    const getStatusLabel = (status: string) => {
        return t(`dashboard:status.${status.toLowerCase()}`, { defaultValue: status.replace(/_/g, ' ') });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header / Status Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={clsx(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            profile?.isAvailableForWork
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            <Truck size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={clsx(
                                    "w-2 h-2 rounded-full",
                                    profile?.isAvailableForWork ? "bg-emerald-500" : "bg-slate-300"
                                )} />
                                <span className="text-sm text-slate-500 font-medium">
                                    {profile?.isAvailableForWork
                                        ? t('delivery.status.online', 'Online & Available')
                                        : t('delivery.status.offline', 'Offline')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleToggleAvailability}
                        disabled={togglingStatus}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all",
                            profile?.isAvailableForWork
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                        )}
                    >
                        <Power size={18} />
                        {profile?.isAvailableForWork ? t('common.go_offline', 'Go Offline') : t('common.go_online', 'Go Online')}
                    </button>
                </div>
            </div>

            {/* Current Orders */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="text-indigo-500" size={20} />
                    {t('delivery.orders.current', 'Current Deliveries')}
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs rounded-full">
                        {orders.length}
                    </span>
                </h2>

                {orders.length > 0 ? (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-indigo-600">#{order.orderNumber}</span>
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            order.status === OrderStatus.OUT_FOR_DELIVERY
                                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                                : "bg-blue-50 text-blue-600 border-blue-200"
                                        )}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Clock size={12} />
                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {order.deliveryAddress?.townEnName}, {order.deliveryAddress?.placeEnName}
                                            </p>
                                            <p className="text-slate-500 text-xs line-clamp-1">{order.deliveryAddress?.addressDetails}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                                {order.store?.name?.charAt(0)}
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">{order.store?.name}</span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-12 text-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Map className="text-slate-300" size={32} />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{t('delivery.orders.no_active', 'No active deliveries')}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t('delivery.orders.no_active_desc', 'New orders will appear here when assigned')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
