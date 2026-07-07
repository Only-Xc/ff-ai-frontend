import { createBrowserRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { AppLayout } from '@/layouts/AppLayout'
import { BareLayout } from '@/layouts/BareLayout'
import { authMiddleware } from './middleware/auth'
import { RouteOutletBoundary } from './runtime/RouteBoundary'
import { appRoutes } from './routes'

const publicBareRoutes = appRoutes.filter(
  (route) => route.handle?.layout === false && route.path === '/login',
)

const standaloneProtectedRoutes = appRoutes.filter(
  (route) => route.handle?.standalone === true,
)

const protectedBareRoutes = appRoutes.filter(
  (route) =>
    route.handle?.layout === false &&
    route.handle?.standalone !== true &&
    route.path !== '/login',
)

const layoutRoutes = appRoutes.filter(
  (route) =>
    route.handle?.layout !== false && route.handle?.standalone !== true,
)

const router = createBrowserRouter([
  {
    element: <BareLayout />,
    children: [
      {
        element: <RouteOutletBoundary />,
        children: publicBareRoutes as RouteObject[],
      },
    ],
  },
  {
    element: <BareLayout />,
    middleware: [authMiddleware],
    children: [
      {
        element: <RouteOutletBoundary />,
        children: protectedBareRoutes as RouteObject[],
      },
    ],
  },
  {
    middleware: [authMiddleware],
    children: [
      {
        element: <RouteOutletBoundary />,
        children: standaloneProtectedRoutes as RouteObject[],
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
