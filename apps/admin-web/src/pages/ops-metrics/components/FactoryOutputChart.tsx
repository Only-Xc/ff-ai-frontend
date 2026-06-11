import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'

import type { OpsMetricsFactoryOutput } from '@/api/ops-metrics'
import { useDict } from '@ff-ai-frontend/dictionaries'

import { statusColorMap, statusOrder } from '../constants'
import type { ChartTheme } from '../types'
import { numberUtils } from '@ff-ai-frontend/utils'
import { EmptyBlock } from './EmptyBlock'

interface FactoryOutputChartProps {
  chartTheme: ChartTheme
  output?: OpsMetricsFactoryOutput
}

export function FactoryOutputChart({
  chartTheme,
  output,
}: FactoryOutputChartProps) {
  const { t } = useTranslation()
  const statusDict = useDict('task_status')
  const chartData = useMemo(
    () =>
      statusOrder
        .map((status) => ({
          itemStyle: {
            color: statusColorMap[status],
          },
          name: statusDict.label(status),
          status,
          value: output?.by_status?.[status] ?? 0,
        }))
        .filter((item) => item.value > 0),
    [output?.by_status, statusDict],
  )

  const total = output?.total_tasks ?? 0
  const option = useMemo<EChartsOption>(
    () => ({
      series: [
        {
          avoidLabelOverlap: true,
          center: ['50%', '48%'],
          data: chartData,
          emphasis: {
            label: {
              show: true,
            },
          },
          label: {
            color: chartTheme.muted,
            formatter: '{b}',
            fontSize: 12,
          },
          radius: ['58%', '78%'],
          itemStyle: {
            borderColor: chartTheme.panel,
            borderRadius: 4,
            borderWidth: 2,
          },
          type: 'pie',
        },
      ],
      tooltip: {
        appendToBody: true,
        backgroundColor: chartTheme.panel,
        borderColor: chartTheme.border,
        formatter: '{b}: {c} ({d}%)',
        textStyle: {
          color: chartTheme.text,
        },
        trigger: 'item',
      },
    }),
    [
      chartData,
      chartTheme.border,
      chartTheme.muted,
      chartTheme.panel,
      chartTheme.text,
    ],
  )

  if (!chartData.length) {
    return (
      <EmptyBlock description={t('pages.opsMetrics.empty.factoryOutput')} />
    )
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_150px] items-center gap-3 max-[720px]:grid-cols-1">
      <div className="relative">
        <ReactECharts
          option={option}
          style={{ height: 248, width: '100%' }}
          notMerge
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[11px] text-(--muted)">
              {t('pages.opsMetrics.factory.totalTasks')}
            </div>
            <div className="text-[24px] font-[680] text-(--text-strong) tabular-nums">
              {numberUtils.formatNumber(total)}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {chartData.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[12px] transition-colors duration-160 hover:bg-(--control-bg)"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: statusColorMap[item.status] }}
              />
              <span className="truncate text-(--muted)">{item.name}</span>
            </span>
            <span className="font-semibold text-(--text-strong) tabular-nums">
              {numberUtils.formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
