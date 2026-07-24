import { requestClient } from '@/utils/request'

export interface FlowiseBrowserSession {
  ticket: string
  chatflow_id: string
  workspace_id: string
  mode: 'edit' | 'readonly'
  expires_in: number
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

export function buildFlowiseEditorUrl(ticket: string): string {
  const base = getFlowiseBaseUrl().replace(/\/$/, '')
  const fragment = new URLSearchParams({ ticket })
  return `${base}/ffai-bootstrap.html#${fragment.toString()}`
}
