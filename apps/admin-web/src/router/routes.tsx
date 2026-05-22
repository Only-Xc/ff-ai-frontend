import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  FileTextOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { NotFoundPage } from '@/pages/exception/NotFoundPage'
import { lazyLoad } from './runtime/lazyLoad'

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
    element: lazyLoad(() => import('@/pages/login/Login')),
    handle: {
      title: '登录',
      layout: false,
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/tickets',
    element: lazyLoad(() => import('@/pages/ticket-kanban/TicketKanban')),
    handle: {
      title: '全局工单',
      titleKey: 'routes.tickets.title',
      icon: <FileTextOutlined />,
      navKey: 'tickets',
      navOrder: 2,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/skills',
    element: lazyLoad(() => import('@/pages/skill-hub/SkillHub')),
    handle: {
      title: '技能库',
      titleKey: 'routes.skills.title',
      icon: <AppstoreOutlined />,
      navKey: 'skills',
      navOrder: 3,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/',
    element: <Navigate replace to="/tickets" />,
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
