import { ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useAuthStore } from '@/store/useAuth'
import { grcDashboard_get } from '@/api/grc'

const { Text } = Typography

const RISK_LEVEL_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
}

function formatReviewTime(seconds: number | null): string {
  if (seconds == null || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

const TABLE_COLUMNS = [
  {
    title: 'Rule Code',
    dataIndex: 'rule_code',
    key: 'rule_code',
    width: 140,
  },
  {
    title: 'Rule Name',
    dataIndex: 'rule_name',
    key: 'rule_name',
    ellipsis: true,
  },
  {
    title: 'Fail Count',
    dataIndex: 'fail_count',
    key: 'fail_count',
    width: 120,
    sorter: (a: { fail_count: number }, b: { fail_count: number }) => a.fail_count - b.fail_count,
    defaultSortOrder: 'descend' as const,
  },
]

export function GrcDashboard() {
  const { t } = useTranslation()
  const orgId = useAuthStore((state) => state.organizationIds[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grc', 'dashboard', 'overview'],
    queryFn: () => grcDashboard_get(30, orgId),
  })

  const overview = data

  const riskEntries = overview
    ? Object.entries(overview.risk_distribution).filter(([, v]) => v > 0)
    : []

  const passRate = overview
    ? overview.evaluations_total > 0
      ? ((overview.evaluations_passed / overview.evaluations_total) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  const blockRate = overview
    ? overview.evaluations_total > 0
      ? ((overview.evaluations_blocked / overview.evaluations_total) * 100).toFixed(1)
      : '0.0'
    : '0.0'

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.dashboard.title', 'GRC Dashboard')}
        subtitle={t('routes.grc.dashboard.subtitle', 'Governance, risk, and compliance overview')}
      >
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('pages.grc.common.refresh', 'Refresh')}
        </Button>
      </PageHeader>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Agents"
              value={overview?.total_agents ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Pass Rate"
              value={passRate}
              suffix="%"
              loading={isLoading}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Block Rate"
              value={blockRate}
              suffix="%"
              loading={isLoading}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Overdue Treatments"
              value={overview?.overdue_treatments ?? 0}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card size="small" title="Risk Distribution">
            {isLoading ? (
              <Statistic title="" value={0} />
            ) : riskEntries.length > 0 ? (
              <Row gutter={[8, 8]}>
                {riskEntries.map(([level, count]) => (
                  <Col key={level}>
                    <Tag color={RISK_LEVEL_COLORS[level] || 'default'}>
                      {level}: {count}
                    </Tag>
                  </Col>
                ))}
              </Row>
            ) : (
              <Text type="secondary">No risk data</Text>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card size="small" title="Reviews & Exceptions">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Statistic
                  title="Open Reviews"
                  value={overview?.reviews_open ?? 0}
                  loading={isLoading}
                  valueStyle={{ fontSize: 20 }}
                />
                {overview && overview.reviews_overdue > 0 && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {overview.reviews_overdue} overdue
                  </Text>
                )}
              </Col>
              <Col span={12}>
                <Statistic
                  title="Avg Review Time"
                  value={formatReviewTime(overview?.avg_review_seconds ?? null)}
                  loading={isLoading}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            </Row>
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Statistic
                  title="Active Exceptions"
                  value={overview?.active_exceptions ?? 0}
                  loading={isLoading}
                  valueStyle={{ fontSize: 20 }}
                />
                {overview && overview.expiring_soon_exceptions > 0 && (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    {overview.expiring_soon_exceptions} expiring soon
                  </Text>
                )}
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title="Top Failing Rules"
        style={{ marginTop: 16 }}
      >
        <Table
          rowKey="rule_code"
          columns={TABLE_COLUMNS}
          dataSource={overview?.top_failing_rules ?? []}
          loading={isLoading}
          pagination={false}
          size="small"
        />
      </Card>
    </PageContainer>
  )
}

export default GrcDashboard
