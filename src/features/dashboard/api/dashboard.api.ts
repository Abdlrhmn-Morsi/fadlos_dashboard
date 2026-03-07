import apiService from '../../../services/api.service';
import { UserRole } from '../../../types/user-role';
import { OrderStatus } from '../../../types/order-status';
import { DashboardStats } from '../models/dashboard.model';
import { PlanFeature } from '../../../types/plan-feature';
import { Permissions } from '../../../types/permissions';

export const fetchDashboardStats = async (user: any) => {
    try {
        const userRole = user.role;
        // Default empty stats
        const stats: DashboardStats = {
            totalRevenue: 0,
            totalOrders: 0,
            todayRevenue: 0,
            todayOrders: 0,
            pendingOrders: 0,
            pendingHiringRequests: 0,
            totalHiredDrivers: 0,
            totalUsers: 0,
            totalStores: 0,
            totalProducts: 0,
            avgOrderValue: 0,
            totalClients: 0,
            totalCustomers: 0,
            totalCategories: 0,
            totalDrivers: 0,
            pendingStores: 0,
            activeSubscriptions: 0,
            totalTowns: 0,
            topRatedProducts: [],
            topCategories: [],
            incomingRequests: [],
            sentInvitations: [],
            averageRating: 0,
            chartData: []
        };

        // Helper to check permission
        const hasPerm = (perm: Permissions | string) => {
            if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN || userRole === UserRole.STORE_OWNER) return true;
            if (userRole === UserRole.EMPLOYEE) {
                return user.employeeRole?.permissions?.includes(perm as string) || false;
            }
            return false;
        };

        if (userRole === UserRole.SUPER_ADMIN) {
            const adminStats = await apiService.get('/stats/admin-summary');
            const data = adminStats.data || adminStats;
            return {
                ...stats,
                ...data
            };
        } else {
            // Store Owner / Employee
            const storeId = user.store?.id || user.storeId;

            // 1. Order Stats (Requires orders.view OR analytics.view)
            if (hasPerm(Permissions.ORDERS_VIEW) || hasPerm(Permissions.ANALYTICS_VIEW)) {
                try {
                    const basicStats = await apiService.get('/orders/stats/basic');
                    const data = basicStats.data || basicStats;

                    stats.totalRevenue = data.totalRevenue || 0;
                    stats.totalConfirmedRevenue = data.totalConfirmedRevenue || 0;
                    stats.totalPendingRevenue = data.totalPendingRevenue || 0;
                    stats.totalOrders = data.totalOrders || 0;
                    stats.avgOrderValue = data.averageOrderValue || 0;
                    stats.pendingOrders = data.pendingOrders || 0;
                    stats.statusCounts = data.statusCounts || {};
                    stats.chartData = data.chartData || [];

                    stats.todayRevenue = data.todayRevenue || 0;
                    stats.todayConfirmedRevenue = data.todayConfirmedRevenue || 0;
                    stats.todayPendingRevenue = data.todayPendingRevenue || 0;
                    stats.todayOrders = data.todayOrders || 0;
                } catch (e) {
                    console.warn('Failed to fetch order stats', e);
                }
            }

            // 2. Parallel requests for other sections, strictly guarded
            const promises: Promise<any>[] = [];

            // Products count (Default for all employees)
            promises.push(apiService.get('/products/store-products?limit=1').then(res => ({ key: 'products', val: res.meta?.total || 0 })).catch(() => ({ key: 'products', val: 0 })));

            // Clients count (users.view or clients.view)
            if (hasPerm(Permissions.CLIENTS_VIEW)) {
                const hasClientsFeature = user.subscription?.features?.includes(PlanFeature.STORE_CLIENTS_MANAGEMENT);
                if (hasClientsFeature) {
                    promises.push(apiService.get('/store/clients?limit=1').then(res => ({ key: 'clients', val: res.meta?.total || 0 })).catch(() => ({ key: 'clients', val: 0 })));
                } else {
                    stats.totalClients = 0;
                }
            }


            // Categories count (Default for all employees)
            promises.push(apiService.get('/categories/seller-categories?limit=1').then(res => ({ key: 'categories', val: res.meta?.total || 0 })).catch(() => ({ key: 'categories', val: 0 })));

            // Drivers count (delivery_drivers.view)
            if (hasPerm(Permissions.DELIVERY_DRIVERS_VIEW)) {
                promises.push(apiService.get('/delivery-drivers/store-drivers?limit=1').then(res => ({ key: 'drivers', val: res.meta?.total || 0 })).catch(() => ({ key: 'drivers', val: 0 })));
            }

            // Followers (store.view) - Assuming store view allows seeing followers
            if (storeId && hasPerm(Permissions.STORE_VIEW)) {
                promises.push(apiService.get(`/stores/my-store`).then(res => ({ key: 'rating', val: res.averageRating || 0, extra: res })).catch(() => ({ key: 'rating', val: 0 })));
            }

            // Hiring Stats (delivery_drivers.create or delivery_drivers.update or delivery_drivers.view)
            if (hasPerm(Permissions.DELIVERY_DRIVERS_VIEW)) {
                promises.push(apiService.get('/delivery-drivers/hiring-requests/me').then(res => {
                    const data = (res as any).data || {};
                    const incomingRequests = data.incomingRequests || [];
                    const sentInvitations = data.sentInvitations || [];
                    return {
                        key: 'hiring-requests-full',
                        val: {
                            incomingRequests,
                            sentInvitations,
                            pendingCount: incomingRequests.filter((r: any) => r.status === 'PENDING').length
                        }
                    };
                }).catch(() => ({ key: 'hiring-requests-full', val: { incomingRequests: [], sentInvitations: [], pendingCount: 0 } })));
                promises.push(apiService.get('/delivery-drivers/store-drivers').then(res => ({ key: 'hired-drivers', val: (res.data || res).filter((d: any) => d.driverType === 'FREELANCER').length })).catch(() => ({ key: 'hired-drivers', val: 0 })));
            }

            // Top Rated Products (Default for all employees)
            promises.push(apiService.get('/products/store-products?sortBy=averageRating&sort=DESC&limit=5').then(res => ({ key: 'topProducts', val: (res as any).data || [] })).catch(() => ({ key: 'topProducts', val: [] })));

            // Top Categories (Default for all employees)
            promises.push(apiService.get('/categories/seller-categories?limit=5').then(res => ({ key: 'topCategories', val: (res as any).data || [] })).catch(() => ({ key: 'topCategories', val: [] })));

            const results = await Promise.all(promises);

            results.forEach((res: any) => {
                if (res.key === 'products') stats.totalProducts = res.val;
                if (res.key === 'clients') stats.totalClients = res.val;
                if (res.key === 'categories') stats.totalCategories = res.val;
                if (res.key === 'drivers') stats.totalDrivers = res.val;
                if (res.key === 'rating') {
                    stats.averageRating = res.val;
                    if (res.extra) {
                        stats.pendingHiringRequests = stats.pendingHiringRequests || 0; // Backup
                        // The store object itself might have some indicators, but we use the specific counts
                    }
                }
                if (res.key === 'hiring-requests-full') {
                    stats.incomingRequests = res.val.incomingRequests;
                    stats.sentInvitations = res.val.sentInvitations;
                    stats.pendingHiringRequests = res.val.pendingCount;
                }
                if (res.key === 'hiring-requests') stats.pendingHiringRequests = res.val;
                if (res.key === 'hired-drivers') stats.totalHiredDrivers = res.val;
                if (res.key === 'topProducts') stats.topRatedProducts = res.val;
                if (res.key === 'topCategories') stats.topCategories = res.val;
            });
        }

        return stats;
    } catch (error) {
        console.error('Fetch Dashboard Stats Error', error);
        throw error;
    }
};
