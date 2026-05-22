import { isRecord } from '../runtime/normalizeProps'
import type { SchemaComponentValidateContext } from '../types'

export function validateGridLayoutProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (props.columns !== undefined && !isGridColumns(props.columns)) {
    context.addError(
      'props.columns',
      'columns 必须是 1 到 24 之间的数字',
      'columns',
    )
  }
  if (props.gutter !== undefined && !isGutter(props.gutter)) {
    context.addError(
      'props.gutter',
      'gutter 必须是数字或两个数字组成的数组',
      'gutter',
    )
  }
  if (
    props.span !== undefined &&
    (!Array.isArray(props.span) || !props.span.every(isPositiveNumber))
  ) {
    context.addError('props.span', 'span 必须是数字数组', 'span')
  }
}

export function validateHeaderProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.title !== 'string') {
    context.addError('props.title', 'title 必须是字符串', 'title')
  }
  if (
    props.description !== undefined &&
    typeof props.description !== 'string'
  ) {
    context.addError(
      'props.description',
      'description 必须是字符串',
      'description',
    )
  }
  if (props.level !== undefined && !isHeadingLevel(props.level)) {
    context.addError('props.level', 'level 必须是 1 到 5 之间的数字', 'level')
  }
}

export function validatePanelCardProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (props.title !== undefined && typeof props.title !== 'string') {
    context.addError('props.title', 'title 必须是字符串', 'title')
  }
  if (props.bordered !== undefined && typeof props.bordered !== 'boolean') {
    context.addError('props.bordered', 'bordered 必须是布尔值', 'bordered')
  }
  if (
    props.size !== undefined &&
    props.size !== 'default' &&
    props.size !== 'medium' &&
    props.size !== 'small'
  ) {
    context.addError(
      'props.size',
      'size 必须是 default、medium 或 small',
      'size',
    )
  }
}

export function validateMarkdownBlockProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.content !== 'string') {
    context.addError('props.content', 'content 必须是字符串', 'content')
  }
}

export function validateMetricStatisticProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.title !== 'string') {
    context.addError('props.title', 'title 必须是字符串', 'title')
  }
  if (typeof props.value !== 'string' && typeof props.value !== 'number') {
    context.addError('props.value', 'value 必须是字符串或数字', 'value')
  }
  if (props.precision !== undefined && !isFiniteNumber(props.precision)) {
    context.addError('props.precision', 'precision 必须是数字', 'precision')
  }
  if (
    props.status !== undefined &&
    props.status !== 'success' &&
    props.status !== 'warning' &&
    props.status !== 'error' &&
    props.status !== 'default'
  ) {
    context.addError('props.status', 'status 不在允许范围内', 'status')
  }
}

export function validateDataTableProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.columns) || !props.columns.every(isTableColumn)) {
    context.addError('props.columns', 'columns 必须是表格列配置数组', 'columns')
  }
  if (!Array.isArray(props.data) || !props.data.every(isRecord)) {
    context.addError('props.data', 'data 必须是对象数组', 'data')
  }
  if (props.pagination !== undefined && !isPagination(props.pagination)) {
    context.addError(
      'props.pagination',
      'pagination 必须是布尔值或分页配置对象',
      'pagination',
    )
  }
}

export function validateLineChartProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.data) || !props.data.every(isRecord)) {
    context.addError('props.data', 'data 必须是对象数组', 'data')
  }
  if (typeof props.xAxisKey !== 'string') {
    context.addError('props.xAxisKey', 'xAxisKey 必须是字符串', 'xAxisKey')
  }
  if (!Array.isArray(props.series) || !props.series.every(isLineSeries)) {
    context.addError('props.series', 'series 必须是折线配置数组', 'series')
  }
  if (props.height !== undefined && !isPositiveNumber(props.height)) {
    context.addError('props.height', 'height 必须是正数', 'height')
  }
}

export function validatePieChartProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.data) || !props.data.every(isPieDatum)) {
    context.addError('props.data', 'data 必须是 { name, value } 数组', 'data')
  }
  if (props.height !== undefined && !isPositiveNumber(props.height)) {
    context.addError('props.height', 'height 必须是正数', 'height')
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
}

function isGridColumns(value: unknown): value is number {
  return isPositiveNumber(value) && value <= 24
}

function isHeadingLevel(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function isGutter(value: unknown): value is number | [number, number] {
  return (
    isFiniteNumber(value) ||
    (Array.isArray(value) &&
      value.length === 2 &&
      value.every((item) => isFiniteNumber(item) && item >= 0))
  )
}

function isTableColumn(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.dataIndex === 'string' &&
    (value.width === undefined || isPositiveNumber(value.width))
  )
}

function isPagination(value: unknown): boolean {
  return (
    typeof value === 'boolean' ||
    (isRecord(value) &&
      (value.pageSize === undefined || isPositiveNumber(value.pageSize)))
  )
}

function isLineSeries(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.dataKey === 'string' &&
    (value.name === undefined || typeof value.name === 'string')
  )
}

function isPieDatum(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.value)
  )
}
