import { redirect, type MiddlewareFunction } from 'react-router'

import { testAccessToken } from '@/api/auth'
import { useAuthStore } from '@/store/useAuth'
import { useMenuStore } from '@/store/useMenu'

export const authMiddleware: MiddlewareFunction = async (_args, next) => {
  const { accessToken, clearAuth, setUserInfo, user } = useAuthStore.getState()

  if (!accessToken) {
    return redirect('/login')
  }

  try {
    if (!user) {
      const userInfo = await testAccessToken(accessToken)

      setUserInfo(userInfo)
    }

    await useMenuStore.getState().loadMenu()
  } catch {
    clearAuth()

    return redirect('/login')
  }

  return next()
}
