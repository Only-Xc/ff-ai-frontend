import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tree,
  message,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer } from '@ff-ai-frontend/components'
import {
  serviceCategories_list,
  serviceCategory_create,
  serviceCategory_delete,
  serviceCategory_update,
  type ServiceCategory,
  type ServiceCategoryCreate,
} from '@/api/service-catalog'

function toTreeData(cats: ServiceCategory[]): DataNode[] {
  const byId = new Map<string, DataNode>()
  cats.forEach((c) => byId.set(c.id, {
    key: c.id,
    title: `${c.name} (${c.code})`,
    children: [],
  }))
  const roots: DataNode[] = []
  cats.forEach((c) => {
    const node = byId.get(c.id)!
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export default function CategoryTreePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['service-catalog', 'categories'],
    queryFn: () => serviceCategories_list({}) as unknown as Promise<ServiceCategory[]>,
  })
  const [editing, setEditing] = useState<ServiceCategory | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<ServiceCategoryCreate>()

  const allCats = useMemo<ServiceCategory[]>(() => {
    const out: ServiceCategory[] = []
    const walk = (cats: ServiceCategory[]) => {
      cats.forEach((c) => {
        out.push(c); if (c.children) walk(c.children as ServiceCategory[])
      })
    }
    walk(tree as ServiceCategory[])
    return out
  }, [tree])

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof serviceCategory_create>[0]) =>
      serviceCategory_create(body),
    onSuccess: () => { message.success(t('pages.serviceCatalog.messages.created')); qc.invalidateQueries({ queryKey: ['service-catalog'] }); setModalOpen(false) },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      serviceCategory_update(id, body),
    onSuccess: () => { message.success(t('pages.serviceCatalog.messages.updated')); qc.invalidateQueries({ queryKey: ['service-catalog'] }); setEditing(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => serviceCategory_delete(id),
    onSuccess: () => { message.success(t('pages.serviceCatalog.messages.deleted')); qc.invalidateQueries({ queryKey: ['service-catalog'] }) },
  })

  const openCreate = (parentId?: string) => {
    form.resetFields()
    form.setFieldsValue({ parent_id: parentId ?? null, status: 'active', sort_order: 0 } as any)
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (cat: ServiceCategory) => {
    setEditing(cat); form.setFieldsValue(cat as any); setModalOpen(true)
  }
  const submit = async () => {
    const v = await form.validateFields().catch(() => null)
    if (editing) {
      updateMut.mutate({ id: editing.id, body: v })
    } else {
      createMut.mutate(v)
    }
  }

  return (
    <PageContainer>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
          {t('pages.serviceCatalog.actions.createCategory')}
        </Button>
      </Space>
      {isLoading ? (
        <Alert type="info" message="loading..." />
      ) : allCats.length === 0 ? (
        <Empty />
      ) : (
        <Tree
          treeData={toTreeData(allCats as ServiceCategory[])}
          showLine
          defaultExpandAll
          titleRender={(node) => {
            const cat = allCats.find((c) => c.id === node.key)
            if (!cat) return node.title as any
            return (
              <Space>
                <span>{cat.name}</span>
                <Button size="small" icon={<PlusOutlined />} onClick={() => cat && openCreate(cat.id)} />
                <Button size="small" icon={<EditOutlined />} onClick={() => cat && openEdit(cat)} />
                <Popconfirm
                  title={t('pages.serviceCatalog.actions.confirmDelete')}
                  onConfirm={() => cat && deleteMut.mutate(cat.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }}
        />
      )}
      <Modal
        title={editing ? t('pages.serviceCatalog.actions.editCategory') : t('pages.serviceCatalog.actions.createCategory')}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null) }}
        onOk={submit}
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('pages.serviceCatalog.columns.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t('pages.serviceCatalog.columns.code')} rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="sort_order" label={t('pages.serviceCatalog.columns.sortOrder')}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label={t('pages.serviceCatalog.columns.status')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
