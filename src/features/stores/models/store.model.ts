export interface Store {
    id: string;
    nameAr: string;
    name: string;
    descriptionAr?: string;
    description?: string;
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
    openingTime?: string;
    closingTime?: string;
    is24Hours?: boolean;
    workingDays?: number[];
    acceptOrdersIfOffDay?: boolean;
    acceptOrdersInClosedHours?: boolean;
    isAcceptingOrders?: boolean;
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
