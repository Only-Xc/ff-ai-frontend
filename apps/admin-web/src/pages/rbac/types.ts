import type { OrganizationNode } from '@ff-ai-frontend/api'

export type {
  RoleCreateBody,
  RoleUpdateBody,
  RoleDetail,
  RoleListQuery,
  PermissionListQuery,
  Permission,
  OrganizationNode,
  OrganizationCreateBody,
  OrganizationUpdateBody,
  UserRoleAssignment,
  CurrentOrganization,
} from '@ff-ai-frontend/api'

export interface RoleFormValues {
  name: string
  code: string
  description?: string
  scope_type: 'system' | 'organization'
  organization_id?: string
  is_active: boolean
}

export interface PermFormValues {
  permission_ids: string[]
}

export interface UserRoleFormValues {
  assignments: {
    role_id: string
    organization_id?: string | null
    expires_at?: string | null
  }[]
}
