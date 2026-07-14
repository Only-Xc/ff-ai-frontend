import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Alert,
  Space,
  Tag,
  Typography,
  Input,
} from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { grcRule_test } from '@/api/grc'
import type { GrcRuleTestResult } from '@/api/grc'

const { TextArea } = Input

interface RuleTestPanelProps {
  evaluatorType: string
  evaluatorConfig: Record<string, unknown>
  applicableScope: Record<string, unknown>
  evidenceRequirements: Record<string, unknown>
  defaultSnapshot?: Record<string, unknown>
  onTestResult?: (result: GrcRuleTestResult | null) => void
}

export function RuleTestPanel({
  evaluatorType,
  evaluatorConfig,
  applicableScope,
  evidenceRequirements,
  defaultSnapshot,
  onTestResult,
}: RuleTestPanelProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [snapshot, setSnapshot] = useState(
    () => JSON.stringify(defaultSnapshot || {}, null, 2),
  )
  const [parseError, setParseError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: grcRule_test,
    onSuccess: data => {
      onTestResult?.(data)
    },
    onError: () => {
      onTestResult?.(null)
    },
  })

  const handleTest = () => {
    setParseError(null)
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(snapshot)
    } catch {
      setParseError(t('pages.grc.rules.invalidJson'))
      onTestResult?.(null)
      return
    }
    mutation.mutate({
      evaluator_type: evaluatorType,
      evaluator_config: evaluatorConfig,
      applicable_scope: applicableScope,
      evidence_requirements: evidenceRequirements,
      input_snapshot: parsed,
    })
  }

  const result = mutation.data
  const alertType =
    result?.valid === false
      ? 'error'
      : result?.result === 'pass'
        ? 'success'
        : result?.result === 'review_required'
          ? 'info'
          : result?.result === 'fail'
            ? 'warning'
            : 'error'

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #f0f0f0' }}>
      <Typography.Text strong>{t('pages.grc.rules.testRule')}</Typography.Text>
      <TextArea
        value={snapshot}
        onChange={e => setSnapshot(e.target.value)}
        rows={5}
        placeholder='{ "data_classification": "restricted" }'
        style={{ marginTop: 8, fontFamily: 'monospace' }}
      />
      {parseError && <Typography.Text type="danger" style={{ fontSize: 12 }}>{parseError}</Typography.Text>}
      <Space style={{ marginTop: 8, marginBottom: 12 }}>
        <Button onClick={handleTest} loading={mutation.isPending}>
          {t('pages.grc.rules.runTest')}
        </Button>
      </Space>
      {result && (
        <Alert
          type={alertType}
          showIcon
          style={{ marginBottom: 12 }}
          title={
            result.valid === false
              ? t('pages.grc.rules.validationFailed')
              : (
                  <Space>
                    <span>{t('pages.grc.rules.testResult')}:</span>
                    <Tag
                      color={
                        result.result === 'pass'
                          ? 'green'
                          : result.result === 'review_required'
                            ? 'blue'
                            : result.result === 'fail'
                              ? 'red'
                              : 'orange'
                      }
                    >
                      {result.result === 'review_required'
                        ? t('pages.grc.rules.resultReviewRequired')
                        : (result.result ?? '-')}
                    </Tag>
                  </Space>
                )
          }
          description={
            <Space orientation="vertical" size={4} style={{ width: '100%' }}>
              {result.valid === false && result.errors?.length ? (
                <Typography.Text>{result.errors.join('; ')}</Typography.Text>
              ) : null}
              {result.message ? (
                <Typography.Text>
                  {t('pages.grc.rules.testMessage')}: {result.message}
                </Typography.Text>
              ) : null}
              {result.evidence && Object.keys(result.evidence).length > 0 ? (
                <div>
                  <Typography.Text strong>{t('pages.grc.rules.testEvidence')}</Typography.Text>
                  <Typography.Paragraph
                    code
                    copyable
                    style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                  >
                    {JSON.stringify(result.evidence, null, 2)}
                  </Typography.Paragraph>
                </div>
              ) : null}
            </Space>
          }
        />
      )}
    </div>
  )
}
