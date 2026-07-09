import {
  createAdminRoleRequest,
  deleteAdminRoleRequest,
  getAdminRoleRequest,
  getCurrentRbacProfileRequest,
  listAdminPermissionsRequest,
  listAdminRolesRequest,
  listOrganizationTreeRequest,
  updateAdminRoleRequest,
  updateRolePermissionsRequest,
  type PermissionListQuery,
  type RoleListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  CurrentRbacProfile,
  OrganizationNode,
  Permission,
  PermissionList,
  PermissionListQuery,
  Role,
  RoleCreateBody,
  RoleDetail,
  RoleList,
  RoleListQuery,
  RolePermissionsUpdateBody,
  RoleUpdateBody,
} from '@ff-ai-frontend/api'

export const rbacKeys = {
  all: ['rbac'] as const,
  profile: () => [...rbacKeys.all, 'profile'] as const,
  roles: (query: RoleListQuery) => [...rbacKeys.all, 'roles', query] as const,
  role: (roleId: string) => [...rbacKeys.all, 'role', roleId] as const,
  permissions: (query: PermissionListQuery) =>
    [...rbacKeys.all, 'permissions', query] as const,
  organizations: () => [...rbacKeys.all, 'organizations'] as const,
}

export const rbacProfile_get = request(getCurrentRbacProfileRequest)
export const adminRoles_list = request(listAdminRolesRequest)
export const adminRoles_get = request(getAdminRoleRequest)
export const adminRoles_create = request(createAdminRoleRequest)
export const adminRoles_update = request(updateAdminRoleRequest)
export const adminRoles_delete = request(deleteAdminRoleRequest)
export const adminRolePermissions_update = request(updateRolePermissionsRequest)
export const adminPermissions_list = request(listAdminPermissionsRequest)
export const adminOrganizations_tree = request(listOrganizationTreeRequest)
