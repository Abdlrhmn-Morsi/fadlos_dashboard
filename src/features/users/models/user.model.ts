export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export interface UsersFilters {
    role: string;
    search: string;
}

export interface UsersPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
