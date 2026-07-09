import { ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'

import {
  adminRoles_list,
  rbacKeys,
  type Role,
  type RoleListQuery,
} from '@/api/rbac'
import { usePermission } from '@/hooks/usePermission'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { globalMessage } from '@/utils/message'

const DEFAULT_QUERY: RoleListQuery = {
  limit: 100,
  skip: 0,
}

export default function RoleList() {
  const { t } = useTranslation()
  const { hasPermission } = usePermission()
  const rolesQuery = useQuery({
    queryKey: rbacKeys.roles(DEFAULT_QUERY),
    queryFn: () => adminRoles_list(DEFAULT_QUERY),
    placeholderData: keepPreviousData,
  })

  const columns: TableProps<Role>['columns'] = [
    {
      title: t('pages.rbac.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text className="text-xs" type="secondary">
            {record.code}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.rbac.columns.scope'),
      dataIndex: 'scope_type',
      key: 'scope_type',
      width: 140,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: t('pages.rbac.columns.permissions'),
      dataIndex: 'permission_count',
      key: 'permission_count',
      width: 120,
      align: 'right',
    },
    {
      title: t('pages.rbac.columns.users'),
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      align: 'right',
    },
    {
      title: t('pages.rbac.columns.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>
          {value ? t('pages.rbac.status.active') : t('pages.rbac.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('pages.rbac.columns.system'),
      dataIndex: 'is_system',
      key: 'is_system',
      width: 120,
      render: (value: boolean) =>
        value ? <Tag color="blue">{t('pages.rbac.status.system')}</Tag> : '-',
    },
    {
      title: t('pages.rbac.columns.action'),
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Button
          size="small"
          disabled={!hasPermission('admin.roles.update')}
          onClick={() => {
            globalMessage.info(
              t('pages.rbac.messages.permissionDrawerPending', {
                name: record.name,
              }),
            )
          }}
        >
          {t('pages.rbac.actions.configure')}
        </Button>
      ),
    },
  ]

  return (
    <PageContainer className="min-h-full p-4">
      <PageHeader
        title={
          <Space>
            <SafetyCertificateOutlined />
            {t('pages.rbac.title')}
          </Space>
        }
        subtitle={t('pages.rbac.subtitle')}
      >
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void rolesQuery.refetch()}
        >
          {t('pages.rbac.actions.refresh')}
        </Button>
      </PageHeader>

      <Alert
        className="mb-4"
        showIcon
        type="info"
        message={t('pages.rbac.notice.title')}
        description={t('pages.rbac.notice.description')}
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Table<Role>
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rolesQuery.data?.data ?? []}
          loading={rolesQuery.isLoading || rolesQuery.isFetching}
          pagination={false}
        />
      </Card>
    </PageContainer>
  )
}
