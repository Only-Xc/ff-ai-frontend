import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import type { OpsMetricsLatency, OpsMetricsPeriod } from '@/api/ops-metrics'

import type { ChartTheme } from '../types'
import { formatHourLabel } from '../utils'
import { EmptyBlock } from './EmptyBlock'

interface LatencyChartProps {
  latency?: OpsMetricsLatency
  period: OpsMetricsPeriod
  chartTheme: ChartTheme
}

export function LatencyChart({
  latency,
  period,
  chartTheme,
}: LatencyChartProps) {
  const data = useMemo(() => latency?.data ?? [], [latency?.data])
  const unit = latency?.unit ?? 'ms'

  const option = useMemo<EChartsOption>(
    () => ({
      color: [chartTheme.success, chartTheme.primary, chartTheme.danger],
      grid: {
        bottom: 22,
        containLabel: true,
        left: 8,
        right: 12,
        top: 34,
      },
      legend: {
        itemHeight: 8,
        itemWidth: 16,
        right: 0,
        textStyle: {
          color: chartTheme.muted,
          fontSize: 12,
        },
        top: 0,
      },
      series: [
        {
          data: data.map((item) => item.p50),
          name: 'P50',
          showSymbol: false,
          smooth: true,
          lineStyle: {
            width: 2,
          },
          type: 'line',
        },
        {
          data: data.map((item) => item.p95),
          name: 'P95',
          showSymbol: false,
          smooth: true,
          lineStyle: {
            width: 2.5,
          },
          type: 'line',
        },
        {
          data: data.map((item) => item.p99),
          name: 'P99',
          showSymbol: false,
          smooth: true,
          lineStyle: {
            type: 'dashed',
            width: 2,
          },
          type: 'line',
        },
      ],
      tooltip: {
        appendToBody: true,
        backgroundColor: chartTheme.panel,
        borderColor: chartTheme.border,
        textStyle: {
          color: chartTheme.text,
        },
        trigger: 'axis',
        valueFormatter: (value) => {
          const formattedValue = Array.isArray(value)
            ? value.join(', ')
            : value == null
            ? ''
            : String(value)
          return `${formattedValue}${unit}`
        },
      },
      xAxis: {
        axisLabel: {
          color: chartTheme.axis,
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: chartTheme.grid,
          },
        },
        axisTick: {
          show: false,
        },
        data: data.map((item) => formatHourLabel(item.hour, period)),
        type: 'category',
      },
      yAxis: {
        axisLabel: {
          color: chartTheme.axis,
          fontSize: 11,
          formatter: `{value}${unit}`,
        },
        splitLine: {
          lineStyle: {
            color: chartTheme.grid,
            opacity: 0.75,
          },
        },
        type: 'value',
      },
    }),
    [
      chartTheme.axis,
      chartTheme.border,
      chartTheme.danger,
      chartTheme.grid,
      chartTheme.muted,
      chartTheme.panel,
      chartTheme.primary,
      chartTheme.success,
      chartTheme.text,
      data,
      period,
      unit,
    ],
  )

  if (!data.length) {
    return <EmptyBlock description="暂无延迟数据" />
  }

  return (
    <ReactECharts
      option={option}
      style={{ height: 292, width: '100%' }}
      notMerge
    />
  )
}
