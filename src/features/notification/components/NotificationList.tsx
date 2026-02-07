import React, { useRef, useEffect, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Check, X, FileText, ShoppingBag, UserPlus, Info } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/user-role';

// Icons mapping based on type
const getIcon = (type: string) => {
    switch (type) {
        case 'order': return <ShoppingBag className="h-5 w-5 text-indigo-500" />;
        case 'review': return <FileText className="h-5 w-5 text-yellow-500" />;
        case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />;
        default: return <Info className="h-5 w-5 text-gray-500" />;
    }
};

export const NotificationList = () => {
    const {
        notifications,
        isLoading,
        markAllAsRead,
        showNotificationList,
        setShowNotificationList,
        markAsRead,
        fetchNotifications,
        activeFilters
    } = useNotification();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { isRTL } = useLanguage();

    const displayNotifications = notifications;

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                // Ensure we don't close if clicking the badge itself (handled in parent or careful logic)
                // For simplicity, we might let the parent handle layout refs, or close here.
                // Because badge is separate, clicking badge might trigger close then open.
                // Better handled if Badge and List are in a container, but here we just provide the list.
                setShowNotificationList(false);
            }
        }
        if (showNotificationList) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotificationList, setShowNotificationList]);

    useEffect(() => {
        if (showNotificationList) {
            // When list opens, fetch and mark all as read
            fetchNotifications(1, true, activeFilters);
        }
    }, [showNotificationList, fetchNotifications, activeFilters]);

    if (!showNotificationList) return null;

    return (
        <div ref={wrapperRef} className={clsx(
            "absolute mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 z-50 overflow-hidden",
            isRTL ? "left-0" : "right-0"
        )}>
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('notifications')}</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {isLoading && displayNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">Loading...</div>
                ) : displayNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm flex flex-col items-center">
                        <BellOffIcon />
                        <span className="mt-2 text-slate-400 dark:text-slate-500">{t('noNotifications')}</span>
                    </div>
                ) : (
                    <ul>
                        {displayNotifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={clsx(
                                    "p-4 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group",
                                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                )}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                                    <div className="flex-shrink-0 mt-1">
                                        {notification.imageUrl ? (
                                            <img src={notification.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            getIcon(notification.type?.toLowerCase() || 'info')
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx("text-sm font-medium text-gray-900 dark:text-white", !notification.isRead && "font-semibold")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="flex-shrink-0 self-center">
                                            <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                        <li className="p-2 text-center">
                            <button
                                className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                                onClick={() => fetchNotifications(Math.ceil(notifications.length / 10) + 1, false, activeFilters)}
                            >
                                {t('loadMore')}
                            </button>
                        </li>
                    </ul>
                )}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-center">
                <button
                    onClick={() => {
                        setShowNotificationList(false);
                        navigate('/notifications');
                    }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    {t('viewAllNotifications')}
                </button>
            </div>
        </div >
    );
};

const BellOffIcon = () => (
    <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17h6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
);
