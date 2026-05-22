import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { Empty, theme } from 'antd'

import type { LineChartProps } from '../types'
import { DEFAULT_CHART_HEIGHT, getChartColors } from './chartUtils'

interface LineChartComponentProps {
  props: LineChartProps
}

export function LineChart({ props }: LineChartComponentProps) {
  const { token } = theme.useToken()

  if (props.data.length === 0 || props.series.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图表数据" />
    )
  }

  const option: EChartsOption = {
    color: getChartColors(token),
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: token.colorTextSecondary } },
    grid: { top: 48, right: 16, bottom: 20, left: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map((item) => String(item[props.xAxisKey] ?? '')),
      axisLabel: { color: token.colorTextSecondary },
      axisLine: { lineStyle: { color: token.colorBorder } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: token.colorTextSecondary },
      splitLine: { lineStyle: { color: token.colorBorderSecondary } },
    },
    series: props.series.map((item) => ({
      type: 'line',
      smooth: true,
      name: item.name ?? item.dataKey,
      data: props.data.map((row) => row[item.dataKey] ?? null),
    })),
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      className="min-w-0"
      style={{ height: props.height ?? DEFAULT_CHART_HEIGHT, width: '100%' }}
    />
  )
}
