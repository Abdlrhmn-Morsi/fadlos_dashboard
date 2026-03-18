import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { fetchDashboardStats } from './api/dashboard.api';
import { getMyStore } from '../stores/api/stores.api';
import { getMySubscriptionUsage, SubscriptionUsage } from '../subscriptions/api/subscriptions.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserRole } from '../../types/user-role';
import {
    dashboardStatsState,
    dashboardLoadingState,
    dashboardErrorState,
    dashboardChartDataState
} from './store/dashboard.store';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../contexts/CacheContext';
import AdminDashboard from './components/AdminDashboard';
import StoreDashboard from './components/StoreDashboard';
import clsx from 'clsx';
import { useLanguage } from '../../contexts/LanguageContext';

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const { isRTL } = useLanguage();
    const [stats, setStats] = useRecoilState(dashboardStatsState);
    const [loading, setLoading] = useRecoilState(dashboardLoadingState);
    const [error, setError] = useRecoilState(dashboardErrorState);
    const [chartData, setChartData] = useRecoilState(dashboardChartDataState);
    const [storeDetails, setStoreDetails] = useState<any>(null);
    const [subscription, setSubscription] = useState<SubscriptionUsage | null>(null);
    const { getCache, setCache } = useCache();
    const { user, hasPermission } = useAuth();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const dashboardCacheKey = `dashboard-stats-v4-${user.role}`;
                const storeCacheKey = 'store-details';

                // Fetch Dashboard Stats (Unified API handles role-based logic)
                const cachedStats = getCache<any>(dashboardCacheKey);
                let dashboardData;
                if (cachedStats) {
                    dashboardData = cachedStats;
                } else {
                    dashboardData = await fetchDashboardStats(user);
                    setCache(dashboardCacheKey, dashboardData);
                }
                setStats(dashboardData);

                // Handle Chart Data
                const data = dashboardData.chartData || [];
                if (data.length === 0) {
                    const skeletonData = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        skeletonData.push({ label: d.toLocaleDateString('sv-SE'), revenue: 0 });
                    }
                    setChartData(skeletonData);
                } else {
                    setChartData(data);
                }

                // Role-Specific Additional Data
                if (user?.role === UserRole.STORE_OWNER || user?.role === UserRole.EMPLOYEE) {
                    // Fetch Store Details
                    const cachedStore = getCache<any>(storeCacheKey);
                    if (cachedStore) {
                        setStoreDetails(cachedStore);
                    } else {
                        try {
                            const storeData = await getMyStore();
                            setStoreDetails(storeData);
                            setCache(storeCacheKey, storeData);
                        } catch (e) {
                            console.warn('Store fetch failed', e);
                        }
                    }

                    // Fetch Subscription for Store Owners
                    if (user?.role === UserRole.STORE_OWNER) {
                        const subCacheKey = 'subscription-usage';
                        const cachedSub = getCache<SubscriptionUsage>(subCacheKey);
                        if (cachedSub) {
                            setSubscription(cachedSub);
                        } else {
                            try {
                                const subData = await getMySubscriptionUsage();
                                setSubscription(subData as SubscriptionUsage);
                                setCache(subCacheKey, subData);
                            } catch (e) {
                                console.warn('Sub fetch failed', e);
                            }
                        }
                    }
                }

                setError(null);
            } catch (err: any) {
                console.error("Dashboard load error:", err);
                setError(t('failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user]);

    if (loading || !user) return <LoadingSpinner />;
    
    if (error) return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded text-rose-600 font-medium m-6 text-center">
            {error}
        </div>
    );

    return (
        <div className={clsx(
            "p-6 max-w-full mx-auto min-h-full bg-[#fdfdfd] dark:bg-slate-950 transition-colors duration-500",
            isRTL ? "font-cairo" : "font-inter"
        )}>
            {user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? (
                <AdminDashboard stats={stats} />
            ) : (
                <StoreDashboard 
                    stats={stats} 
                    user={user} 
                    storeDetails={storeDetails} 
                    subscription={subscription} 
                    hasPermission={hasPermission}
                    chartData={chartData}
                />
            )}
        </div>
    );
};

export default Dashboard;
