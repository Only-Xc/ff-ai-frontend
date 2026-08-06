import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  createWorkflowApp,
  deleteWorkflowApp,
  duplicateWorkflowApp,
  listWorkflowApps,
  workflowKeys,
  type WorkflowApp,
} from '@/api/workflow'

const STATUS_COLORS: Record<string, string> = {
  approved: 'success',
  draft: 'default',
  pending_approval: 'processing',
  building: 'blue',
  published: 'success',
  rejected: 'error',
  disabled: 'warning',
  archived: 'default',
}

export default function WorkflowList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAppType, setNewAppType] = useState<'chatflow' | 'agentflow'>(
    'chatflow',
  )

  const { data, isLoading } = useQuery({
    queryKey: workflowKeys.appList({ page, search, status: statusFilter }),
    queryFn: () =>
      listWorkflowApps({ page, page_size: 20, search, status: statusFilter }),
  })

  const scope = data?.scope ?? null
  const scopeColor =
    scope === 'global'
      ? 'geekblue'
      : scope === 'tenant'
        ? 'cyan'
        : scope === 'self'
          ? 'default'
          : 'default'

  const createMutation = useMutation({
    mutationFn: createWorkflowApp,
    onSuccess: (res: Awaited<ReturnType<typeof createWorkflowApp>>) => {
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
      setNewAppType('chatflow')
      message.success(t('pages.workflow.createSuccess'))
      void navigate(`/workflow/flowise/${res.id}/design`)
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflowApp,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      message.success(t('pages.workflow.deleteSuccess'))
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateWorkflowApp,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      message.success(t('pages.workflow.duplicateSuccess'))
    },
  })

  const handleDelete = (app: WorkflowApp) => {
    Modal.confirm({
      title: t('pages.workflow.deleteConfirmTitle'),
      content: t('pages.workflow.deleteConfirmContent', { name: app.name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutateAsync(app.id),
    })
  }

  const columns = [
    {
      title: t('pages.workflow.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name: string, record: WorkflowApp) => (
        <a
          onClick={() => {
            void navigate(`/workflow/flowise/${record.id}/design`)
          }}
        >
          {name}
        </a>
      ),
    },
    {
      title: t('pages.workflow.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string, record: WorkflowApp) => {
        const releaseStatus = record.catalog_status
        let displayStatuses: string[]
        if (releaseStatus === 'active') {
          displayStatuses = ['published']
        } else if (releaseStatus === 'building') {
          displayStatuses = ['building']
        } else if (
          releaseStatus === 'pending_approval' ||
          releaseStatus === 'rejected'
        ) {
          displayStatuses = [releaseStatus]
        } else {
          displayStatuses = [status]
        }

        return (
          <Space size={4}>
            {displayStatuses.map((displayStatus) => (
              <Tag
                key={displayStatus}
                color={STATUS_COLORS[displayStatus] ?? 'default'}
              >
                {t(`pages.workflow.status.${displayStatus}`, displayStatus)}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: t('pages.workflow.columns.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('pages.workflow.columns.updatedAt'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 190,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('pages.workflow.columns.actions'),
      key: 'actions',
      align: 'right' as const,
      width: 152,
      render: (_: unknown, record: WorkflowApp) => (
        <Space size={4}>
          <Tooltip title={t('common.edit')}>
            <Button
              type="text"
              size="small"
              aria-label={t('common.edit')}
              icon={<EditOutlined />}
              onClick={() => {
                void navigate(`/workflow/flowise/${record.id}/design`)
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.duplicate')}>
            <Button
              type="text"
              size="small"
              aria-label={t('common.duplicate')}
              icon={<CopyOutlined />}
              onClick={() => duplicateMutation.mutate(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('pages.workflow.evaluations.shortTitle')}>
            <Button
              type="text"
              size="small"
              aria-label={t('pages.workflow.evaluations.shortTitle')}
              icon={<ExperimentOutlined />}
              onClick={() => {
                void navigate(`/workflow/flowise/${record.id}/evaluations`)
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button
              type="text"
              size="small"
              danger
              aria-label={t('common.delete')}
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>{t('pages.menu.workflow')}</span>
            {scope && (
              <Tag color={scopeColor}>
                {t(`pages.workflow.scope.${scope}`, scope)}
              </Tag>
            )}
          </Space>
        }
      >
        {scope === 'self' && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('pages.workflow.roleFilteredHint')}
          />
        )}
        {scope && scope !== 'self' && (
          <div
            style={{
              marginBottom: 16,
              color: 'var(--ant-color-text-secondary)',
              fontSize: 13,
            }}
          >
            {t('pages.workflow.scopeHint')}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Space>
            <Input
              placeholder={t('pages.workflow.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder={t('pages.workflow.statusFilter')}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 140 }}
              options={[
                { label: t('pages.workflow.status.draft'), value: 'draft' },
                {
                  label: t('pages.workflow.status.published'),
                  value: 'published',
                },
                {
                  label: t('pages.workflow.status.disabled'),
                  value: 'disabled',
                },
                {
                  label: t('pages.workflow.status.archived'),
                  value: 'archived',
                },
              ]}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            {t('pages.workflow.create')}
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          scroll={{ x: 960 }}
          tableLayout="fixed"
          pagination={{
            current: page,
            total: data?.total ?? 0,
            pageSize: 20,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        title={t('pages.workflow.createTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() =>
          createMutation.mutate({
            name: newName,
            description: newDesc || undefined,
            app_type: newAppType,
          })
        }
        confirmLoading={createMutation.isPending}
        okButtonProps={{ disabled: !newName.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder={t('pages.workflow.namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input.TextArea
            placeholder={t('pages.workflow.descPlaceholder')}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
          />
          <div>
            <div style={{ marginBottom: 8 }}>{t('pages.workflow.appType')}</div>
            <Segmented
              block
              value={newAppType}
              onChange={(value) =>
                setNewAppType(value as 'chatflow' | 'agentflow')
              }
              options={[
                {
                  label: t('pages.workflow.appType.chatflow'),
                  value: 'chatflow',
                },
                {
                  label: t('pages.workflow.appType.agentflow'),
                  value: 'agentflow',
                },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
