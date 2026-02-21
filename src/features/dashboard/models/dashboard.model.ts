export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalStores: number;
    totalProducts: number;
    avgOrderValue: number;
    todayRevenue?: number;
    todayOrders?: number;
    pendingOrders?: number;
    statusCounts?: Record<string, number>;
    totalCustomers?: number;
    pendingStores?: number;
    activeSubscriptions?: number;
    totalTowns?: number;
    pendingApprovals?: {
        stores: any[];
        drivers: any[];
    };
    topStores?: any[];
    // Seller specific (Optional as they might not be present for Admin)
    totalClients?: number;
    totalFollowers?: number;
    totalReviews?: number;
    totalCategories?: number;
    totalDrivers?: number;
    pendingHiringRequests?: number;
    totalHiredDrivers?: number;
    topRatedProducts?: any[];
    topCategories?: any[];
    averageRating?: number;
    chartData?: ChartDataItem[];
}

export interface ChartDataItem {
    label: string;
    revenue: number;
}
