import apiService from '../../../services/api.service';

export const fetchDashboardStats = async (userRole: string) => {
    try {
        let revenue = 0;
        let ordersCount = 0;
        let usersCount = 0;
        let storesCount = 0;
        let productsCount = 0;
        let avgValue = 0;

        if (userRole === 'super_admin') {
            const [usersRes, storesRes, ordersRes, productsRes] = await Promise.all([
                apiService.get('/users').catch(() => ({ data: [], meta: { total: 0 } })),
                apiService.get('/stores').catch(() => ({ data: [], meta: { total: 0 } })),
                apiService.get('/orders').catch(() => ({ orders: [] })),
                apiService.get('/products').catch(() => ({ data: [], meta: { total: 0 } }))
            ]);

            usersCount = usersRes.meta?.total || 0;
            storesCount = storesRes.meta?.total || 0;
            productsCount = productsRes.meta?.total || 0;

            const orders = ordersRes.orders || [];
            ordersCount = orders.length;
            revenue = orders
                .filter((o: any) => o.status === 'DELIVERED')
                .reduce((sum: number, o: any) => sum + Number(o.total), 0);

            avgValue = ordersCount > 0 ? revenue / ordersCount : 0;
        } else {
            const responseBody = await apiService.get('/orders/stats/summary?period=30d');
            const data = responseBody.data || responseBody;

            revenue = data.totalRevenue || 0;
            ordersCount = data.totalOrders || 0;
            avgValue = data.averageOrderValue || 0;
            usersCount = 0;

            const [storesRes, productsRes] = await Promise.all([
                apiService.get('/stores').catch(() => ({ data: [], meta: { total: 0 } })),
                apiService.get('/products/store-products').catch(() => ({ data: [], meta: { total: 0 } }))
            ]);
            storesCount = storesRes.meta?.total || 0;
            productsCount = productsRes.meta?.total || 0;
        }

        return {
            totalRevenue: revenue,
            totalOrders: ordersCount,
            totalUsers: usersCount,
            totalStores: storesCount,
            totalProducts: productsCount,
            avgOrderValue: avgValue
        };
    } catch (error) {
        throw error;
    }
};
