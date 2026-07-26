import { createRequest, path } from '@ff-ai-frontend/api'

import { request } from './_request'
import { useAuthStore } from '@/store/useAuth'

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

export function isDirectlyIntegratedPlugin(
  item: Pick<PluginCatalogItem, 'plugin_id'>,
) {
  return /^mailgraph-knowledge-base(?:-\d+)?$/.test(item.plugin_id)
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

export interface WorkflowRuntimeConversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface WorkflowRuntimeHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WorkflowRuntimeStreamEvent {
  type: string
  data: Record<string, unknown>
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
  workflowConversations: (workflowAppId: string) =>
    [...pluginCatalogKeys.workflow(workflowAppId), 'conversations'] as const,
  workflowMessages: (workflowAppId: string, conversationId: string) =>
    [
      ...pluginCatalogKeys.workflow(workflowAppId),
      'messages',
      conversationId,
    ] as const,
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
    { data, timeout: 120_000 },
  )

const listWorkflowRuntimeConversationsRequest = (workflowAppId: string) =>
  createRequest<{ conversations: WorkflowRuntimeConversation[] }>(
    'GET',
    path`/api/v1/plugins/workflow-runtime/apps/${workflowAppId}/conversations`,
  )

const listWorkflowRuntimeMessagesRequest = (
  workflowAppId: string,
  conversationId: string,
) =>
  createRequest<{
    conversation_id: string
    messages: WorkflowRuntimeHistoryMessage[]
  }>(
    'GET',
    path`/api/v1/plugins/workflow-runtime/apps/${workflowAppId}/conversations/${conversationId}/messages`,
  )

const deleteWorkflowRuntimeConversationRequest = (
  workflowAppId: string,
  conversationId: string,
) =>
  createRequest<void>(
    'DELETE',
    path`/api/v1/plugins/workflow-runtime/apps/${workflowAppId}/conversations/${conversationId}`,
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
export const plugins_workflowConversations = request(
  listWorkflowRuntimeConversationsRequest,
)
export const plugins_workflowMessages = request(
  listWorkflowRuntimeMessagesRequest,
)
export const plugins_deleteWorkflowConversation = request(
  deleteWorkflowRuntimeConversationRequest,
)
export const plugins_createUiSession = request(createPluginUiSessionRequest)

export async function plugins_streamWorkflowMessage(
  workflowAppId: string,
  data: WorkflowRuntimeMessageBody,
  onEvent: (event: WorkflowRuntimeStreamEvent) => void,
  signal?: AbortSignal,
) {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(
    `/api/v1/plugins/workflow-runtime/apps/${encodeURIComponent(workflowAppId)}/messages/stream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal,
    },
  )
  if (!response.ok || !response.body) {
    throw new Error(`Workflow Runtime returned HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message'
  const consumeFrame = (frame: string) => {
    const dataLines: string[] = []
    for (const line of frame.replace(/\r\n/g, '\n').split('\n')) {
      if (line.startsWith('event:')) currentEvent = line.slice(6).trim()
      else if (line.startsWith('data:'))
        dataLines.push(line.slice(5).trimStart())
    }
    if (!dataLines.length) return
    const payload = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
    onEvent({ type: currentEvent, data: payload })
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ''
    frames.forEach(consumeFrame)
    if (done) break
  }
  if (buffer.trim()) consumeFrame(buffer)
}
