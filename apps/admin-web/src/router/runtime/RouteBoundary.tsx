import { Button, Result } from 'antd'
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTimeout } from 'usehooks-ts'

import {
  getRouteChunkLoadingSnapshot,
  subscribeRouteChunkLoading,
} from './lazyLoad'

const ROUTE_FALLBACK_DELAY = 400
const ROUTE_CHUNK_ERROR_PATTERNS = [
  'ChunkLoadError',
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
]

interface RouteChunkErrorBoundaryProps {
  children: ReactNode
  resetKey: string
}

interface RouteChunkErrorBoundaryState {
  error: Error | null
}

interface RouteResolvedOutletProps {
  onResolved: () => void
}

function RouteChunkLoadingBar() {
  const [visible, setVisible] = useState(false)

  useTimeout(() => {
    setVisible(true)
  }, ROUTE_FALLBACK_DELAY)

  if (!visible) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-4"
      role="status"
    >
      <div className="flex items-center gap-2 rounded-full border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container)/90 px-3 py-2 shadow-[0_8px_24px_rgb(15_23_42/0.10)] backdrop-blur">
        <span className="relative size-4">
          <span className="absolute inset-0 rounded-full border border-(--ant-color-border-secondary)" />
          <span
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
            style={{
              borderRightColor: 'var(--primary)',
              borderTopColor: 'var(--primary)',
            }}
          />
        </span>
        <span className="text-xs font-medium text-(--muted)">页面加载中</span>
      </div>
    </div>
  )
}

function InitialRouteResolvedOutlet({ onResolved }: RouteResolvedOutletProps) {
  useEffect(() => {
    onResolved()
  }, [onResolved])

  return <Outlet />
}

function isRouteChunkLoadError(error: Error) {
  const errorText = `${error.name} ${error.message}`

  return ROUTE_CHUNK_ERROR_PATTERNS.some((pattern) =>
    errorText.includes(pattern),
  )
}

export function RouteOutletBoundary() {
  const location = useLocation()
  const [initialRouteResolved, setInitialRouteResolved] = useState(false)
  const routeChunkLoading = useSyncExternalStore(
    subscribeRouteChunkLoading,
    getRouteChunkLoadingSnapshot,
    getRouteChunkLoadingSnapshot,
  )
  const routeErrorResetKey = `${location.pathname}${location.search}${location.hash}`
  const handleRouteResolved = useCallback(() => {
    setInitialRouteResolved(true)
  }, [])

  return (
    <div className="relative h-full w-full">
      <RouteChunkErrorBoundary resetKey={routeErrorResetKey}>
        <Suspense fallback={null}>
          <InitialRouteResolvedOutlet onResolved={handleRouteResolved} />
        </Suspense>
      </RouteChunkErrorBoundary>
      {initialRouteResolved && routeChunkLoading ? (
        <RouteChunkLoadingBar />
      ) : null}
    </div>
  )
}

export class RouteChunkErrorBoundary extends Component<
  RouteChunkErrorBoundaryProps,
  RouteChunkErrorBoundaryState
> {
  state: RouteChunkErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): RouteChunkErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(prevProps: RouteChunkErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorLabel = isRouteChunkLoadError(error)
      ? 'Route chunk load failed'
      : 'Route render failed'

    console.error(errorLabel, error, errorInfo)
  }

  render() {
    if (this.state.error) {
      const isChunkLoadError = isRouteChunkLoadError(this.state.error)
      const title = isChunkLoadError ? '页面资源加载失败' : '页面渲染失败'
      const subTitle = isChunkLoadError
        ? '当前页面资源可能已更新，请刷新后重试。'
        : '当前页面渲染出现异常，请刷新后重试。'
      const buttonText = isChunkLoadError ? '刷新页面' : '刷新重试'

      return (
        <Result
          status="warning"
          title={title}
          subTitle={subTitle}
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              {buttonText}
            </Button>
          }
        />
      )
    }

    return this.props.children
  }
}
