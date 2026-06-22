import { createRequest, path } from '../client.js'

export type TenantAppMenuNodeType = 'group' | 'folder' | 'app'

export interface TenantAppMenuNode {
  /** 全局唯一节点 ID，用作菜单 key。 */
  id: string
  /** 菜单展示名称。 */
  title: string
  /** 节点类型：分组、可展开目录或可点击应用。 */
  type: TenantAppMenuNodeType
  /** 同级节点排序值，按升序展示。 */
  order?: number
  /** 智能体 ID，app 类型节点必填。 */
  agent_id?: string
  /** 应用任务 ID，app 类型节点必填。 */
  task_id?: string
  /** 生成应用预览地址，app 类型节点必填。 */
  preview_url?: string
  /** 菜单图标地址，预留给后端自定义应用图标。 */
  icon_url?: string | null
  /** 子菜单节点，叶子节点返回空数组。 */
  children: TenantAppMenuNode[]
}

export interface TenantAppMenuResponse {
  data: TenantAppMenuNode[]
}

export interface TenantAppQuery {
  title: string
  type: TenantAppMenuNodeType
  order?: number
  agent_id?: string
  icon_url?: string | null
}

export const getTenantAppMenuRequest = () =>
  createRequest<TenantAppMenuResponse>('GET', '/api/tenant/apps')

export const addTenantAppRequest = (data: TenantAppQuery) =>
  createRequest<unknown>('POST', '/api/tenant/apps', { data })

export const deleteTenantAppRequest = (agentId: string) =>
  createRequest<unknown>('DELETE', path`/api/tenant/apps/${agentId}`)
