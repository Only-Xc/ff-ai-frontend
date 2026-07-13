import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Space, Table, Tag } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusOutlined } from '@ant-design/icons'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  type GrcRule,
  grcRules_list,
} from '@/api/grc'
import { RuleEditorDrawer } from './RuleEditorDrawer'

export function RuleLibrary() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<GrcRule | null>(null)
  const [filters] = useState({ category: undefined as string | undefined, is_active: undefined as boolean | undefined })

  const { data, isLoading } = useQuery({
    queryKey: ['grc', 'rules', filters],
    queryFn: () => grcRules_list({ ...filters, skip: 0, limit: 50 }),
  })

  const columns = [
    { title: t('pages.grc.rules.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('pages.grc.rules.name'), dataIndex: 'name', key: 'name' },
    { title: t('pages.grc.rules.category'), dataIndex: 'category', key: 'category', width: 120 },
    { title: t('pages.grc.rules.version'), key: 'version', width: 80, render: (r: GrcRule) => r.current_version ?? '-' },
    { title: t('pages.grc.rules.severity'), key: 'severity', width: 100, render: (r: GrcRule) => r.current_severity ? <Tag>{r.current_severity}</Tag> : '-' },
    { title: t('pages.grc.rules.status'), key: 'status', width: 100, render: (r: GrcRule) => <Tag color={r.is_active ? 'green' : 'default'}>{r.is_active ? t('common.enabled') : t('common.disabled')}</Tag> },
    { title: t('pages.grc.rules.actions'), key: 'actions', width: 200, render: (_: unknown, r: GrcRule) => (
      <Space>
        <Button size="small" onClick={() => { setEditingRule(r); setDrawerOpen(true) }}>Edit</Button>
      </Space>
    )},
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.rules.title')}
        subtitle={t('routes.grc.rules.subtitle')}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRule(null); setDrawerOpen(true) }}>
          {t('pages.grc.common.create') || 'Create'}
        </Button>
      </PageHeader>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        pagination={{ total: data?.count ?? 0, pageSize: 50 }}
      />
      <RuleEditorDrawer
        open={drawerOpen}
        rule={editingRule}
        onClose={() => { setDrawerOpen(false); setEditingRule(null) }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['grc', 'rules'] })}
      />
    </PageContainer>
  )
}

export default RuleLibrary
