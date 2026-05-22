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
import { useQuery } from '@tanstack/react-query'

import {
  adminMetrics_getOverview,
  type AdminMetricsOverview,
  type OpsMetricsPeriod,
} from '@/api/adminMetrics'

import { AgentSummary } from './components/AgentSummary'
import { BillingSummary } from './components/BillingSummary'
import { FactoryOutputChart } from './components/FactoryOutputChart'
import { HotSkillsList } from './components/HotSkillsList'
import { LatencyChart } from './components/LatencyChart'
import { MetricCard } from './components/MetricCard'
import { periodOptions } from './constants'
import { useOpsMetricsStyles } from './styles'
import type { ChartTheme } from './types'
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
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
) {
  const latestP95 = getLatestP95(data?.llm_latency)
  const unit = data?.llm_latency.unit ?? 'ms'

  return [
    {
      hint: '周期内创建与流转的工单',
      icon: <ToolOutlined />,
      title: '工单总量',
      value: data ? formatNumber(data.factory_output.total_tasks) : '-',
    },
    {
      hint: 'COMPLETED / total_tasks',
      icon: <CheckCircleOutlined />,
      title: '工单成功率',
      value: data ? formatPercent(data.factory_output.success_rate) : '-',
      valueColor: 'var(--admin-success)',
    },
    {
      hint: '最新聚合点 P95',
      icon: <ClockCircleOutlined />,
      title: 'LLM P95 延迟',
      value: latestP95 ? `${formatNumber(latestP95)}${unit}` : '-',
    },
    {
      hint: 'Top Skill 调用汇总',
      icon: <ThunderboltOutlined />,
      title: 'Skill 调用量',
      value: data ? formatNumber(getSkillCallTotal(data.hot_skills)) : '-',
    },
    {
      hint: '计费汇总 this_month',
      icon: <DollarOutlined />,
      title: '本月消费',
      value: data ? formatCurrency(data.billing_summary.this_month) : '-',
      valueColor: 'var(--admin-warning)',
    },
  ].map((item) => ({ ...item, loading }))
}

export function OpsMetrics() {
  const { styles } = useOpsMetricsStyles()
  const chartTheme = useChartTheme()
  const [period, setPeriod] = useState<OpsMetricsPeriod>('week')

  const metricsQuery = useQuery({
    queryKey: ['adminMetricsOverview', period],
    queryFn: () => adminMetrics_getOverview(period),
    placeholderData: (previous) => previous,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })

  const data = metricsQuery.data
  const isInitialLoading = metricsQuery.isLoading
  const metricItems = buildMetrics(data, isInitialLoading)

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
                运营大盘
              </Typography.Title>
              <Tag
                className="rounded-md! border-0! bg-[color-mix(in_srgb,var(--admin-primary)_10%,transparent)]! px-2! text-(--admin-primary)!"
                icon={<ApiOutlined />}
              >
                {periodOptions.find((item) => item.value === period)?.label}
              </Tag>
            </div>
            <Typography.Text className="mt-1 block text-[12px]! text-(--muted)!">
              数据生成时间：{formatDateTime(data?.generated_at)}
            </Typography.Text>
          </div>
          <Space wrap>
            <Segmented
              options={periodOptions}
              value={period}
              onChange={(value) => setPeriod(value)}
            />
            <Tooltip title="刷新">
              <Button
                aria-label="刷新"
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
          message="运营大盘加载失败"
          description={getErrorMessage(metricsQuery.error)}
          action={
            <Button size="small" onClick={() => void metricsQuery.refetch()}>
              重试
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
              LLM 响应延迟
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
              工厂产出分布
            </Space>
          }
          extra={
            data ? (
              <Tag className="rounded-md!" color="green">
                成功率 {formatPercent(data.factory_output.success_rate)}
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
              热门 Skill
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
              计费汇总
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
              智能体汇总
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
