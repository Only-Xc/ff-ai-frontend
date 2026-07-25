import { requestClient } from '@/utils/request'

export const FLOWISE_SESSION_EXPIRED_EVENT = 'ffai:flowise-session-expired'

export interface FlowiseBrowserSession {
  ticket: string
  chatflow_id: string
  workspace_id: string
  mode: 'edit' | 'readonly'
  expires_in: number
}

export const flowiseKeys = {
  all: ['flowise'] as const,
  readonlyBrowserSession: (appId: string, versionId?: string) =>
    ['flowise', 'readonly-browser-session', appId, versionId ?? 'draft'] as const,
}

export async function createReadonlyFlowiseBrowserSession(
  appId: string,
  versionId?: string,
): Promise<FlowiseBrowserSession> {
  return requestClient.post(`/api/v1/flowise/browser-session/${appId}/readonly`, {
    version_id: versionId,
  })
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
