import { create } from 'zustand'

import type { AuthUser } from '@ff-ai-frontend/api'
import { local } from '@ff-ai-frontend/utils'

export const AUTH_TOKEN_STORAGE_KEY = 'ff-user-access-token'

interface AuthState {
  accessToken: string
  user: AuthUser | null
  setToken: (accessToken: string) => void
  setUserInfo: (user: AuthUser | null) => void
  clearAuth: () => void
}

function getInitialAccessToken() {
  return local.get<string>(AUTH_TOKEN_STORAGE_KEY) ?? ''
}

export const useAuthStore = create<AuthState>((set) => {
  const accessToken = getInitialAccessToken()

  return {
    accessToken,
    user: null,
    setToken: (nextAccessToken) => {
      local.set(AUTH_TOKEN_STORAGE_KEY, nextAccessToken)
      set({
        accessToken: nextAccessToken,
      })
    },
    setUserInfo: (user) => {
      set({ user })
    },
    clearAuth: () => {
      local.remove(AUTH_TOKEN_STORAGE_KEY)
      set({
        accessToken: '',
        user: null,
      })
    },
  }
})
