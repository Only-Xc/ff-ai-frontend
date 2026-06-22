import {
  addTenantAppRequest,
  deleteTenantAppRequest,
  getTenantAppMenuRequest,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  TenantAppMenuNode,
  TenantAppMenuNodeType,
  TenantAppMenuResponse,
  TenantAppQuery,
} from '@ff-ai-frontend/api'

export const tenantAppKeys = {
  all: ['tenant-app'] as const,
  menu: () => [...tenantAppKeys.all, 'menu'] as const,
}

export const tenantApps_menu = request(getTenantAppMenuRequest)
export const tenantApps_add = request(addTenantAppRequest)
export const tenantApps_delete = request(deleteTenantAppRequest)
