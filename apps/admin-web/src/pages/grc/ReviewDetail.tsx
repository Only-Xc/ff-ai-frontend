import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import {
  Alert,
  type AlertProps,
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd'
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

type UserRef = { id: string; email: string; full_name: string | null } | null | undefined

/** Prefer full_name, then email, then fall back to the raw id. */
function userLabel(ref: UserRef, fallbackId?: string | null): string {
  return ref?.full_name || ref?.email || fallbackId || '-'
}

/** Prefer "code · name", then name or code, then fall back to the raw rule_id. */
function ruleLabel(row: GrcEvaluationResult): string {
  if (row.rule_code && row.rule_name) return `${row.rule_code} · ${row.rule_name}`
  return row.rule_name || row.rule_code || row.rule_id
}

const DECISION_IMPACTS: Record<
  string,
  { title: string; color: AlertProps['type']; items: string[] }
> = {
  APPROVED: {
    title: 'approve',
    color: 'success',
    items: [
      'agentWillDeploy',
      'releaseAuthGenerated',
      'taskWillComplete',
    ],
  },
  APPROVED_WITH_CONDITIONS: {
    title: 'approveWithConditions',
    color: 'warning',
    items: [
      'conditionsMustBeMet',
      'agentBlockedUntilConditionsMet',
    ],
  },
  REJECTED: {
    title: 'reject',
    color: 'error',
    items: [
      'taskWillFail',
      'agentStaysInSandbox',
      'cannotRedeployWithoutNewReview',
    ],
  },
  REMEDIATION_REQUIRED: {
    title: 'requireRemediation',
    color: 'warning',
    items: [
      'agentRemainsBlocked',
      'taskRemainsPending',
      'canRepromptAfterFix',
    ],
  },
  EXCEPTION_REQUESTED: {
    title: 'requestException',
    color: 'info',
    items: [
      'exceptionUnderReview',
      'blockedRulesStillActive',
      'separateApprovalRequired',
    ],
  },
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
  const [selectedDecision, setSelectedDecision] = useState<string | undefined>()
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
      appMessage.success(t('pages.grc.reviews.decisionSubmitted'))
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
        title={caseData?.case_no ?? t('pages.grc.reviews.caseNo')}
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
            <Space size="large" align="start">
              <Statistic
                title={t('pages.grc.reviews.riskLevel')}
                value={caseData.risk_level}
              />
              <Statistic title={t("pages.grc.reviews.riskScore")} value={caseData.risk_score} />
              <Statistic
                title={t('pages.grc.reviews.status')}
                value={caseData.status}
                formatter={() => (
                  <Tag color={STATUS_COLORS[caseData.status] ?? 'default'}>
                    {caseData.status}
                  </Tag>
                )}
              />
            </Space>
          </div>

          {/* Case Details */}
          <Descriptions
            title={t("pages.grc.reviews.caseInfo")}
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 24 }}
          >
            <Descriptions.Item label={t("pages.grc.reviews.subject")}>
              {caseData.subject_type}: {caseData.subject_id}
            </Descriptions.Item>
            <Descriptions.Item label={t("pages.grc.reviews.agent")}>
              {caseData.agent_id ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t("pages.grc.reviews.requester")}>
              {userLabel(caseData.requester, caseData.requester_id)}
            </Descriptions.Item>
            <Descriptions.Item label={t("pages.grc.reviews.assigneeField")}>
              {userLabel(caseData.assignee, caseData.assignee_id)}
            </Descriptions.Item>
            <Descriptions.Item label={t("pages.grc.reviews.opened")}>
              {dayjs(caseData.opened_at).format()}
            </Descriptions.Item>
            <Descriptions.Item label={t("pages.grc.reviews.due")}>
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
                    title: t('pages.grc.reviews.rule'),
                    dataIndex: 'rule_id',
                    key: 'rule_id',
                    width: 200,
                    render: (_: string, row: GrcEvaluationResult) => ruleLabel(row),
                  },
                  {
                    title: t('pages.grc.reviews.evaluationResult'),
                    dataIndex: 'result',
                    key: 'result',
                    width: 120,
                    render: (v: string) => (
                      <Tag
                        color={
                          v === 'pass'
                            ? 'green'
                            : v === 'review_required'
                              ? 'blue'
                              : v === 'fail'
                                ? 'red'
                                : 'orange'
                        }
                      >
                        {v === 'review_required' ? t('pages.grc.rules.resultReviewRequired') : v}
                      </Tag>
                    ),
                  },
                  {
                    title: t('pages.grc.reviews.evaluationSeverity'),
                    dataIndex: 'severity',
                    key: 'severity',
                    width: 100,
                  },
                  {
                    title: t('pages.grc.reviews.evaluationMessage'),
                    dataIndex: 'message',
                    key: 'message',
                    ellipsis: true,
                  },
                ]}
                expandable={{
                  rowExpandable: (row: GrcEvaluationResult) =>
                    !!row.evidence && Object.keys(row.evidence).length > 0,
                  expandedRowRender: (row: GrcEvaluationResult) => (
                    <div>
                      <Typography.Text strong>
                        {t('pages.grc.reviews.evaluationEvidence')}
                      </Typography.Text>
                      <Typography.Paragraph code copyable style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(row.evidence, null, 2)}
                      </Typography.Paragraph>
                    </div>
                  ),
                }}
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
                      <strong>{d.decision}</strong> by {userLabel(d.decided_by_user, d.decided_by)}
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
          <Form.Item name="decision" label={t("pages.grc.reviews.decision")} rules={[{ required: true }]}>
            <Select
              onChange={setSelectedDecision}
              options={[
                { value: 'APPROVED', label: t('pages.grc.reviews.approve') },
                {
                  value: 'APPROVED_WITH_CONDITIONS',
                  label: t('pages.grc.reviews.approveWithConditions'),
                },
                { value: 'REJECTED', label: t('pages.grc.reviews.reject') },
                {
                  value: 'REMEDIATION_REQUIRED',
                  label: t('pages.grc.reviews.requireRemediation'),
                },
                {
                  value: 'EXCEPTION_REQUESTED',
                  label: t('pages.grc.reviews.requestException'),
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

        {selectedDecision && DECISION_IMPACTS[selectedDecision] && (
          <Alert
            style={{ marginBottom: 16, marginTop: 8 }}
            type={DECISION_IMPACTS[selectedDecision].color}
            showIcon
            message={t(`pages.grc.reviews.impactPreview.${DECISION_IMPACTS[selectedDecision].title}`)}
            description={
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {DECISION_IMPACTS[selectedDecision].items.map((key) => (
                  <li key={key}>{t(`pages.grc.reviews.impactPreview.${key}`)}</li>
                ))}
              </ul>
            }
          />
        )}

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
