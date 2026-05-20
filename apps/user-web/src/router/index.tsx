import { BrowserRouter, useRoutes, type RouteObject } from 'react-router'

import { AppLayout } from '@/layouts/AppLayout'
import { BareLayout } from '@/layouts/BareLayout'
import { AuthGuard } from './guards/AuthGuard'
import { RouteOutletBoundary } from './runtime/RouteBoundary'
import { appRoutes } from './routes'

const bareRoutes = appRoutes.filter((route) => route.handle?.layout === false)

const layoutRoutes = appRoutes.filter((route) => route.handle?.layout !== false)

function RouteViews() {
  return useRoutes([
    {
      element: <BareLayout />,
      children: [
        {
          element: <RouteOutletBoundary />,
          children: bareRoutes as RouteObject[],
        },
      ],
    },
    {
      element: (
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      ),
      children: [
        {
          element: <RouteOutletBoundary />,
          children: layoutRoutes as RouteObject[],
        },
      ],
    },
  ])
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <RouteViews />
    </BrowserRouter>
  )
}
