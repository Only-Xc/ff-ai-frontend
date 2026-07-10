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
  listOrganizationTreeRequest,
  listUsersRequest,
  updateAdminRoleRequest,
  updateOrganizationRequest,
  updateRolePermissionsRequest,
  updateUserRequest,
  updateUserRolesRequest,
  type CurrentRbacProfile,
  type OrganizationNode,
  type Permission,
  type PermissionListQuery,
  type Role,
  type RoleCreateBody,
  type RoleDetail,
  type RoleListQuery,
  type RolePermissionsUpdateBody,
  type RoleUpdateBody,
  type User,
  type UserCreateBody,
  type UserListQuery,
  type UserRoleAssignment,
  type UserUpdateBody,
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
  organizations: () => [...rbacKeys.all, 'organizations'] as const,
  users: (query: UserListQuery) => [...rbacKeys.all, 'users', query] as const,
  userRoles: (userId: string) => [...rbacKeys.all, 'userRoles', userId] as const,
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
export const userRoles_list = request(getUserRolesRequest)
export const userRoles_update = request(updateUserRolesRequest)
export const adminOrganizations_create = request(createOrganizationRequest)
export const adminOrganizations_update = request(updateOrganizationRequest)
export const adminOrganizations_delete = request(deleteOrganizationRequest)
export const adminUsers_list = request(listUsersRequest)
export const adminUsers_create = request(createUserRequest)
export const adminUsers_update = request(updateUserRequest)
export const adminUsers_delete = request(deleteUserRequest)
