export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    meta?: ApiMeta;
}

export interface ApiMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: ApiMeta;
}
