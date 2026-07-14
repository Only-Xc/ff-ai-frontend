import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
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
    path: '/rbac/users',
    element: lazyLoad(() => import('@/pages/rbac/UserList')),
    handle: {
      title: 'User Management',
      titleKey: 'routes.rbac.users.title',
      icon: <TeamOutlined />,
      navKey: 'rbac-users',
      navOrder: 8,
      hideInBreadcrumb: true,
      permission: 'admin.users.read',
      menuCode: 'menu.admin.rbac',
    },
  },
  {
    path: '/rbac/organizations',
    element: lazyLoad(() => import('@/pages/rbac/OrganizationPage')),
    handle: {
      title: 'Organization Management',
      titleKey: 'routes.rbac.organizations.title',
      icon: <DeploymentUnitOutlined />,
      navKey: 'rbac-organizations',
      navOrder: 9,
      hideInBreadcrumb: true,
      permission: 'admin.orgs.read',
      menuCode: 'menu.admin.rbac',
    },
  },
  {
    path: '/grc/dashboard',
    element: lazyLoad(() => import('@/pages/grc/GrcDashboard')),
    handle: {
      title: 'GRC Dashboard',
      titleKey: 'routes.grc.dashboard.title',
      subtitleKey: 'routes.grc.dashboard.subtitle',
      icon: <SafetyCertificateOutlined />,
      navKey: 'grc-dashboard',
      navOrder: 8,
      hideInBreadcrumb: true,
      permission: 'admin.grc.dashboard.read',
      menuCode: 'menu.admin.grc',
    },
  },
  {
    path: '/grc/rules',
    element: lazyLoad(() => import('@/pages/grc/RuleLibrary')),
    handle: {
      title: 'Compliance Rules',
      titleKey: 'routes.grc.rules.title',
      subtitleKey: 'routes.grc.rules.subtitle',
      icon: <FileTextOutlined />,
      navKey: 'grc-rules',
      navOrder: 9,
      hideInBreadcrumb: true,
      permission: 'admin.grc.rules.read',
      menuCode: 'menu.admin.grc',
    },
  },
  {
    path: '/grc/reviews',
    element: lazyLoad(() => import('@/pages/grc/ReviewQueue')),
    handle: {
      title: 'Review Queue',
      titleKey: 'routes.grc.reviews.title',
      subtitleKey: 'routes.grc.reviews.subtitle',
      icon: <FileDoneOutlined />,
      navKey: 'grc-reviews',
      navOrder: 10,
      hideInBreadcrumb: true,
      permission: 'admin.grc.reviews.read',
      menuCode: 'menu.admin.grc',
    },
  },
  {
    path: '/grc/reviews/:caseId',
    element: lazyLoad(() => import('@/pages/grc/ReviewDetail')),
    handle: {
      title: 'Review Detail',
      titleKey: 'pages.grc.reviews.decision',
      navKey: 'grc-reviews',
      hideInMenu: true,
      permission: 'admin.grc.reviews.read',
    },
  },
  {
    path: '/grc/rules/:ruleId',
    element: lazyLoad(() => import('@/pages/grc/RuleDetail')),
    handle: {
      title: 'Rule Detail',
      titleKey: 'routes.grc.rules.detail.title',
      navKey: 'grc-rules',
      hideInMenu: true,
      permission: 'admin.grc.rules.read',
    },
  },
  {
    path: '/grc/evaluations',
    element: lazyLoad(() => import('@/pages/grc/EvaluationList')),
    handle: {
      title: 'Evaluations',
      titleKey: 'routes.grc.evaluations.title',
      subtitleKey: 'routes.grc.evaluations.subtitle',
      icon: <DeploymentUnitOutlined />,
      navKey: 'grc-evaluations',
      navOrder: 9.5,
      hideInBreadcrumb: true,
      permission: 'admin.grc.evaluations.read',
      menuCode: 'menu.admin.grc',
    },
  },
  {
    path: '/grc/evaluations/:evaluationId',
    element: lazyLoad(() => import('@/pages/grc/EvaluationDetail')),
    handle: {
      title: 'Evaluation Detail',
      titleKey: 'routes.grc.evaluations.detail.title',
      navKey: 'grc-evaluations',
      hideInMenu: true,
      permission: 'admin.grc.evaluations.read',
    },
  },
  {
    path: '/grc/exceptions',
    element: lazyLoad(() => import('@/pages/grc/ExceptionManagement')),
    handle: {
      title: 'Exceptions',
      titleKey: 'routes.grc.exceptions.title',
      subtitleKey: 'routes.grc.exceptions.subtitle',
      icon: <SafetyCertificateOutlined />,
      navKey: 'grc-exceptions',
      navOrder: 11,
      hideInBreadcrumb: true,
      permission: 'admin.grc.exceptions.read',
      menuCode: 'menu.admin.grc',
    },
  },
  {
    path: '/grc/reports',
    element: lazyLoad(() => import('@/pages/grc/GovernanceReports')),
    handle: {
      title: 'Governance Reports',
      titleKey: 'routes.grc.reports.title',
      subtitleKey: 'routes.grc.reports.subtitle',
      icon: <LineChartOutlined />,
      navKey: 'grc-reports',
      navOrder: 12,
      hideInBreadcrumb: true,
      permission: 'admin.grc.reports.read',
      menuCode: 'menu.admin.grc',
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
