import apiService from '../../../services/api.service';
import { UserRole } from '../../../types/user-role';
import { OrderStatus } from '../../../types/order-status';

export const fetchDashboardStats = async (user: any) => {
    try {
        const userRole = user.role;
        let revenue = 0;
        let ordersCount = 0;
        let usersCount = 0;
        let storesCount = 0;
        let productsCount = 0;
        let avgValue = 0;

        // New Seller Stats
        let clientsCount = 0;
        let followersCount = 0;
        let reviewsCount = 0;
        let categoriesCount = 0;
        let pendingOrders = 0;

        if (userRole === UserRole.SUPER_ADMIN) {
            const adminStats = await apiService.get('/stats/admin-summary');
            const data = adminStats.data || adminStats;

            usersCount = data.totalUsers || 0;
            storesCount = data.totalStores || 0;
            productsCount = data.totalProducts || 0;
            ordersCount = data.totalOrders || 0;
            revenue = data.totalRevenue || 0;
            avgValue = data.avgOrderValue || 0;
            pendingOrders = data.statusCounts?.pending || 0;
        } else {
            // Store Owner / Employee
            const storeId = user.store?.id || user.storeId;

            // 1. Order Stats
            const responseBody = await apiService.get('/orders/stats/summary?period=30d');
            const data = responseBody.data || responseBody;

            revenue = data.totalRevenue || 0;
            ordersCount = data.totalOrders || 0;
            avgValue = data.averageOrderValue || 0;
            pendingOrders = data.statusCounts?.pending || 0;

            // 2. Fetch other stats using parallel requests
            const promises = [
                // Products
                apiService.get('/products/store-products?limit=1').catch(() => ({ meta: { total: 0 } })),
                // Clients
                apiService.get('/store/clients?limit=1').catch(() => ({ meta: { total: 0 } })),
                // Reviews
                apiService.get('/reviews/store-management?limit=1').catch(() => ({ meta: { total: 0 } })),
                // Categories
                apiService.get('/categories/seller-categories?limit=1').catch(() => ({ meta: { total: 0 } }))
            ];

            // Only fetch followers if we have a storeId
            if (storeId) {
                promises.push(apiService.get(`/follows/stats/store/${storeId}`).catch(() => ({ followersCount: 0 })));
            } else {
                promises.push(Promise.resolve({ followersCount: 0 }));
            }

            const [productsRes, clientsRes, reviewsRes, categoriesRes, followersRes] = await Promise.all(promises);

            productsCount = productsRes.meta?.total || productsRes.pagination?.total || 0;
            clientsCount = clientsRes.meta?.total || clientsRes.pagination?.total || 0;
            reviewsCount = reviewsRes.meta?.total || reviewsRes.pagination?.total || 0;
            categoriesCount = categoriesRes.meta?.total || categoriesRes.pagination?.total || 0;
            followersCount = followersRes.followersCount || 0;
        }

        return {
            totalRevenue: revenue,
            totalOrders: ordersCount,
            pendingOrders: pendingOrders,
            totalUsers: usersCount,
            totalStores: storesCount,
            totalProducts: productsCount,
            avgOrderValue: avgValue,
            // Seller specific
            totalClients: clientsCount,
            totalFollowers: followersCount,
            totalReviews: reviewsCount,
            totalCategories: categoriesCount
        };
    } catch (error) {
        throw error;
    }
};

