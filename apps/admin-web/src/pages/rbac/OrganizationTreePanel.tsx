import { Button, Drawer, Form, Input, InputNumber, message, Popconfirm, Space, Spin } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { Tree } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminOrganizations_create,
  adminOrganizations_delete,
  adminOrganizations_update,
  adminOrganizations_tree,
  rbacKeys,
  type OrganizationCreateBody,
  type OrganizationUpdateBody,
} from '@/api/rbac'

export interface OrganizationTreePanelProps {
  open: boolean
  onClose: () => void
}

export function OrganizationTreePanel({
  open,
  onClose,
}: OrganizationTreePanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<DataNode | null>(null)
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const orgsQuery = useQuery({
    queryKey: rbacKeys.organizations(),
    queryFn: adminOrganizations_tree,
    enabled: open,
  })

  useMemo(() => {
    if (orgsQuery.data) {
      setTreeData(orgsQuery.data.map((node) => mapOrgNode(node)))
    }
  }, [orgsQuery.data])

  const openCreateChild = (parentId: string) => {
    setCreatingParentId(parentId)
    setEditingNode(null)
    form.resetFields()
    setFormOpen(true)
  }

  const openEdit = (node: DataNode) => {
    setEditingNode(node)
    setCreatingParentId(null)
    form.setFieldsValue({
      name: node.title as string,
      code: node.code as string,
      type: (node.type as string) || 'department',
      sort_order: node.sortOrder as number,
    })
    setFormOpen(true)
  }

  const openCreateRoot = () => {
    setEditingNode(null)
    setCreatingParentId(null)
    form.resetFields()
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()

    setSaving(true)
    try {
      if (editingNode) {
        await adminOrganizations_update(editingNode.key as string, values as OrganizationUpdateBody)
        message.success(t('pages.rbac.messages.orgUpdated'))
      } else {
        await adminOrganizations_create({
          ...values,
          parent_id: creatingParentId,
          type: values.type || 'department',
          status: 'active',
          sort_order: values.sort_order ?? 0,
        } as OrganizationCreateBody)
        message.success(t('pages.rbac.messages.orgCreated'))
      }

      setFormOpen(false)
      setEditingNode(null)
      setCreatingParentId(null)
      form.resetFields()
      void queryClient.invalidateQueries({ queryKey: rbacKeys.organizations() })
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (orgId: string) => {
    try {
      await adminOrganizations_delete(orgId)
      void queryClient.invalidateQueries({ queryKey: rbacKeys.organizations() })
      message.success(t('pages.rbac.messages.orgDeleted'))
    } catch {
      // handled globally
    }
  }

  return (
    <Drawer
      title={t('pages.rbac.drawers.organizationTree')}
      open={open}
      onClose={onClose}
      width={500}
    >
      {orgsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Tree
          showLine
          defaultExpandAll
          treeData={treeData}
          titleRender={(node) => (
            <div className="flex w-full items-center justify-between py-1">
              <span>
                <span className="font-medium">{node.title as string}</span>
                <span className="ml-2 text-xs text-gray-400">
                  ({node.type as string})
                </span>
              </span>
              <Space size={2} onClick={(e) => e.stopPropagation()}>
                <Button size="small" type="text" onClick={() => openCreateChild(node.key as string)}>
                  {t('pages.rbac.actions.addChild')}
                </Button>
                <Button size="small" type="text" onClick={() => openEdit(node)}>
                  {t('common.actions.edit')}
                </Button>
                <Popconfirm
                  title={t('pages.rbac.actions.deleteConfirmTitle')}
                  onConfirm={() => handleDelete(node.key as string)}
                  okText={t('common.actions.delete')}
                  okButtonProps={{ danger: true }}
                  cancelText={t('common.actions.cancel')}
                >
                  <Button size="small" type="text" danger>
                    {t('common.actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          )}
        />
      )}

      {/* Inline create root button */}
      {!formOpen && (
        <Button onClick={openCreateRoot} block className="mt-4">
          {t('pages.rbac.actions.addRootOrg')}
        </Button>
      )}

      {/* Inline form */}
      {formOpen && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 text-sm font-medium">
            {editingNode
              ? t('pages.rbac.drawers.editOrganization')
              : creatingParentId
                ? t('pages.rbac.drawers.createChildOrg')
                : t('pages.rbac.drawers.createRootOrg')}
          </div>
          <Form
            form={form}
            layout="vertical"
            size="small"
            onFinish={handleSubmit}
          >
            <Form.Item label={t('pages.rbac.form.name')} name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={t('pages.rbac.form.code')} name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label={t('pages.rbac.form.type')} name="type">
              <Input />
            </Form.Item>
            <Form.Item label={t('pages.rbac.form.sortOrder')} name="sort_order">
              <InputNumber min={0} />
            </Form.Item>
            <Space>
              <Button onClick={() => setFormOpen(false)}>{t('common.actions.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('pages.rbac.actions.save')}
              </Button>
            </Space>
          </Form>
        </div>
      )}
    </Drawer>
  )
}

function mapOrgNode(node: OrganizationNode): DataNode {
  return {
    key: node.id,
    title: node.name,
    type: node.type,
    code: node.code,
    sortOrder: node.sort_order,
    children: node.children?.length ? node.children.map(mapOrgNode) : undefined,
  }
}
