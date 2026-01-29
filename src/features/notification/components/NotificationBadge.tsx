import React from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const NotificationBadge = () => {
    const { unreadCount, showNotificationList, setShowNotificationList, isAudioBlocked } = useNotification();
    const { t } = useTranslation('common');

    return (
        <div className="relative">
            <button
                type="button"
                className={clsx(
                    "relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors",
                    isAudioBlocked && "animate-pulse text-red-500 bg-red-50"
                )}
                onClick={() => setShowNotificationList(!showNotificationList)}
                title={isAudioBlocked ? "Click to enable notification sounds" : t('notifications')}
            >
                <span className="sr-only">{t('notifications')}</span>
                <Bell className={clsx("h-6 w-6", isAudioBlocked && "text-red-500")} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className={clsx(
                        "absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full",
                        unreadCount > 99 ? "px-1.5" : "px-2"
                    )}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isAudioBlocked && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg z-50 pointer-events-none animate-bounce">
                    🔔 Click bell to enable sounds
                    <div className="absolute top-0 right-4 -mt-1 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};
