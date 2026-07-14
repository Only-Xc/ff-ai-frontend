import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

import { PageContainer } from '@ff-ai-frontend/components'
import {
  grcEvaluations_list,
  grcEvaluation_rerun,
  type EvaluationResult as EvaluationResultType,
  type RiskLevel as RiskLevelType,
} from '@/api/grc'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { usePermission } from '@/hooks/usePermission'
import { RunEvaluationModal } from './RunEvaluationModal'

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

export function EvaluationList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasPermission } = usePermission()
  const { current, pageSize, skip, limit, handleChange } = usePaginationParams({ defaultPageSize: 20 })

  const [filters, setFilters] = useState<{
    agent_id: string
    result: string
    risk_level: string
  }>({
    agent_id: '',
    result: '',
    risk_level: '',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [rerunning, setRerunning] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['grc', 'evaluations', { ...filters, skip, limit }],
    queryFn: () =>
      grcEvaluations_list({
        agent_id: filters.agent_id || undefined,
        result: (filters.result as EvaluationResultType | undefined) || undefined,
        risk_level: (filters.risk_level as RiskLevelType | undefined) || undefined,
        skip,
        limit,
      }),
  })

  const rerunMutation = useMutation({
    mutationFn: grcEvaluation_rerun,
    onSuccess: () => {
      message.success(t('pages.grc.evaluations.rerunSuccess'))
      qc.invalidateQueries({ queryKey: ['grc', 'evaluations'] })
      setRerunning(null)
    },
    onError: () => setRerunning(null),
  })

  const columns = [
    {
      title: t('pages.grc.evaluations.id'),
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (v: string) => v.slice(0, 8) + '...',
    },
    { title: t('pages.grc.evaluations.agentId'), dataIndex: 'agent_id', key: 'agent_id' },
    {
      title: t('pages.grc.evaluations.result'),
      dataIndex: 'result',
      key: 'result',
      width: 140,
      render: (v: string) => <Tag color={RESULT_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: t('pages.grc.evaluations.riskLevel'),
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 120,
      render: (v: string) => <Tag color={RISK_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    { title: t('pages.grc.evaluations.riskScore'), dataIndex: 'risk_score', key: 'risk_score', width: 100 },
    { title: t('pages.grc.evaluations.triggerType'), dataIndex: 'trigger_type', key: 'trigger_type', width: 100 },
    {
      title: t('pages.grc.evaluations.startedAt'),
      dataIndex: 'started_at',
      key: 'started_at',
      width: 170,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: t('pages.grc.common.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, row: { id: string }) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/grc/evaluations/${row.id}`)}>
            {t('pages.grc.evaluations.viewDetail')}
          </Button>
          {hasPermission('admin.grc.evaluations.run') && (
            <Button
              size="small"
              onClick={() => {
                setRerunning(row.id)
                rerunMutation.mutate(row.id)
              }}
              loading={rerunning === row.id}
            >
              {t('pages.grc.evaluations.rerun')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const total = data?.count ?? 0
  const evaluations = data?.data ?? []

  return (
    <PageContainer
      header={{
        title: t('routes.grc.evaluations.title'),
        subtitle: t('routes.grc.evaluations.subtitle'),
        extra: hasPermission('admin.grc.evaluations.run') ? (
          <Button type="primary" onClick={() => setModalOpen(true)}>
            {t('pages.grc.evaluations.manualRun')}
          </Button>
        ) : undefined,
      }}
    >
      {/* Filters */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder={t('pages.grc.evaluations.filterAgentId')}
          value={filters.agent_id}
          onChange={e => setFilters(f => ({ ...f, agent_id: e.target.value }))}
          style={{ width: 180 }}
        />
        <Select
          placeholder={t('pages.grc.evaluations.filterResult')}
          value={filters.result || undefined}
          onChange={v => setFilters(f => ({ ...f, result: v || '' }))}
          allowClear
          style={{ width: 150 }}
          options={[
            { value: 'PASS', label: 'PASS' },
            { value: 'PASS_WITH_NOTICE', label: 'PASS_WITH_NOTICE' },
            { value: 'REVIEW_REQUIRED', label: 'REVIEW_REQUIRED' },
            { value: 'BLOCKED', label: 'BLOCKED' },
            { value: 'ERROR', label: 'ERROR' },
          ]}
        />
        <Select
          placeholder={t('pages.grc.evaluations.filterRiskLevel')}
          value={filters.risk_level || undefined}
          onChange={v => setFilters(f => ({ ...f, risk_level: v || '' }))}
          allowClear
          style={{ width: 140 }}
          options={[
            { value: 'LOW', label: 'LOW' },
            { value: 'MEDIUM', label: 'MEDIUM' },
            { value: 'HIGH', label: 'HIGH' },
            { value: 'CRITICAL', label: 'CRITICAL' },
          ]}
        />
      </Space>

      <Table
        dataSource={evaluations}
        rowKey="id"
        loading={isLoading}
        columns={columns}
        pagination={{
          current: current,
          pageSize,
          total,
          onChange: handleChange,
          showSizeChanger: false,
        }}
      />

      {modalOpen && (
        <RunEvaluationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['grc', 'evaluations'] })
            setModalOpen(false)
          }}
        />
      )}
    </PageContainer>
  )
}

export default EvaluationList
