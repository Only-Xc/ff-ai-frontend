import { Spin } from 'antd'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { testAccessToken } from '@/api/auth'
import { useAuthStore } from '@/store/useAuth'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  useEffect(() => {
    if (!accessToken || status === 'authenticated') {
      return
    }

    let canceled = false

    void testAccessToken(accessToken)
      .then((user) => {
        if (canceled) return

        setAuthenticated(accessToken, user)
      })
      .catch(() => {
        if (canceled) return

        clearAuth()
      })

    return () => {
      canceled = true
    }
  }, [accessToken, clearAuth, setAuthenticated, status])

  if (!accessToken) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg)">
        <Spin size="large" description="正在校验登录状态" />
      </div>
    )
  }

  return children
}
