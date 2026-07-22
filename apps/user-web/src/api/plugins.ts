import { createRequest, path } from '@ff-ai-frontend/api'

import { request } from './_request'

export interface PluginCatalogItem {
  plugin_id: string
  installation_id: string
  organization_id: string
  name: string
  description: string | null
  source_type: string
  version: string
  status: string
  icon: string | null
  entry_path: string
  is_favorite: boolean
}

export interface PluginCatalogResult {
  data: PluginCatalogItem[]
  count: number
}

export interface WorkflowRuntimeConfig {
  workflow_app_id: string
  workflow_version_id: string
  plugin_id: string
  name: string
  description: string | null
  icon: string | null
  opening_statement: string | null
  suggested_questions: string[]
  runtime_mode: 'mock' | 'workflow_runtime'
}

export interface WorkflowRuntimeMessage {
  request_id: string
  conversation_id: string
  workflow_app_id: string
  workflow_version_id: string
  answer: string
  simulated: boolean
  created_at: string
}

export interface WorkflowRuntimeMessageBody {
  message: string
  conversation_id?: string
  request_id: string
}

export interface PluginUiSession {
  url: string
  expires_at: string
  external: boolean
}

export const pluginCatalogKeys = {
  all: ['plugin-catalog'] as const,
  list: (favoritesOnly = false, keyword = '') =>
    [...pluginCatalogKeys.all, favoritesOnly, keyword] as const,
  workflow: (workflowAppId: string) =>
    [...pluginCatalogKeys.all, 'workflow', workflowAppId] as const,
  uiSession: (pluginId: string) =>
    [...pluginCatalogKeys.all, 'uiSession', pluginId] as const,
}

const listPluginCatalogRequest = (params?: {
  favorites_only?: boolean
  keyword?: string
}) =>
  createRequest<PluginCatalogResult>('GET', '/api/v1/plugins/catalog', {
    params,
  })

const addPluginFavoriteRequest = (item: PluginCatalogItem) =>
  createRequest<PluginCatalogItem>(
    'POST',
    path`/api/v1/plugins/catalog/${item.installation_id}/favorite`,
    { params: { organization_id: item.organization_id }, data: {} },
  )

const removePluginFavoriteRequest = (item: PluginCatalogItem) =>
  createRequest<void>(
    'DELETE',
    path`/api/v1/plugins/catalog/${item.installation_id}/favorite`,
    { params: { organization_id: item.organization_id } },
  )

const getWorkflowRuntimeConfigRequest = (workflowAppId: string) =>
  createRequest<WorkflowRuntimeConfig>(
    'GET',
    path`/api/v1/plugins/workflow-runtime/apps/${workflowAppId}`,
  )

const sendWorkflowRuntimeMessageRequest = (
  workflowAppId: string,
  data: WorkflowRuntimeMessageBody,
) =>
  createRequest<WorkflowRuntimeMessage>(
    'POST',
    path`/api/v1/plugins/workflow-runtime/apps/${workflowAppId}/messages`,
    { data },
  )

const createPluginUiSessionRequest = (pluginId: string) =>
  createRequest<PluginUiSession>(
    'POST',
    path`/api/v1/plugins/${pluginId}/ui-session`,
    { data: {} },
  )

export const plugins_catalog = request(listPluginCatalogRequest)
export const plugins_addFavorite = request(addPluginFavoriteRequest)
export const plugins_removeFavorite = request(removePluginFavoriteRequest)
export const plugins_workflowConfig = request(getWorkflowRuntimeConfigRequest)
export const plugins_sendWorkflowMessage = request(
  sendWorkflowRuntimeMessageRequest,
)
export const plugins_createUiSession = request(createPluginUiSessionRequest)
