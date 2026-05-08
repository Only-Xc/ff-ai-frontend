import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  LaptopOutlined,
  SettingOutlined,
  ToolOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { AnalysisPage } from '@/pages/dashboard/Analysis'
import { NotFoundPage } from '@/pages/exception/NotFoundPage'
import { WorkspacePage } from '@/pages/workspace/Workspace'

export interface RouteMeta {
  title?: string
  titleKey?: string
  navGroupKey?: string
  subtitleKey?: string
  icon?: ReactNode
  layout?: boolean
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  navGroup?: string
  navKey?: string
  navOrder?: number
}

export type AppRouteObject = Omit<RouteObject, 'children' | 'handle'> & {
  children?: AppRouteObject[]
  handle?: RouteMeta
}

export const appRoutes: AppRouteObject[] = [
  {
    path: '/usage',
    handle: {
      title: '用量与余额',
      titleKey: 'routes.usage.title',
      icon: <WalletOutlined />,
      navGroup: '平台管理',
      navGroupKey: 'routes.groups.platform',
      subtitleKey: 'pages.shell.usageSubtitle',
      navKey: 'usage',
      navOrder: 1,
    },
    children: [
      {
        index: true,
        element: <AnalysisPage />,
        handle: {
          title: '用量与余额',
          titleKey: 'routes.usage.title',
          subtitleKey: 'pages.shell.usageSubtitle',
          hideInMenu: true,
        },
      },
    ],
  },
  {
    path: '/generate',
    element: <AnalysisPage />,
    handle: {
      title: '应用生成',
      titleKey: 'routes.generate.title',
      icon: <ToolOutlined />,
      navGroup: '工作空间',
      navGroupKey: 'routes.groups.workspace',
      navKey: 'generate',
      navOrder: 2,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/tickets',
    element: <AnalysisPage />,
    handle: {
      title: '我的工单',
      titleKey: 'routes.tickets.title',
      icon: <FileTextOutlined />,
      navGroup: '工作空间',
      navGroupKey: 'routes.groups.workspace',
      navKey: 'tickets',
      navOrder: 3,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/apps',
    element: <AnalysisPage />,
    handle: {
      title: '我的应用',
      titleKey: 'routes.apps.title',
      icon: <AppstoreOutlined />,
      navGroup: '业务管理',
      navGroupKey: 'routes.groups.business',
      navKey: 'apps',
      navOrder: 1,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/board',
    element: <AnalysisPage />,
    handle: {
      title: '我的看板',
      titleKey: 'routes.board.title',
      icon: <BarChartOutlined />,
      navGroup: '业务管理',
      navGroupKey: 'routes.groups.business',
      navKey: 'board',
      navOrder: 2,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/data',
    element: <AnalysisPage />,
    handle: {
      title: '应用数据',
      titleKey: 'routes.data.title',
      icon: <DatabaseOutlined />,
      navGroup: '业务管理',
      navGroupKey: 'routes.groups.business',
      navKey: 'data',
      navOrder: 3,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/settings',
    element: <AnalysisPage />,
    handle: {
      title: '设置',
      titleKey: 'routes.settings.title',
      icon: <SettingOutlined />,
      navGroup: '平台管理',
      navGroupKey: 'routes.groups.platform',
      navKey: 'settings',
      navOrder: 2,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/workspace',
    element: <WorkspacePage />,
    handle: {
      title: '工作台',
      titleKey: 'routes.workspace.title',
      icon: <DashboardOutlined />,
      navGroup: '工作空间',
      navGroupKey: 'routes.groups.workspace',
      navKey: 'dashboard',
      navOrder: 1,
    },
  },
  {
    path: '/workspace-overview',
    element: <WorkspacePage />,
    handle: {
      title: '工作空间',
      titleKey: 'routes.workspaceOverview.title',
      icon: <LaptopOutlined />,
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
  },
  {
    path: '/',
    element: <Navigate replace to="/usage" />,
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
