import { useCallback, useEffect, useRef, useState } from 'react'

import {
  FLOWISE_SESSION_EXPIRED_EVENT,
  getFlowiseBaseUrl,
  type FlowiseBrowserSession,
} from '@/api/flowise'

interface RefetchResult {
  data?: FlowiseBrowserSession
}

interface UseFlowiseIframeSessionRefreshOptions {
  appId: string
  refetchSession: () => Promise<RefetchResult>
}

function getExpectedFlowiseOrigin() {
  try {
    return new URL(getFlowiseBaseUrl(), window.location.origin).origin
  } catch {
    return ''
  }
}

function isFlowiseSessionExpiredMessage(event: MessageEvent) {
  if (event.origin !== getExpectedFlowiseOrigin()) return false
  const data = event.data as { type?: unknown } | null
  return data?.type === FLOWISE_SESSION_EXPIRED_EVENT
}

export function useFlowiseIframeSessionRefresh({
  appId,
  refetchSession,
}: UseFlowiseIframeSessionRefreshOptions) {
  const [iframeKey, setIframeKey] = useState(0)
  const refreshInFlightRef = useRef(false)

  const refreshIframeSession = useCallback(async () => {
    if (!appId || refreshInFlightRef.current) return

    refreshInFlightRef.current = true
    try {
      const { data } = await refetchSession()
      if (data) setIframeKey((current) => current + 1)
    } finally {
      refreshInFlightRef.current = false
    }
  }, [appId, refetchSession])

  useEffect(() => {
    if (!appId) return

    const handleMessage = (event: MessageEvent) => {
      if (!isFlowiseSessionExpiredMessage(event)) return
      void refreshIframeSession()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [appId, refreshIframeSession])

  return { iframeKey, refreshIframeSession }
}
