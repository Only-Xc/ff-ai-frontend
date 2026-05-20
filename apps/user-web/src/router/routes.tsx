import { DesktopOutlined, ProjectOutlined } from '@ant-design/icons'
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
    children: [
      {
        path: '/chat',
        element: lazyLoad(() => import('@/pages/chat/Chat')),
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
        path: '/agent-ticket',
        handle: {
          title: '智能体与工单',
          // titleKey: 'routes.settings.title',
          icon: <ProjectOutlined />,
          menuType: 'menu',
          navKey: 'todo',
          navOrder: 2,
          hideInBreadcrumb: true,
        },
        children: [
          {
            index: true,
            element: <Navigate replace to="tickets" />,
            handle: {
              hideInMenu: true,
            },
          },
          {
            element: lazyLoad(() => import('@/pages/agent-ticket/AgentTicket')),
            children: [
              {
                path: 'tickets',
                element: lazyLoad(
                  () => import('@/pages/agent-ticket/components/TicketList'),
                ),
                handle: {
                  title: '工单列表',
                  hideInMenu: true,
                },
              },
              {
                path: 'agents',
                element: lazyLoad(
                  () => import('@/pages/agent-ticket/components/AgentList'),
                ),
                handle: {
                  title: '智能体列表',
                  hideInMenu: true,
                },
              },
            ],
          },
          {
            path: 'tasks/:taskId/board',
            element: lazyLoad(() => import('@/pages/agent-ticket/TaskBoard')),
            handle: {
              title: '动态看板',
              hideInMenu: true,
            },
          },
          {
            path: 'agents/:agentId',
            element: lazyLoad(() => import('@/pages/agent-ticket/AgentDetail')),
            handle: {
              title: '智能体详情',
              hideInMenu: true,
            },
          },
        ],
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
