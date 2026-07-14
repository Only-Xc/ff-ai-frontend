import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  App,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { DownloadOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  grcAuditChain_verify,
  grcAuditEvents_list,
  grcReports_complianceTrend,
  grcReports_exceptions,
  grcReports_reviewSla,
  grcReports_riskDistribution,
  grcReports_treatments,
  type GrcAuditEvent,
  type GrcRiskDistributionItem,
  type TreatmentStatus,
  type TreatmentType,
} from '@/api/grc'
import { adminUsers_list } from '@/api/rbac'
import { useAuthStore } from '@/store/useAuth'
import { requestClient } from '@/utils/request'

const RISK_LEVEL_COLORS: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'green',
}

const ALL_TREATMENT_TYPES: TreatmentType[] = ['mitigate', 'avoid', 'transfer', 'accept']
const ALL_TREATMENT_STATUSES: TreatmentStatus[] = ['open', 'in_progress', 'verified', 'closed', 'overdue']

const EVAL_RESULT_COLORS: Record<string, string> = {
  PASS: 'green',
  PASS_WITH_NOTICE: 'cyan',
  REVIEW_REQUIRED: 'blue',
  BLOCKED: 'red',
  ERROR: 'orange',
}

const REPORT_TYPES = [
  'risk-distribution',
  'compliance-trend',
  'review-sla',
  'exceptions',
  'treatments',
]

export function GovernanceReports() {
  const { t } = useTranslation()
  const { message, modal } = App.useApp()
  const orgId = useAuthStore((state) => state.organizationIds[0])
  const [days, setDays] = useState(30)

  const [exportOpen, setExportOpen] = useState(false)
  const [exportType, setExportType] = useState<string>('risk-distribution')
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv')
  const [auditPage, setAuditPage] = useState(1)
  const [auditPageSize, setAuditPageSize] = useState(20)

  const riskQuery = useQuery({
    queryKey: ['grc', 'reports', 'risk-distribution', days, orgId],
    queryFn: () => grcReports_riskDistribution(days, orgId ?? undefined),
  })

  const complianceQuery = useQuery({
    queryKey: ['grc', 'reports', 'compliance-trend', days, orgId],
    queryFn: () => grcReports_complianceTrend(days, orgId ?? undefined),
  })

  const slaQuery = useQuery({
    queryKey: ['grc', 'reports', 'review-sla', days, orgId],
    queryFn: () => grcReports_reviewSla(days, orgId ?? undefined),
  })

  const exceptionQuery = useQuery({
    queryKey: ['grc', 'reports', 'exceptions', days, orgId],
    queryFn: () => grcReports_exceptions(days, orgId ?? undefined),
  })

  const treatmentQuery = useQuery({
    queryKey: ['grc', 'reports', 'treatments', days, orgId],
    queryFn: () => grcReports_treatments(days, orgId ?? undefined),
  })

  const auditQuery = useQuery({
    queryKey: ['grc', 'audit', auditPage, auditPageSize, orgId],
    placeholderData: keepPreviousData,
    queryFn: () =>
      grcAuditEvents_list({
        organization_id: orgId ?? undefined,
        skip: (auditPage - 1) * auditPageSize,
        limit: auditPageSize,
      }),
  })

  // User directory (cached) so actor_id renders as a name/email
  const { data: usersResp } = useQuery({
    queryKey: ['rbac', 'users', 'grc-reports-lookup'],
    queryFn: () => adminUsers_list({ skip: 0, limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })
  const userMap = new Map((usersResp?.data ?? []).map((u) => [u.id, u]))
  const userLabel = (id?: string | null) => {
    if (!id) return '-'
    const u = userMap.get(id)
    if (!u) return id
    return u.full_name || u.email || id
  }

  const exportMutation = useMutation({
    mutationFn: async () => {
      const resp = await requestClient.post(
        '/api/v1/admin/grc/reports/exports',
        {
          report_type: exportType,
          format: exportFormat,
        },
        { responseType: 'blob' },
      )
      return resp as Blob
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `grc-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      message.success(t('pages.grc.reports.exportSuccess'))
      setExportOpen(false)
    },
    onError: (err: Error) => {
      message.error(err.message || t('pages.grc.reports.exportFailed'))
    },
  })

  const verifyChainMutation = useMutation({
    mutationFn: async () => {
      // If there are any events, verify [1 .. maxId]; otherwise use a nominal
      // range so the endpoint returns a valid empty-range response.
      const events = auditQuery.data?.data ?? []
      const maxId = events.length > 0 ? Math.max(...events.map((e) => e.id)) : 1
      return grcAuditChain_verify(1, Math.max(maxId, 1))
    },
    onSuccess: (res) => {
      if (res.chain_valid) {
        message.success(
          t('pages.grc.reports.chainValid', { count: res.events_in_range }),
        )
      } else {
        message.error(
          t('pages.grc.reports.chainBroken', { id: res.broken_at ?? '?' }),
        )
      }
    },
    onError: (err: Error) => message.error(err.message),
  })

  const refreshAll = () => {
    riskQuery.refetch()
    complianceQuery.refetch()
    slaQuery.refetch()
    exceptionQuery.refetch()
    treatmentQuery.refetch()
    auditQuery.refetch()
  }

  const riskLevelTag = (raw: string) => {
    const key = (raw || '').toLowerCase()
    const label = t(`pages.grc.riskLevel.${key}`, raw)
    return <Tag color={RISK_LEVEL_COLORS[key] ?? 'default'}>{label}</Tag>
  }

  const evalResultTag = (raw: string) => {
    const keyMap: Record<string, string> = {
      PASS: 'pages.grc.reports.evalPass',
      PASS_WITH_NOTICE: 'pages.grc.reports.evalPassNotice',
      REVIEW_REQUIRED: 'pages.grc.reports.evalReview',
      BLOCKED: 'pages.grc.reports.evalBlocked',
      ERROR: 'pages.grc.reports.evalError',
    }
    const label = t(keyMap[raw] ?? raw)
    return <Tag color={EVAL_RESULT_COLORS[raw] ?? 'default'}>{label}</Tag>
  }

  const tabItems = [
    {
      key: 'risk',
      label: t('pages.grc.reports.riskDistribution'),
      children: (
        <Card>
          <Table
            size="small"
            dataSource={riskQuery.data ?? []}
            loading={riskQuery.isFetching}
            rowKey={(r) => `${r.date}-${r.risk_level}`}
            columns={[
              {
                title: t('pages.grc.reports.date'),
                dataIndex: 'date',
                key: 'date',
                width: 150,
                render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
              },
              {
                title: t('pages.grc.reports.riskLevel'),
                dataIndex: 'risk_level',
                key: 'risk_level',
                render: (v: string) => riskLevelTag(v),
              },
              {
                title: t('pages.grc.reports.count'),
                dataIndex: 'count',
                key: 'count',
                sorter: (a: GrcRiskDistributionItem, b: GrcRiskDistributionItem) =>
                  a.count - b.count,
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
            loading={complianceQuery.isFetching}
            rowKey={(r) => `${r.date}-${r.result}`}
            columns={[
              {
                title: t('pages.grc.reports.date'),
                dataIndex: 'date',
                key: 'date',
                width: 150,
                render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
              },
              {
                title: t('pages.grc.reports.result'),
                dataIndex: 'result',
                key: 'result',
                render: (v: string) => evalResultTag(v),
              },
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
        <Card loading={slaQuery.isFetching}>
          {slaQuery.data && (
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.reports.totalDecided')}
                  value={slaQuery.data.total_decided}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.reports.onTime')}
                  value={slaQuery.data.on_time_count}
                  styles={{ content: { color: '#389e0d' } }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.reports.slaRate')}
                  value={slaQuery.data.sla_rate_percent}
                  suffix="%"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.reports.avgResolution')}
                  value={
                    slaQuery.data.avg_resolution_hours ??
                    slaQuery.data.avg_resolution_seconds ??
                    0
                  }
                />
              </Col>
            </Row>
          )}
        </Card>
      ),
    },
    {
      key: 'exceptions',
      label: t('pages.grc.reports.exceptions'),
      children: (
        <Card loading={exceptionQuery.isFetching}>
          {exceptionQuery.data && (
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.exceptions.statTotal')}
                  value={exceptionQuery.data.total}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.exceptions.statActive')}
                  value={exceptionQuery.data.active_count}
                  styles={{ content: { color: '#389e0d' } }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.exceptions.statExpired')}
                  value={exceptionQuery.data.expired_count}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={t('pages.grc.exceptions.statRejected')}
                  value={exceptionQuery.data.rejected_count}
                />
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
        <Card loading={treatmentQuery.isFetching}>
          {treatmentQuery.data && (
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title={t('pages.grc.treatments.statTotal')}
                    value={treatmentQuery.data.total}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t('pages.grc.reports.closureRate')}
                    value={treatmentQuery.data.closure_rate}
                    suffix="%"
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Table<{ type: TreatmentType; count: number }>
                    size="small"
                    dataSource={ALL_TREATMENT_TYPES.map((type) => ({
                      type,
                      count: (treatmentQuery.data.by_type as Record<string, number> | undefined)?.[type] ?? 0,
                    }))}
                    rowKey="type"
                    pagination={false}
                    showHeader={true}
                    columns={[
                      {
                        title: t('pages.grc.treatments.type'),
                        dataIndex: 'type',
                        key: 'type',
                        render: (v: string) =>
                          t(`pages.grc.treatments.${v}`, v),
                      },
                      {
                        title: t('pages.grc.reports.count'),
                        dataIndex: 'count',
                        key: 'count',
                      },
                    ]}
                  />
                </Col>
                <Col span={12}>
                  <Table<{ status: TreatmentStatus; count: number }>
                    size="small"
                    dataSource={ALL_TREATMENT_STATUSES.map((status) => ({
                      status,
                      count: (treatmentQuery.data.by_status as Record<string, number> | undefined)?.[status] ?? 0,
                    }))}
                    rowKey="status"
                    pagination={false}
                    showHeader={true}
                    columns={[
                      {
                        title: t('pages.grc.reports.status'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (v: string) =>
                          t(
                            `pages.grc.treatments.status${v
                              .replace(/_./g, (m) => m[1].toUpperCase())
                              .replace(/^./, (c) => c.toUpperCase())}`,
                            v,
                          ),
                      },
                      {
                        title: t('pages.grc.reports.count'),
                        dataIndex: 'count',
                        key: 'count',
                      },
                    ]}
                  />
                </Col>
              </Row>
            </Space>
          )}
        </Card>
      ),
    },
    {
      key: 'audit',
      label: t('pages.grc.reports.auditEvents'),
      children: (
        <Card
          extra={
            <Button
              icon={<SafetyOutlined />}
              onClick={() => verifyChainMutation.mutate()}
              loading={verifyChainMutation.isPending}
            >
              {t('pages.grc.reports.verifyChain')}
            </Button>
          }
        >
          <Table<GrcAuditEvent>
            size="small"
            dataSource={auditQuery.data?.data ?? []}
            loading={auditQuery.isFetching}
            rowKey="id"
            locale={{ emptyText: t('pages.grc.reports.auditNoData') }}
            columns={[
              { title: '#', dataIndex: 'id', key: 'id', width: 70 },
              {
                title: t('pages.grc.reports.auditEventType'),
                dataIndex: 'event_type',
                key: 'event_type',
                width: 180,
              },
              {
                title: t('pages.grc.reports.auditAggregateType'),
                dataIndex: 'aggregate_type',
                key: 'aggregate_type',
                width: 140,
              },
              {
                title: t('pages.grc.reports.auditAggregateId'),
                dataIndex: 'aggregate_id',
                key: 'aggregate_id',
                ellipsis: true,
              },
              {
                title: t('pages.grc.reports.auditActor'),
                dataIndex: 'actor_id',
                key: 'actor_id',
                render: (v: string) => userLabel(v),
                width: 180,
              },
              {
                title: t('pages.grc.reports.auditOutcome'),
                dataIndex: 'outcome',
                key: 'outcome',
                width: 100,
              },
              {
                title: t('pages.grc.reports.auditCreatedAt'),
                dataIndex: 'created_at',
                key: 'created_at',
                width: 170,
                render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
              },
            ]}
            pagination={{
              current: auditPage,
              pageSize: auditPageSize,
              total: auditQuery.data?.count ?? 0,
              showSizeChanger: true,
              showTotal: (total) =>
                t('pages.grc.common.totalItems', { count: total }),
              onChange: (p, s) => {
                setAuditPage(p)
                setAuditPageSize(s)
              },
            }}
          />
        </Card>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.reports.title')}
        subtitle={t('routes.grc.reports.subtitle')}
      >
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
            icon={<DownloadOutlined />}
            onClick={() => setExportOpen(true)}
          >
            {t('pages.grc.reports.export')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            {t('pages.grc.common.refresh')}
          </Button>
        </Space>
      </PageHeader>

      <Tabs items={tabItems} />

      <Modal
        open={exportOpen}
        title={t('pages.grc.reports.export')}
        onCancel={() => setExportOpen(false)}
        onOk={() => exportMutation.mutate()}
        confirmLoading={exportMutation.isPending}
        okText={t('pages.grc.common.submit')}
        cancelText={t('pages.grc.common.cancel')}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t('pages.grc.reports.riskDistribution')} /{' '}
              {t('pages.grc.reports.complianceTrend')} …
            </div>
            <Select
              style={{ width: '100%' }}
              value={exportType}
              onChange={setExportType}
              options={REPORT_TYPES.map((rt) => ({
                value: rt,
                label: t(
                  `pages.grc.reports.${
                    rt === 'risk-distribution'
                      ? 'riskDistribution'
                      : rt === 'compliance-trend'
                        ? 'complianceTrend'
                        : rt === 'review-sla'
                          ? 'reviewSla'
                          : rt
                  }`,
                  rt,
                ),
              }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              {t('pages.grc.reports.exportFormat')}
            </div>
            <Select
              style={{ width: '100%' }}
              value={exportFormat}
              onChange={(v) => setExportFormat(v as 'csv' | 'xlsx')}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'xlsx', label: 'XLSX' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </PageContainer>
  )
}

export default GovernanceReports
