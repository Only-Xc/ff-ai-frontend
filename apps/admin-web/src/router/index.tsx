import { createBrowserRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { AppLayout } from '@/layouts/AppLayout'
import { BareLayout } from '@/layouts/BareLayout'
import { authMiddleware } from './middleware/auth'
import { RouteOutletBoundary } from './runtime/RouteBoundary'
import { appRoutes } from './routes'

const bareRoutes = appRoutes.filter((route) => route.handle?.layout === false)

const layoutRoutes = appRoutes.filter((route) => route.handle?.layout !== false)

const router = createBrowserRouter([
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
    element: <AppLayout />,
    middleware: [authMiddleware],
    children: [
      {
        element: <RouteOutletBoundary />,
        children: layoutRoutes as RouteObject[],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
