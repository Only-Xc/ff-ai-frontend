import { Button, Card, Drawer, Form, Input, InputNumber, message, Popconfirm, Radio, Select, Space, Spin, Table, Tag, Tooltip, Tree } from 'antd'
import type { RadioChangeEvent } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import { ReloadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminOrganizations_create,
  adminOrganizations_delete,
  adminOrganizations_tree,
  adminOrganizations_update,
  rbacKeys,
  type OrganizationCreateBody,
  type OrganizationNode,
  type OrganizationUpdateBody,
} from '@/api/rbac'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

type ViewMode = 'list' | 'tree'

interface OrgDataNode extends DataNode {
  type?: string
  code?: string
  sortOrder?: number
  children?: OrgDataNode[]
}

const { Search } = Input

export default function OrganizationPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [keyword, setKeyword] = useState<string>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<OrganizationNode | null>(null)
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const treeQuery = useQuery({
    queryKey: rbacKeys.organizationTree(),
    queryFn: adminOrganizations_tree,
  })

  // ─── Helpers ───
  const orgMap = useMemo(() => {
    const map = new Map<string, OrganizationNode>()
    treeQuery.data?.forEach((org) => map.set(org.id, org))
    return map
  }, [treeQuery.data])

  // ─── Filter tree data by keyword (client-side) ───
  const filteredTreeData = useMemo(() => {
    if (!treeQuery.data) return []
    if (!keyword.trim()) return treeQuery.data
    const lower = keyword.toLowerCase()
    function filter(nodes: OrganizationNode[]): OrganizationNode[] {
      const result: OrganizationNode[] = []
      for (const node of nodes) {
        const nameMatch = node.name.toLowerCase().includes(lower)
        const codeMatch = node.code.toLowerCase().includes(lower)
        const childMatch = node.children?.length ? filter(node.children) : []
        if (nameMatch || codeMatch || childMatch.length > 0) {
          result.push({
            ...node,
            children: childMatch.length > 0 ? childMatch : node.children,
          })
        }
      }
      return result
    }
    return filter(treeQuery.data)
  }, [treeQuery.data, keyword])

  // ─── Mutations ───
  const createMutation = useMutation({
    mutationFn: adminOrganizations_create,
    onSuccess: () => {
      message.success(t('pages.rbac.orgs.messages.createSuccess'))
      setFormOpen(false)
      setCreatingParentId(null)
      form.resetFields()
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
    onError: (err: Error) => message.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminOrganizations_update>[1] }) =>
      adminOrganizations_update(id, data),
    onSuccess: () => {
      message.success(t('pages.rbac.orgs.messages.updateSuccess'))
      setFormOpen(false)
      setEditingOrg(null)
      form.resetFields()
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
    onError: (err: Error) => message.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: adminOrganizations_delete,
    onSuccess: () => {
      message.success(t('pages.rbac.orgs.messages.deleteSuccess'))
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
  })

  // ─── Actions ───
  const handleSearch = (value: string) => {
    setKeyword(value)
  }

  const openCreateRoot = () => {
    setEditingOrg(null)
    setCreatingParentId(null)
    form.resetFields()
    setFormOpen(true)
  }

  const openCreateChild = (parentId: string) => {
    setEditingOrg(null)
    setCreatingParentId(parentId)
    form.resetFields()
    setFormOpen(true)
  }

  const openEdit = (record: OrganizationNode) => {
    setEditingOrg(record)
    setCreatingParentId(null)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type || 'tenant',
      sort_order: record.sort_order,
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingOrg) {
        await updateMutation.mutateAsync({
          id: editingOrg.id,
          data: values as OrganizationUpdateBody,
        })
      } else {
        await createMutation.mutateAsync({
          ...values,
          parent_id: creatingParentId || null,
          type: values.type || 'tenant',
          status: 'active',
          sort_order: values.sort_order ?? 0,
        } as OrganizationCreateBody)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewModeChange = (e: RadioChangeEvent) => {
    setViewMode(e.target.value as ViewMode)
  }

  // ─── Tree data mapping ───
  function mapToTreeData(nodes: OrganizationNode[]): OrgDataNode[] {
    return nodes.map((node) => ({
      key: node.id,
      title: node.name,
      code: node.code,
      type: node.type,
      sortOrder: node.sort_order,
      children: node.children?.length ? mapToTreeData(node.children) : undefined,
    }))
  }

  const treeData: OrgDataNode[] = useMemo(() => {
    if (!filteredTreeData.length) return []
    return mapToTreeData(filteredTreeData)
  }, [filteredTreeData])

  // ─── List columns ───
  const columns: ColumnsType<OrganizationNode> = useMemo(() => [
    {
      title: t('pages.rbac.orgs.columns.name'),
      key: 'name',
      render: (_, record) => (
        <span className="font-medium">{record.name}</span>
      ),
    },
    {
      title: t('pages.rbac.orgs.columns.parent'),
      key: 'parent',
      width: 160,
      render: (_, record) => {
        const parent = record.parent_id ? orgMap.get(record.parent_id) : null
        return parent ? (
          <span className="text-xs text-gray-500">{parent.name}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )
      },
    },
    {
      title: t('pages.rbac.orgs.columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 200,
      ellipsis: { showTitle: false },
      render: (code: string) => (
        <Tooltip placement="topLeft" title={code}>
          <span className="text-xs text-gray-500 cursor-default">{code}</span>
        </Tooltip>
      ),
    },
    {
      title: t('pages.rbac.orgs.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type || 'tenant'}</Tag>,
    },
    {
      title: t('pages.rbac.orgs.columns.actions'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size={0} split={<span className="mx-1 text-gray-300">|</span>}>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            {t('pages.rbac.orgs.actions.edit')}
          </Button>
          <Button size="small" type="link" onClick={() => openCreateChild(record.id)}>
            {t('pages.rbac.actions.addChild')}
          </Button>
          <Popconfirm
            title={t('pages.rbac.orgs.messages.deleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t('pages.rbac.orgs.actions.delete')}
            okButtonProps={{ danger: true }}
            cancelText={t('pages.rbac.orgs.actions.cancel')}
          >
            <Button size="small" type="link" danger>
              {t('pages.rbac.orgs.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [t, orgMap])

  const getDrawerTitle = () => {
    if (editingOrg) return t('pages.rbac.drawers.editOrganization')
    if (creatingParentId) return t('pages.rbac.drawers.createChildOrg')
    return t('pages.rbac.drawers.createRootOrg')
  }

  return (
    <PageContainer className="min-h-full p-4">
      <PageHeader
        title={t('pages.rbac.orgs.title')}
        subtitle={t('pages.rbac.orgs.subtitle')}
      >
        <Space>
          <Radio.Group value={viewMode} onChange={handleViewModeChange} size="small">
            <Radio.Button value="list">{t('pages.rbac.orgs.view.list')}</Radio.Button>
            <Radio.Button value="tree">{t('pages.rbac.orgs.view.tree')}</Radio.Button>
          </Radio.Group>
          <Button icon={<ReloadOutlined />} onClick={() => treeQuery.refetch()} loading={treeQuery.isFetching}>
            {t('pages.rbac.actions.refresh')}
          </Button>
          <Button type="primary" onClick={openCreateRoot}>
            {t('pages.rbac.orgs.actions.addRoot')}
          </Button>
        </Space>
      </PageHeader>

      {viewMode === 'list' && (
        <>
          <Card className="mb-4">
            <Form layout="inline">
              <Form.Item>
                <Search
                  placeholder={t('pages.rbac.orgs.form.searchPlaceholder')}
                  onSearch={handleSearch}
                  allowClear
                  style={{ width: 240 }}
                />
              </Form.Item>
            </Form>
          </Card>

          <Card styles={{ body: { padding: 0 } }}>
            {treeQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spin />
              </div>
            ) : (
              <Table<OrganizationNode>
                rowKey="id"
                size="middle"
                columns={columns}
                dataSource={filteredTreeData}
                loading={treeQuery.isFetching}
                pagination={false}
              />
            )}
          </Card>
        </>
      )}

      {viewMode === 'tree' && (
        <Card>
          {treeQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spin />
            </div>
          ) : (
            <Tree
              showLine={{ showLeafIcon: false }}
              defaultExpandAll
              treeData={treeData}
              className="org-tree"
              titleRender={(node) => (
                <span className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{node.title as string}</span>
                  <Tag bordered={false} color="blue" className="m-0 text-xs">{(node as OrgDataNode).type as string}</Tag>
                  <span className="text-xs text-gray-400">({(node as OrgDataNode).code as string})</span>
                </span>
              )}
            />
          )}
        </Card>
      )}

      <Drawer
        title={getDrawerTitle()}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="small"
        footer={
          <Space>
            <Button onClick={() => setFormOpen(false)}>{t('pages.rbac.orgs.actions.cancel')}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t('pages.rbac.orgs.actions.save')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('pages.rbac.orgs.form.name')}
            name="name"
            rules={[
              { required: true, message: t('pages.rbac.orgs.form.nameRequired') },
              {
                validator: (_, value: string) => {
                  if (!value || !treeQuery.data) return Promise.resolve()
                  const allOrgs = treeQuery.data.flatMap((n) => [n, ...(n.children ?? [])])
                  const dup = allOrgs.find((o) => o.name === value && o.id !== editingOrg?.id)
                  return dup ? Promise.reject(new Error(t('pages.rbac.orgs.form.nameDuplicate', { name: dup.name }))) : Promise.resolve()
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('pages.rbac.orgs.form.code')}
            name="code"
            rules={[
              { required: true, message: t('pages.rbac.orgs.form.codeRequired') },
              {
                validator: (_, value: string) => {
                  if (!value || !treeQuery.data) return Promise.resolve()
                  const allOrgs = treeQuery.data.flatMap((n) => [n, ...(n.children ?? [])])
                  const dup = allOrgs.find((o) => o.code === value && o.id !== editingOrg?.id)
                  return dup ? Promise.reject(new Error(t('pages.rbac.orgs.form.codeDuplicate', { code: dup.code }))) : Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder={t('pages.rbac.orgs.form.codePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('pages.rbac.orgs.form.type')} name="type" initialValue="tenant">
            <Select options={[
              { value: 'tenant', label: t('pages.rbac.orgs.form.typeTenant') },
              { value: 'department', label: t('pages.rbac.orgs.form.typeDepartment') },
              { value: 'team', label: t('pages.rbac.orgs.form.typeTeam') },
            ]} />
          </Form.Item>
          <Form.Item label={t('pages.rbac.orgs.form.sortOrder')} name="sort_order" initialValue={0}>
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageContainer>
  )
}
