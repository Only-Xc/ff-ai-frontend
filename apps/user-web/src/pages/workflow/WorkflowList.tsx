import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
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
  draft: 'default',
  published: 'success',
  disabled: 'warning',
  archived: 'default',
}

const CATALOG_STATUS_COLORS: Record<string, string> = {
  active: 'success',
  pending_approval: 'processing',
  rejected: 'error',
  disabled: 'warning',
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

  const { data, isLoading } = useQuery({
    queryKey: workflowKeys.appList({ page, search, status: statusFilter }),
    queryFn: () =>
      listWorkflowApps({ page, page_size: 20, search, status: statusFilter }),
  })

  const createMutation = useMutation({
    mutationFn: createWorkflowApp,
    onSuccess: (res: Awaited<ReturnType<typeof createWorkflowApp>>) => {
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
      message.success(t('pages.workflow.createSuccess'))
      void navigate(`/workflow/${res.id}`)
    },
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
      render: (name: string, record: WorkflowApp) => (
        <a onClick={() => { void navigate(`/workflow/${record.id}`) }}>{name}</a>
      ),
    },
    {
      title: t('pages.workflow.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: WorkflowApp) => (
        <Space size={4}>
          <Tag color={STATUS_COLORS[status] ?? 'default'}>
            {t(`pages.workflow.status.${status}`, status)}
          </Tag>
          {record.catalog_status === 'pending_approval' && (
            <Tag color={CATALOG_STATUS_COLORS.pending_approval}>
              {t('pages.workflow.catalogStatus.pendingApproval')}
            </Tag>
          )}
          {record.catalog_status === 'rejected' && (
            <Tag color={CATALOG_STATUS_COLORS.rejected}>
              {t('pages.workflow.catalogStatus.rejected')}
            </Tag>
          )}
        </Space>
      ),
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
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('pages.workflow.columns.actions'),
      key: 'actions',
      render: (_: unknown, record: WorkflowApp) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { void navigate(`/workflow/${record.id}`) }}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => duplicateMutation.mutate(record.id)}
          >
            {t('common.duplicate')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
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
          createMutation.mutate({ name: newName, description: newDesc || undefined })
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
        </Space>
      </Modal>
    </div>
  )
}
