export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  priority: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminRoleDto {
  name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
  priority?: number;
}

export interface UpdateAdminRoleDto extends Partial<CreateAdminRoleDto> {}
