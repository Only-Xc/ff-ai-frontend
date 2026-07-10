import { create } from 'zustand'

import type { AuthUser, CurrentRbacProfile } from '@ff-ai-frontend/api'
import { local } from '@ff-ai-frontend/utils'
import { rbacProfile_get } from '@/api/rbac'

export const AUTH_TOKEN_STORAGE_KEY = 'ff-admin-access-token'

interface AuthState {
  accessToken: string
  user: AuthUser | null
  roleCodes: string[]
  permissionCodes: string[]
  menuCodes: string[]
  organizationIds: string[]
  setToken: (accessToken: string) => void
  setUserInfo: (user: AuthUser | null) => void
  setRbacProfile: (profile: CurrentRbacProfile | null) => void
  refreshRbacProfile: () => Promise<void>
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  hasMenu: (code: string) => boolean
  clearAuth: () => void
}

function getInitialAccessToken() {
  return local.get<string>(AUTH_TOKEN_STORAGE_KEY) ?? ''
}

export const useAuthStore = create<AuthState>((set, get) => {
  const accessToken = getInitialAccessToken()

  return {
    accessToken,
    user: null,
    roleCodes: [],
    permissionCodes: [],
    menuCodes: [],
    organizationIds: [],
    setToken: (nextAccessToken) => {
      local.set(AUTH_TOKEN_STORAGE_KEY, nextAccessToken)
      set({
        accessToken: nextAccessToken,
      })
    },
    setUserInfo: (user) => {
      set({ user })
    },
    setRbacProfile: (profile) => {
      set({
        roleCodes: profile?.role_codes ?? [],
        permissionCodes: profile?.permission_codes ?? [],
        menuCodes: profile?.menu_codes ?? [],
        organizationIds: profile?.organizations.map((item) => item.id) ?? [],
      })
    },
    hasPermission: (code) => {
      const { permissionCodes, user } = get()

      return Boolean(user?.is_superuser) || permissionCodes.includes(code)
    },
    hasAnyPermission: (codes) => {
      const { permissionCodes, user } = get()

      return Boolean(user?.is_superuser) || codes.some((code) => permissionCodes.includes(code))
    },
    hasAllPermissions: (codes) => {
      const { permissionCodes, user } = get()

      return Boolean(user?.is_superuser) || codes.every((code) => permissionCodes.includes(code))
    },
    hasMenu: (code) => {
      const { menuCodes, user } = get()

      return Boolean(user?.is_superuser) || menuCodes.includes(code)
    },
    clearAuth: () => {
      local.remove(AUTH_TOKEN_STORAGE_KEY)
      set({
        accessToken: '',
        user: null,
        roleCodes: [],
        permissionCodes: [],
        menuCodes: [],
        organizationIds: [],
      })
    },
    refreshRbacProfile: async () => {
      try {
        const profile = await rbacProfile_get()
        set({
          roleCodes: profile.role_codes ?? [],
          permissionCodes: profile.permission_codes ?? [],
          menuCodes: profile.menu_codes ?? [],
          organizationIds: profile.organizations.map((item) => item.id) ?? [],
        })
      } catch {
        // best-effort refresh; auth middleware will re-fetch on next navigation
      }
    },
  }
})
