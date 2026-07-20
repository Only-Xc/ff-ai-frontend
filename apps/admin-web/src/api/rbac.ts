import {
  createAdminRoleRequest,
  createOrganizationRequest,
  createUserRequest,
  deleteAdminRoleRequest,
  deleteOrganizationRequest,
  deleteUserRequest,
  getAdminRoleRequest,
  getCurrentRbacProfileRequest,
  getUserRolesRequest,
  listAdminPermissionsRequest,
  listAdminRolesRequest,
  listAssignableTenantsRequest,
  listOrganizationTreeRequest,
  listOrganizationsRequest,
  listUsersRequest,
  updateAdminRoleRequest,
  updateOrganizationRequest,
  updateRolePermissionsRequest,
  updateUserRequest,
  updateUserRolesRequest,
  type OrganizationListQuery,
  type PermissionListQuery,
  type RoleListQuery,
  type UserListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AssignableTenant,
  CurrentRbacProfile,
  PrimaryOrganization,
  OrganizationCreateBody,
  OrganizationList,
  OrganizationListQuery,
  OrganizationNode,
  OrganizationUpdateBody,
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
  User,
  UserCreateBody,
  UserListQuery,
  UserRoleAssignment,
  UserUpdateBody,
} from '@ff-ai-frontend/api'

export const rbacKeys = {
  all: ['rbac'] as const,
  profile: () => [...rbacKeys.all, 'profile'] as const,
  roles: (query: RoleListQuery) => [...rbacKeys.all, 'roles', query] as const,
  role: (roleId: string) => [...rbacKeys.all, 'role', roleId] as const,
  permissions: (query: PermissionListQuery) =>
    [...rbacKeys.all, 'permissions', query] as const,
  organizationTree: () => [...rbacKeys.all, 'organizationTree'] as const,
  organizations: () => [...rbacKeys.all, 'organizations'] as const,
  organizationList: (query: OrganizationListQuery) =>
    [...rbacKeys.all, 'organizationList', query] as const,
  users: (query: UserListQuery) => [...rbacKeys.all, 'users', query] as const,
  userRoles: (userId: string) => [...rbacKeys.all, 'userRoles', userId] as const,
  assignableTenants: () => [...rbacKeys.all, 'assignableTenants'] as const,
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
export const adminOrganizations_list = request(listOrganizationsRequest)
export const userRoles_list = request(getUserRolesRequest)
export const userRoles_update = request(updateUserRolesRequest)
export const adminOrganizations_create = request(createOrganizationRequest)
export const adminOrganizations_update = request(updateOrganizationRequest)
export const adminOrganizations_delete = request(deleteOrganizationRequest)
export const adminUsers_list = request(listUsersRequest)
export const adminUsers_create = request(createUserRequest)
export const adminUsers_update = request(updateUserRequest)
export const adminUsers_delete = request(deleteUserRequest)

export const adminAssignableTenants_list = request(listAssignableTenantsRequest)
