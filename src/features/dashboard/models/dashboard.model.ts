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
    // Seller specific (Optional as they might not be present for Admin)
    totalClients?: number;
    totalFollowers?: number;
    totalReviews?: number;
    totalCategories?: number;
    topRatedProducts?: any[];
    topCategories?: any[];
    averageRating?: number;
    chartData?: ChartDataItem[];
}

export interface ChartDataItem {
    label: string;
    revenue: number;
}
