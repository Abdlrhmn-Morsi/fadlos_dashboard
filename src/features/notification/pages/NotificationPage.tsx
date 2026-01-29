import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Check, Bell, BellOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export const NotificationPage = () => {
    const {
        notifications,
        isLoading,
        markAllAsRead,
        markAsRead,
        fetchNotifications
    } = useNotification();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { t } = useTranslation('common');

    useEffect(() => {
        fetchNotifications(1, true);
    }, [fetchNotifications]);

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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    {t('notificationsTitle')}
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading && notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <BellOff className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('noNotifications')}</h3>
                        <p className="mt-1">{t('caughtUp')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={clsx(
                                    "p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 items-start",
                                    !notification.isRead ? "bg-indigo-50/40" : ""
                                )}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {notification.imageUrl ? (
                                        <img src={notification.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            notification.type === 'order' ? "bg-indigo-100 text-indigo-600" :
                                                notification.type === 'review' ? "bg-yellow-100 text-yellow-600" :
                                                    notification.type === 'follow' ? "bg-green-100 text-green-600" :
                                                        "bg-gray-100 text-gray-600"
                                        )}>
                                            <Bell className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={clsx("text-sm font-medium text-gray-900", !notification.isRead && "font-bold")}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
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
                    <div className="p-4 border-t border-gray-100 text-center">
                        <button
                            onClick={() => fetchNotifications(Math.ceil(notifications.length / 10) + 1)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {t('loadEarlierNotifications')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
