import { StrictMode, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Result, Spin } from 'antd'
import { testAccessTokenRequest } from '@ff-ai-frontend/api'
import { IframeStandalonePage } from '@ff-ai-frontend/components'
import type { AuthUser } from '@ff-ai-frontend/api'

import '../src/index.css'
import { AppProvider } from '../src/components/AppProvider'
import { ensureI18nReady } from '../src/i18n'
import { useAuthStore } from '../src/store/useAuth'
import { requestClient } from '../src/utils/request'

const root = createRoot(document.getElementById('root')!)
const IFRAME_AUTH_CHECK_INTERVAL = 60_000

let iframeAuthPromise: Promise<boolean> | null = null

function getTaskIdFromSearch(search: string) {
  const params = new URLSearchParams(search)

  return (params.get('taskid') ?? params.get('taskId') ?? '').trim()
}

function renderApp(children: ReactNode) {
  root.render(
    <StrictMode>
      <AppProvider>{children}</AppProvider>
    </StrictMode>,
  )
}

function IframeLoadingPage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-(--panel)">
      <Spin />
    </div>
  )
}

export function IframeUnauthorizedPage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-(--panel) p-6">
      <Result
        status="403"
        title="401"
        subTitle="Token is missing or expired."
      />
    </div>
  )
}

async function checkIframeAuth() {
  const { accessToken, clearAuth, setUserInfo } = useAuthStore.getState()

  if (!accessToken) {
    return false
  }

  try {
    const userInfo = await requestClient<AuthUser>({
      ...testAccessTokenRequest(accessToken),
      skipErrorHandler: true,
    })

    setUserInfo(userInfo)

    return true
  } catch {
    clearAuth()

    return false
  }
}

function getIframeAuthResult() {
  iframeAuthPromise ??= checkIframeAuth()

  return iframeAuthPromise
}

export function IframeAuthGate({ taskId }: { taskId: string }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    void getIframeAuthResult().then((nextAuthorized) => {
      if (active) {
        setAuthorized(nextAuthorized)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!authorized) {
      return
    }

    let active = true
    let checking = false

    const refreshAuth = () => {
      if (checking) {
        return
      }

      checking = true

      void checkIframeAuth()
        .then((nextAuthorized) => {
          if (active && !nextAuthorized) {
            setAuthorized(false)
          }
        })
        .finally(() => {
          checking = false
        })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAuth()
      }
    }

    const timer = window.setInterval(refreshAuth, IFRAME_AUTH_CHECK_INTERVAL)

    window.addEventListener('focus', refreshAuth)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshAuth)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authorized])

  if (authorized === null) {
    return <IframeLoadingPage />
  }

  if (!authorized) {
    return <IframeUnauthorizedPage />
  }

  return <IframeStandalonePage taskId={taskId} />
}

void ensureI18nReady().then(() => {
  const taskId = getTaskIdFromSearch(window.location.search)

  renderApp(<IframeAuthGate taskId={taskId} />)
})
