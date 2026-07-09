import { redirect, type MiddlewareFunction } from 'react-router'

import { testAccessToken } from '@/api/auth'
import { rbacProfile_get } from '@/api/rbac'
import { canAccessRouteMeta } from '@/hooks/usePermission'
import { appRoutes } from '@/router/routes'
import { useAuthStore } from '@/store/useAuth'
import { getCurrentRouteMeta } from '@/utils/routeMeta'

export const authMiddleware: MiddlewareFunction = async (args, next) => {
  const { accessToken, clearAuth, setRbacProfile, setUserInfo, user } =
    useAuthStore.getState()

  if (!accessToken) {
    return redirect('/login')
  }

  try {
    if (!user) {
      const userInfo = await testAccessToken(accessToken)
      setUserInfo(userInfo)
    }

    const profile = await rbacProfile_get()
    setRbacProfile(profile)

    const pathname = new URL(args.request.url).pathname
    const current = getCurrentRouteMeta(appRoutes, pathname)

    if (current && !canAccessRouteMeta(current.meta)) {
      return redirect('/403')
    }
  } catch (e: unknown) {
    const error = e as { canceled?: boolean; status?: number }

    if (error.canceled) {
      return next()
    }

    clearAuth()
    return redirect('/login')
  }

  return next()
}
