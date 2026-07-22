import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Button,
  Empty,
  Input,
  Segmented,
  Skeleton,
  Space,
  Table,
  Tag,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useAuthStore } from '@/store/useAuth'
import {
  workflowAdminApps_list,
  workflowAdminKeys,
  type AdminWorkflowApp,
  type WorkflowAppStatus,
} from '@/api/workflow-admin'
import { WorkflowAdminAppDetail } from './WorkflowAdminAppDetail'
import { WorkflowAdminTenantPicker } from './WorkflowAdminTenantPicker'

const STATUS_OPTIONS: { labelKey: string; value: WorkflowAppStatus | '' }[] = [
  { labelKey: 'common.filters.all', value: '' },
  { labelKey: 'pages.workflowAdmin.status.draft', value: 'draft' },
  {
    labelKey: 'pages.workflowAdmin.status.pending_approval',
    value: 'pending_approval',
  },
  { labelKey: 'pages.workflowAdmin.status.published', value: 'published' as WorkflowAppStatus },
  { labelKey: 'pages.workflowAdmin.status.active', value: 'active' },
  { labelKey: 'pages.workflowAdmin.status.disabled', value: 'disabled' },
]

const STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  pending_approval: 'gold',
  published: 'success',
  active: 'success',
  disabled: 'error',
}

const CATALOG_STATUS_COLOR: Record<string, string> = {
  active: 'blue',
  published: 'blue',
  pending_approval: 'warning',
  rejected: 'magenta',
  disabled: 'magenta',
}

export function WorkflowAdminApps() {
  const { t } = useTranslation()
  const isSuperuser = useAuthStore((state) => state.user?.is_superuser) === true
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkflowAppStatus | ''>('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [detailAppId, setDetailAppId] = useState<string | null>(null)
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
        render: (v: WorkflowAppStatus) => (
          <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag>
        ),
      },
      {
        title: t('pages.workflowAdmin.apps.catalogStatus', '目录状态'),
        dataIndex: 'catalog_status',
        key: 'catalog_status',
        width: 120,
        render: (v: string | null) => {
          if (!v) return <Tag color="default">—</Tag>
          return <Tag color={CATALOG_STATUS_COLOR[v] ?? 'default'}>{v}</Tag>
        },
      },
      {
        title: t('pages.workflowAdmin.apps.actions', '操作'),
        key: 'actions',
        width: 100,
        fixed: 'right' as const,
        render: (_: unknown, record: AdminWorkflowApp) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailAppId(record.id)}
          >
            {t('pages.workflowAdmin.apps.viewDetail', '查看')}
          </Button>
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
  }, [t, isSuperuser])

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
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            {t('pages.workflowAdmin.common.refresh', '刷新')}
          </Button>
        </Space>
      </PageHeader>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          prefix={<SearchOutlined />}
          allowClear
          placeholder={t('pages.workflowAdmin.apps.searchPlaceholder', '搜索应用名')}
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
            setStatusFilter(v as WorkflowAppStatus | '')
            setPage(1)
          }}
        />
      </Space>

      {isFetching && items.length === 0 ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length === 0 ? (
        <Empty description={t('pages.workflowAdmin.apps.empty', '暂无 Workflow 应用')} />
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

      <WorkflowAdminAppDetail
        appId={detailAppId}
        open={detailAppId !== null}
        onClose={() => setDetailAppId(null)}
      />
    </PageContainer>
  )
}

export default WorkflowAdminApps
