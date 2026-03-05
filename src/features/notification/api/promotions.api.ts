import api from '../../../services/api';
import apiService from '../../../services/api.service';

export enum PromotionTargetType {
    ALL_CLIENTS = 'all_clients',
    ALL_FOLLOWERS = 'all_followers',
    INDIVIDUAL_CLIENTS = 'individual_clients',
    INDIVIDUAL_FOLLOWERS = 'individual_followers',
    CLIENTS_SEGMENT = 'clients_segment',
    FOLLOWERS_SEGMENT = 'followers_segment',
}


export interface SendPromotionAdDto {
    title?: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    targetType: PromotionTargetType;
    targetIds?: string[];
    criteria?: string;
}

export interface PromotionCredits {
    used: number;
    total: number;
    remaining: number;
}

export interface FollowerItem {
    id: string;
    name: string;
    username?: string;
    email?: string;
    profileImage?: string;
    followedAt?: string;
}

export const sendPromotionAd = async (dto: SendPromotionAdDto): Promise<any> => {
    return apiService.post('/promotions/send', dto);
};

export const getPromotionCredits = async (): Promise<PromotionCredits> => {
    return apiService.get(`/promotions/credits?t=${Date.now()}`);
};

export const getFollowersForSelection = async (
    storeId: string,
    params: { page?: number; limit?: number; search?: string; order?: 'ASC' | 'DESC' }
): Promise<{ data: FollowerItem[]; total: number; page: number; limit: number }> => {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', params.page.toString());
    if (params.limit) qp.append('limit', params.limit.toString());
    if (params.search) qp.append('search', params.search);
    if (params.order) qp.append('order', params.order);
    return apiService.get(`/follows/store/${storeId}/followers?${qp.toString()}`);
};

export interface PromotionLogItem {
    id: string;
    message: string;
    messageAr?: string;
    title?: string;
    titleAr?: string;
    targetType: string;
    targetCount: number;
    criteria?: string;
    createdAt: string;
}

export interface PromotionHistoryResponse {
    data: PromotionLogItem[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

export const getPromotionHistory = async (params: {
    page?: number;
    limit?: number;
    type?: 'followers' | 'clients';
}): Promise<PromotionHistoryResponse> => {
    return apiService.get('/promotions/history', { params });
};

