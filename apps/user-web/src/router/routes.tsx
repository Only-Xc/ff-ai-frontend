import {
  ApartmentOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  FileTextOutlined,
  ProjectOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { ForbiddenPage } from '@/pages/exception/ForbiddenPage'
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
  permission?: string
  permissions?: string[]
  permissionMode?: 'all' | 'any'
  menuCode?: string
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
          permission: 'user.chat.use',
          menuCode: 'menu.user.chat',
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
          permission: 'user.agent_tickets.read',
          menuCode: 'menu.user.agent_ticket',
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
          permission: 'user.billing.read',
          menuCode: 'menu.user.billing_center',
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
          permission: 'user.exams.read',
          menuCode: 'menu.user.exams',
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
          permission: 'user.exams.attempt',
        },
      },
      {
        path: '/attempts',
        element: <Navigate replace to="/exams?tab=attempts" />,
        handle: {
          title: 'Attempt History',
          titleKey: 'routes.attempts.title',
          navKey: 'exams',
          hideInMenu: true,
          hideInBreadcrumb: true,
          permission: 'user.attempts.read',
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
          permission: 'user.attempts.read',
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
      permission: 'user.exams.attempt',
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
    handle: {
      title: 'Workflow',
      titleKey: 'pages.menu.workflow',
      menuType: 'catalog',
      menuMode: 'group',
      navKey: 'workflow',
      navOrder: 4,
      hideInBreadcrumb: true,
    },
    children: [
      {
        path: '/workflow',
        element: lazyLoad(() => import('@/pages/workflow/WorkflowList')),
        handle: {
          title: 'Workflow Apps',
          titleKey: 'routes.workflow.title',
          icon: <ApartmentOutlined />,
          menuType: 'menu',
          navKey: 'workflow-list',
          navOrder: 1,
          hideInBreadcrumb: true,
          permission: 'admin.workflow_apps.read',
        },
      },
      {
        path: '/workflow/:appId',
        element: lazyLoad(() => import('@/pages/workflow/CanvasEditor')),
        handle: {
          title: 'Canvas Editor',
          titleKey: 'routes.workflow.canvas',
          hideInMenu: true,
          hideInBreadcrumb: true,
          permission: 'admin.workflow_apps.update',
        },
      },
      {
        path: '/platform-apps/workflows/:appId/chat',
        element: lazyLoad(() => import('@/pages/workflow/WorkflowChat')),
        handle: {
          title: 'Workflow Chat',
          titleKey: 'routes.workflow.chat',
          hideInMenu: true,
          hideInBreadcrumb: true,
          permission: 'user.workflow_apps.use',
        },
      },
      {
        path: '/platform-apps',
        element: lazyLoad(
          () => import('@/pages/platform-apps/PlatformAppsCatalog'),
        ),
        handle: {
          title: 'Platform Apps Catalog',
          titleKey: 'pages.platformApps.title',
          navKey: 'platform-apps-catalog',
          navOrder: 0,
          hideInMenu: false,
          hideInBreadcrumb: true,
          permission: 'user.workflow_apps.use',
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
    path: '/403',
    element: <ForbiddenPage />,
    handle: {
      title: '403',
      titleKey: 'routes.forbidden.title',
      layout: false,
      hideInMenu: true,
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
