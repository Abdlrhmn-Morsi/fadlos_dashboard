import api from '../../../services/api';
import { AdminRole, CreateAdminRoleDto, UpdateAdminRoleDto } from '../models/admin-role.model';
import { AdminPermissionGroup, ADMIN_PERMISSION_GROUPS } from '../../../types/admin-permissions';

export const AdminRolesApiService = {
  getPermissions: (): { categories: string[]; permissions: AdminPermissionGroup[] } => {
    return {
      categories: ADMIN_PERMISSION_GROUPS.map(g => g.category),
      permissions: ADMIN_PERMISSION_GROUPS,
    };
  },

  getAdminRoles: async () => {
    const response = await api.get<AdminRole[]>('/admin-roles');
    return response.data;
  },

  getAdminRole: async (id: string) => {
    const response = await api.get<AdminRole>(`/admin-roles/${id}`);
    return response.data;
  },

  createAdminRole: async (data: CreateAdminRoleDto) => {
    const response = await api.post<AdminRole>('/admin-roles', data);
    return response.data;
  },

  updateAdminRole: async (id: string, data: UpdateAdminRoleDto) => {
    const response = await api.patch<AdminRole>(`/admin-roles/${id}`, data);
    return response.data;
  },

  deleteAdminRole: async (id: string) => {
    await api.delete(`/admin-roles/${id}`);
  },
};
