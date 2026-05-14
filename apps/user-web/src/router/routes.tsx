import {
  DesktopOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { AnalysisPage } from '@/pages/dashboard/Analysis'
import { NotFoundPage } from '@/pages/exception/NotFoundPage'
import { WorkspacePage } from '@/pages/workspace/Workspace'
import { LoginPage } from '@/pages/login/Login'

export interface RouteMeta {
  title?: string
  titleKey?: string
  subtitleKey?: string
  icon?: ReactNode
  layout?: boolean
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  menuType?: 'catalog' | 'menu'
  menuMode?: 'group' | 'submenu'
  navKey?: string
  navOrder?: number
}

export type AppRouteObject = Omit<RouteObject, 'children' | 'handle'> & {
  children?: AppRouteObject[]
  handle?: RouteMeta
}

export const appRoutes: AppRouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
    handle: {
      title: '登录',
      layout: false,
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
  },
  {
    children: [
      {
        path: '/chat',
        element: <WorkspacePage />,
        handle: {
          title: '工作台',
          // titleKey: 'routes.chat.title',
          icon: <DesktopOutlined />,
          // subtitleKey: 'pages.shell.usageSubtitle',
          menuType: 'menu',
          navKey: 'chat',
          navOrder: 1,
        },
      },
      {
        path: '/todo',
        element: <AnalysisPage />,
        handle: {
          title: '研发大盘',
          // titleKey: 'routes.settings.title',
          icon: <ProjectOutlined />,
          menuType: 'menu',
          navKey: 'todo',
          navOrder: 2,
          hideInBreadcrumb: true,
        },
      },
    ],
  },
  {
    path: '/',
    element: <Navigate replace to="/chat" />,
    handle: {
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '*',
    element: <NotFoundPage />,
    handle: {
      title: '404',
      titleKey: 'routes.notFound.title',
      layout: false,
      hideInMenu: true,
    },
  },
]
