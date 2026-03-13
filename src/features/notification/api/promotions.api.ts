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
    coverImage?: File;
    coverImageUrl?: string;
}

export interface PromotionCredits {
    used: number;
    total: number;
    remaining: number;
}

export interface FollowerItem {
    id: string;
    userId: string;
    name: string;
    username?: string;
    email?: string;
    profileImage?: string;
    followedAt?: string;
}

export const sendPromotionAd = async (dto: SendPromotionAdDto): Promise<any> => {
    const formData = new FormData();
    formData.append('message', dto.message);
    formData.append('targetType', dto.targetType);
    if (dto.title) formData.append('title', dto.title);
    if (dto.titleAr) formData.append('titleAr', dto.titleAr);
    if (dto.messageAr) formData.append('messageAr', dto.messageAr);
    if (dto.criteria) formData.append('criteria', dto.criteria);
    if (dto.targetIds && dto.targetIds.length > 0) {
        dto.targetIds.forEach(id => formData.append('targetIds', id));
    }
    if (dto.coverImage) {
        formData.append('coverImage', dto.coverImage);
    }
    if (dto.coverImageUrl) {
        formData.append('coverImageUrl', dto.coverImageUrl);
    }
    return apiService.post('/promotions/send', formData);
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
    coverImageUrl?: string;
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

