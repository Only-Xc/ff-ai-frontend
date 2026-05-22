import { createElement, type ComponentType, type ReactNode } from 'react'

import { DataTable } from '../components/DataTable'
import { GridLayout } from '../components/GridLayout'
import { Header } from '../components/Header'
import { LineChart } from '../components/LineChart'
import { MarkdownBlock } from '../components/MarkdownBlock'
import { MetricStatistic } from '../components/MetricStatistic'
import { PanelCard } from '../components/PanelCard'
import { PieChart } from '../components/PieChart'
import {
  validateDataTableProps,
  validateGridLayoutProps,
  validateHeaderProps,
  validateLineChartProps,
  validateMarkdownBlockProps,
  validateMetricStatisticProps,
  validatePanelCardProps,
  validatePieChartProps,
} from './componentValidators'
import type {
  DataTableProps,
  HeaderProps,
  LineChartProps,
  MarkdownBlockProps,
  MetricStatisticProps,
  PieChartProps,
  RegisteredComponentName,
  SchemaComponentDefinition,
} from '../types'

interface SchemaComponentProps<TProps> {
  props: TProps
  children?: ReactNode
}

type SchemaComponent<TProps> = ComponentType<SchemaComponentProps<TProps>>

function defineComponent<TProps>(
  name: RegisteredComponentName,
  acceptsChildren: boolean,
  Component: SchemaComponent<TProps>,
  validateProps: SchemaComponentDefinition<TProps>['validateProps'],
): SchemaComponentDefinition {
  return {
    name,
    acceptsChildren,
    validateProps,
    render: ({ props, children }) =>
      createElement(Component, {
        props: props as TProps,
        children: acceptsChildren ? children : undefined,
      }),
  }
}

export const builtinComponents: SchemaComponentDefinition[] = [
  defineComponent<HeaderProps>('Header', false, Header, validateHeaderProps),
  defineComponent('GridLayout', true, GridLayout, validateGridLayoutProps),
  defineComponent('PanelCard', true, PanelCard, validatePanelCardProps),
  defineComponent<MarkdownBlockProps>(
    'MarkdownBlock',
    false,
    MarkdownBlock,
    validateMarkdownBlockProps,
  ),
  defineComponent<MetricStatisticProps>(
    'MetricStatistic',
    false,
    MetricStatistic,
    validateMetricStatisticProps,
  ),
  defineComponent<DataTableProps>(
    'DataTable',
    false,
    DataTable,
    validateDataTableProps,
  ),
  defineComponent<LineChartProps>(
    'LineChart',
    false,
    LineChart,
    validateLineChartProps,
  ),
  defineComponent<PieChartProps>(
    'PieChart',
    false,
    PieChart,
    validatePieChartProps,
  ),
]
