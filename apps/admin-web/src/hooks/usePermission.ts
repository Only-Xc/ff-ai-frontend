import type { RouteMeta } from '@/router/routes'
import { useAuthStore } from '@/store/useAuth'

export function canAccessRouteMeta(meta?: RouteMeta) {
  if (!meta) return true

  const { hasAllPermissions, hasAnyPermission, hasMenu, hasPermission } =
    useAuthStore.getState()

  if (meta.menuCode && !hasMenu(meta.menuCode)) return false
  if (meta.permission && !hasPermission(meta.permission)) return false
  if (!meta.permissions?.length) return true

  return meta.permissionMode === 'any'
    ? hasAnyPermission(meta.permissions)
    : hasAllPermissions(meta.permissions)
}

export function usePermission() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions)
  const hasMenu = useAuthStore((state) => state.hasMenu)

  return {
    hasAllPermissions,
    hasAnyPermission,
    hasMenu,
    hasPermission,
  }
}
