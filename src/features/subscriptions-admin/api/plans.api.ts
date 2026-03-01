import apiService from '../../../services/api.service';

export interface Plan {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    features: string[];
    limits: Record<string, number>;
}

export interface PlanMetadata {
    features: string[];
    limits: string[];
}

export const getAdminPlans = async (): Promise<Plan[]> => {
    return apiService.get('/admin/plans');
};

export const updateAdminPlan = async (id: string, data: Partial<Plan>): Promise<Plan> => {
    return apiService.patch(`/admin/plans/${id}`, data);
};

export const getPlanMetadata = async (): Promise<PlanMetadata> => {
    return apiService.get('/admin/plans/metadata');
};
