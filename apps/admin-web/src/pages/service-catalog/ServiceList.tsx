import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  serviceCatalogKeys,
  serviceCatalogService_delete,
  serviceCatalogServices_list,
  type ServiceDefinition,
  type ServiceListQuery,
} from '@/api/service-catalog'

const LEVELS = ['P0', 'P1', 'P2', 'P3'] as const
const STATUSES = ['active', 'inactive'] as const

export default function ServiceListPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [query, setQuery] = useState<ServiceListQuery>({
    skip: 0, limit: 20, keyword: '', service_level: undefined, status: undefined,
  })
  const { data, isLoading } = useQuery({
    queryKey: serviceCatalogKeys.services(query),
    queryFn: () => serviceCatalogServices_list(query),
  })
  const delMut = useMutation({
    mutationFn: (id: string) => serviceCatalogService_delete(id),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: serviceCatalogKeys.all })
    },
  })

  const columns: ColumnsType<ServiceDefinition> = [
    { title: t('pages.serviceCatalog.columns.code'), dataIndex: 'code' },
    { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
    {
      title: t('pages.serviceCatalog.columns.serviceLevel'),
      dataIndex: 'service_level',
      render: (v: string) => <Tag color={v === 'P0' ? 'red' : v === 'P1' ? 'orange' : 'blue'}>{v}</Tag>,
    },
    {
      title: t('pages.serviceCatalog.columns.status'),
      dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
    {
      title: t('pages.serviceCatalog.columns.actions'),
      render: (_: any, row: ServiceDefinition) => (
        <Space>
          <Link to={`/service-catalog/services/${row.id}`}>
            <Button size="small">{t('pages.serviceCatalog.actions.view')}</Button>
          </Link>
          <Link to={`/service-catalog/services/${row.id}/edit`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
          <Button
            size="small" danger icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: t('pages.serviceCatalog.actions.confirmDelete'),
                onOk: () => delMut.mutate(row.id),
              })
            }
          />
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader title={t('routes.serviceCatalog.services.title')} />
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          style={{ width: 240 }}
          placeholder={t('pages.serviceCatalog.actions.searchKeyword')}
          value={query.keyword}
          onChange={(e) => setQuery({ ...query, keyword: e.target.value, skip: 0 })}
        />
        <Select
          allowClear
          style={{ width: 120 }}
          placeholder={t('pages.serviceCatalog.columns.serviceLevel')}
          value={query.service_level}
          onChange={(v) => setQuery({ ...query, service_level: v, skip: 0 })}
          options={LEVELS.map((v) => ({ value: v, label: v }))}
        />
        <Select
          allowClear
          style={{ width: 120 }}
          placeholder={t('pages.serviceCatalog.columns.status')}
          value={query.status}
          onChange={(v) => setQuery({ ...query, status: v, skip: 0 })}
          options={STATUSES.map((v) => ({ value: v, label: v }))}
        />
        <Link to="/service-catalog/services/new/edit">
          <Button type="primary" icon={<PlusOutlined />}>
            {t('pages.serviceCatalog.actions.createService')}
          </Button>
        </Link>
        <Link to="/service-catalog/import">
          <Button>{t('pages.serviceCatalog.actions.importFile')}</Button>
        </Link>
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={columns}
        pagination={{
          total: data?.count ?? 0,
          current: Math.floor((query.skip ?? 0) / (query.limit ?? 20)) + 1,
          pageSize: query.limit,
          onChange: (page) => setQuery({ ...query, skip: (page - 1) * (query.limit ?? 20) }),
        }}
      />
    </PageContainer>
  )
}
