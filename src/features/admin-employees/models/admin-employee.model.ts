import { AdminRole } from '../../admin-roles/models/admin-role.model';

export interface AdminEmployee {
  id: string;
  profileId: string;
  adminRoleId: string;
  adminRole: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      isActive: boolean;
    };
  };
}

export interface CreateAdminEmployeeDto {
  name: string;
  email: string;
  password?: string;
  adminRoleId: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateAdminEmployeeDto extends Partial<CreateAdminEmployeeDto> {}

export interface AdminEmployeeQueryDto {
  search?: string;
  roleId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}
