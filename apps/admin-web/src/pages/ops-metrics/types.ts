import type { ReactNode } from 'react'

export interface ChartTheme {
  axis: string
  border: string
  danger: string
  grid: string
  muted: string
  panel: string
  primary: string
  success: string
  text: string
  warning: string
}

export interface MetricCardProps {
  icon: ReactNode
  loading: boolean
  title: string
  value: ReactNode
  hint: string
  valueColor?: string
}
