import type { ListResult, PaginationQuery } from './common.js'
import { createRequest, path } from './client.js'

export interface CurrentOrganization {
  id: string
  name: string
  type: 'tenant' | 'department' | 'team' | string
  is_primary: boolean
}

export interface CurrentRbacProfile {
  user_id: string
  is_superuser: boolean
  role_codes: string[]
  permission_codes: string[]
  menu_codes: string[]
  organizations: CurrentOrganization[]
}

export interface MenuNode {
  id: string
  code: string
  title: string
  app: 'admin' | 'user' | string
  path: string | null
  parent_id: string | null
  permission_code: string | null
  icon: string | null
  sort_order: number
  is_visible: boolean
  children: MenuNode[]
}

export const getCurrentRbacProfileRequest = () =>
  createRequest<CurrentRbacProfile>('GET', '/api/v1/rbac/me', {
    skipDedupe: true,
  })

export const listCurrentMenusRequest = (app?: string) =>
  createRequest<MenuNode[]>('GET', '/api/v1/menus/me', {
    params: app ? { app } : undefined,
  })

export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  group: string
  resource: string
  action: string
  is_menu: boolean
  is_api: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PermissionList = ListResult<Permission>

export type PermissionListQuery = {
  group?: string
  resource?: string
  is_menu?: boolean
  is_api?: boolean
  keyword?: string
} & PaginationQuery

export interface Role {
  id: string
  code: string
  name: string
  description: string | null
  scope_type: 'system' | 'organization' | string
  organization_id: string | null
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  permission_count: number
  user_count: number
}

export interface RoleDetail extends Role {
  permission_ids: string[]
  permission_codes: string[]
}

export type RoleList = ListResult<Role>

export type RoleListQuery = {
  keyword?: string
  scope_type?: 'system' | 'organization' | string
  organization_id?: string
} & PaginationQuery

export interface RoleCreateBody {
  code: string
  name: string
  description?: string | null
  scope_type: 'system' | 'organization' | string
  organization_id?: string | null
  is_active?: boolean
  permission_ids?: string[]
}

export type RoleUpdateBody = Partial<Omit<RoleCreateBody, 'permission_ids'>>

export interface RolePermissionsUpdateBody {
  permission_ids: string[]
}

export interface OrganizationNode {
  id: string
  name: string
  code: string
  type: 'tenant' | 'department' | 'team' | string
  parent_id: string | null
  status: 'active' | 'disabled' | string
  sort_order: number
  created_at: string
  updated_at: string
  children: OrganizationNode[]
}

export interface OrganizationCreateBody {
  name: string
  code: string
  type?: 'tenant' | 'department' | 'team' | string
  parent_id?: string | null
  status?: 'active' | 'disabled' | string
  sort_order?: number
}

export type OrganizationUpdateBody = Partial<OrganizationCreateBody>

export interface UserRoleAssignment {
  role_id: string
  organization_id?: string | null
  expires_at?: string | null
}

export interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  created_at: string | null
}

export interface UserCreateBody {
  email: string
  full_name: string
  password: string
  is_active?: boolean
}

export type UserUpdateBody = Partial<{
  email: string
  full_name: string
  password: string
  is_active: boolean
}>

export type UserList = ListResult<User>

export type UserListQuery = {
  keyword?: string
} & PaginationQuery

export const listAdminMenusRequest = (app?: string) =>
  createRequest<MenuNode[]>('GET', '/api/v1/admin/menus', {
    params: app ? { app } : undefined,
  })

export const listAdminPermissionsRequest = (params: PermissionListQuery) =>
  createRequest<PermissionList>('GET', '/api/v1/admin/permissions', { params })

export const listAdminRolesRequest = (params: RoleListQuery) =>
  createRequest<RoleList>('GET', '/api/v1/admin/roles', { params })

export const createAdminRoleRequest = (data: RoleCreateBody) =>
  createRequest<Role>('POST', '/api/v1/admin/roles', { data })

export const getAdminRoleRequest = (roleId: string) =>
  createRequest<RoleDetail>('GET', path`/api/v1/admin/roles/${roleId}`)

export const updateAdminRoleRequest = (roleId: string, data: RoleUpdateBody) =>
  createRequest<Role>('PATCH', path`/api/v1/admin/roles/${roleId}`, { data })

export const deleteAdminRoleRequest = (roleId: string) =>
  createRequest<{ deleted: boolean }>(
    'DELETE',
    path`/api/v1/admin/roles/${roleId}`,
  )

export const updateRolePermissionsRequest = (
  roleId: string,
  data: RolePermissionsUpdateBody,
) =>
  createRequest<RoleDetail>(
    'PUT',
    path`/api/v1/admin/roles/${roleId}/permissions`,
    { data },
  )

export const listOrganizationTreeRequest = () =>
  createRequest<OrganizationNode[]>('GET', '/api/v1/admin/organizations/tree')

export const createOrganizationRequest = (data: OrganizationCreateBody) =>
  createRequest<OrganizationNode>('POST', '/api/v1/admin/organizations', { data })

export const updateOrganizationRequest = (
  organizationId: string,
  data: OrganizationUpdateBody,
) =>
  createRequest<OrganizationNode>(
    'PATCH',
    path`/api/v1/admin/organizations/${organizationId}`,
    { data },
  )

export const deleteOrganizationRequest = (organizationId: string) =>
  createRequest<{ deleted: boolean }>(
    'DELETE',
    path`/api/v1/admin/organizations/${organizationId}`,
  )

export const getUserRolesRequest = (userId: string) =>
  createRequest<UserRoleAssignment[]>(
    'GET',
    path`/api/v1/admin/users/${userId}/roles`,
  )

export const updateUserRolesRequest = (
  userId: string,
  assignments: UserRoleAssignment[],
) =>
  createRequest<UserRoleAssignment[]>(
    'PUT',
    path`/api/v1/admin/users/${userId}/roles`,
    { data: { assignments } },
  )

export const listUsersRequest = (params: UserListQuery) =>
  createRequest<UserList>('GET', '/api/v1/users/', { params })

export const createUserRequest = (data: UserCreateBody) =>
  createRequest<User>('POST', '/api/v1/users/', { data })

export const updateUserRequest = (userId: string, data: UserUpdateBody) =>
  createRequest<User>('PATCH', path`/api/v1/users/${userId}`, { data })

export const deleteUserRequest = (userId: string) =>
  createRequest<{ message: string }>(
    'DELETE',
    path`/api/v1/users/${userId}`,
  )
