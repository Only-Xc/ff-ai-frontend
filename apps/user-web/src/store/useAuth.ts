import { create } from 'zustand'

import { local } from '@ff-ai-frontend/utils'

export const AUTH_TOKEN_STORAGE_KEY = 'ff-user-access-token'

export type AuthStatus = 'idle' | 'authenticated' | 'anonymous'

export type AuthUser = Record<string, unknown>

interface AuthState {
  accessToken: string
  status: AuthStatus
  user: AuthUser | null
  setAuthenticated: (accessToken: string, user?: AuthUser | null) => void
  clearAuth: () => void
}

function getInitialAccessToken() {
  return local.get<string>(AUTH_TOKEN_STORAGE_KEY) ?? ''
}

function getInitialStatus(accessToken: string): AuthStatus {
  return accessToken ? 'idle' : 'anonymous'
}

export const useAuthStore = create<AuthState>((set) => {
  const accessToken = getInitialAccessToken()

  return {
    accessToken,
    status: getInitialStatus(accessToken),
    user: null,
    setAuthenticated: (nextAccessToken, user = null) => {
      local.set(AUTH_TOKEN_STORAGE_KEY, nextAccessToken)
      set({
        accessToken: nextAccessToken,
        status: 'authenticated',
        user,
      })
    },
    clearAuth: () => {
      local.remove(AUTH_TOKEN_STORAGE_KEY)
      set({
        accessToken: '',
        status: 'anonymous',
        user: null,
      })
    },
  }
})
