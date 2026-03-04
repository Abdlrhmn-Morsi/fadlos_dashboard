import api from '../../../services/api';
import apiService from '../../../services/api.service';

export enum PromotionTargetType {
    ALL_CLIENTS = 'all_clients',
    ALL_FOLLOWERS = 'all_followers',
    INDIVIDUALS = 'individuals',
}

export interface SendPromotionAdDto {
    title?: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    targetType: PromotionTargetType;
    targetIds?: string[];
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
