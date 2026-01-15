import { atom } from 'recoil';
import { DashboardStats, ChartDataItem } from '../models/dashboard.model';

export const dashboardStatsState = atom<DashboardStats>({
    key: 'dashboardStatsState',
    default: {
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalStores: 0,
        totalProducts: 0,
        avgOrderValue: 0
    }
});

export const dashboardLoadingState = atom<boolean>({
    key: 'dashboardLoadingState',
    default: true
});

export const dashboardErrorState = atom<string | null>({
    key: 'dashboardErrorState',
    default: null
});

export const dashboardChartDataState = atom<ChartDataItem[]>({
    key: 'dashboardChartDataState',
    default: []
});
