import apiService from '../../../services/api.service';
import { UserRole } from '../../../types/user-role';
import { OrderStatus } from '../../../types/order-status';

export const fetchDashboardStats = async (user: any) => {
    try {
        const userRole = user.role;
        // Default empty stats
        const stats = {
            totalRevenue: 0,
            totalOrders: 0,
            pendingOrders: 0,
            totalUsers: 0,
            totalStores: 0,
            totalProducts: 0,
            avgOrderValue: 0,
            totalClients: 0,
            totalFollowers: 0,
            totalReviews: 0,
            totalCategories: 0,
            topRatedProducts: [],
            topCategories: [],
            averageRating: 0,
            chartData: []
        };

        // Helper to check permission
        const hasPerm = (perm: string) => {
            if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN || userRole === UserRole.STORE_OWNER) return true;
            if (userRole === UserRole.EMPLOYEE) {
                return user.employeeRole?.permissions?.includes(perm) || false;
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
            // If the user only has orders.update, they might not be allowed to see stats.
            // We'll require orders.view for now as it's the safest bet for "reading" order data.
            if (hasPerm('orders.view') || hasPerm('analytics.view')) {
                try {
                    const responseBody = await apiService.get('/orders/stats/summary?period=30d');
                    const data = responseBody.data || responseBody;
                    stats.totalRevenue = data.totalRevenue || 0;
                    stats.totalOrders = data.totalOrders || 0;
                    stats.avgOrderValue = data.averageOrderValue || 0;
                    stats.pendingOrders = data.statusCounts?.pending || 0;
                    stats.chartData = data.chartData || [];
                } catch (e) {
                    console.warn('Failed to fetch order stats', e);
                }
            }

            // 2. Parallel requests for other sections, strictly guarded
            const promises: Promise<any>[] = [];

            // Products count (Default for all employees)
            promises.push(apiService.get('/products/store-products?limit=1').then(res => ({ key: 'products', val: res.meta?.total || 0 })).catch(() => ({ key: 'products', val: 0 })));

            // Clients count (users.view or clients.view)
            if (hasPerm('users.view')) {
                promises.push(apiService.get('/store/clients?limit=1').then(res => ({ key: 'clients', val: res.meta?.total || 0 })).catch(() => ({ key: 'clients', val: 0 })));
            }

            // Reviews count (store.view)
            if (hasPerm('store.view')) {
                promises.push(apiService.get('/reviews/store-management?limit=1').then(res => ({ key: 'reviews', val: res.meta?.total || 0 })).catch(() => ({ key: 'reviews', val: 0 })));
            }

            // Categories count (Default for all employees)
            promises.push(apiService.get('/categories/seller-categories?limit=1').then(res => ({ key: 'categories', val: res.meta?.total || 0 })).catch(() => ({ key: 'categories', val: 0 })));

            // Followers (store.view) - Assuming store view allows seeing followers
            if (storeId && hasPerm('store.view')) {
                promises.push(apiService.get(`/follows/stats/store/${storeId}`).then(res => ({ key: 'followers', val: res.followersCount || 0 })).catch(() => ({ key: 'followers', val: 0 })));
                promises.push(apiService.get(`/stores/my-store`).then(res => ({ key: 'rating', val: res.averageRating || 0 })).catch(() => ({ key: 'rating', val: 0 })));
            }

            // Top Rated Products (Default for all employees)
            promises.push(apiService.get('/products/store-products?sortBy=averageRating&sort=DESC&limit=5').then(res => ({ key: 'topProducts', val: (res as any).data || [] })).catch(() => ({ key: 'topProducts', val: [] })));

            // Top Categories (Default for all employees)
            promises.push(apiService.get('/categories/seller-categories?limit=5').then(res => ({ key: 'topCategories', val: (res as any).data || [] })).catch(() => ({ key: 'topCategories', val: [] })));

            const results = await Promise.all(promises);

            results.forEach((res: any) => {
                if (res.key === 'products') stats.totalProducts = res.val;
                if (res.key === 'clients') stats.totalClients = res.val;
                if (res.key === 'reviews') stats.totalReviews = res.val;
                if (res.key === 'categories') stats.totalCategories = res.val;
                if (res.key === 'followers') stats.totalFollowers = res.val;
                if (res.key === 'rating') stats.averageRating = res.val;
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
