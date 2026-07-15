import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Input, Select, Space, Table, Tag } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  type GrcRule,
  grcRules_list,
} from '@/api/grc'
import { useAuthStore } from '@/store/useAuth'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { usePermission } from '@/hooks/usePermission'
import { RuleEditorDrawer } from './RuleEditorDrawer'
import { RuleTemplatePicker } from './RuleTemplatePicker'
import type { RuleTemplate } from './ruleTemplates'

const CATEGORY_OPTIONS = [
  'privacy',
  'security',
  'safety',
  'model',
  'data',
  'tool',
  'deployment',
  'access_control',
  'logging',
  'human_oversight',
  'legal',
  'operational',
]

const VERSION_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  published: 'green',
  retired: 'red',
}

export function RuleLibrary() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orgId = useAuthStore(state => state.organizationIds[0])
  const { hasPermission } = usePermission()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<GrcRule | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null)
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  const [keyword, setKeyword] = useState<string>('')
  const [committedKeyword, setCommittedKeyword] = useState<string>('')
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  const { current, pageSize, skip, limit, handleChange } = usePaginationParams({ defaultPageSize: 20 })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grc', 'rules', { category, isActive, keyword: committedKeyword, orgId, skip, limit }],
    queryFn: () =>
      grcRules_list({
        category,
        is_active: isActive,
        keyword: committedKeyword || undefined,
        organization_id: orgId ?? undefined,
        skip,
        limit,
      }),
  })

  const handleReset = () => {
    setCategory(undefined)
    setIsActive(undefined)
    setKeyword('')
    setCommittedKeyword('')
  }

  const handleTemplateSelect = (template: RuleTemplate) => {
    setEditingRule(null)
    setSelectedTemplate(template)
    setDrawerOpen(true)
  }

  const columns = [
    { title: t('pages.grc.rules.code'), dataIndex: 'code', key: 'code', width: 220,
      render: (v: string, r: GrcRule) => <a onClick={() => navigate(`/grc/rules/${r.id}`)}>{v}</a>,
    },
    { title: t('pages.grc.rules.name'), dataIndex: 'name', key: 'name' },
    { title: t('pages.grc.rules.category'), dataIndex: 'category', key: 'category', width: 120 },
    {
      title: t('pages.grc.rules.version'),
      key: 'version',
      width: 140,
      render: (r: GrcRule) => {
        if (r.current_version == null) return '-'
        const status = r.current_status ?? 'draft'
        const color = VERSION_STATUS_COLORS[status] ?? 'default'
        return (
          <Space size={4}>
            <span>v{r.current_version}</span>
            <Tag color={color}>{t(`pages.grc.rules.status_${status}`, status)}</Tag>
          </Space>
        )
      },
    },
    {
      title: t('pages.grc.rules.severity'),
      key: 'severity',
      width: 100,
      render: (r: GrcRule) => (r.current_severity ? <Tag>{r.current_severity}</Tag> : '-'),
    },
    {
      title: t('pages.grc.rules.ruleActive'),
      key: 'status',
      width: 100,
      render: (r: GrcRule) => (
        <Tag color={r.is_active ? 'green' : 'default'}>
          {r.is_active ? t('pages.grc.rules.enabled') : t('pages.grc.rules.disabled')}
        </Tag>
      ),
    },
    {
      title: t('pages.grc.rules.actions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, r: GrcRule) => (
        <Space>
          {hasPermission('admin.grc.rules.update') && (
            <Button size="small" onClick={() => { setEditingRule(r); setSelectedTemplate(null); setDrawerOpen(true) }}>
              {t('pages.grc.rules.edit')}
            </Button>
          )}
          {hasPermission('admin.grc.rules.create') && (
            <Button size="small" onClick={() => { setEditingRule(r); setSelectedTemplate(null); setDrawerOpen(true) }}>
              {t('pages.grc.rules.createVersion')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.rules.title')}
        subtitle={t('routes.grc.rules.subtitle')}
      >
        <Space>
          {hasPermission('admin.grc.rules.create') && (
            <>
              <Button onClick={() => setTemplatePickerOpen(true)}>
                {t('pages.grc.rules.fromTemplate')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRule(null); setSelectedTemplate(null); setDrawerOpen(true) }}>
                {t('pages.grc.common.create')}
              </Button>
            </>
          )}
        </Space>
      </PageHeader>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder={t('pages.grc.rules.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(v) => setCommittedKeyword(v.trim())}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder={t('pages.grc.rules.category')}
          value={category}
          onChange={setCategory}
          allowClear
          style={{ width: 160 }}
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
        />
        <Select
          placeholder={t('pages.grc.rules.status')}
          value={isActive}
          onChange={setIsActive}
          allowClear
          style={{ width: 140 }}
          options={[
            { value: true, label: t('pages.grc.rules.enabled') },
            { value: false, label: t('pages.grc.rules.disabled') },
          ]}
        />
        <Button onClick={handleReset}>{t('pages.grc.common.reset')}</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('pages.grc.common.refresh')}
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        pagination={{
          current: current,
          pageSize,
          total: data?.count ?? 0,
          onChange: handleChange,
          showSizeChanger: false,
        }}
      />
      <RuleEditorDrawer
        open={drawerOpen}
        rule={editingRule}
        template={selectedTemplate}
        onClose={() => { setDrawerOpen(false); setEditingRule(null); setSelectedTemplate(null) }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['grc', 'rules'] })}
      />
      <RuleTemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </PageContainer>
  )
}

export default RuleLibrary
