import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { App, Button, Descriptions, Drawer, Form, Input, Select, Space, Statistic, Table, Tag, Timeline, Typography } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import type { DecisionOutcome } from '@ff-ai-frontend/api'
import {
  grcEvaluationResults_list,
  grcReviewCase_get,
  grcReviewDecision_submit,
  grcReviewDecisions_list,
  type GrcEvaluationResult,
  type GrcReviewDecision,
} from '@/api/grc'
import { grcKeys } from '@/api/grc'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'blue',
  IN_REVIEW: 'processing',
  APPROVED: 'green',
  APPROVED_WITH_CONDITIONS: 'cyan',
  REJECTED: 'red',
  REMEDIATION_REQUIRED: 'orange',
  EXCEPTION_REQUESTED: 'purple',
}

export function ReviewDetail() {
  const { caseId = '' } = useParams()
  const { t } = useTranslation()
  const { message: appMessage } = App.useApp()
  const queryClient = useQueryClient()

  const { data: caseData } = useQuery({
    queryKey: grcKeys.reviewCase(caseId),
    queryFn: () => grcReviewCase_get(caseId),
    enabled: !!caseId,
  })

  // grcReviewDecisions_list returns GrcReviewDecision[] directly (not wrapped)
  const { data: decisionsData } = useQuery({
    queryKey: ['grc', 'review', caseId, 'decisions'] as const,
    queryFn: () => grcReviewDecisions_list(caseId),
    enabled: !!caseId,
  })
  const decisions: GrcReviewDecision[] = decisionsData ?? []

  const { data: evalResultsData } = useQuery({
    queryKey: ['grc', 'evaluation', caseData?.evaluation_id, 'results'] as const,
    queryFn: () => grcEvaluationResults_list(caseData!.evaluation_id),
    enabled: !!caseData?.evaluation_id,
  })

  const [decisionOpen, setDecisionOpen] = useState(false)
  const [form] = Form.useForm()

  const decideMutation = useMutation({
    mutationFn: ({
      decision,
      rationale,
      expectedVersion,
    }: {
      decision: DecisionOutcome
      rationale: string
      expectedVersion: number
    }) =>
      grcReviewDecision_submit(caseId, {
        decision,
        rationale,
        expected_version: expectedVersion,
      }),
    onSuccess: () => {
      appMessage.success('Decision submitted')
      queryClient.invalidateQueries({ queryKey: ['grc', 'review', caseId] })
      setDecisionOpen(false)
    },
  })

  const handleDecide = () => {
    form.validateFields().then(values => {
      decideMutation.mutate({
        decision: values.decision,
        rationale: values.rationale,
        expectedVersion: caseData?.version ?? 1,
      })
    })
  }

  const isDecided =
    caseData != null &&
    !['OPEN', 'IN_REVIEW', 'REMEDIATION_REQUIRED', 'EXCEPTION_REQUESTED'].includes(
      caseData.status,
    )

  // getEvaluationResults_list returns ListResult<GrcEvaluationResult>; unwrap data field
  const evalResults: GrcEvaluationResult[] = Array.isArray(evalResultsData)
    ? evalResultsData
    : evalResultsData?.data ?? []

  return (
    <PageContainer>
      <PageHeader
        title={caseData?.case_no ?? 'Review Detail'}
        subtitle={caseData?.title}
      >
        {!isDecided && (
          <Button type="primary" onClick={() => setDecisionOpen(true)}>
            {t('pages.grc.reviews.decide')}
          </Button>
        )}
      </PageHeader>

      {caseData && (
        <>
          {/* Risk Overview */}
          <div style={{ marginBottom: 24 }}>
            <Space size="large">
              <Statistic
                title={t('pages.grc.reviews.riskLevel')}
                value={caseData.risk_level}
              />
              <Statistic title="Risk Score" value={caseData.risk_score} />
              <Tag color={STATUS_COLORS[caseData.status] ?? 'default'}>
                {caseData.status}
              </Tag>
            </Space>
          </div>

          {/* Case Details */}
          <Descriptions
            title="Case Info"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label="Subject">
              {caseData.subject_type}: {caseData.subject_id}
            </Descriptions.Item>
            <Descriptions.Item label="Agent">
              {caseData.agent_id ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Requester">
              {caseData.requester_id}
            </Descriptions.Item>
            <Descriptions.Item label="Assignee">
              {caseData.assignee_id ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Opened">
              {dayjs(caseData.opened_at).format()}
            </Descriptions.Item>
            <Descriptions.Item label="Due">
              {caseData.due_at ? dayjs(caseData.due_at).format() : '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Evaluation Results */}
          {evalResults.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={5}>
                {t('pages.grc.reviews.ruleFindings')}
              </Typography.Title>
              <Table
                size="small"
                rowKey="id"
                dataSource={evalResults}
                columns={[
                  {
                    title: 'Rule',
                    dataIndex: 'rule_id',
                    key: 'rule_id',
                    width: 200,
                  },
                  {
                    title: 'Result',
                    dataIndex: 'result',
                    key: 'result',
                    width: 120,
                    render: (v: string) => (
                      <Tag
                        color={
                          v === 'pass'
                            ? 'green'
                            : v === 'fail'
                              ? 'red'
                              : 'orange'
                        }
                      >
                        {v}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Severity',
                    dataIndex: 'severity',
                    key: 'severity',
                    width: 100,
                  },
                  {
                    title: 'Message',
                    dataIndex: 'message',
                    key: 'message',
                    ellipsis: true,
                  },
                ]}
                pagination={false}
              />
            </div>
          )}

          {/* Audit Timeline */}
          {decisions && decisions.length > 0 && (
            <div>
              <Typography.Title level={5}>
                {t('pages.grc.reviews.auditTimeline')}
              </Typography.Title>
              <Timeline
                items={decisions.map(d => ({
                  color:
                    d.decision === 'APPROVED'
                      ? 'green'
                      : d.decision === 'REJECTED'
                        ? 'red'
                        : 'orange',
                  children: (
                    <div>
                      <strong>{d.decision}</strong> by {d.decided_by}
                      <br />
                      <span style={{ color: '#999' }}>
                        {dayjs(d.decided_at).format()}
                      </span>
                      <p style={{ marginTop: 4 }}>{d.rationale}</p>
                    </div>
                  ),
                }))}
              />
            </div>
          )}
        </>
      )}

      {/* Decision Modal */}
      <Drawer
        title={t('pages.grc.reviews.decide')}
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="decision" label="Decision" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'APPROVED', label: 'Approve' },
                {
                  value: 'APPROVED_WITH_CONDITIONS',
                  label: 'Approve with Conditions',
                },
                { value: 'REJECTED', label: 'Reject' },
                {
                  value: 'REMEDIATION_REQUIRED',
                  label: 'Require Remediation',
                },
                {
                  value: 'EXCEPTION_REQUESTED',
                  label: 'Request Exception',
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="rationale"
            label={t('pages.grc.reviews.rationale')}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
        >
          <Button onClick={() => setDecisionOpen(false)}>
            {t('pages.grc.common.cancel')}
          </Button>
          <Button
            type="primary"
            onClick={handleDecide}
            loading={decideMutation.isPending}
          >
            {t('pages.grc.common.submit')}
          </Button>
        </div>
      </Drawer>
    </PageContainer>
  )
}

export default ReviewDetail
