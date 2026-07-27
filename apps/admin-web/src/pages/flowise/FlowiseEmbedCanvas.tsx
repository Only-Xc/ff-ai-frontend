import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import {
  buildFlowiseBootstrapUrl,
  buildFlowiseReadonlyViewerUrl,
  createReadonlyFlowiseBrowserSession,
  FLOWISE_SESSION_EXPIRED_EVENT,
  flowiseKeys,
} from '@/api/flowise'

interface FlowiseEmbedCanvasProps {
  appId: string
  versionId?: string
  fallback: ReactNode
}

const BOOTSTRAP_PROBE_TIMEOUT_MS = 4000
type EmbedStatus = 'checking' | 'ready' | 'failed'

export function FlowiseEmbedCanvas({
  appId,
  versionId,
  fallback,
}: FlowiseEmbedCanvasProps) {
  const { t } = useTranslation()
  const [sessionNonce, setSessionNonce] = useState(() => uuidv4())
  const [embedStatus, setEmbedStatus] = useState<EmbedStatus>('checking')
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      ...flowiseKeys.readonlyBrowserSession(appId, versionId),
      sessionNonce,
    ],
    queryFn: () => createReadonlyFlowiseBrowserSession(appId, versionId),
    enabled: Boolean(appId),
    gcTime: 0,
    refetchOnMount: 'always',
    retry: false,
    staleTime: 0,
  })

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: unknown = event.data
      if (
        !message ||
        typeof message !== 'object' ||
        !('type' in message) ||
        message.type !== FLOWISE_SESSION_EXPIRED_EVENT
      ) {
        return
      }
      setSessionNonce(uuidv4())
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (!data?.ticket) return

    const controller = new AbortController()
    let active = true
    setEmbedStatus('checking')
    const timeout = window.setTimeout(() => {
      controller.abort()
    }, BOOTSTRAP_PROBE_TIMEOUT_MS)

    fetch(buildFlowiseBootstrapUrl(), {
      method: 'HEAD',
      credentials: 'omit',
      signal: controller.signal,
    })
      .then((response) => {
        if (!active) return
        setEmbedStatus(response.ok ? 'ready' : 'failed')
      })
      .catch(() => {
        if (active) setEmbedStatus('failed')
      })

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [data?.ticket])

  if (isLoading || (data && embedStatus === 'checking')) {
    return (
      <div className="flowise-embed-canvas grid place-items-center">
        <Spin
          size="large"
          description={t(
            'pages.flowise.loadingSession',
            'Loading read-only canvas...',
          )}
        />
      </div>
    )
  }

  if (isError || !data || embedStatus === 'failed') return <>{fallback}</>

  return (
    <div className="flowise-embed-canvas">
      <iframe
        key={data.ticket}
        className="flowise-embed-canvas__iframe"
        src={buildFlowiseReadonlyViewerUrl(data.ticket)}
        title={t('pages.flowise.canvasAriaLabel')}
        onError={() => setEmbedStatus('failed')}
      />
    </div>
  )
}
