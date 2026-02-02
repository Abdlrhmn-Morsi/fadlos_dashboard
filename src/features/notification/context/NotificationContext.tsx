import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import OneSignal from 'react-onesignal';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useCache } from '../../../contexts/CacheContext';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    type?: string;
    data?: any;
    imageUrl?: string;
}

interface NotificationContextType {
    unreadCount: number;
    notifications: Notification[];
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: (page?: number, markSeen?: boolean) => Promise<void>;
    showNotificationList: boolean;
    setShowNotificationList: (show: boolean) => void;
    loginOneSignal: (userId: string) => Promise<void>;
    isAudioBlocked: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showNotificationList, setShowNotificationList] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const initialized = useRef(false);
    const { user: authUser } = useAuth(); // Get user from AuthContext
    const { t } = useTranslation(['dashboard', 'common']);
    const { getCache, setCache, invalidateCache } = useCache();

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            const count = response.data.data?.data?.unreadCount ?? response.data.data?.unreadCount ?? 0;
            setUnreadCount(count);
        } catch (error) {
            // Silently handle
        }
    }, []);

    const fetchNotifications = useCallback(async (page = 1, markAll = false) => {
        setIsLoading(true);
        const params: any = { page, limit: 10 };

        try {
            // Check cache for first page
            if (page === 1) {
                const cacheKey = 'notifications';
                const cachedData = getCache<Notification[]>(cacheKey, params);
                if (cachedData && Array.isArray(cachedData)) {
                    console.log('[Cache] Loading notifications from cache:', cachedData.length);
                    setNotifications(cachedData);
                    setIsLoading(false);

                    // If markAll is requested, make a separate API call to mark as seen
                    if (markAll) {
                        try {
                            await api.get('/notifications', { params: { ...params, markAll: true } });
                            fetchUnreadCount();
                        } catch (error) {
                            // Silently handle
                        }
                    } else {
                        fetchUnreadCount();
                    }
                    return;
                }
                console.log('[Cache] No cached notifications found');
            }

            console.log('[API] Fetching notifications from API');

            // Add markAll to params if needed
            if (markAll) {
                params.markAll = true;
            }

            const response = await api.get('/notifications', { params });
            const newNotifications = response.data.data?.data || response.data.data || [];

            if (page === 1) {
                setNotifications(Array.isArray(newNotifications) ? newNotifications : []);
                // Always cache first page (without markAll in the cache key)
                const cacheParams = { page, limit: 10 };
                setCache('notifications', newNotifications, cacheParams);
            } else {
                setNotifications(prev => [...prev, ...(Array.isArray(newNotifications) ? newNotifications : [])]);
            }
            fetchUnreadCount();
        } catch (error) {
            // Silently handle
        } finally {
            setIsLoading(false);
        }
    }, [fetchUnreadCount, getCache, setCache]);

    const playNotificationSound = (soundPath = '/notification_sound.mp3') => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(soundPath);
            } else {
                audioRef.current.src = soundPath;
            }

            console.log('[NotificationSound] Attempting play:', soundPath);
            audioRef.current.play()
                .then(() => console.log('[NotificationSound] Success'))
                .catch((err) => console.warn('[NotificationSound] Blocked/Error:', err));

        } catch (e) {
            // Silently handle
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/mark-read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            // Invalidate cache when marking as read
            invalidateCache('notifications');
        } catch (error) {
            // Silently handle
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            // Invalidate cache when marking all as read
            invalidateCache('notifications');
        } catch (error) {
            // Silently handle
        }
    };

    const loginOneSignal = async (userId: string) => {
        try {
            await OneSignal.login(userId);
            const isOptedIn = OneSignal.User.PushSubscription.optedIn;
            if (!isOptedIn) {
                OneSignal.User.PushSubscription.optIn();
            }
        } catch (error) {
            // Silently handle
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const unlockAudio = () => {
            if (!audioRef.current) {
                audioRef.current = new Audio('/notification_sound.mp3');
            }
            audioRef.current.volume = 0;
            audioRef.current.play()
                .then(() => {
                    if (audioRef.current) audioRef.current.volume = 1;
                    setIsAudioBlocked(false);
                })
                .catch((err) => {
                    if (err.name === 'NotAllowedError') {
                        setIsAudioBlocked(true);
                    }
                });

            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        fetchUnreadCount();

        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: (import.meta as any).env.VITE_ONESIGNAL_APP_ID || '02d9099a-d519-499a-9768-1a4010512a3f',
                    allowLocalhostAsSecureOrigin: true,
                });

                OneSignal.Slidedown.promptPush();

                // Use authUser instead of localStorage
                if (authUser && authUser.id) {
                    if (OneSignal.User.externalId !== authUser.id) {
                        await OneSignal.login(authUser.id);
                    }
                }

                OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
                    console.log('[OneSignal] Foreground Notification:', event.notification);
                    const notification = event.notification;
                    const data = notification.additionalData as any;
                    console.log('[OneSignal] Additional Data:', data);

                    // Determine which sound to play
                    let soundToPlay = '/notification_sound.mp3';
                    if (data && (data.type === 'order' || data.trigger === 'new_order' || data.isOrder === true)) {
                        soundToPlay = '/notification_sound_order.mp3';
                        toast.success(t('dashboard:newOrderReceived'));
                    }

                    playNotificationSound(soundToPlay);
                    // Invalidate cache when new notification arrives
                    invalidateCache('notifications');
                    fetchUnreadCount();
                    fetchNotifications(1);
                });

            } catch (error) {
                // OneSignal initialization failed
            }
        };

        initOneSignal();

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, [fetchUnreadCount, fetchNotifications, authUser]);

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            isLoading,
            markAsRead,
            markAllAsRead,
            fetchNotifications,
            showNotificationList,
            setShowNotificationList,
            loginOneSignal,
            isAudioBlocked
        }}>
            {children}

        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
