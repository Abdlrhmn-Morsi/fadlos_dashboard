export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalStores: number;
    totalProducts: number;
    avgOrderValue: number;
    pendingOrders?: number;
    // Seller specific (Optional as they might not be present for Admin)
    totalClients?: number;
    totalFollowers?: number;
    totalReviews?: number;
    totalCategories?: number;
    topRatedProducts?: any[];
    topCategories?: any[];
    averageRating?: number;
}

export interface ChartDataItem {
    name: string;
    revenue: number;
}
