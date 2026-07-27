import { DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Empty,
  Input,
  Popconfirm,
  Segmented,
  Skeleton,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useAuthStore } from '@/store/useAuth'
import {
  workflowAdminApp_delete,
  workflowAdminApps_list,
  workflowAdminKeys,
  type AdminWorkflowApp,
  type WorkflowAppStatus,
} from '@/api/workflow-admin'
import { WorkflowAdminTenantPicker } from './WorkflowAdminTenantPicker'

const STATUS_OPTIONS: { labelKey: string; value: WorkflowAppStatus | '' }[] = [
  { labelKey: 'common.filters.all', value: '' },
  { labelKey: 'pages.workflowAdmin.status.draft', value: 'draft' },
  {
    labelKey: 'pages.workflowAdmin.status.pending_approval',
    value: 'pending_approval',
  },
  { labelKey: 'pages.workflowAdmin.status.published', value: 'published' },
  { labelKey: 'pages.workflowAdmin.status.active', value: 'active' },
  { labelKey: 'pages.workflowAdmin.status.disabled', value: 'disabled' },
]

const STATUS_COLOR: Record<string, string> = {
  approved: 'success',
  draft: 'default',
  pending_approval: 'gold',
  published: 'success',
  active: 'success',
  disabled: 'error',
  deleted: 'error',
}

const CATALOG_STATUS_COLOR: Record<string, string> = {
  active: 'blue',
  building: 'blue',
  published: 'blue',
  pending_approval: 'warning',
  rejected: 'magenta',
  disabled: 'magenta',
  deleted: 'error',
}

export function WorkflowAdminApps() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isSuperuser = useAuthStore((state) => state.user?.is_superuser) === true
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkflowAppStatus | ''>('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    undefined,
  )
  const [page, setPage] = useState(1)
  const pageSize = 20

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(keyword.trim() ? { search: keyword.trim() } : {}),
      ...(selectedOrgId ? { org_id: selectedOrgId } : {}),
    }),
    [page, statusFilter, keyword, selectedOrgId],
  )

  const { data, isFetching, refetch } = useQuery({
    queryKey: workflowAdminKeys.apps(queryParams),
    queryFn: () => workflowAdminApps_list(queryParams),
    placeholderData: keepPreviousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (appId: string) => workflowAdminApp_delete(appId),
    onSuccess: () => {
      message.success(t('pages.workflowAdmin.apps.deleteSuccess', '应用已删除'))
      void queryClient.invalidateQueries({
        queryKey: workflowAdminKeys.all,
      })
    },
    onError: (err: Error) => {
      message.error(err.message || t('common.errors.unknown'))
    },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const scope = data?.scope ?? 'tenant'

  const columns: TableProps<AdminWorkflowApp>['columns'] = useMemo(() => {
    const cols: TableProps<AdminWorkflowApp>['columns'] = [
      {
        title: t('pages.workflowAdmin.apps.name', '应用名称'),
        dataIndex: 'name',
        key: 'name',
        width: 180,
        ellipsis: true,
      },
      {
        title: t('pages.workflowAdmin.apps.status', '状态'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (v: WorkflowAppStatus, record: AdminWorkflowApp) => {
          const displayStatus =
            record.catalog_status === 'building' ? 'approved' : v
          return (
            <Tag color={STATUS_COLOR[displayStatus] ?? 'default'}>
              {t(`pages.workflowAdmin.status.${displayStatus}`, displayStatus)}
            </Tag>
          )
        },
      },
      {
        title: t('pages.workflowAdmin.apps.catalogStatus', '发布状态'),
        dataIndex: 'catalog_status',
        key: 'catalog_status',
        width: 120,
        render: (v: string | null) => {
          if (!v) return <Tag color="default">—</Tag>
          return (
            <Tag color={CATALOG_STATUS_COLOR[v] ?? 'default'}>
              {t(`pages.workflowAdmin.catalogStatus.${v}`, v)}
            </Tag>
          )
        },
      },
      {
        title: t('pages.workflowAdmin.apps.actions', '操作'),
        key: 'actions',
        width: 150,
        fixed: 'right',
        render: (_: unknown, record: AdminWorkflowApp) => (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                void navigate(`/workflow-apps/${record.id}/review`)
              }}
            >
              {t('pages.workflowAdmin.apps.viewDetail', '查看')}
            </Button>
            <Popconfirm
              title={t('pages.workflowAdmin.apps.deleteConfirm', '确定删除该应用？删除后不可恢复。')}
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText={t('common.actions.confirm')}
              cancelText={t('common.actions.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              >
                {t('common.actions.delete', '删除')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]

    // 仅超管可见租户 ID 列
    if (isSuperuser) {
      cols.splice(2, 0, {
        title: t('pages.workflowAdmin.apps.orgId', '租户 ID'),
        dataIndex: 'org_id',
        key: 'org_id',
        width: 200,
        ellipsis: true,
      })
    }

    cols.push(
      {
        title: t('pages.workflowAdmin.apps.updatedAt', '更新时间'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: (v: string) =>
          v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '—',
      },
      {
        title: t('pages.workflowAdmin.apps.description', '描述'),
        dataIndex: 'description',
        key: 'description',
        width: 200,
        ellipsis: true,
      },
    )

    return cols
  }, [t, isSuperuser, navigate])

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.workflowAdmin.apps.title', 'Workflow 应用列表')}
        subtitle={t(
          'pages.workflowAdmin.apps.subtitle',
          '跨租户 Workflow 应用管理（仅 system_admin 可跨租户；tenant_admin 仅看自己）',
        )}
      >
        <Space>
          {isSuperuser && (
            <WorkflowAdminTenantPicker
              scope={scope}
              value={selectedOrgId}
              onChange={(orgId) => {
                setSelectedOrgId(orgId)
                setPage(1)
              }}
            />
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void refetch()
            }}
          >
            {t('pages.workflowAdmin.common.refresh', '刷新')}
          </Button>
        </Space>
      </PageHeader>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          prefix={<SearchOutlined />}
          allowClear
          placeholder={t(
            'pages.workflowAdmin.apps.searchPlaceholder',
            '搜索应用名',
          )}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
          style={{ width: 260 }}
        />
        <Segmented
          options={STATUS_OPTIONS.map((it) => ({
            label: t(it.labelKey, it.value || '全部'),
            value: it.value,
          }))}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
        />
      </Space>

      {isFetching && items.length === 0 ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length === 0 ? (
        <Empty
          description={t(
            'pages.workflowAdmin.apps.empty',
            '暂无 Workflow 应用',
          )}
        />
      ) : (
        <Table<AdminWorkflowApp>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isFetching}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: setPage,
          }}
        />
      )}
    </PageContainer>
  )
}

export default WorkflowAdminApps
