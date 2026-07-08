import {
  DatabaseOutlined,
  DesktopOutlined,
  FileTextOutlined,
  ProjectOutlined,
  WalletOutlined,
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
  standalone?: boolean
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
      title: 'Login',
      titleKey: 'routes.login.title',
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
          title: 'Dashboard',
          titleKey: 'routes.chat.title',
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
          title: 'Agents & Tickets',
          titleKey: 'routes.agentTicket.title',
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
                  () => import('@/pages/agent-ticket/TicketList'),
                ),
                handle: {
                  title: 'Ticket List',
                  titleKey: 'routes.agentTicket.tickets.title',
                  hideInMenu: true,
                },
              },
              {
                path: 'agents',
                element: lazyLoad(
                  () => import('@/pages/agent-ticket/AgentList'),
                ),
                handle: {
                  title: 'Agent List',
                  titleKey: 'routes.agentTicket.agents.title',
                  hideInMenu: true,
                },
              },
            ],
          },
          {
            path: 'tasks/:taskId/board',
            element: lazyLoad(() => import('@/pages/agent-ticket/TaskBoard')),
            handle: {
              title: 'Live Board',
              titleKey: 'routes.agentTicket.taskBoard.title',
              hideInMenu: true,
            },
          },
          {
            path: 'agents/:agentId',
            element: lazyLoad(() => import('@/pages/agent-ticket/AgentDetail')),
            handle: {
              title: 'Agent Details',
              titleKey: 'routes.agentTicket.agentDetail.title',
              hideInMenu: true,
            },
          },
        ],
      },
      {
        path: '/apps/:taskId',
        element: lazyLoad(
          () => import('@/pages/iframe-container/IframeContainerPage'),
        ),
        handle: {
          title: 'App Preview',
          titleKey: 'routes.appPreview.title',
          hideInMenu: true,
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/billing-center',
        element: lazyLoad(() => import('@/pages/billing-center/BillingCenter')),
        handle: {
          title: 'Billing Center',
          titleKey: 'routes.billingCenter.title',
          icon: <WalletOutlined />,
          menuType: 'menu',
          navKey: 'billingCenter',
          navOrder: 4,
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/exams',
        element: lazyLoad(() => import('@/pages/exam/ExamList')),
        handle: {
          title: 'Exams',
          titleKey: 'routes.exams.title',
          icon: <FileTextOutlined />,
          menuType: 'menu',
          navKey: 'exams',
          navOrder: 5,
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/exams/:paperId/attempt',
        element: lazyLoad(() => import('@/pages/exam/AttemptState')),
        handle: {
          title: 'Start Exam',
          titleKey: 'routes.examAttempt.title',
          navKey: 'exams',
          hideInMenu: true,
        },
      },
      {
        path: '/attempts',
        element: lazyLoad(() => import('@/pages/exam/AttemptHistory')),
        handle: {
          title: 'Attempt History',
          titleKey: 'routes.attempts.title',
          icon: <FileTextOutlined />,
          menuType: 'menu',
          navKey: 'attempts',
          navOrder: 6,
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/attempts/:attemptId/result',
        element: lazyLoad(() => import('@/pages/exam/ExamResult')),
        handle: {
          title: 'Exam Result',
          titleKey: 'routes.examResult.title',
          navKey: 'attempts',
          hideInMenu: true,
        },
      },
    ],
  },
  {
    path: '/attempts/:attemptId',
    element: lazyLoad(() => import('@/pages/exam/ExamRoom')),
    handle: {
      title: 'Exam Room',
      titleKey: 'routes.examRoom.title',
      standalone: true,
      navKey: 'exams',
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
  },
  {
    handle: {
      title: 'App List',
      titleKey: 'routes.appList.title',
      menuType: 'catalog',
      menuMode: 'group',
      navKey: 'workspace',
      navOrder: 2,
      hideInBreadcrumb: true,
    },
    children: [
      {
        path: '/schema-renderer-demo',
        element: lazyLoad(
          () => import('@/pages/schema-renderer/SchemaRendererDemo'),
        ),
        handle: {
          title: 'SchemaRender Demo',
          titleKey: 'routes.schemaRendererDemo.title',
          menuType: 'menu',
          navKey: 'schemaRendererDemo',
          navOrder: 3,
          hideInMenu: true,
          hideInBreadcrumb: true,
        },
      },
    ],
  },
  {
    handle: {
      title: 'Knowledge Base',
      titleKey: 'pages.menu.knowledgeBase',
      menuType: 'catalog',
      menuMode: 'group',
      navKey: 'knowledge-base',
      navOrder: 3,
      hideInBreadcrumb: true,
    },
    children: [
      {
        path: '/knowledge',
        element: lazyLoad(() => import('@/pages/knowledge/KnowledgeBase')),
        handle: {
          title: 'Knowledge Base',
          titleKey: 'routes.knowledge.title',
          icon: <DatabaseOutlined />,
          menuType: 'menu',
          navKey: 'knowledge',
          navOrder: 1,
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
