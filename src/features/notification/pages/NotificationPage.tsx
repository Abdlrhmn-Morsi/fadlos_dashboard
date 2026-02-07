import React, { useEffect, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Check, Bell, BellOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/user-role';

export const NotificationPage = () => {
    const {
        notifications,
        isLoading,
        markAllAsRead,
        markAsRead,
        fetchNotifications,
        activeFilters
    } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { t } = useTranslation('common');

    const displayNotifications = notifications;

    useEffect(() => {
        fetchNotifications(1, true, activeFilters);
    }, [fetchNotifications, activeFilters]);

    // Reset pagination to first page or handle deeper pagination logic if needed
    // For now we rely on the context fetching logic which appends

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);

        // Navigation logic based on type
        if (notification.type === 'order' && notification.data?.order?.id) {
            navigate(`/orders/${notification.data.order.id}`);
        } else if (notification.type === 'order' && notification.data?.isOrder && notification.data?.order?.orderId) {
            navigate(`/orders/${notification.data.order.orderId}`);
        } else if (notification.type === 'review') {
            navigate(`/reviews`);
        } else if (notification.type === 'follow') {
            navigate(`/followers`);
        } else if (notification.data?.isStore && notification.data?.store?.id) {
            navigate(`/stores`); // Super admin logic
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {t('notificationsTitle')}
                </h1>
                {user?.role !== UserRole.EMPLOYEE && notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                        <Check className="w-4 h-4" />
                        {t('markAllAsRead')}
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                {isLoading && displayNotifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-slate-400">Loading notifications...</div>
                ) : displayNotifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center">
                        <BellOff className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('noNotifications')}</h3>
                        <p className="mt-1">{t('caughtUp')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {displayNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={clsx(
                                    "p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-4 items-start",
                                    !notification.isRead ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                                )}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {notification.imageUrl ? (
                                        <img src={notification.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700" />
                                    ) : (
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            notification.type === 'order' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                                notification.type === 'review' ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                    notification.type === 'follow' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                                        "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={clsx("text-sm font-medium text-gray-900 dark:text-white", !notification.isRead && "font-bold")}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap ml-2">
                                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{notification.message}</p>
                                </div>
                                {!notification.isRead && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-center">
                        <button
                            onClick={() => fetchNotifications(Math.ceil(notifications.length / 10) + 1, false, activeFilters)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                        >
                            {t('loadEarlierNotifications')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
