import { isValidElement, type CSSProperties, type ReactNode } from 'react'

import type { GridLayoutProps } from '../types'

interface GridLayoutComponentProps {
  props: GridLayoutProps
  children?: ReactNode
}

type CSSVariableStyle = CSSProperties & Record<`--${string}`, string>

export function GridLayout({ props, children }: GridLayoutComponentProps) {
  const columns = normalizeColumns(props.columns)
  const [rowGap, columnGap] = normalizeGutter(props.gutter)
  const spans = Array.isArray(props.span) ? props.span : []
  const childItems: ReactNode[] = Array.isArray(children)
    ? (children as ReactNode[])
    : children === undefined || children === null
      ? []
      : [children]
  const gridStyle: CSSVariableStyle = {
    '--schema-grid-columns': String(columns),
    '--schema-row-gap': `${rowGap}px`,
    '--schema-column-gap': `${columnGap}px`,
  }

  return (
    <div
      className="grid grid-cols-[repeat(var(--schema-grid-columns),minmax(0,1fr))] [row-gap:var(--schema-row-gap)] [column-gap:var(--schema-column-gap)]"
      style={gridStyle}
    >
      {childItems.map((child, index) => {
        const span = normalizeSpan(spans[index], columns)
        const itemStyle: CSSVariableStyle = {
          '--schema-grid-span': String(span),
        }

        return (
          <div
            key={getChildKey(child, index)}
            className="min-w-0 [grid-column:span_var(--schema-grid-span)/span_var(--schema-grid-span)] max-sm:col-span-full"
            style={itemStyle}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

function normalizeColumns(value: unknown): number {
  return typeof value === 'number' && value > 0 && value <= 24 ? value : 24
}

function normalizeGutter(value: unknown): [number, number] {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return [value, value]
  }

  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((item) => typeof item === 'number' && item >= 0)
  ) {
    const horizontal = Number(value[0])
    const vertical = Number(value[1])

    return [vertical, horizontal]
  }

  return [16, 16]
}

function normalizeSpan(value: unknown, columns: number): number {
  return typeof value === 'number' && value > 0 && value <= columns
    ? value
    : columns
}

function getChildKey(child: ReactNode, index: number): string {
  if (isValidElement(child) && child.key !== null) {
    return String(child.key)
  }

  return `schema-child-${index}`
}
