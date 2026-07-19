/** 服务流程目录（Service Catalog）API 类型与请求工厂。 */
import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export type ServiceLevel = 'P0' | 'P1' | 'P2' | 'P3'
export type NodeType = 'manual' | 'automated' | 'semi_automated'
export type MaterialType = 'input' | 'output'
export type SystemType = 'internal' | 'external' | 'api' | 'platform'
export type AgentLinkType = 'primary' | 'supporting' | 'reference'
export type ServiceStatus = 'active' | 'inactive'

export interface ServiceCategory {
  id: string
  name: string
  code: string
  parent_id: string | null
  sort_order: number
  status: string
  created_at: string
  updated_at: string
  children?: ServiceCategory[]
}

export interface ServiceCategoryCreate {
  name: string
  code: string
  parent_id?: string | null
  sort_order?: number
  status?: ServiceStatus
}

export interface ServiceCategoryUpdate {
  name?: string
  code?: string
  parent_id?: string | null
  sort_order?: number
  status?: ServiceStatus
}

export interface ServiceDefinition {
  id: string
  name: string
  code: string
  category_id: string
  organization_id: string | null
  owner_user_id: string
  description: string
  service_level: ServiceLevel
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ServiceDefinitionCreate {
  name: string
  code: string
  category_id: string
  organization_id?: string | null
  owner_user_id: string
  description?: string
  service_level?: ServiceLevel
  status?: ServiceStatus
  sort_order?: number
}

export interface ServiceDefinitionUpdate {
  name?: string
  code?: string
  category_id?: string
  organization_id?: string | null
  owner_user_id?: string
  description?: string
  service_level?: ServiceLevel
  status?: ServiceStatus
  sort_order?: number
}

export interface ServiceProcessNode {
  id: string
  service_id: string
  name: string
  sequence: number
  node_type: NodeType
  handler_role_id: string | null
  estimated_duration_minutes: number | null
  description: string
  created_at: string
  updated_at: string
}

export interface ServiceProcessNodeCreate {
  service_id?: string | null
  name: string
  sequence: number
  node_type: NodeType
  handler_role_id?: string | null
  estimated_duration_minutes?: number | null
  description?: string
}

export interface ServiceProcessNodeUpdate {
  name?: string
  sequence?: number
  node_type?: NodeType
  handler_role_id?: string | null
  estimated_duration_minutes?: number | null
  description?: string
}

export interface ServiceNodeMaterial {
  id: string
  node_id: string
  material_type: MaterialType
  name: string
  description: string
  template_path: string | null
  created_at: string
  updated_at: string
}

export interface ServiceNodeMaterialCreate {
  node_id?: string | null
  material_type: MaterialType
  name: string
  description?: string
  template_path?: string | null
}

export interface ServiceNodeMaterialUpdate {
  material_type?: MaterialType
  name?: string
  description?: string
  template_path?: string | null
}

export interface ServiceRelatedSystem {
  id: string
  service_id: string
  name: string
  system_type: SystemType
  interface_description: string
  url: string | null
  created_at: string
  updated_at: string
}

export interface ServiceRelatedSystemCreate {
  service_id?: string | null
  name: string
  system_type: SystemType
  interface_description?: string
  url?: string | null
}

export interface ServiceRelatedSystemUpdate {
  name?: string
  system_type?: SystemType
  interface_description?: string
  url?: string | null
}

export interface ServiceAgentLink {
  id: string
  service_id: string
  agent_id: string
  task_id: string | null
  link_type: AgentLinkType
  description: string
  created_at: string
}

export interface ServiceAgentLinkCreate {
  service_id?: string | null
  agent_id: string
  task_id?: string | null
  link_type?: AgentLinkType
  description?: string
}

export interface ServiceDetailPublic {
  service: ServiceDefinition
  nodes: ServiceProcessNode[]
  systems: ServiceRelatedSystem[]
  agent_links: ServiceAgentLink[]
}

export interface ServiceListResult extends ListResult<ServiceDefinition> {}

export interface ServiceImportResult {
  success: boolean
  errors: Array<{ row: number; field: string; message: string }>
  summary: Record<string, unknown>
}

const SC_PREFIX = '/api/v1/admin/service-catalog'

// ──────── 分类 ────────
export const listServiceCategoriesRequest = () =>
  createRequest<ServiceCategory[]>('GET', `${SC_PREFIX}/categories`)

export const createServiceCategoryRequest = (body: ServiceCategoryCreate) =>
  createRequest<ServiceCategory>('POST', `${SC_PREFIX}/categories`, { data: body })

export const updateServiceCategoryRequest = (
  id: string,
  body: ServiceCategoryUpdate,
) => createRequest<ServiceCategory>('PATCH', path`${SC_PREFIX}/categories/${id}`, { data: body })

export const deleteServiceCategoryRequest = (id: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/categories/${id}`)

// ──────── 服务 ────────
export interface ServiceListQuery extends PaginationQuery {
  category_id?: string
  organization_id?: string
  service_level?: ServiceLevel
  status?: ServiceStatus
  keyword?: string
}

export const listServicesRequest = (params: ServiceListQuery) =>
  createRequest<ServiceListResult>('GET', `${SC_PREFIX}/services`, { params })

export const createServiceRequest = (body: ServiceDefinitionCreate) =>
  createRequest<ServiceDefinition>('POST', `${SC_PREFIX}/services`, { data: body })

export const getServiceDetailRequest = (id: string) =>
  createRequest<ServiceDetailPublic>('GET', path`${SC_PREFIX}/services/${id}`)

export const updateServiceRequest = (id: string, body: ServiceDefinitionUpdate) =>
  createRequest<ServiceDefinition>('PATCH', path`${SC_PREFIX}/services/${id}`, { data: body })

export const deleteServiceRequest = (id: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/services/${id}`)

// ──────── 节点 ────────
export const listNodesRequest = (serviceId: string) =>
  createRequest<ServiceProcessNode[]>('GET', path`${SC_PREFIX}/services/${serviceId}/nodes`)

export const createNodeRequest = (serviceId: string, body: ServiceProcessNodeCreate) =>
  createRequest<ServiceProcessNode>(
    'POST',
    path`${SC_PREFIX}/services/${serviceId}/nodes`,
    { data: body },
  )

export const updateNodeRequest = (
  serviceId: string,
  nodeId: string,
  body: ServiceProcessNodeUpdate,
) =>
  createRequest<ServiceProcessNode>(
    'PATCH',
    path`${SC_PREFIX}/services/${serviceId}/nodes/${nodeId}`,
    { data: body },
  )

export const reorderNodesRequest = (serviceId: string, nodeIds: string[]) =>
  createRequest<ServiceProcessNode[]>(
    'PUT',
    path`${SC_PREFIX}/services/${serviceId}/nodes/reorder`,
    { data: nodeIds },
  )

export const deleteNodeRequest = (serviceId: string, nodeId: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/services/${serviceId}/nodes/${nodeId}`)

// ──────── 材料 ────────
export const listMaterialsRequest = (nodeId: string) =>
  createRequest<ServiceNodeMaterial[]>('GET', path`${SC_PREFIX}/nodes/${nodeId}/materials`)

export const createMaterialRequest = (nodeId: string, body: ServiceNodeMaterialCreate) =>
  createRequest<ServiceNodeMaterial>(
    'POST',
    path`${SC_PREFIX}/nodes/${nodeId}/materials`,
    { data: body },
  )

export const updateMaterialRequest = (
  nodeId: string,
  materialId: string,
  body: ServiceNodeMaterialUpdate,
) =>
  createRequest<ServiceNodeMaterial>(
    'PATCH',
    path`${SC_PREFIX}/nodes/${nodeId}/materials/${materialId}`,
    { data: body },
  )

export const deleteMaterialRequest = (nodeId: string, materialId: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/nodes/${nodeId}/materials/${materialId}`)

// ──────── 涉及系统 ────────
export const listSystemsRequest = (serviceId: string) =>
  createRequest<ServiceRelatedSystem[]>('GET', path`${SC_PREFIX}/services/${serviceId}/systems`)

export const createSystemRequest = (serviceId: string, body: ServiceRelatedSystemCreate) =>
  createRequest<ServiceRelatedSystem>(
    'POST',
    path`${SC_PREFIX}/services/${serviceId}/systems`,
    { data: body },
  )

export const updateSystemRequest = (
  serviceId: string,
  systemId: string,
  body: ServiceRelatedSystemUpdate,
) =>
  createRequest<ServiceRelatedSystem>(
    'PATCH',
    path`${SC_PREFIX}/services/${serviceId}/systems/${systemId}`,
    { data: body },
  )

export const deleteSystemRequest = (serviceId: string, systemId: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/services/${serviceId}/systems/${systemId}`)

// ──────── Agent 关联 ────────
export const listAgentLinksRequest = (serviceId: string) =>
  createRequest<ServiceAgentLink[]>(
    'GET',
    path`${SC_PREFIX}/services/${serviceId}/agent-links`,
  )

export const createAgentLinkRequest = (serviceId: string, body: ServiceAgentLinkCreate) =>
  createRequest<ServiceAgentLink>(
    'POST',
    path`${SC_PREFIX}/services/${serviceId}/agent-links`,
    { data: body },
  )

export const deleteAgentLinkRequest = (serviceId: string, linkId: string) =>
  createRequest<void>('DELETE', path`${SC_PREFIX}/services/${serviceId}/agent-links/${linkId}`)

// ──────── 导入导出 ────────
export const exportWorkbookRequest = (params: {
  template?: 0 | 1
  category_id?: string
  service_id?: string
}) =>
  createRequest<Blob>('GET', `${SC_PREFIX}/export`, {
    params,
    responseType: 'blob',
  } as never)

export const importWorkbookRequest = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return createRequest<ServiceImportResult>('POST', `${SC_PREFIX}/import`, {
    data: fd,
  } as never)
}
