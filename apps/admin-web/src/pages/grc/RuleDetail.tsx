import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router'
import { Descriptions, Space, Statistic, Table, Tag, Typography, Button, Alert, Tabs, Spin } from 'antd'
import dayjs from 'dayjs'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  grcRule_get,
  grcRuleVersions_list,
  grcRuleStats_get,
  type GrcRuleVersion,
  type GrcRuleStatsResponse,
} from '@/api/grc'
import { usePermission } from '@/hooks/usePermission'
import { RuleTestPanel } from './RuleTestPanel'

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  published: 'green',
  retired: 'red',
}

const RESULT_COLORS: Record<string, string> = {
  pass: 'green',
  fail: 'red',
  error: 'orange',
  review_required: 'blue',
  warning: 'gold',
}

const formatJson = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export function RuleDetail() {
  const { t } = useTranslation()
  const { ruleId } = useParams<{ ruleId: string }>()
  const { hasPermission } = usePermission()
  const qc = useQueryClient()

  const { data: rule, isLoading: ruleLoading } = useQuery({
    queryKey: ['grc', 'rule', ruleId!],
    queryFn: () => grcRule_get(ruleId!),
    enabled: !!ruleId,
  })

  const { data: versionsData } = useQuery({
    queryKey: ['grc', 'ruleVersions', ruleId!],
    queryFn: () => grcRuleVersions_list(ruleId!),
    enabled: !!ruleId,
  })

  const { data: stats } = useQuery({
    queryKey: ['grc', 'ruleStats', ruleId!],
    queryFn: () => grcRuleStats_get(ruleId!),
    enabled: !!ruleId,
  })

  const versions: GrcRuleVersion[] = versionsData?.data ?? []
  const statsData: GrcRuleStatsResponse | undefined = stats as GrcRuleStatsResponse | undefined

  if (ruleLoading || !rule) {
    return (
      <PageContainer>
        <Spin />
      </PageContainer>
    )
  }

  const latestVer = versions[0]

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['grc', 'rule', ruleId!] })
    qc.invalidateQueries({ queryKey: ['grc', 'ruleVersions', ruleId!] })
    qc.invalidateQueries({ queryKey: ['grc', 'ruleStats', ruleId!] })
  }

  return (
    <PageContainer>
      <PageHeader
        title={rule.code}
        subtitle={rule.name}
        breadcrumb={{
          items: [
            { title: <Link to="/grc/rules">{t('pages.grc.rules.title')}</Link> },
            { title: rule.code },
          ],
        }}
      >
        <Space>
          <Button onClick={handleRefresh}>
            {t('pages.grc.common.refresh')}
          </Button>
          {hasPermission('admin.grc.rules.update') && (
            <Button type="primary">{t('pages.grc.rules.edit')}</Button>
          )}
          {hasPermission('admin.grc.rules.create') && latestVer?.status !== 'published' && (
            <Button onClick={() => {}}>{t('pages.grc.rules.createVersion')}</Button>
          )}
          {hasPermission('admin.grc.rules.publish') && latestVer?.status === 'draft' && (
            <Button type="primary">{t('pages.grc.rules.publish')}</Button>
          )}
          {hasPermission('admin.grc.rules.publish') && latestVer?.status === 'published' && (
            <Button danger>{t('pages.grc.rules.retire')}</Button>
          )}
        </Space>
      </PageHeader>
      {/* Info badges */}
      <Space style={{ marginBottom: 16 }} size="middle">
        <Tag color={rule.is_active ? 'green' : 'red'}>
          {rule.is_active ? t('pages.grc.rules.enabled') : t('pages.grc.rules.disabled')}
        </Tag>
        {latestVer && (
          <Tag color={STATUS_COLORS[latestVer.status] ?? 'default'}>
            v{latestVer.version} · {latestVer.status}
          </Tag>
        )}
        <Tag>{rule.category}</Tag>
      </Space>

      {/* KPI Cards */}
      <Space size="middle" style={{ marginBottom: 24 }} wrap>
        <Statistic title={t('pages.grc.rules.evaluatorType')} value={latestVer?.evaluator_type ?? '-'} />
        <Statistic title={t('pages.grc.rules.severity')} value={latestVer?.severity ?? '-'} />
        <Statistic title={t('pages.grc.rules.blockOnFail')} value={latestVer?.block_on_fail ? 'Yes' : 'No'} />
        <Statistic title={t('pages.grc.rules.exceptionAllowed')} value={latestVer?.exception_allowed ? 'Yes' : 'No'} />
      </Space>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: t('pages.grc.rules.evaluatorConfig'),
            children: (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={t('pages.grc.rules.evaluatorType')}>
                  {latestVer?.evaluator_type ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('pages.grc.rules.evaluatorConfig')}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatJson(latestVer?.evaluator_config)}</pre>
                </Descriptions.Item>
                <Descriptions.Item label={t('pages.grc.rules.applicableScope')}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatJson(latestVer?.applicable_scope)}</pre>
                </Descriptions.Item>
                <Descriptions.Item label={t('pages.grc.rules.evidenceRequirements')}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatJson(latestVer?.evidence_requirements)}</pre>
                </Descriptions.Item>
                {latestVer?.remediation_template && (
                  <Descriptions.Item label={t('pages.grc.rules.remediationTemplate')}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{latestVer.remediation_template}</pre>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ),
          },
          {
            key: 'versions',
            label: t('pages.grc.rules.versionHistory', 'Version History'),
            children: versions.length === 0 ? (
              <Alert message={t('pages.grc.rules.noVersions')} type="info" />
            ) : (
              <Table
                dataSource={versions}
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: (v: GrcRuleVersion) => (
                    <Descriptions bordered column={1} size="small" style={{ margin: 8 }}>
                      <Descriptions.Item label={t('pages.grc.rules.evaluatorConfig')}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatJson(v.evaluator_config)}</pre>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('pages.grc.rules.applicableScope')}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatJson(v.applicable_scope)}</pre>
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                }}
                columns={[
                  { title: 'Version', dataIndex: 'version', key: 'version', width: 80 },
                  { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: s => <Tag color={STATUS_COLORS[s] ?? 'default'}>{s}</Tag> },
                  { title: 'Evaluator', dataIndex: 'evaluator_type', key: 'evaluator_type', width: 120 },
                  { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 80 },
                  { title: 'Risk Score', dataIndex: 'risk_score', key: 'risk_score', width: 80 },
                  { title: t('pages.grc.rules.publishedAt'), dataIndex: 'published_at', key: 'published_at', width: 170, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                  { title: t('pages.grc.rules.publishedBy'), dataIndex: 'published_by', key: 'published_by', width: 140, render: v => v || '-' },
                  { title: t('pages.grc.rules.changeNote'), dataIndex: 'change_note', key: 'change_note', ellipsis: true },
                ]}
              />
            ),
          },
          {
            key: 'stats',
            label: t('pages.grc.rules.usageStats'),
            children: statsData ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space size="middle">
                  <Statistic title={t('pages.grc.rules.totalEvaluations')} value={statsData.total_evaluations} />
                  <Statistic title="Pass" value={statsData.pass_count} valueStyle={{ color: '#3f8600' }} />
                  <Statistic title="Fail" value={statsData.fail_count} valueStyle={{ color: '#cf1322' }} />
                  <Statistic title="Error" value={statsData.error_count} valueStyle={{ color: '#d48806' }} />
                  <Statistic title={t('pages.grc.rules.resultReviewRequired')} value={statsData.review_required_count} valueStyle={{ color: '#1890ff' }} />
                </Space>
                {statsData.recent_results.length > 0 && (
                  <>
                    <Typography.Title level={5}>{t('pages.grc.rules.recentResults')}</Typography.Title>
                    <Table
                      dataSource={statsData.recent_results}
                      rowKey="id"
                      pagination={false}
                      expandable={{
                        rowExpandable: row => !!row.evidence && Object.keys(row.evidence).length > 0,
                        expandedRowRender: row => (
                          <pre style={{ margin: 8, whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                            {JSON.stringify(row.evidence, null, 2)}
                          </pre>
                        ),
                      }}
                      columns={[
                        { title: 'Result', dataIndex: 'result', key: 'result', width: 120, render: r => <Tag color={RESULT_COLORS[r] ?? 'default'}>{r}</Tag> },
                        { title: 'Severity', dataIndex: 'severity', key: 'severity', width: 80 },
                        { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
                        { title: 'Evaluated', dataIndex: 'evaluated_at', key: 'evaluated_at', width: 170, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                      ]}
                    />
                  </>
                )}
              </Space>
            ) : (
              <Alert message={t('pages.grc.common.loading')} type="info" />
            ),
          },
          {
            key: 'test',
            label: t('pages.grc.rules.testRule'),
            children: (
              <RuleTestPanel
                evaluatorType={latestVer?.evaluator_type ?? 'builtin'}
                evaluatorConfig={latestVer?.evaluator_config ?? {}}
                applicableScope={latestVer?.applicable_scope ?? {}}
                evidenceRequirements={latestVer?.evidence_requirements ?? {}}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  )
}

export default RuleDetail
