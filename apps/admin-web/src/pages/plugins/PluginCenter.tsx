import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import {
  pluginKeys,
  plugins_delete,
  plugins_get,
  plugins_importCompose,
  plugins_install,
  plugins_list,
  plugins_register,
  plugins_update,
  type PluginDefinition,
  type ComposeImportErrorDetail,
  type PluginDefinitionUpdateBody,
  type PluginInstallBody,
  type PluginRegistrationBody,
} from '@/api/plugins'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { InstallPluginModal } from './components/InstallPluginModal'
import { PluginCenterTabs } from './components/PluginCenterTabs'
import { PluginStatusTag } from './components/PluginStatusTag'
import { PluginRegistrationModal } from './components/PluginRegistrationModal'
import { INSTALLABLE_SOURCE_TYPES } from './constants'

export default function PluginCenter() {
  const { message, modal } = App.useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pagination = usePaginationParams({ defaultPageSize: 20 })
  const [keyword, setKeyword] = useState('')
  const [installPluginId, setInstallPluginId] = useState<string>()
  const [editingPlugin, setEditingPlugin] = useState<PluginDefinition>()
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [composeImportError, setComposeImportError] =
    useState<ComposeImportErrorDetail>()
  const [editForm] = Form.useForm<PluginDefinitionUpdateBody>()
  const params = useMemo(
    () => ({ keyword: keyword || undefined, ...pagination.query }),
    [keyword, pagination.query],
  )
  const listQuery = useQuery({
    queryKey: pluginKeys.list(params),
    queryFn: () => plugins_list(params),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data?.data.some((item) => item.install_in_progress)
        ? 3000
        : false,
  })
  const installDetailQuery = useQuery({
    queryKey: pluginKeys.detail(installPluginId ?? ''),
    queryFn: () => plugins_get(installPluginId!),
    enabled: Boolean(installPluginId),
  })
  const installMutation = useMutation({
    mutationFn: (body: PluginInstallBody) =>
      plugins_install(installPluginId!, body),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.messages.installQueued'))
      setInstallPluginId(undefined)
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
    },
  })
  const registrationMutation = useMutation({
    mutationFn: (body: PluginRegistrationBody) => plugins_register(body),
    onSuccess: async (plugin) => {
      message.success('插件已注册，首个版本已发布')
      setRegistrationOpen(false)
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
      void navigate(`/plugins/${plugin.plugin_id}`)
    },
  })
  const composeImportMutation = useMutation({
    mutationFn: (file: File) => plugins_importCompose(file),
    onMutate: () => setComposeImportError(undefined),
    onSuccess: async ({ plugin }) => {
      message.success('插件已从 Docker Compose 自动注册')
      setRegistrationOpen(false)
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
      void navigate(`/plugins/${plugin.plugin_id}`)
    },
    onError: (error) => setComposeImportError(readComposeImportError(error)),
  })
  const updateMutation = useMutation({
    mutationFn: (body: PluginDefinitionUpdateBody) =>
      plugins_update(editingPlugin!.plugin_id, body),
    onSuccess: async () => {
      message.success('插件名称和描述已更新')
      setEditingPlugin(undefined)
      editForm.resetFields()
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (pluginId: string) => plugins_delete(pluginId),
    onSuccess: async () => {
      message.success('插件已删除')
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
    },
  })

  const openEditModal = (plugin: PluginDefinition) => {
    setEditingPlugin(plugin)
    editForm.setFieldsValue({
      name: plugin.name,
      description: plugin.description,
    })
  }

  const confirmDelete = (plugin: PluginDefinition) => {
    modal.confirm({
      title: `删除插件“${plugin.name}”？`,
      content:
        '删除后将从插件目录移除，但历史版本、安装记录和审计记录会继续保留。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteMutation.mutateAsync(plugin.plugin_id)
      },
    })
  }

  const columns: TableProps<PluginDefinition>['columns'] = [
    {
      title: t('pages.pluginCenter.columns.plugin'),
      dataIndex: 'name',
      width: 250,
      render: (_, record) => (
        <div className="min-w-0">
          <Button
            className="h-auto! max-w-full p-0! text-left"
            type="link"
            onClick={() => void navigate(`/plugins/${record.plugin_id}`)}
          >
            <span className="truncate font-medium">{record.name}</span>
          </Button>
          <Typography.Text className="block font-mono text-xs" type="secondary">
            {record.plugin_id}
          </Typography.Text>
          {record.description ? (
            <Typography.Paragraph
              className="mb-0! mt-1! max-w-72 text-xs"
              ellipsis={{ rows: 1, tooltip: record.description }}
              type="secondary"
            >
              {record.description}
            </Typography.Paragraph>
          ) : null}
        </div>
      ),
    },
    {
      title: t('pages.pluginCenter.columns.source'),
      dataIndex: 'source_type',
      width: 150,
      render: (value: string, record) => (
        <Space size={4} wrap>
          <Tag>{value}</Tag>
          {record.is_official ? <Tag color="blue">Official</Tag> : null}
        </Space>
      ),
    },
    {
      title: t('pages.pluginCenter.columns.status'),
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <PluginStatusTag status={value} />,
    },
    {
      align: 'right',
      title: t('pages.pluginCenter.columns.versions'),
      dataIndex: 'version_count',
      width: 90,
    },
    {
      align: 'right',
      title: t('pages.pluginCenter.columns.installations'),
      dataIndex: 'installation_count',
      width: 100,
    },
    {
      title: t('pages.pluginCenter.columns.health'),
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Tag color="green">{record.healthy_installation_count}</Tag>
          <Tag color={record.failed_installation_count ? 'red' : 'default'}>
            {record.failed_installation_count}
          </Tag>
        </Space>
      ),
    },
    {
      title: t('pages.pluginCenter.columns.updatedAt'),
      dataIndex: 'updated_at',
      width: 160,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      fixed: 'right',
      align: 'center',
      title: t('pages.pluginCenter.columns.actions'),
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('pages.pluginCenter.actions.detail')}>
            <Button
              aria-label={t('pages.pluginCenter.actions.detail')}
              icon={<EyeOutlined />}
              type="text"
              onClick={() => void navigate(`/plugins/${record.plugin_id}`)}
            />
          </Tooltip>
          <Tooltip
            title={
              record.install_in_progress
                ? record.install_block_reason
                : INSTALLABLE_SOURCE_TYPES.has(record.source_type)
                  ? t('pages.pluginCenter.actions.install')
                  : t('pages.pluginCenter.install.managedExternally')
            }
          >
            <span>
              <Button
                aria-label={t('pages.pluginCenter.actions.install')}
                disabled={
                  record.install_in_progress ||
                  !INSTALLABLE_SOURCE_TYPES.has(record.source_type)
                }
                icon={<DownloadOutlined />}
                type="text"
                onClick={() => setInstallPluginId(record.plugin_id)}
              />
            </span>
          </Tooltip>
          <Tooltip title="修改名称和描述">
            <Button
              aria-label="修改插件"
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip
            title={record.can_delete ? '删除插件' : record.delete_block_reason}
          >
            <span>
              <Button
                aria-label="删除插件"
                danger
                disabled={!record.can_delete}
                icon={<DeleteOutlined />}
                loading={
                  deleteMutation.isPending &&
                  deleteMutation.variables === record.plugin_id
                }
                type="text"
                onClick={() => confirmDelete(record)}
              />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer className="p-5">
      <PageHeader
        subtitle={t('pages.pluginCenter.subtitle')}
        title={t('pages.pluginCenter.title')}
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={listQuery.isFetching}
            onClick={() => void listQuery.refetch()}
          >
            {t('common.actions.refresh')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              setComposeImportError(undefined)
              setRegistrationOpen(true)
            }}
          >
            添加插件
          </Button>
        </Space>
      </PageHeader>

      <PluginCenterTabs />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          allowClear
          className="w-80"
          placeholder={t('pages.pluginCenter.search')}
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value)
            pagination.reset()
          }}
        />
      </div>

      {listQuery.isError ? (
        <Alert
          className="mb-4"
          action={
            <Button size="small" onClick={() => void listQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
          title={t('pages.pluginCenter.loadFailed')}
          showIcon
          type="error"
        />
      ) : null}

      <Table<PluginDefinition>
        columns={columns}
        dataSource={listQuery.data?.data ?? []}
        loading={listQuery.isPending}
        rowKey="id"
        scroll={{ x: 1190 }}
        size="middle"
        pagination={{
          ...pagination.props,
          total: listQuery.data?.count ?? 0,
          showTotal: (total) => t('pages.pluginCenter.total', { total }),
        }}
      />

      <InstallPluginModal
        open={Boolean(installPluginId)}
        plugin={installDetailQuery.data}
        submitting={installMutation.isPending || installDetailQuery.isPending}
        onCancel={() => setInstallPluginId(undefined)}
        onSubmit={(body) => installMutation.mutate(body)}
      />
      <PluginRegistrationModal
        open={registrationOpen}
        composeError={composeImportError}
        submitting={
          registrationMutation.isPending || composeImportMutation.isPending
        }
        onCancel={() => {
          setComposeImportError(undefined)
          setRegistrationOpen(false)
        }}
        onComposeImport={(file) =>
          composeImportMutation.mutateAsync(file).then(() => undefined)
        }
        onSubmit={(body) => registrationMutation.mutate(body)}
      />
      <Modal
        destroyOnHidden
        confirmLoading={updateMutation.isPending}
        okText="保存"
        open={Boolean(editingPlugin)}
        title="修改插件信息"
        onCancel={() => {
          setEditingPlugin(undefined)
          editForm.resetFields()
        }}
        onOk={() => {
          void editForm.validateFields().then((values) => {
            const description = values.description?.trim()
            updateMutation.mutate({
              name: values.name?.trim(),
              description: description ?? null,
            })
          })
        }}
      >
        <Form form={editForm} layout="vertical" requiredMark="optional">
          <Form.Item
            label="插件名称"
            name="name"
            rules={[
              { required: true, whitespace: true, message: '请输入插件名称' },
              { max: 255, message: '插件名称不能超过 255 个字符' },
            ]}
          >
            <Input placeholder="请输入插件名称" />
          </Form.Item>
          <Form.Item
            label="插件描述"
            name="description"
            rules={[{ max: 4000, message: '插件描述不能超过 4000 个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入插件描述"
              rows={4}
              showCount
              maxLength={4000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

function readComposeImportError(error: unknown): ComposeImportErrorDetail {
  const data =
    typeof error === 'object' && error !== null && 'data' in error
      ? (error as { data?: unknown }).data
      : undefined
  const detail =
    typeof data === 'object' && data !== null && 'detail' in data
      ? (data as { detail?: unknown }).detail
      : undefined
  if (isComposeImportErrorDetail(detail)) return detail
  return {
    code: 'COMPOSE_IMPORT_FAILED',
    message: error instanceof Error ? error.message : '检测 Docker 实际运行状态失败。',
    reasons: [],
  }
}

function isComposeImportErrorDetail(
  value: unknown,
): value is ComposeImportErrorDetail {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    'message' in value &&
    typeof value.message === 'string' &&
    'reasons' in value &&
    Array.isArray(value.reasons)
  )
}
