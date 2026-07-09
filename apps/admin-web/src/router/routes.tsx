import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
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
    path: '/tickets',
    element: lazyLoad(() => import('@/pages/ticket-kanban/TicketKanban')),
    handle: {
      title: 'Global Tickets',
      titleKey: 'routes.tickets.title',
      icon: <FileTextOutlined />,
      navKey: 'tickets',
      navOrder: 2,
      hideInBreadcrumb: true,
      permission: 'admin.tickets.read',
      menuCode: 'menu.admin.tickets',
    },
  },
  {
    path: '/skills',
    element: lazyLoad(() => import('@/pages/skill-hub/SkillHub')),
    handle: {
      title: 'Skill Hub',
      titleKey: 'routes.skills.title',
      icon: <AppstoreOutlined />,
      navKey: 'skills',
      navOrder: 3,
      hideInBreadcrumb: true,
      permission: 'admin.skills.read',
      menuCode: 'menu.admin.skills',
    },
  },
  {
    path: '/ops-metrics',
    element: lazyLoad(() => import('@/pages/ops-metrics/OpsMetrics')),
    handle: {
      title: 'Ops Metrics',
      titleKey: 'routes.opsMetrics.title',
      icon: <LineChartOutlined />,
      navKey: 'ops-metrics',
      navOrder: 4,
      hideInBreadcrumb: true,
      permission: 'admin.metrics.read',
      menuCode: 'menu.admin.ops_metrics',
    },
  },
  {
    path: '/lifecycle-ops',
    element: lazyLoad(() => import('@/pages/lifecycle-ops/LifecycleOps')),
    handle: {
      title: 'Lifecycle Ops',
      titleKey: 'routes.lifecycleOps.title',
      icon: <DeploymentUnitOutlined />,
      navKey: 'lifecycle-ops',
      navOrder: 5,
      hideInBreadcrumb: true,
      permission: 'admin.lifecycle.read',
      menuCode: 'menu.admin.lifecycle_ops',
    },
  },
  {
    handle: {
      title: 'Exam Center',
      titleKey: 'routes.examCenter.title',
      icon: <FileDoneOutlined />,
      menuType: 'catalog',
      menuMode: 'submenu',
      navKey: 'exam-center',
      navOrder: 6,
      hideInBreadcrumb: true,
      permission: 'admin.exams.read',
      menuCode: 'menu.admin.exam_center',
    },
    children: [
      {
        path: '/exams',
        element: lazyLoad(() => import('@/pages/exam-management/ExamList')),
        handle: {
          title: 'Exam Management',
          titleKey: 'routes.exams.title',
          navKey: 'exams',
          navOrder: 1,
          hideInBreadcrumb: true,
          permission: 'admin.exams.read',
        },
      },
      {
        path: '/exams/:paperId',
        element: lazyLoad(() => import('@/pages/exam-management/ExamDetail')),
        handle: {
          title: 'Exam Detail',
          titleKey: 'routes.examDetail.title',
          navKey: 'exams',
          hideInMenu: true,
          permission: 'admin.exams.read',
        },
      },
      {
        path: '/exam-attempts',
        element: lazyLoad(() => import('@/pages/exam-management/AttemptOverview')),
        handle: {
          title: 'Exam Attempts',
          titleKey: 'routes.examAttempts.title',
          navKey: 'exam-attempts',
          navOrder: 2,
          hideInBreadcrumb: true,
          permission: 'admin.exams.read',
        },
      },
    ],
  },
  {
    path: '/rbac/roles',
    element: lazyLoad(() => import('@/pages/rbac/RoleList')),
    handle: {
      title: 'Role & Permissions',
      titleKey: 'routes.rbac.roles.title',
      icon: <SafetyCertificateOutlined />,
      navKey: 'rbac-roles',
      navOrder: 7,
      hideInBreadcrumb: true,
      permission: 'admin.roles.read',
      menuCode: 'menu.admin.rbac',
    },
  },
  {
    path: '/tickets/:taskId/intervention',
    element: lazyLoad(
      () => import('@/pages/intervention-workbench/InterventionWorkbench'),
    ),
    handle: {
      title: 'Intervention',
      titleKey: 'routes.intervention.title',
      layout: false,
      navKey: 'tickets',
      hideInMenu: true,
      permission: 'admin.tickets.intervene',
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
