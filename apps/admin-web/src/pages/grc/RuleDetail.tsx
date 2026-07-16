import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router'
import { Alert, App, Breadcrumb, Button, Descriptions, Popconfirm, Space, Spin, Statistic, Table, Tabs, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  grcRule_get,
  grcRuleVersions_list,
  grcRuleStats_get,
  grcRuleVersion_publish,
  grcRuleVersion_retire,
  type GrcRuleVersion,
  type GrcRuleStatsResponse,
} from '@/api/grc'
import { usePermission } from '@/hooks/usePermission'
import { RuleTestPanel } from './RuleTestPanel'
import { RuleEditorDrawer } from './RuleEditorDrawer'

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  published: 'green',
  retired: 'red',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
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
  const { message } = App.useApp()
  const qc = useQueryClient()

  const [editorOpen, setEditorOpen] = useState(false)

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

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['grc', 'rule', ruleId!] })
    qc.invalidateQueries({ queryKey: ['grc', 'ruleVersions', ruleId!] })
    qc.invalidateQueries({ queryKey: ['grc', 'ruleStats', ruleId!] })
    message.success(t('pages.grc.common.refresh'))
  }

  const latestVersion = versions[0]?.version

  const publishMutation = useMutation({
    mutationFn: () => grcRuleVersion_publish(ruleId!, latestVersion!, { change_note: '' }),
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionPublished'))
      handleRefresh()
    },
    onError: (err: Error) => message.error(err.message),
  })

  const retireMutation = useMutation({
    mutationFn: () => grcRuleVersion_retire(ruleId!, latestVersion!),
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionRetired'))
      handleRefresh()
    },
    onError: (err: Error) => message.error(err.message),
  })

  if (ruleLoading || !rule) {
    return (
      <PageContainer>
        <Spin />
      </PageContainer>
    )
  }

  const latestVer = versions[0]

  return (
    <PageContainer>
      <Breadcrumb
        className="mb-3"
        items={[
          {
            title: (
              <Link to="/grc/rules">{t('pages.grc.rules.title')}</Link>
            ),
          },
          { title: rule.code },
        ]}
      />
      <PageHeader
        title={rule.code}
        subtitle={rule.name}
      >
        <Space>
          <Button onClick={handleRefresh}>
            {t('pages.grc.common.refresh')}
          </Button>
          {hasPermission('admin.grc.rules.update') && (
            <Button type="primary" onClick={() => setEditorOpen(true)}>{t('pages.grc.rules.edit')}</Button>
          )}
          {hasPermission('admin.grc.rules.create') && latestVer?.status !== 'published' && (
            <Button onClick={() => setEditorOpen(true)}>{t('pages.grc.rules.createVersion')}</Button>
          )}
          {hasPermission('admin.grc.rules.publish') && latestVer?.status === 'draft' && (
            <Popconfirm
              title={t('pages.grc.rules.publishConfirm')}
              onConfirm={() => publishMutation.mutate()}
              okText={t('pages.grc.common.confirm')}
              cancelText={t('pages.grc.common.cancel')}
            >
              <Button type="primary" loading={publishMutation.isPending}>{t('pages.grc.rules.publish')}</Button>
            </Popconfirm>
          )}
          {hasPermission('admin.grc.rules.publish') && latestVer?.status === 'published' && (
            <Popconfirm
              title={t('pages.grc.rules.retireConfirm')}
              onConfirm={() => retireMutation.mutate()}
              okText={t('pages.grc.common.confirm')}
              cancelText={t('pages.grc.common.cancel')}
            >
              <Button danger loading={retireMutation.isPending}>{t('pages.grc.rules.retire')}</Button>
            </Popconfirm>
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
            v{latestVer.version} · {t(`pages.grc.rules.status_${latestVer.status}`, latestVer.status)}
          </Tag>
        )}
        <Tag>{rule.category}</Tag>
      </Space>

      {/* KPI Cards */}
      <Descriptions
        column={{ xs: 1, sm: 2, md: 4 }}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'evaluatorType',
            label: t('pages.grc.rules.evaluatorType'),
            children: latestVer?.evaluator_type
              ? t(`pages.grc.rules.evaluatorType_${latestVer.evaluator_type}`, latestVer.evaluator_type)
              : '-',
          },
          {
            key: 'severity',
            label: t('pages.grc.rules.severity'),
            children: latestVer?.severity ? (
              <Tag color={SEVERITY_COLORS[latestVer.severity] ?? 'default'} style={{ marginInlineEnd: 0 }}>
                {latestVer.severity}
              </Tag>
            ) : (
              '-'
            ),
          },
          {
            key: 'blockOnFail',
            label: t('pages.grc.rules.blockOnFail'),
            children: (
              <Tag color={latestVer?.block_on_fail ? 'red' : 'default'} style={{ marginInlineEnd: 0 }}>
                {latestVer?.block_on_fail ? t('pages.grc.common.yes') : t('pages.grc.common.no')}
              </Tag>
            ),
          },
          {
            key: 'exceptionAllowed',
            label: t('pages.grc.rules.exceptionAllowed'),
            children: (
              <Tag color={latestVer?.exception_allowed ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
                {latestVer?.exception_allowed ? t('pages.grc.common.yes') : t('pages.grc.common.no')}
              </Tag>
            ),
          },
        ]}
      />

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

      <RuleEditorDrawer
        open={editorOpen}
        rule={rule}
        onClose={() => setEditorOpen(false)}
        onSuccess={handleRefresh}
      />
    </PageContainer>
  )
}

export default RuleDetail
