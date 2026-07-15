import { LogoutOutlined } from '@ant-design/icons'
import { Button, Result, Space } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { canAccessRouteMeta } from '@/hooks/usePermission'
import { appRoutes, type AppRouteObject } from '@/router/routes'
import { useAuthStore } from '@/store/useAuth'

function joinPath(parentPath: string, path?: string) {
  if (!path) return parentPath
  if (path.startsWith('/')) return path

  return `${parentPath.replace(/\/$/, '')}/${path}`.replace(/\/+/g, '/')
}

function findFirstAccessiblePath(
  routes: AppRouteObject[],
  parentPath = '',
): string | undefined {
  for (const route of routes) {
    const routePath = joinPath(parentPath, route.path)

    if (route.children?.length) {
      const childPath = findFirstAccessiblePath(route.children, routePath)
      if (childPath) return childPath
      continue
    }

    const meta = route.handle
    if (
      !meta ||
      meta.layout === false ||
      meta.hideInMenu ||
      !route.element ||
      routePath.includes(':') ||
      routePath === '*'
    ) {
      continue
    }

    if (canAccessRouteMeta(meta)) return routePath
  }

  return undefined
}

export function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  // Re-evaluate against the current RBAC profile so the fallback is dynamic,
  // not hardcoded to any specific role.
  const permissionCodes = useAuthStore((state) => state.permissionCodes)
  const menuCodes = useAuthStore((state) => state.menuCodes)
  const isSuperuser = useAuthStore((state) => state.user?.is_superuser)

  const fallbackPath = useMemo(
    () => findFirstAccessiblePath(appRoutes),
    // eslint-disable-next-line react-x/exhaustive-deps -- appRoutes is a module constant; re-run only when RBAC profile changes
    [permissionCodes, menuCodes, isSuperuser],
  )

  const handleLogout = () => {
    clearAuth()
    void navigate('/login', { replace: true })
  }

  return (
    <Result
      status="403"
      title={t('routes.forbidden.title')}
      subTitle={
        fallbackPath
          ? t('pages.forbidden.subtitle')
          : t('pages.forbidden.noAccessSubtitle')
      }
      extra={
        <Space>
          {fallbackPath ? (
            <Button
              type="primary"
              onClick={() => void navigate(fallbackPath, { replace: true })}
            >
              {t('pages.forbidden.backHome')}
            </Button>
          ) : null}
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            {t('pages.forbidden.logout')}
          </Button>
        </Space>
      }
    />
  )
}
