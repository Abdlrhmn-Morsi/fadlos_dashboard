import api from '../../../services/api';
import { CreateRoleDto, Role, UpdateRoleDto } from '../models/role.model';
import { PermissionGroup } from '../../../types/permission';

export const RolesService = {
    getPermissions: async () => {
        const response = await api.get<{ categories: string[]; permissions: PermissionGroup[] }>('/roles/permissions');
        return response.data;
    },

    getRoles: async () => {
        const response = await api.get<Role[]>('/roles');
        return response.data;
    },

    getRole: async (id: string) => {
        const response = await api.get<Role>(`/roles/${id}`);
        return response.data;
    },

    createRole: async (data: CreateRoleDto) => {
        const response = await api.post<Role>('/roles', data);
        return response.data;
    },

    updateRole: async (id: string, data: UpdateRoleDto) => {
        const response = await api.patch<Role>(`/roles/${id}`, data);
        return response.data;
    },

    deleteRole: async (id: string) => {
        await api.delete(`/roles/${id}`);
    },
};
