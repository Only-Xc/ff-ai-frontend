import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Col, Row, Select, Space, Statistic, Table, Tabs, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ReloadOutlined } from '@ant-design/icons'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  type GrcRiskDistributionItem,
  grcReports_complianceTrend,
  grcReports_exceptions,
  grcReports_riskDistribution,
  grcReports_reviewSla,
  grcReports_treatments,
} from '@/api/grc'
import { useAuthStore } from '@/store/useAuth'

export function GovernanceReports() {
  const { t } = useTranslation()
  const orgId = useAuthStore(state => state.organizationIds[0])
  const [days, setDays] = useState(30)

  const riskQuery = useQuery({
    queryKey: ['grc', 'reports', 'risk-distribution', days],
    queryFn: () => grcReports_riskDistribution(days, orgId),
  })

  const complianceQuery = useQuery({
    queryKey: ['grc', 'reports', 'compliance-trend', days],
    queryFn: () => grcReports_complianceTrend(days, orgId),
  })

  const slaQuery = useQuery({
    queryKey: ['grc', 'reports', 'review-sla', days],
    queryFn: () => grcReports_reviewSla(days, orgId),
  })

  const exceptionQuery = useQuery({
    queryKey: ['grc', 'reports', 'exceptions', days],
    queryFn: () => grcReports_exceptions(days, orgId),
  })

  const treatmentQuery = useQuery({
    queryKey: ['grc', 'reports', 'treatments', days],
    queryFn: () => grcReports_treatments(days, orgId),
  })

  const tabItems = [
    {
      key: 'risk',
      label: t('pages.grc.reports.riskDistribution'),
      children: (
        <Card>
          <Table
            size="small"
            dataSource={riskQuery.data ?? []}
            rowKey={(r) => `${r.date}-${r.risk_level}`}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', width: 150 },
              {
                title: 'Risk Level',
                dataIndex: 'risk_level',
                key: 'risk_level',
                render: (v: string) => {
                  const color =
                    v === 'CRITICAL' ? 'red' : v === 'HIGH' ? 'orange' : v === 'MEDIUM' ? 'blue' : 'green'
                  return <Tag color={color}>{v}</Tag>
                },
              },
              {
                title: 'Count',
                dataIndex: 'count',
                key: 'count',
                sorter: (a: GrcRiskDistributionItem, b: GrcRiskDistributionItem) => a.count - b.count,
              },
            ]}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'compliance',
      label: t('pages.grc.reports.complianceTrend'),
      children: (
        <Card>
          <Table
            size="small"
            dataSource={complianceQuery.data ?? []}
            rowKey={(r) => `${r.date}-${r.result}`}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', width: 150 },
              { title: 'Result', dataIndex: 'result', key: 'result' },
              { title: 'Count', dataIndex: 'count', key: 'count' },
            ]}
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'sla',
      label: t('pages.grc.reports.reviewSla'),
      children: (
        <Card>
          {slaQuery.data && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Total Decided" value={slaQuery.data.total_decided} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="On Time"
                    value={slaQuery.data.on_time_count}
                    valueStyle={{ color: '#389e0d' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="SLA Rate" value={slaQuery.data.sla_rate_percent} suffix="%" />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Avg Resolution (h)"
                    value={slaQuery.data.avg_resolution_hours ?? slaQuery.data.avg_resolution_seconds ?? undefined}
                  />
                </Col>
              </Row>
            </Space>
          )}
        </Card>
      ),
    },
    {
      key: 'exceptions',
      label: t('pages.grc.reports.exceptions'),
      children: (
        <Card>
          {exceptionQuery.data && (
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="Total" value={exceptionQuery.data.total} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Active"
                  value={exceptionQuery.data.active_count}
                  valueStyle={{ color: '#389e0d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title="Expired" value={exceptionQuery.data.expired_count} />
              </Col>
              <Col span={6}>
                <Statistic title="Rejected" value={exceptionQuery.data.rejected_count} />
              </Col>
            </Row>
          )}
        </Card>
      ),
    },
    {
      key: 'treatments',
      label: t('pages.grc.reports.treatments'),
      children: (
        <Card>
          {treatmentQuery.data && (
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="Total" value={treatmentQuery.data.total} />
              </Col>
              <Col span={6}>
                <Statistic title="Closure Rate" value={treatmentQuery.data.closure_rate} suffix="%" />
              </Col>
            </Row>
          )}
        </Card>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader title={t('routes.grc.reports.title')} subtitle={t('routes.grc.reports.subtitle')}>
        <Space>
          <Select
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            style={{ width: 120 }}
            options={[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              riskQuery.refetch()
              complianceQuery.refetch()
              slaQuery.refetch()
              exceptionQuery.refetch()
              treatmentQuery.refetch()
            }}
          >
            {t('pages.grc.common.refresh')}
          </Button>
        </Space>
      </PageHeader>
      <Tabs items={tabItems} />
    </PageContainer>
  )
}

export default GovernanceReports
