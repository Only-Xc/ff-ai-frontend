import {
  ArrowLeftOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import {
  addWorkflowTestCase,
  cancelWorkflowTestRun,
  compareWorkflowTestRuns,
  createWorkflowTestRun,
  createWorkflowTestSuite,
  deleteWorkflowTestCase,
  deleteWorkflowTestSuite,
  exportWorkflowTestRun,
  getWorkflowApp,
  getWorkflowTestRun,
  importWorkflowTestCases,
  listWorkflowTestCases,
  listWorkflowTestRuns,
  listWorkflowTestSuites,
  listWorkflowVersions,
  rerunFailedWorkflowTestResults,
  updateWorkflowTestCase,
  workflowKeys,
  type WorkflowTestCase,
  type WorkflowTestSuiteCreatePayload,
  type WorkflowTestStatus,
  type WorkflowTestRun,
  type WorkflowTestTargetType,
} from '@/api/workflow'

const { Text, Title } = Typography

const STATUS_COLORS: Record<WorkflowTestStatus, string> = {
  queued: 'default',
  running: 'processing',
  completed: 'success',
  completed_with_errors: 'warning',
  cancel_requested: 'processing',
  failed: 'error',
  cancelled: 'warning',
}

const ACTIVE_RUN_STATUSES: WorkflowTestStatus[] = [
  'queued',
  'running',
  'cancel_requested',
]

const COMPARABLE_RUN_STATUSES: WorkflowTestStatus[] = [
  'completed',
  'completed_with_errors',
]

function getMetricNumber(
  metrics: Record<string, unknown>,
  key: string,
): number | null {
  const value = metrics[key]
  return typeof value === 'number' ? value : null
}

function getErrorMessage(error: Record<string, unknown> | null): string | null {
  const value = error?.message
  return typeof value === 'string' ? value : null
}

function summarizeRun(run?: WorkflowTestRun) {
  const results = run?.results ?? []
  const latencies = results
    .map((result) => getMetricNumber(result.metrics, 'latency_ms'))
    .filter((value): value is number => value !== null)
  const scores = results
    .map((result) => result.score)
    .filter((value): value is number => value !== null)
  const totalTokens = results.reduce(
    (sum, result) =>
      sum + (getMetricNumber(result.metrics, 'total_tokens') ?? 0),
    0,
  )
  const channels = new Set<string>()
  for (const result of results) {
    for (const evidence of result.evidence) {
      const retrievalChannels = evidence.retrieval_channels
      if (!Array.isArray(retrievalChannels)) continue
      retrievalChannels.forEach((channel) => {
        if (typeof channel === 'string') channels.add(channel)
      })
    }
  }
  return {
    averageLatency:
      latencies.length > 0
        ? Math.round(
            latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
          )
        : null,
    averageScore:
      scores.length > 0
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : null,
    totalTokens,
    channels: [...channels].sort(),
  }
}

interface TestCaseFormValues {
  question: string
  expected_answer?: string
  tags?: string
  variables?: string
}

interface SuiteFormValues {
  name: string
  description?: string
}

function parseVariables(value?: string): Record<string, unknown> {
  if (!value?.trim()) return {}
  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('variables must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

function toTestCasePayload(values: TestCaseFormValues) {
  return {
    question: values.question,
    expected_answer: values.expected_answer,
    tags: values.tags
      ? values.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    variables: parseVariables(values.variables),
  }
}

function toSuitePayload(
  values: SuiteFormValues,
): WorkflowTestSuiteCreatePayload {
  const description = values.description?.trim()
  return {
    name: values.name.trim(),
    description: description?.length ? description : undefined,
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function WorkflowEvaluationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appId = '' } = useParams<{ appId: string }>()

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>()
  const [suiteModalOpen, setSuiteModalOpen] = useState(false)
  const [caseModalOpen, setCaseModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<WorkflowTestCase | null>(null)
  const [runModalOpen, setRunModalOpen] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string>()
  const [leftRunId, setLeftRunId] = useState<string>()
  const [rightRunId, setRightRunId] = useState<string>()
  const [suiteForm] = Form.useForm()
  const [caseForm] = Form.useForm()
  const [runForm] = Form.useForm()

  const showMutationError = () => {
    void message.error(t('common.errors.requestFailed'))
  }

  const openCaseModal = (testCase?: WorkflowTestCase) => {
    setEditingCase(testCase ?? null)
    caseForm.resetFields()
    if (testCase) {
      caseForm.setFieldsValue({
        question: testCase.question,
        expected_answer: testCase.expected_answer ?? undefined,
        tags: testCase.tags.join(', '),
        variables: JSON.stringify(testCase.variables, null, 2),
      })
    }
    setCaseModalOpen(true)
  }

  const closeCaseModal = () => {
    setCaseModalOpen(false)
    setEditingCase(null)
    caseForm.resetFields()
  }

  const appQuery = useQuery({
    queryKey: workflowKeys.app(appId),
    queryFn: () => getWorkflowApp(appId),
    enabled: Boolean(appId),
  })
  const suitesQuery = useQuery({
    queryKey: workflowKeys.testSuites(appId),
    queryFn: () => listWorkflowTestSuites(appId),
    enabled: Boolean(appId),
  })
  const casesQuery = useQuery({
    queryKey: workflowKeys.testCases(appId, selectedSuiteId ?? ''),
    queryFn: () => listWorkflowTestCases(appId, selectedSuiteId!),
    enabled: Boolean(appId && selectedSuiteId),
  })
  const versionsQuery = useQuery({
    queryKey: workflowKeys.versions(appId),
    queryFn: () => listWorkflowVersions(appId),
    enabled: Boolean(appId),
  })
  const runsQuery = useQuery({
    queryKey: workflowKeys.testRuns(appId),
    queryFn: () => listWorkflowTestRuns(appId),
    enabled: Boolean(appId),
    refetchInterval: (query) =>
      query.state.data?.some((run) => ACTIVE_RUN_STATUSES.includes(run.status))
        ? 3000
        : false,
  })
  const runDetailQuery = useQuery({
    queryKey: workflowKeys.testRun(appId, selectedRunId ?? ''),
    queryFn: () => getWorkflowTestRun(appId, selectedRunId!),
    enabled: Boolean(appId && selectedRunId),
    refetchInterval: (query) =>
      query.state.data && ACTIVE_RUN_STATUSES.includes(query.state.data.status)
        ? 2000
        : false,
  })
  const comparisonQuery = useQuery({
    queryKey: workflowKeys.testComparison(
      appId,
      leftRunId ?? '',
      rightRunId ?? '',
    ),
    queryFn: () => compareWorkflowTestRuns(appId, leftRunId!, rightRunId!),
    enabled: Boolean(appId && leftRunId && rightRunId),
  })

  const refreshSuites = async () => {
    await queryClient.invalidateQueries({
      queryKey: workflowKeys.testSuites(appId),
    })
    if (selectedSuiteId) {
      await queryClient.invalidateQueries({
        queryKey: workflowKeys.testCases(appId, selectedSuiteId),
      })
    }
  }

  const createSuiteMutation = useMutation({
    mutationFn: (values: SuiteFormValues) =>
      createWorkflowTestSuite(appId, toSuitePayload(values)),
    onSuccess: async (suite) => {
      setSuiteModalOpen(false)
      suiteForm.resetFields()
      setSelectedSuiteId(suite.id)
      await refreshSuites()
      void message.success(t('pages.workflow.evaluations.suiteCreated'))
    },
    onError: showMutationError,
  })
  const deleteSuiteMutation = useMutation({
    mutationFn: (suiteId: string) => deleteWorkflowTestSuite(appId, suiteId),
    onSuccess: async () => {
      setSelectedSuiteId(undefined)
      await refreshSuites()
      void message.success(t('pages.workflow.evaluations.suiteDeleted'))
    },
    onError: showMutationError,
  })
  const saveCaseMutation = useMutation({
    mutationFn: ({
      caseId,
      values,
    }: {
      caseId?: string
      values: TestCaseFormValues
    }) =>
      caseId
        ? updateWorkflowTestCase(
            appId,
            selectedSuiteId!,
            caseId,
            toTestCasePayload(values),
          )
        : addWorkflowTestCase(
            appId,
            selectedSuiteId!,
            toTestCasePayload(values),
          ),
    onSuccess: async (_, { caseId }) => {
      closeCaseModal()
      await refreshSuites()
      void message.success(
        t(
          caseId
            ? 'pages.workflow.evaluations.caseUpdated'
            : 'pages.workflow.evaluations.caseCreated',
        ),
      )
    },
    onError: showMutationError,
  })
  const deleteCaseMutation = useMutation({
    mutationFn: (caseId: string) =>
      deleteWorkflowTestCase(appId, selectedSuiteId!, caseId),
    onSuccess: async () => {
      await refreshSuites()
      void message.success(t('pages.workflow.evaluations.caseDeleted'))
    },
    onError: showMutationError,
  })
  const importMutation = useMutation({
    mutationFn: (file: File) =>
      importWorkflowTestCases(appId, selectedSuiteId!, file),
    onSuccess: async (result) => {
      await refreshSuites()
      void message.success(
        t('pages.workflow.evaluations.imported', {
          count: result.imported_count,
        }),
      )
    },
    onError: showMutationError,
  })
  const createRunMutation = useMutation({
    mutationFn: (values: {
      suite_id: string
      target_type: WorkflowTestTargetType
      target_version_id?: string
      exact_match?: boolean
      require_citations?: boolean
      llm_enabled?: boolean
      llm_model?: string
      keywords?: string
    }) =>
      createWorkflowTestRun(appId, {
        suite_id: values.suite_id,
        target_type: values.target_type,
        target_version_id:
          values.target_type === 'version'
            ? values.target_version_id
            : undefined,
        evaluator_config: {
          rules: {
            exact_match: values.exact_match ?? true,
            citation_required: values.require_citations ?? false,
            contains_keywords: values.keywords
              ? values.keywords
                  .split(',')
                  .map((keyword) => keyword.trim())
                  .filter(Boolean)
              : [],
            weights: {},
          },
          llm: {
            enabled: values.llm_enabled ?? false,
            model: values.llm_enabled
              ? (values.llm_model?.trim() ?? null)
              : null,
            prompt_version: 'workflow-rag-evaluator-v1',
          },
        },
      }),
    onSuccess: async (run) => {
      setRunModalOpen(false)
      runForm.resetFields()
      setSelectedRunId(run.id)
      await queryClient.invalidateQueries({
        queryKey: workflowKeys.testRuns(appId),
      })
      void message.success(t('pages.workflow.evaluations.runCreated'))
    },
    onError: showMutationError,
  })
  const cancelRunMutation = useMutation({
    mutationFn: (runId: string) => cancelWorkflowTestRun(appId, runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workflowKeys.testRuns(appId),
      })
    },
    onError: showMutationError,
  })
  const rerunMutation = useMutation({
    mutationFn: (runId: string) => rerunFailedWorkflowTestResults(appId, runId),
    onSuccess: async (run) => {
      setSelectedRunId(run.id)
      await queryClient.invalidateQueries({
        queryKey: workflowKeys.testRuns(appId),
      })
      void message.success(t('pages.workflow.evaluations.rerunQueued'))
    },
    onError: showMutationError,
  })
  const exportMutation = useMutation({
    mutationFn: ({
      runId,
      format,
    }: {
      runId: string
      format: 'csv' | 'json'
    }) =>
      exportWorkflowTestRun(appId, runId, format).then((blob) => ({
        blob,
        format,
        runId,
      })),
    onSuccess: ({ blob, format, runId }) =>
      triggerDownload(blob, `workflow-test-${runId}.${format}`),
    onError: showMutationError,
  })

  const completedRuns = useMemo(
    () =>
      (runsQuery.data ?? []).filter((run) =>
        COMPARABLE_RUN_STATUSES.includes(run.status),
      ),
    [runsQuery.data],
  )

  const renderStatus = (status: WorkflowTestStatus) => (
    <Tag color={STATUS_COLORS[status]}>
      {t(`pages.workflow.evaluations.status.${status}`, {
        defaultValue: status.replaceAll('_', ' '),
      })}
    </Tag>
  )

  const suiteTab = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 32%) minmax(0, 1fr)',
        gap: 20,
      }}
    >
      <section style={{ minWidth: 0 }}>
        <Space style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSuiteModalOpen(true)}
          >
            {t('pages.workflow.evaluations.newSuite')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={suitesQuery.isFetching}
            onClick={() => void suitesQuery.refetch()}
          />
        </Space>
        <Table
          rowKey="id"
          size="small"
          loading={suitesQuery.isLoading}
          pagination={false}
          rowClassName={(record) =>
            record.id === selectedSuiteId ? 'ant-table-row-selected' : ''
          }
          onRow={(record) => ({ onClick: () => setSelectedSuiteId(record.id) })}
          dataSource={suitesQuery.data ?? []}
          columns={[
            {
              title: t('pages.workflow.evaluations.name'),
              dataIndex: 'name',
              ellipsis: true,
            },
            {
              title: t('pages.workflow.evaluations.cases'),
              dataIndex: 'case_count',
              width: 72,
            },
            {
              title: '',
              width: 62,
              render: (_, record) => (
                <Button
                  danger
                  type="text"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()
                    Modal.confirm({
                      title: t('pages.workflow.evaluations.deleteSuite'),
                      onOk: () => deleteSuiteMutation.mutateAsync(record.id),
                    })
                  }}
                >
                  {t('common.delete')}
                </Button>
              ),
            },
          ]}
        />
      </section>
      <section style={{ minWidth: 0 }}>
        {selectedSuiteId ? (
          <>
            <Space wrap style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCaseModal()}
              >
                {t('pages.workflow.evaluations.addCase')}
              </Button>
              <Upload
                accept=".csv,text/csv"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  importMutation.mutate(file)
                  return false
                }}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={importMutation.isPending}
                >
                  {t('pages.workflow.evaluations.importCsv')}
                </Button>
              </Upload>
            </Space>
            <Table
              rowKey="id"
              size="small"
              loading={casesQuery.isLoading}
              dataSource={casesQuery.data ?? []}
              pagination={{ pageSize: 20 }}
              columns={[
                {
                  title: '#',
                  dataIndex: 'ordinal',
                  width: 60,
                  render: (ordinal: number) => ordinal + 1,
                },
                {
                  title: t('pages.workflow.evaluations.question'),
                  dataIndex: 'question',
                  ellipsis: true,
                },
                {
                  title: t('pages.workflow.evaluations.expectedAnswer'),
                  dataIndex: 'expected_answer',
                  ellipsis: true,
                  render: (value: string | null) => value ?? '-',
                },
                {
                  title: t('pages.workflow.evaluations.tags'),
                  dataIndex: 'tags',
                  render: (tags: string[]) =>
                    tags.map((tag) => <Tag key={tag}>{tag}</Tag>),
                },
                {
                  title: t('pages.workflow.evaluations.actions'),
                  width: 96,
                  render: (_: unknown, record: WorkflowTestCase) => (
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                        onClick={() => openCaseModal(record)}
                      />
                      <Button
                        danger
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                        loading={
                          deleteCaseMutation.isPending &&
                          deleteCaseMutation.variables === record.id
                        }
                        onClick={() => {
                          Modal.confirm({
                            title: t('pages.workflow.evaluations.deleteCase'),
                            content: t(
                              'pages.workflow.evaluations.deleteCaseConfirm',
                            ),
                            okText: t('common.delete'),
                            cancelText: t('common.cancel'),
                            okButtonProps: { danger: true },
                            onOk: () =>
                              deleteCaseMutation.mutateAsync(record.id),
                          })
                        }}
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </>
        ) : (
          <Empty description={t('pages.workflow.evaluations.selectSuite')} />
        )}
      </section>
    </div>
  )

  const runTab = (
    <>
      <Space wrap style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          disabled={!suitesQuery.data?.length}
          onClick={() => setRunModalOpen(true)}
        >
          {t('pages.workflow.evaluations.startRun')}
        </Button>
        <Button
          icon={<ReloadOutlined />}
          loading={runsQuery.isFetching}
          onClick={() => void runsQuery.refetch()}
        >
          {t('common.actions.refresh')}
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={runsQuery.isLoading}
        dataSource={runsQuery.data ?? []}
        pagination={{ pageSize: 20 }}
        onRow={(record) => ({ onClick: () => setSelectedRunId(record.id) })}
        columns={[
          {
            title: t('pages.workflow.evaluations.createdAt'),
            dataIndex: 'created_at',
            width: 180,
            render: (value: string) => new Date(value).toLocaleString(),
          },
          {
            title: t('pages.workflow.evaluations.target'),
            key: 'target',
            render: (_: unknown, run: WorkflowTestRun) =>
              run.target_type === 'draft'
                ? t('pages.workflow.evaluations.draft')
                : `v${versionsQuery.data?.find((v) => v.id === run.target_version_id)?.version ?? '-'}`,
          },
          {
            title: t('pages.workflow.evaluations.statusLabel'),
            dataIndex: 'status',
            render: renderStatus,
          },
          {
            title: t('pages.workflow.evaluations.progress'),
            key: 'progress',
            width: 220,
            render: (_: unknown, run: WorkflowTestRun) => (
              <Progress
                size="small"
                percent={
                  run.total_count
                    ? Math.round(
                        ((run.completed_count +
                          run.failed_count +
                          run.cancelled_count) /
                          run.total_count) *
                          100,
                      )
                    : 0
                }
                format={() =>
                  `${run.completed_count + run.failed_count + run.cancelled_count}/${run.total_count}`
                }
              />
            ),
          },
          {
            title: t('pages.workflow.evaluations.actions'),
            width: 240,
            render: (_: unknown, run: WorkflowTestRun) => (
              <Space onClick={(event) => event.stopPropagation()}>
                {['queued', 'running'].includes(run.status) ? (
                  <Button
                    size="small"
                    icon={<StopOutlined />}
                    onClick={() => cancelRunMutation.mutate(run.id)}
                  >
                    {t('common.cancel')}
                  </Button>
                ) : null}
                {run.failed_count > 0 ? (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => rerunMutation.mutate(run.id)}
                  >
                    {t('pages.workflow.evaluations.rerunFailed')}
                  </Button>
                ) : null}
                <Button
                  size="small"
                  icon={<CloudDownloadOutlined />}
                  onClick={() =>
                    exportMutation.mutate({ runId: run.id, format: 'csv' })
                  }
                />
              </Space>
            ),
          },
        ]}
      />
    </>
  )

  const comparisonTab = (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 280 }}
          placeholder={t('pages.workflow.evaluations.leftRun')}
          value={leftRunId}
          onChange={setLeftRunId}
          options={completedRuns.map((run) => ({
            value: run.id,
            label: `${new Date(run.created_at).toLocaleString()} · ${run.target_type}`,
          }))}
        />
        <Select
          style={{ width: 280 }}
          placeholder={t('pages.workflow.evaluations.rightRun')}
          value={rightRunId}
          onChange={setRightRunId}
          options={completedRuns
            .filter((run) => run.id !== leftRunId)
            .map((run) => ({
              value: run.id,
              label: `${new Date(run.created_at).toLocaleString()} · ${run.target_type}`,
            }))}
        />
      </Space>
      <Table
        rowKey="case_id"
        loading={comparisonQuery.isLoading}
        dataSource={comparisonQuery.data?.cases ?? []}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: t('pages.workflow.evaluations.question'),
            dataIndex: 'question',
            ellipsis: true,
          },
          {
            title: (
              <span style={{ whiteSpace: 'nowrap' }}>
                {t('pages.workflow.evaluations.leftScore')}
              </span>
            ),
            dataIndex: 'left_score',
            width: 140,
          },
          {
            title: (
              <span style={{ whiteSpace: 'nowrap' }}>
                {t('pages.workflow.evaluations.rightScore')}
              </span>
            ),
            dataIndex: 'right_score',
            width: 148,
          },
          {
            title: t('pages.workflow.evaluations.delta'),
            dataIndex: 'score_delta',
            width: 100,
            render: (value: number | null) =>
              value == null
                ? '-'
                : `${value > 0 ? '+' : ''}${value.toFixed(2)}`,
          },
        ]}
      />
    </>
  )

  const selectedRun = runDetailQuery.data
  const selectedRunSummary = useMemo(
    () => summarizeRun(selectedRun),
    [selectedRun],
  )

  return (
    <div style={{ padding: 24 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => void navigate(`/workflow/flowise/${appId}/design`)}
        >
          {t('common.back')}
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {t('pages.workflow.evaluations.title')}
        </Title>
        <Text type="secondary">{appQuery.data?.name}</Text>
      </Space>

      <Tabs
        items={[
          {
            key: 'suites',
            label: t('pages.workflow.evaluations.suitesTab'),
            children: suiteTab,
          },
          {
            key: 'runs',
            label: t('pages.workflow.evaluations.runsTab'),
            children: runTab,
          },
          {
            key: 'comparison',
            label: t('pages.workflow.evaluations.comparisonTab'),
            children: comparisonTab,
          },
        ]}
      />

      <Modal
        open={suiteModalOpen}
        title={t('pages.workflow.evaluations.newSuite')}
        okText={t('common.create')}
        confirmLoading={createSuiteMutation.isPending}
        onCancel={() => setSuiteModalOpen(false)}
        onOk={() => void suiteForm.submit()}
        destroyOnHidden
      >
        <Form
          form={suiteForm}
          layout="vertical"
          onFinish={createSuiteMutation.mutate}
        >
          <Form.Item
            name="name"
            label={t('pages.workflow.evaluations.name')}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('pages.workflow.evaluations.nameRequired'),
              },
            ]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('pages.workflow.evaluations.description')}
          >
            <Input.TextArea rows={3} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={caseModalOpen}
        title={t(
          editingCase
            ? 'pages.workflow.evaluations.editCase'
            : 'pages.workflow.evaluations.addCase',
        )}
        okText={t(editingCase ? 'common.save' : 'common.create')}
        confirmLoading={saveCaseMutation.isPending}
        onCancel={closeCaseModal}
        onOk={() => void caseForm.submit()}
        destroyOnHidden
      >
        <Form
          form={caseForm}
          layout="vertical"
          onFinish={(values: TestCaseFormValues) =>
            saveCaseMutation.mutate({
              caseId: editingCase?.id,
              values,
            })
          }
        >
          <Form.Item
            name="question"
            label={t('pages.workflow.evaluations.question')}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} maxLength={20000} />
          </Form.Item>
          <Form.Item
            name="expected_answer"
            label={t('pages.workflow.evaluations.expectedAnswer')}
          >
            <Input.TextArea rows={3} maxLength={20000} />
          </Form.Item>
          <Form.Item name="tags" label={t('pages.workflow.evaluations.tags')}>
            <Input
              placeholder={t('pages.workflow.evaluations.commaSeparated')}
            />
          </Form.Item>
          <Form.Item
            name="variables"
            label={t('pages.workflow.evaluations.variables')}
            initialValue="{}"
            rules={[
              {
                validator: async (_, value: string | undefined) => {
                  try {
                    parseVariables(value)
                  } catch {
                    throw new Error(
                      t('pages.workflow.evaluations.variablesInvalid'),
                    )
                  }
                },
              },
            ]}
          >
            <Input.TextArea rows={5} spellCheck={false} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={runModalOpen}
        title={t('pages.workflow.evaluations.startRun')}
        okText={t('pages.workflow.evaluations.run')}
        confirmLoading={createRunMutation.isPending}
        onCancel={() => setRunModalOpen(false)}
        onOk={() => void runForm.submit()}
        destroyOnHidden
      >
        <Form
          form={runForm}
          layout="vertical"
          initialValues={{
            suite_id: selectedSuiteId,
            target_type: 'draft',
            exact_match: true,
            require_citations: true,
            llm_enabled: false,
          }}
          onFinish={createRunMutation.mutate}
        >
          <Form.Item
            name="suite_id"
            label={t('pages.workflow.evaluations.suite')}
            rules={[{ required: true }]}
          >
            <Select
              options={(suitesQuery.data ?? []).map((suite) => ({
                value: suite.id,
                label: suite.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="target_type"
            label={t('pages.workflow.evaluations.target')}
          >
            <Radio.Group>
              <Radio.Button value="draft">
                {t('pages.workflow.evaluations.draft')}
              </Radio.Button>
              <Radio.Button value="version">
                {t('pages.workflow.evaluations.version')}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(
              previous: Record<string, unknown>,
              current: Record<string, unknown>,
            ) => previous.target_type !== current.target_type}
          >
            {({ getFieldValue }) =>
              getFieldValue('target_type') === 'version' ? (
                <Form.Item
                  name="target_version_id"
                  label={t('pages.workflow.evaluations.version')}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={(versionsQuery.data ?? []).map((version) => ({
                      value: version.id,
                      label: `v${version.version} · ${version.checksum.slice(0, 8)}`,
                    }))}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="keywords"
            label={t('pages.workflow.evaluations.keywords')}
          >
            <Input
              placeholder={t('pages.workflow.evaluations.commaSeparated')}
            />
          </Form.Item>
          <Space size="large" wrap>
            <Form.Item
              name="exact_match"
              label={t('pages.workflow.evaluations.exactMatch')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="require_citations"
              label={t('pages.workflow.evaluations.requireCitations')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="llm_enabled"
              label={t('pages.workflow.evaluations.llmEvaluator')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item
            noStyle
            shouldUpdate={(
              previous: Record<string, unknown>,
              current: Record<string, unknown>,
            ) => previous.llm_enabled !== current.llm_enabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('llm_enabled') ? (
                <Form.Item
                  name="llm_model"
                  label={t('pages.workflow.nodeFields.model')}
                  rules={[{ required: true, whitespace: true }]}
                >
                  <Input maxLength={255} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={Boolean(selectedRunId)}
        size="min(860px, 92vw)"
        title={t('pages.workflow.evaluations.runDetail')}
        loading={runDetailQuery.isLoading}
        onClose={() => setSelectedRunId(undefined)}
        extra={
          selectedRun ? (
            <Space>
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={() =>
                  exportMutation.mutate({
                    runId: selectedRun.id,
                    format: 'json',
                  })
                }
              >
                JSON
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedRun ? (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.statusLabel')}
              >
                {renderStatus(selectedRun.status)}
              </Descriptions.Item>
              <Descriptions.Item label={t('pages.workflow.evaluations.target')}>
                {selectedRun.target_type}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.graphChecksum')}
              >
                <Text code>
                  {selectedRun.graph_checksum?.slice(0, 16) || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.promptChecksum')}
              >
                <Text code>
                  {selectedRun.prompt_checksum?.slice(0, 16) || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.successFailure')}
              >
                {selectedRun.completed_count} / {selectedRun.failed_count}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.averageLatency')}
              >
                {selectedRunSummary.averageLatency == null
                  ? '-'
                  : `${selectedRunSummary.averageLatency} ms`}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.totalTokens')}
              >
                {selectedRunSummary.totalTokens || '-'}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.averageScore')}
              >
                {selectedRunSummary.averageScore == null
                  ? '-'
                  : selectedRunSummary.averageScore.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item
                label={t('pages.workflow.evaluations.retrievalChannels')}
                span={2}
              >
                {selectedRunSummary.channels.length
                  ? selectedRunSummary.channels.map((channel) => (
                      <Tag key={channel}>{channel}</Tag>
                    ))
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="id"
              size="small"
              dataSource={selectedRun.results ?? []}
              pagination={{ pageSize: 20 }}
              expandable={{
                expandedRowRender: (result) => (
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item
                      label={t('pages.workflow.evaluations.expectedAnswer')}
                    >
                      {result.expected_answer ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.workflow.evaluations.actualAnswer')}
                    >
                      {result.actual_answer ??
                        getErrorMessage(result.error) ??
                        '-'}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.workflow.evaluations.evidence')}
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(
                          {
                            citations: result.citations,
                            evidence: result.evidence,
                            retrieval_trace: result.retrieval_trace,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              }}
              columns={[
                {
                  title: t('pages.workflow.evaluations.question'),
                  dataIndex: 'question',
                  ellipsis: true,
                },
                {
                  title: t('pages.workflow.evaluations.statusLabel'),
                  dataIndex: 'status',
                  width: 110,
                  render: renderStatus,
                },
                {
                  title: t('pages.workflow.evaluations.score'),
                  dataIndex: 'score',
                  width: 80,
                  render: (score: number | null) =>
                    score == null ? '-' : score.toFixed(2),
                },
                {
                  title: t('pages.workflow.evaluations.latency'),
                  dataIndex: 'metrics',
                  width: 100,
                  render: (metrics: Record<string, unknown>) => {
                    const value = getMetricNumber(metrics, 'latency_ms')
                    return value == null ? '-' : `${value} ms`
                  },
                },
              ]}
            />
          </>
        ) : null}
      </Drawer>
    </div>
  )
}
