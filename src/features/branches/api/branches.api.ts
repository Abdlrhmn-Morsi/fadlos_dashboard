import apiService from '../../../services/api.service';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../../types/branch';

export const branchesApi = {
    create: async (data: CreateBranchDto): Promise<Branch> => {
        const response = await apiService.post<Branch>('/branches', data);
        return response;
    },

    findAllByStore: async (): Promise<Branch[]> => {
        const response = await apiService.get<Branch[]>('/branches/my-store');
        return response;
    },

    update: async (id: string, data: UpdateBranchDto): Promise<Branch> => {
        const response = await apiService.patch<Branch>(`/branches/${id}`, data);
        return response;
    },

    remove: async (id: string): Promise<void> => {
        await apiService.delete(`/branches/${id}`);
    },
};
