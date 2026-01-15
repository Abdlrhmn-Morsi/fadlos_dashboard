export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalStores: number;
    totalProducts: number;
    avgOrderValue: number;
}

export interface ChartDataItem {
    name: string;
    revenue: number;
}
