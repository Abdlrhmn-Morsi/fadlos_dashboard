export interface Store {
    id: string;
    name: string;
    logo: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    totalOrders: number;
    totalRevenue: number;
    owner?: {
        id: string;
        name: string;
    };
    businessType?: {
        id: string;
        en_name: string;
    };
    towns?: Array<{
        id: string;
        enName: string;
    }>;
}

export interface StoresFilters {
    search: string;
    status: string;
}

export interface StoresPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface GetStoresParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}
