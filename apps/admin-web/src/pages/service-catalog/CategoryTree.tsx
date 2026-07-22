import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tree,
  message,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  serviceCatalogKeys,
  serviceCategories_list,
  serviceCategory_create,
  serviceCategory_delete,
  serviceCategory_update,
  type ServiceCategory,
  type ServiceCategoryCreate,
} from '@/api/service-catalog'

function toTreeData(cats: ServiceCategory[]): DataNode[] {
  const byId = new Map<string, DataNode>()
  cats.forEach((c) =>
    byId.set(c.id, { key: c.id, title: c.name, children: [] }),
  )
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

const errorMessage = (e: any, fallback: string) =>
  e?.response?.data?.detail ?? e?.message ?? fallback

export default function CategoryTreePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { data: tree = [], isLoading } = useQuery({
    queryKey: serviceCatalogKeys.categories(),
    queryFn: () =>
      serviceCategories_list() as unknown as Promise<ServiceCategory[]>,
  })

  const [editing, setEditing] = useState<ServiceCategory | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<ServiceCategoryCreate & { parent_id?: string | null }>()

  const allCats = useMemo<ServiceCategory[]>(() => {
    const out: ServiceCategory[] = []
    const walk = (cats: ServiceCategory[]) => {
      cats.forEach((c) => {
        out.push(c)
        if (c.children) walk(c.children as ServiceCategory[])
      })
    }
    walk(tree as ServiceCategory[])
    return out
  }, [tree])

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof serviceCategory_create>[0]) =>
      serviceCategory_create(body),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.created'))
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
      setModalOpen(false)
    },
    onError: (e: any) =>
      message.error(errorMessage(e, t('pages.serviceCatalog.messages.createFailed'))),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      serviceCategory_update(id, body),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.updated'))
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
      setModalOpen(false)
      setEditing(null)
    },
    onError: (e: any) =>
      message.error(errorMessage(e, t('pages.serviceCatalog.messages.updateFailed'))),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => serviceCategory_delete(id),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
    },
    onError: (e: any) =>
      message.error(errorMessage(e, t('pages.serviceCatalog.messages.deleteBlocked'))),
  })

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      serviceCategory_update(id, { status }),
    onSuccess: (_data, vars) => {
      message.success(
        vars.status === 'active'
          ? t('pages.serviceCatalog.messages.activated')
          : t('pages.serviceCatalog.messages.deactivated'),
      )
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
    },
    onError: (e: any) =>
      message.error(errorMessage(e, t('pages.serviceCatalog.messages.updateFailed'))),
  })

  const openCreate = (parentId?: string) => {
    form.resetFields()
    form.setFieldsValue({
      parent_id: parentId ?? null,
      status: 'active',
      sort_order: 0,
    } as any)
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (cat: ServiceCategory) => {
    setEditing(cat)
    form.setFieldsValue({ ...cat, parent_id: cat.parent_id ?? null } as any)
    setModalOpen(true)
  }

  const submit = async () => {
    const v = await form.validateFields().catch(() => null)
    if (!v) return
    if (editing) {
      updateMut.mutate({ id: editing.id, body: v })
    } else {
      createMut.mutate(v as Parameters<typeof serviceCategory_create>[0])
    }
  }

  const findCat = (id: string | number | bigint) =>
    allCats.find((c) => c.id === id)

  /** 收集某个分类的所有后代 ID，用于编辑时禁止选择子孙作为父分类（防止循环引用） */
  const descendantIds = (rootId: string): Set<string> => {
    const ids = new Set<string>()
    const queue = [rootId]
    while (queue.length > 0) {
      const cur = queue.pop()!
      for (const c of allCats) {
        if (c.parent_id === cur && !ids.has(c.id)) {
          ids.add(c.id)
          queue.push(c.id)
        }
      }
    }
    return ids
  }

  const parentOptions = useMemo(() => {
    const excluded = editing ? descendantIds(editing.id) : new Set<string>()
    if (editing) excluded.add(editing.id)
    return allCats
      .filter((c) => !excluded.has(c.id))
      .map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCats, editing])

  const statusTag = (s: string) =>
    s === 'active' ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        {t('pages.serviceCatalog.actions.active')}
      </Tag>
    ) : (
      <Tag color="default">{t('pages.serviceCatalog.actions.inactive')}</Tag>
    )

  return (
    <PageContainer>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => nav('/service-catalog/services')}
        style={{ marginBottom: 4 }}
      >
        {t('pages.serviceCatalog.actions.back')}
      </Button>
      <PageHeader
        title={t('routes.serviceCatalog.categories.title')}
        subtitle={t('routes.serviceCatalog.categories.subtitle')}
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
          {t('pages.serviceCatalog.actions.createRootCategory')}
        </Button>
      </Space>

      {isLoading ? (
        <Alert type="info" message="loading..." />
      ) : allCats.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={4}>
              <span>{t('pages.serviceCatalog.actions.emptyHint')}</span>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
                {t('pages.serviceCatalog.actions.createRootCategory')}
              </Button>
            </Space>
          }
        />
      ) : (
        <Tree
          treeData={toTreeData(allCats as ServiceCategory[])}
          showLine
          defaultExpandAll
          titleRender={(node) => {
            const cat = findCat(node.key)
            if (!cat) return node.title as any
            const isActive = cat.status === 'active'
            return (
              <Space size={6} wrap>
                <strong style={{ textDecoration: isActive ? 'none' : 'line-through', color: isActive ? undefined : '#999' }}>
                  {cat.name}
                </strong>
                <Tag color="blue">{cat.code}</Tag>
                <Tag>#{cat.sort_order}</Tag>
                {statusTag(cat.status)}
                <Button
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => openCreate(cat.id)}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(cat)}
                />
                <Switch
                  size="small"
                  checked={isActive}
                  checkedChildren={t('pages.serviceCatalog.actions.active')}
                  unCheckedChildren={t('pages.serviceCatalog.actions.inactive')}
                  loading={toggleStatusMut.isPending}
                  onChange={(checked) =>
                    toggleStatusMut.mutate({
                      id: cat.id,
                      status: checked ? 'active' : 'inactive',
                    })
                  }
                />
                <Popconfirm
                  title={t('pages.serviceCatalog.actions.confirmDelete')}
                  description={t('pages.serviceCatalog.actions.confirmDeleteDesc')}
                  okText={t('pages.serviceCatalog.actions.delete')}
                  cancelText={t('pages.serviceCatalog.actions.cancel')}
                  onConfirm={() => deleteMut.mutate(cat.id)}
                >
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }}
        />
      )}

      <Modal
        title={
          editing
            ? t('pages.serviceCatalog.actions.editCategory')
            : t('pages.serviceCatalog.actions.createCategory')
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onOk={submit}
        confirmLoading={createMut.isPending || updateMut.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label={t('pages.serviceCatalog.columns.name')}
            rules={[{ required: true, max: 255 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('pages.serviceCatalog.columns.code')}
            rules={[
              { required: true, max: 128 },
              { pattern: /^[A-Za-z0-9_-]+$/, message: t('pages.serviceCatalog.actions.codePattern') },
            ]}
          >
            <Input disabled={!!editing} placeholder="IT-CLOUD" />
          </Form.Item>
          <Form.Item
            name="parent_id"
            label={t('pages.serviceCatalog.actions.parentCategory')}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('pages.serviceCatalog.actions.parentCategoryPlaceholder')}
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item name="sort_order" label={t('pages.serviceCatalog.columns.sortOrder')}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label={t('pages.serviceCatalog.columns.status')}>
            <Select
              options={[
                { value: 'active', label: t('pages.serviceCatalog.actions.active') },
                { value: 'inactive', label: t('pages.serviceCatalog.actions.inactive') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
