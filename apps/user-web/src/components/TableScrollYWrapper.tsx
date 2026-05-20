import type { TableProps } from 'antd'
import { merge } from 'lodash-es'
import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react'

import {
  useAntdTableScrollY,
  type UseAntdTableScrollYOptions,
} from '@/hooks/useAntdTableScrollY'

type AntdTableScroll = TableProps<object>['scroll']
type AntdTableStyles = TableProps<object>['styles']

interface TableScrollYWrapperRenderArgs {
  scroll?: AntdTableScroll
  scrollY?: number
  styles?: AntdTableStyles
}

type TableScrollYWrapperChild =
  | ReactElement<{ scroll?: AntdTableScroll; styles?: AntdTableStyles }>
  | ((args: TableScrollYWrapperRenderArgs) => ReactNode)

interface TableScrollYWrapperProps extends UseAntdTableScrollYOptions {
  children: TableScrollYWrapperChild
  className?: string
  style?: CSSProperties
}

export function TableScrollYWrapper({
  children,
  className,
  style,
  ...options
}: TableScrollYWrapperProps) {
  const { containerHeight, containerRef, scrollY } =
    useAntdTableScrollY(options)
  const mergedScroll = useMemo(
    () => merge({}, { y: scrollY }) as AntdTableScroll,
    [scrollY],
  )
  const mergedStyles = useMemo(
    () =>
      merge({}, { content: { height: containerHeight } }) as AntdTableStyles,
    [containerHeight],
  )

  const content = useMemo(() => {
    if (typeof children === 'function') {
      return children({
        scroll: mergedScroll,
        scrollY,
        styles: mergedStyles,
      })
    }

    if (!isValidElement(children)) return children

    // Direct wrapper syntax needs to inject scroll into the child Table.
    // eslint-disable-next-line react-x/no-clone-element
    return cloneElement(children, {
      styles: merge({}, children.props.styles, mergedStyles),
      scroll: merge({}, children.props.scroll, { y: scrollY }),
    })
  }, [children, mergedScroll, mergedStyles, scrollY])

  return (
    <div className={className} ref={containerRef} style={style}>
      {content}
    </div>
  )
}
