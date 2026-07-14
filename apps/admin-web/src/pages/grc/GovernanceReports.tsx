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
              { title: t('pages.grc.reports.date'), dataIndex: 'date', key: 'date', width: 150 },
              {
                title: t('pages.grc.reports.riskLevel'),
                dataIndex: 'risk_level',
                key: 'risk_level',
                render: (v: string) => {
                  const color =
                    v === 'CRITICAL' ? 'red' : v === 'HIGH' ? 'orange' : v === 'MEDIUM' ? 'blue' : 'green'
                  return <Tag color={color}>{v}</Tag>
                },
              },
              {
                title: t('pages.grc.reports.count'),
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
              { title: t('pages.grc.reports.date'), dataIndex: 'date', key: 'date', width: 150 },
              { title: t('pages.grc.reports.result'), dataIndex: 'result', key: 'result' },
              { title: t('pages.grc.reports.count'), dataIndex: 'count', key: 'count' },
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
                  <Statistic title={t("pages.grc.reports.totalDecided")} value={slaQuery.data.total_decided} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t("pages.grc.reports.onTime")}
                    value={slaQuery.data.on_time_count}
                    valueStyle={{ color: '#389e0d' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title={t("pages.grc.reports.slaRate")} value={slaQuery.data.sla_rate_percent} suffix="%" />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t("pages.grc.reports.avgResolution")}
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
                <Statistic title={t("pages.grc.reports.statTotal")} value={exceptionQuery.data.total} />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t("pages.grc.reports.statActive")}
                  value={exceptionQuery.data.active_count}
                  valueStyle={{ color: '#389e0d' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title={t("pages.grc.reports.statExpired")} value={exceptionQuery.data.expired_count} />
              </Col>
              <Col span={6}>
                <Statistic title={t("pages.grc.reports.statRejected")} value={exceptionQuery.data.rejected_count} />
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
                <Statistic title={t("pages.grc.reports.statTotal")} value={treatmentQuery.data.total} />
              </Col>
              <Col span={6}>
                <Statistic title={t("pages.grc.reports.closureRate")} value={treatmentQuery.data.closure_rate} suffix="%" />
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
              { value: '7', label: t('pages.grc.reports.days7') },
              { value: '30', label: t('pages.grc.reports.days30') },
              { value: '90', label: t('pages.grc.reports.days90') },
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
