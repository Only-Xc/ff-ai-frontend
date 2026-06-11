import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { Empty, theme } from 'antd'
import { useTranslation } from 'react-i18next'

import type { PieChartProps } from '../types'
import { DEFAULT_CHART_HEIGHT, getChartColors } from './chartUtils'

interface PieChartComponentProps {
  props: PieChartProps
}

export function PieChart({ props }: PieChartComponentProps) {
  const { t } = useTranslation()
  const { token } = theme.useToken()

  if (props.data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('common.empty.chartData')}
      />
    )
  }

  const option: EChartsOption = {
    color: getChartColors(token, { includeError: true }),
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: token.colorTextSecondary },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        data: props.data,
      },
    ],
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
