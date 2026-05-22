import { type RefObject, useEffect, useRef, useState } from 'react'
import { useResizeObserver } from 'usehooks-ts'

export interface UseAntdTableScrollYOptions {
  fallbackHeaderHeight?: number
  minScrollY?: number
  overflowBuffer?: number
  refreshKey?: unknown
}

export function useAntdTableScrollY<T extends HTMLElement = HTMLDivElement>({
  fallbackHeaderHeight = 55,
  minScrollY = 160,
  overflowBuffer = 1,
  refreshKey,
}: UseAntdTableScrollYOptions = {}) {
  const containerRef = useRef<T>(null)
  const [scrollY, setScrollY] = useState<number>()
  const { height: containerHeight } = useResizeObserver<T>({
    ref: containerRef as RefObject<T>,
  })

  useEffect(() => {
    let animationFrame = 0

    animationFrame = window.requestAnimationFrame(() => {
      const container = containerRef.current

      if (!container || !containerHeight) {
        setScrollY(undefined)
        return
      }

      const header =
        container.querySelector<HTMLElement>('.ant-table-header') ??
        container.querySelector<HTMLElement>('.ant-table-thead')
      const body = container.querySelector<HTMLElement>('.ant-table-tbody')
      const headerHeight =
        header?.getBoundingClientRect().height ?? fallbackHeaderHeight
      const bodyHeight = body?.getBoundingClientRect().height ?? 0
      const nextScrollY = Math.max(
        minScrollY,
        Math.floor(containerHeight - headerHeight),
      )
      const nextValue =
        bodyHeight > nextScrollY + overflowBuffer ? nextScrollY : undefined

      setScrollY((prev) => (prev === nextValue ? prev : nextValue))
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [
    containerHeight,
    fallbackHeaderHeight,
    minScrollY,
    overflowBuffer,
    refreshKey,
  ])

  return {
    containerHeight,
    containerRef,
    scrollY,
  }
}
