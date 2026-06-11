import { i18n } from '@/i18n'

import { isRecord } from '../runtime/normalizeProps'
import type { SchemaComponentValidateContext } from '../types'

export function validateGridLayoutProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (props.columns !== undefined && !isGridColumns(props.columns)) {
    context.addError(
      'props.columns',
      i18n.t('pages.schema.errors.gridColumns'),
      'columns',
    )
  }
  if (props.gutter !== undefined && !isGutter(props.gutter)) {
    context.addError(
      'props.gutter',
      i18n.t('pages.schema.errors.gutter'),
      'gutter',
    )
  }
  if (
    props.span !== undefined &&
    (!Array.isArray(props.span) || !props.span.every(isPositiveNumber))
  ) {
    context.addError(
      'props.span',
      i18n.t('pages.schema.errors.span'),
      'span',
    )
  }
}

export function validateHeaderProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.title !== 'string') {
    context.addError(
      'props.title',
      i18n.t('pages.schema.errors.string', { field: 'title' }),
      'title',
    )
  }
  if (
    props.description !== undefined &&
    typeof props.description !== 'string'
  ) {
    context.addError(
      'props.description',
      i18n.t('pages.schema.errors.string', { field: 'description' }),
      'description',
    )
  }
  if (props.level !== undefined && !isHeadingLevel(props.level)) {
    context.addError(
      'props.level',
      i18n.t('pages.schema.errors.headingLevel'),
      'level',
    )
  }
}

export function validatePanelCardProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (props.title !== undefined && typeof props.title !== 'string') {
    context.addError(
      'props.title',
      i18n.t('pages.schema.errors.string', { field: 'title' }),
      'title',
    )
  }
  if (props.bordered !== undefined && typeof props.bordered !== 'boolean') {
    context.addError(
      'props.bordered',
      i18n.t('pages.schema.errors.boolean', { field: 'bordered' }),
      'bordered',
    )
  }
  if (
    props.size !== undefined &&
    props.size !== 'default' &&
    props.size !== 'medium' &&
    props.size !== 'small'
  ) {
    context.addError(
      'props.size',
      i18n.t('pages.schema.errors.panelSize'),
      'size',
    )
  }
}

export function validateMarkdownBlockProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.content !== 'string') {
    context.addError(
      'props.content',
      i18n.t('pages.schema.errors.string', { field: 'content' }),
      'content',
    )
  }
}

export function validateMetricStatisticProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (typeof props.title !== 'string') {
    context.addError(
      'props.title',
      i18n.t('pages.schema.errors.string', { field: 'title' }),
      'title',
    )
  }
  if (typeof props.value !== 'string' && typeof props.value !== 'number') {
    context.addError(
      'props.value',
      i18n.t('pages.schema.errors.value'),
      'value',
    )
  }
  if (props.precision !== undefined && !isFiniteNumber(props.precision)) {
    context.addError(
      'props.precision',
      i18n.t('pages.schema.errors.number', { field: 'precision' }),
      'precision',
    )
  }
  if (
    props.status !== undefined &&
    props.status !== 'success' &&
    props.status !== 'warning' &&
    props.status !== 'error' &&
    props.status !== 'default'
  ) {
    context.addError(
      'props.status',
      i18n.t('pages.schema.errors.metricStatus'),
      'status',
    )
  }
}

export function validateDataTableProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.columns) || !props.columns.every(isTableColumn)) {
    context.addError(
      'props.columns',
      i18n.t('pages.schema.errors.tableColumns'),
      'columns',
    )
  }
  if (!Array.isArray(props.data) || !props.data.every(isRecord)) {
    context.addError(
      'props.data',
      i18n.t('pages.schema.errors.objectArray', { field: 'data' }),
      'data',
    )
  }
  if (props.pagination !== undefined && !isPagination(props.pagination)) {
    context.addError(
      'props.pagination',
      i18n.t('pages.schema.errors.pagination'),
      'pagination',
    )
  }
}

export function validateLineChartProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.data) || !props.data.every(isRecord)) {
    context.addError(
      'props.data',
      i18n.t('pages.schema.errors.objectArray', { field: 'data' }),
      'data',
    )
  }
  if (typeof props.xAxisKey !== 'string') {
    context.addError(
      'props.xAxisKey',
      i18n.t('pages.schema.errors.string', { field: 'xAxisKey' }),
      'xAxisKey',
    )
  }
  if (!Array.isArray(props.series) || !props.series.every(isLineSeries)) {
    context.addError(
      'props.series',
      i18n.t('pages.schema.errors.lineSeries'),
      'series',
    )
  }
  if (props.height !== undefined && !isPositiveNumber(props.height)) {
    context.addError(
      'props.height',
      i18n.t('pages.schema.errors.positiveNumber', { field: 'height' }),
      'height',
    )
  }
}

export function validatePieChartProps(
  props: Record<string, unknown>,
  context: SchemaComponentValidateContext,
): void {
  if (!Array.isArray(props.data) || !props.data.every(isPieDatum)) {
    context.addError(
      'props.data',
      i18n.t('pages.schema.errors.pieData'),
      'data',
    )
  }
  if (props.height !== undefined && !isPositiveNumber(props.height)) {
    context.addError(
      'props.height',
      i18n.t('pages.schema.errors.positiveNumber', { field: 'height' }),
      'height',
    )
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
