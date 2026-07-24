import { useQuery } from '@tanstack/react-query'
import { Alert, Spin } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { requestClient } from '@/utils/request'

interface BrowserSessionResponse {
  chatflow_id: string
  workspace_id: string
  user: Record<string, unknown>
}

function createBrowserSession(
  appId: string,
): Promise<BrowserSessionResponse> {
  return requestClient.post(`/api/v1/flowise/browser-session/${appId}`)
}

function getFlowiseBaseUrl(): string {
  const configured: unknown = import.meta.env.VITE_FLOWISE_BASE_URL
  return typeof configured === 'string' && configured.length > 0
    ? configured
    : 'http://localhost:3000'
}

function buildEditorUrl(
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

interface FlowiseEmbedCanvasProps {
  appId: string
  /** Override chatflow ID (e.g. version runtime chatflow). Falls back to browser-session chatflow. */
  chatflowId?: string | null
}

/**
 * Embeds the actual Flowise editor canvas via iframe.
 * Establishes a trusted browser session first (sets HttpOnly cookies),
 * then renders the Flowise UI in an iframe for pixel-perfect fidelity.
 */
export function FlowiseEmbedCanvas({ appId, chatflowId }: FlowiseEmbedCanvasProps) {
  const { t } = useTranslation()

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['flowise', 'admin-session', appId],
    queryFn: () => createBrowserSession(appId),
    enabled: Boolean(appId),
    retry: false,
  })

  const iframeSrc = useMemo(() => {
    if (!session) return ''
    const s = session as BrowserSessionResponse
    const targetChatflow = chatflowId || s.chatflow_id
    return buildEditorUrl(targetChatflow, s.user)
  }, [session, chatflowId])

  if (isLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Spin size="large" tip={t('pages.flowise.loadingSession')} />
      </div>
    )
  }

  if (isError || !iframeSrc) {
    return (
      <Alert
        type="error"
        showIcon
        message={t('pages.flowise.sessionError')}
      />
    )
  }

  return (
    <div className="flowise-embed-canvas">
      <iframe
        src={iframeSrc}
        title="Flowise Canvas"
        className="flowise-embed-canvas__iframe"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
