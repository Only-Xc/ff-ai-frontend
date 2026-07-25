import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
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

export function FlowiseEmbedCanvas({
  appId,
  versionId,
  fallback,
}: FlowiseEmbedCanvasProps) {
  const { t } = useTranslation()
  const [sessionNonce, setSessionNonce] = useState(() => crypto.randomUUID())
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
      setSessionNonce(crypto.randomUUID())
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (isLoading) {
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

  if (isError || !data) return <>{fallback}</>

  return (
    <div className="flowise-embed-canvas">
      <iframe
        key={data.ticket}
        className="flowise-embed-canvas__iframe"
        src={buildFlowiseReadonlyViewerUrl(data.ticket)}
        title={t('pages.flowise.canvasAriaLabel')}
      />
    </div>
  )
}
