import { requestClient } from '@/utils/request'

export interface FlowiseBrowserSession {
  chatflow_id: string
  workspace_id: string
  user: Record<string, unknown>
}

export interface FlowiseDraftSyncResult {
  app_id: string
  revision: number
  graph_json: Record<string, unknown> | null
  feature_config_json: Record<string, unknown> | null
  resource_bindings_json: Record<string, unknown> | null
  updated_by: string | null
  updated_at: string
}

export const flowiseKeys = {
  all: ['flowise'] as const,
  browserSession: (appId: string) =>
    ['flowise', 'browser-session', appId] as const,
}

/** Establish the trusted Flowise UI session after ff-ai authorization. */
export async function createFlowiseBrowserSession(
  appId: string,
): Promise<FlowiseBrowserSession> {
  return requestClient.post(`/api/v1/flowise/browser-session/${appId}`)
}

/** Synchronize the graph saved in Flowise into the ff-ai workflow draft. */
export async function syncFlowiseDraft(
  appId: string,
): Promise<FlowiseDraftSyncResult> {
  return requestClient.post(`/api/v1/flowise/chatflows/${appId}/sync-draft`)
}

export function getFlowiseBaseUrl(): string {
  const configuredUrl: unknown = import.meta.env.VITE_FLOWISE_BASE_URL
  return typeof configuredUrl === 'string' && configuredUrl.length > 0
    ? configuredUrl
    : 'http://localhost:3000'
}

export function buildFlowiseEditorUrl(
  chatflowId: string,
  user: Record<string, unknown>,
): string {
  const base = getFlowiseBaseUrl().replace(/\/$/, '')
  const fragment = new URLSearchParams({
    target: `/canvas/${chatflowId}`,
    user: JSON.stringify(user),
  })
  return `${base}/ffai-bootstrap.html#${fragment.toString()}`
}
