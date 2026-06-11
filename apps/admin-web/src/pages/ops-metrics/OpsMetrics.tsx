import {
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  FireOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Segmented,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'

import {
  adminMetricsKeys,
  adminMetrics_getOverview,
  type AdminMetricsOverview,
  type AdminMetricsOverviewQuery,
  type OpsMetricsPeriod,
} from '@/api/ops-metrics'
import { useDict } from '@ff-ai-frontend/dictionaries'

import { AgentSummary } from './components/AgentSummary'
import { BillingSummary } from './components/BillingSummary'
import { FactoryOutputChart } from './components/FactoryOutputChart'
import { HotSkillsList } from './components/HotSkillsList'
import { LatencyChart } from './components/LatencyChart'
import { MetricCard } from './components/MetricCard'
import { useOpsMetricsStyles } from './styles'
import type { ChartTheme } from './types'
import { numberUtils } from '@ff-ai-frontend/utils'
import {
  formatDateTime,
  getCssVariable,
  getErrorMessage,
  getLatestP95,
  getSkillCallTotal,
} from './utils'

function useChartTheme(): ChartTheme {
  const { token } = theme.useToken()

  return useMemo(
    () => ({
      axis: token.colorTextTertiary,
      border: token.colorBorderSecondary,
      danger: getCssVariable('--admin-danger', '#dc2626'),
      grid: token.colorBorderSecondary,
      muted: token.colorTextSecondary,
      panel: token.colorBgElevated,
      primary: token.colorPrimary,
      success: getCssVariable('--admin-success', '#0f9f8f'),
      text: token.colorText,
      warning: getCssVariable('--admin-warning', '#d97706'),
    }),
    [
      token.colorBgElevated,
      token.colorBorderSecondary,
      token.colorPrimary,
      token.colorText,
      token.colorTextSecondary,
      token.colorTextTertiary,
    ],
  )
}

function buildMetrics(
  data: AdminMetricsOverview | undefined,
  loading: boolean,
  t: TFunction,
) {
  const latestP95 = getLatestP95(data?.llm_latency)
  const unit = data?.llm_latency.unit ?? 'ms'

  return [
    {
      hint: t('pages.opsMetrics.metrics.totalTasks.hint'),
      icon: <ToolOutlined />,
      title: t('pages.opsMetrics.metrics.totalTasks.title'),
      value: data
        ? numberUtils.formatNumber(data.factory_output.total_tasks)
        : '-',
    },
    {
      hint: 'COMPLETED / total_tasks',
      icon: <CheckCircleOutlined />,
      title: t('pages.opsMetrics.metrics.successRate.title'),
      value: data
        ? numberUtils.formatPercent(data.factory_output.success_rate)
        : '-',
      valueColor: 'var(--admin-success)',
    },
    {
      hint: t('pages.opsMetrics.metrics.llmP95.hint'),
      icon: <ClockCircleOutlined />,
      title: t('pages.opsMetrics.metrics.llmP95.title'),
      value: latestP95
        ? numberUtils.formatNumber(latestP95, {
            suffix: unit,
          })
        : '-',
    },
    {
      hint: t('pages.opsMetrics.metrics.skillCalls.hint'),
      icon: <ThunderboltOutlined />,
      title: t('pages.opsMetrics.metrics.skillCalls.title'),
      value: data
        ? numberUtils.formatNumber(getSkillCallTotal(data.hot_skills))
        : '-',
    },
    {
      hint: t('pages.opsMetrics.metrics.monthlySpend.hint'),
      icon: <DollarOutlined />,
      title: t('pages.opsMetrics.metrics.monthlySpend.title'),
      value: data
        ? numberUtils.formatCurrency(data.billing_summary.this_month)
        : '-',
      valueColor: 'var(--admin-warning)',
    },
  ].map((item) => ({ ...item, loading }))
}

export function OpsMetrics() {
  const { t } = useTranslation()
  const { styles } = useOpsMetricsStyles()
  const chartTheme = useChartTheme()
  const periodDict = useDict('ops_metrics_period')
  const [period, setPeriod] = useState<OpsMetricsPeriod>('week')
  const listParams = useMemo<AdminMetricsOverviewQuery>(
    () => ({ period }),
    [period],
  )

  const metricsQuery = useQuery({
    queryKey: adminMetricsKeys.overview(listParams),
    queryFn: () => adminMetrics_getOverview(listParams),
    placeholderData: keepPreviousData,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })

  const data = metricsQuery.data
  const isInitialLoading = metricsQuery.isLoading
  const metricItems = buildMetrics(data, isInitialLoading, t)

  return (
    <div
      className={`${styles.page} flex min-h-[calc(100vh-var(--ant-layout-header-height)-10px)] w-full flex-col gap-3 pb-4`}
    >
      <header className="rounded-xl border border-(--ops-border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel)_96%,white_4%),color-mix(in_srgb,var(--panel)_88%,transparent))] px-4 py-3 shadow-(--ops-shadow) backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Title
                level={3}
                className="m-0! text-[22px]! font-[720]! tracking-normal!"
              >
                {t('pages.opsMetrics.title')}
              </Typography.Title>
              <Tag
                className="rounded-md! border-0! bg-[color-mix(in_srgb,var(--admin-primary)_10%,transparent)]! px-2! text-(--admin-primary)!"
                icon={<ApiOutlined />}
              >
                {periodDict.label(period)}
              </Tag>
            </div>
            <Typography.Text className="mt-1 block text-[12px]! text-(--muted)!">
              {t('pages.opsMetrics.generatedAt', {
                time: formatDateTime(data?.generated_at),
              })}
            </Typography.Text>
          </div>
          <Space wrap>
            <Segmented
              options={periodDict.options}
              value={period}
              onChange={(value) => setPeriod(value as OpsMetricsPeriod)}
            />
            <Tooltip title={t('common.actions.refresh')}>
              <Button
                aria-label={t('common.actions.refresh')}
                icon={<ReloadOutlined />}
                loading={metricsQuery.isFetching && !isInitialLoading}
                onClick={() => void metricsQuery.refetch()}
                className="cursor-pointer"
              />
            </Tooltip>
          </Space>
        </div>
      </header>

      {metricsQuery.isError ? (
        <Alert
          showIcon
          type="error"
          message={t('pages.opsMetrics.loadFailed')}
          description={getErrorMessage(metricsQuery.error, t)}
          action={
            <Button size="small" onClick={() => void metricsQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
        />
      ) : null}

      <div className="grid grid-cols-5 gap-2.5 max-[1280px]:grid-cols-3 max-[860px]:grid-cols-2 max-[520px]:grid-cols-1">
        {metricItems.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Card
          className={`col-span-8 rounded-xl! max-[1180px]:col-span-12 ${styles.chartCard}`}
          title={
            <Space>
              <FieldTimeOutlined />
              {t('pages.opsMetrics.sections.latency')}
            </Space>
          }
        >
          <Skeleton
            active
            loading={isInitialLoading}
            paragraph={{ rows: 8 }}
            title={false}
          >
            <LatencyChart
              chartTheme={chartTheme}
              latency={data?.llm_latency}
              period={period}
            />
          </Skeleton>
        </Card>

        <Card
          className={`col-span-4 rounded-xl! max-[1180px]:col-span-12 ${styles.chartCard}`}
          title={
            <Space>
              <FireOutlined />
              {t('pages.opsMetrics.sections.factoryOutput')}
            </Space>
          }
          extra={
            data ? (
              <Tag className="rounded-md!" color="green">
                {t('pages.opsMetrics.successRateWithValue', {
                  value: numberUtils.formatPercent(
                    data.factory_output.success_rate,
                  ),
                })}
              </Tag>
            ) : null
          }
        >
          <Skeleton
            active
            loading={isInitialLoading}
            paragraph={{ rows: 8 }}
            title={false}
          >
            <FactoryOutputChart
              chartTheme={chartTheme}
              output={data?.factory_output}
            />
          </Skeleton>
        </Card>

        <Card
          className="col-span-6 rounded-xl! max-[1180px]:col-span-12"
          title={
            <Space>
              <ThunderboltOutlined />
              {t('pages.opsMetrics.sections.hotSkills')}
            </Space>
          }
          extra={
            <Typography.Text className="text-(--muted)!">
              Top 10
            </Typography.Text>
          }
        >
          <HotSkillsList loading={isInitialLoading} skills={data?.hot_skills} />
        </Card>

        <Card
          className="col-span-3 rounded-xl! max-[1180px]:col-span-6 max-[720px]:col-span-12"
          title={
            <Space>
              <DollarOutlined />
              {t('pages.opsMetrics.sections.billing')}
            </Space>
          }
        >
          <BillingSummary
            loading={isInitialLoading}
            summary={data?.billing_summary}
          />
        </Card>

        <Card
          className="col-span-3 rounded-xl! max-[1180px]:col-span-6 max-[720px]:col-span-12"
          title={
            <Space>
              <CloudServerOutlined />
              {t('pages.opsMetrics.sections.agents')}
            </Space>
          }
        >
          <AgentSummary
            loading={isInitialLoading}
            summary={data?.agent_summary}
          />
        </Card>
      </div>
    </div>
  )
}

export default OpsMetrics
