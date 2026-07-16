import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import {
  Alert,
  Breadcrumb,
  Button,
  Descriptions,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  grcEvaluation_get,
  grcEvaluationResults_list,
  grcEvaluation_rerun,
  type GrcEvaluationResult,
} from '@/api/grc'
import { grcKeys } from '@/api/grc'
import { usePermission } from '@/hooks/usePermission'
import { usePaginationParams } from '@/hooks/usePaginationParams'

const RESULT_COLORS: Record<string, string> = {
  PASS: 'green',
  PASS_WITH_NOTICE: 'cyan',
  REVIEW_REQUIRED: 'blue',
  BLOCKED: 'red',
  ERROR: 'orange',
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export function EvaluationDetail() {
  const { t } = useTranslation()
  const { evaluationId } = useParams<{ evaluationId: string }>()
  const { hasPermission } = usePermission()
  const qc = useQueryClient()

  const { data: evaluation, isLoading: evalLoading } = useQuery({
    queryKey: grcKeys.evaluation(evaluationId!),
    queryFn: () => grcEvaluation_get(evaluationId!),
    enabled: !!evaluationId,
  })

  const { data: resultsData } = useQuery({
    queryKey: ['grc', 'evaluation', evaluationId, 'results'],
    queryFn: () => grcEvaluationResults_list(evaluationId!),
    enabled: !!evaluationId,
  })

  const rerunMutation = useMutation({
    mutationFn: () => grcEvaluation_rerun(evaluationId!),
    onSuccess: () => {
      message.success(t('pages.grc.evaluations.rerunSuccess'))
      qc.invalidateQueries({ queryKey: ['grc', 'evaluations'] })
    },
  })

  const results: GrcEvaluationResult[] = resultsData?.data ?? []
  const { current, handleChange, pageSize } = usePaginationParams({
    defaultPageSize: 10,
  })

  const paginatedResults = useMemo(() => {
    const start = (current - 1) * pageSize
    return results.slice(start, start + pageSize)
  }, [current, pageSize, results])

  if (evalLoading || !evaluation) {
    return (
      <PageContainer className="flex min-h-48 items-center justify-center p-6">
        <Spin />
      </PageContainer>
    )
  }

  return (
    <div>
      <Breadcrumb
        className="mb-3"
        items={[
          {
            title: (
              <Link to="/grc/evaluations">
                {t('routes.grc.evaluations.title')}
              </Link>
            ),
          },
          { title: evaluation.id.slice(0, 8) },
        ]}
      />
      <PageHeader
        title={evaluation.id.slice(0, 8)}
        subtitle={evaluation.agent_id}
      >
        {hasPermission('admin.grc.evaluations.run') ? (
          <Button type="primary" onClick={() => rerunMutation.mutate()}>
            {t('pages.grc.evaluations.rerun')}
          </Button>
        ) : null}
      </PageHeader>
      <PageContainer className="p-4">
      {/* Summary row */}
      <Space size="large" style={{ marginBottom: 24 }}>
        <Statistic
          title={t('pages.grc.evaluations.result')}
          valueRender={() => (
            <Tag color={RESULT_COLORS[evaluation.result] ?? 'default'}>{evaluation.result}</Tag>
          )}
        />
        <Statistic
          title={t('pages.grc.reviews.riskLevel')}
          value={evaluation.risk_level}
          valueRender={() => (
            <Tag color={RISK_COLORS[evaluation.risk_level] ?? 'default'}>
              {evaluation.risk_level}
            </Tag>
          )}
        />
        <Statistic title={t('pages.grc.reviews.riskScore')} value={evaluation.risk_score} />
        <Statistic title={t('pages.grc.evaluations.agentId')} value={evaluation.agent_id} />
        <Statistic title={t('pages.grc.evaluations.triggerType')} value={evaluation.trigger_type} />
      </Space>

      {/* Metadata */}
      <Descriptions
        title={t('pages.grc.reviews.caseInfo')}
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label={t('pages.grc.evaluations.startedAt')}>
          {evaluation.started_at ? dayjs(evaluation.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.grc.evaluations.completedAt')}>
          {evaluation.completed_at ? dayjs(evaluation.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.grc.evaluations.profileId')}>
          {evaluation.profile_id}
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.grc.evaluations.ruleSetSha256')}>
          <Typography.Text copyable>{evaluation.rule_set_sha256}</Typography.Text>
        </Descriptions.Item>
      </Descriptions>

      {/* Results table */}
      {results.length > 0 ? (
        <Table
          dataSource={paginatedResults}
          rowKey="id"
          pagination={{
            current,
            pageSize,
            total: results.length,
            onChange: handleChange,
            showSizeChanger: false,
          }}
          expandable={{
            rowExpandable: (row: GrcEvaluationResult) =>
              !!row.evidence && Object.keys(row.evidence).length > 0,
            expandedRowRender: (row: GrcEvaluationResult) => (
              <pre style={{ margin: 8, whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {JSON.stringify(row.evidence, null, 2)}
              </pre>
            ),
          }}
          columns={[
            { title: t('pages.grc.evaluations.ruleCode'), dataIndex: 'rule_code', key: 'rule_code', width: 150, render: (v: string | null) => v ?? '-' },
            { title: t('pages.grc.evaluations.ruleName'), dataIndex: 'rule_name', key: 'rule_name', width: 150, ellipsis: true, render: (v: string | null) => v ?? '-' },
            {
              title: t('pages.grc.evaluations.result'),
              dataIndex: 'result',
              key: 'result',
              width: 150,
              render: (v: string) => <Tag color={RESULT_COLORS[v] ?? 'default'}>{v}</Tag>,
            },
            {
              title: t('pages.grc.evaluations.severity'),
              dataIndex: 'severity',
              key: 'severity',
              width: 100,
            },
            {
              title: t('pages.grc.evaluations.message'),
              dataIndex: 'message',
              key: 'message',
              ellipsis: true,
            },
            { title: t('pages.grc.evaluations.blockOnFail'), dataIndex: 'block_on_fail', key: 'block_on_fail', width: 110, render: v => v ? t('pages.grc.common.yes') : t('pages.grc.common.no') },
          ]}
        />
      ) : (
        <Alert message={t('pages.grc.evaluations.noResults')} type="info" />
      )}
      </PageContainer>
    </div>
  )
}

export default EvaluationDetail
