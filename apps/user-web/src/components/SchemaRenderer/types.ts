import type { CSSProperties, ReactNode } from 'react'

export const REGISTERED_COMPONENT_NAMES = [
  'Header',
  'GridLayout',
  'PanelCard',
  'MarkdownBlock',
  'MetricStatistic',
  'DataTable',
  'LineChart',
  'PieChart',
] as const

export type RegisteredComponentName =
  (typeof REGISTERED_COMPONENT_NAMES)[number]

export interface PageSchema {
  schemaVersion: '1.0'
  page: {
    children: SchemaNode[]
  }
}

export interface SchemaNode {
  id: string
  component: string
  props?: Record<string, unknown>
  children?: SchemaNode[]
}

export type SchemaRenderErrorScope = 'schema' | 'node'

export interface SchemaRenderError {
  scope: SchemaRenderErrorScope
  code: string
  message: string
  path: string
  nodeId?: string
}

export interface SchemaValidationResult {
  errors: SchemaRenderError[]
  schema: PageSchema | null
}

export interface SchemaComponentValidateContext {
  nodeId?: string
  path: string
  addError: (code: string, message: string, propPath: string) => void
}

export interface SchemaComponentRenderContext<
  TProps = Record<string, unknown>,
> {
  node: SchemaNode
  props: TProps
  children?: ReactNode
}

export interface SchemaComponentDefinition<TProps = Record<string, unknown>> {
  name: string
  acceptsChildren: boolean
  render: (ctx: SchemaComponentRenderContext<TProps>) => ReactNode
  validateProps?: (
    props: Record<string, unknown>,
    context: SchemaComponentValidateContext,
  ) => void
}

export type RegistryItem<TProps = Record<string, unknown>> =
  SchemaComponentDefinition<TProps>

export interface SchemaRendererProps {
  schema?: PageSchema | null
  className?: string
  style?: CSSProperties
  onError?: (error: SchemaRenderError) => void
}

export interface GridLayoutProps {
  columns?: number
  gutter?: number | [number, number]
  span?: number[]
}

export interface HeaderProps {
  title: string
  description?: string
  level?: 1 | 2 | 3 | 4 | 5
}

export interface PanelCardProps {
  title?: string
  bordered?: boolean
  size?: 'default' | 'medium' | 'small'
}

export interface MarkdownBlockProps {
  content: string
}

export interface MetricStatisticProps {
  title: string
  value: string | number
  prefix?: string
  suffix?: string
  precision?: number
  status?: 'success' | 'warning' | 'error' | 'default'
}

export interface DataTableColumn {
  title: string
  dataIndex: string
  width?: number
}

export interface DataTableProps {
  columns: DataTableColumn[]
  data: Record<string, string | number | boolean | null>[]
  pagination?:
    | boolean
    | {
        pageSize?: number
      }
}

export interface LineChartSeries {
  dataKey: string
  name?: string
}

export interface LineChartProps {
  data: Record<string, string | number>[]
  xAxisKey: string
  series: LineChartSeries[]
  height?: number
}

export interface PieChartProps {
  data: {
    name: string
    value: number
  }[]
  height?: number
}
