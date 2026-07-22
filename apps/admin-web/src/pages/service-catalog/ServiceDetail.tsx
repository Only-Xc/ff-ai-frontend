import { ArrowDownOutlined, ArrowLeftOutlined, ArrowUpOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { adminOrganizations_list, adminRoles_list, adminUsers_list } from '@/api/rbac'
import {
  serviceAgentLink_create,
  serviceAgentLink_delete,
  serviceAgentLink_update,
  serviceAgentLinks_list,
  serviceCatalogService_get,
  serviceMaterial_create,
  serviceMaterial_delete,
  serviceMaterial_update,
  serviceMaterials_list,
  serviceNode_create,
  serviceNode_delete,
  serviceNode_update,
  serviceNodes_list,
  serviceNodes_reorder,
  serviceSystem_create,
  serviceSystem_delete,
  serviceSystem_update,
  serviceSystems_list,
  type ServiceAgentLinkCreate,
  type ServiceAgentLinkUpdate,
  type ServiceNodeMaterialCreate,
  type ServiceNodeMaterialUpdate,
  type ServiceProcessNode,
  type ServiceProcessNodeCreate,
  type ServiceRelatedSystemCreate,
} from '@/api/service-catalog'

const NODE_TYPES = ['manual', 'automated', 'semi_automated'] as const
const SYSTEM_TYPES = ['internal', 'external', 'api', 'platform'] as const
const LINK_TYPES = ['primary', 'supporting', 'reference'] as const
const MATERIAL_TYPES = ['input', 'output'] as const

export default function ServiceDetailPage() {
  const { t } = useTranslation()
  const { serviceId = '' } = useParams<{ serviceId: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()
  const enabled = !!serviceId && serviceId !== 'new'

  // ──────── 数据查询 ────────
  const { data: detail, isLoading } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId],
    queryFn: () => serviceCatalogService_get(serviceId),
    enabled,
  })
  const { data: nodes = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'nodes'],
    queryFn: () => serviceNodes_list(serviceId),
    enabled,
  })
  const { data: systems = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'systems'],
    queryFn: () => serviceSystems_list(serviceId),
    enabled,
  })
  const { data: agentLinks = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'agent-links'],
    queryFn: () => serviceAgentLinks_list(serviceId),
    enabled,
  })
  const { data: rolesResult } = useQuery({
    queryKey: ['rbac', 'roles', 'for-service-catalog'],
    queryFn: () => adminRoles_list({ skip: 0, limit: 200 }),
  })
  const roles = rolesResult?.data ?? []
  const { data: orgsData } = useQuery({
    queryKey: ['rbac', 'organizations', 'for-service-detail'],
    queryFn: () => adminOrganizations_list({ skip: 0, limit: 100 }),
  })
  const orgs = orgsData?.data ?? []
  const { data: usersData } = useQuery({
    queryKey: ['rbac', 'users', 'for-service-detail'],
    queryFn: () => adminUsers_list({ skip: 0, limit: 200 }),
  })
  const users = usersData?.data ?? []

  // ──────── Modal 状态 ────────
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<ServiceProcessNode | null>(null)
  const [systemModalOpen, setSystemModalOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<any | null>(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<any | null>(null)
  const [materialNodeId, setMaterialNodeId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)

  const [nodeForm] = Form.useForm()
  const [systemForm] = Form.useForm()
  const [agentForm] = Form.useForm()
  const [materialForm] = Form.useForm()

  const nodeKey = (id: string) => ['service-catalog', 'service', serviceId, 'nodes', id] as const

  // ──────── 节点 Mutations ────────
  const saveNodeMut = useMutation({
    mutationFn: async (values: any) => {
      if (editingNode) return serviceNode_update(serviceId, editingNode.id, values)
      return serviceNode_create(serviceId, values as ServiceProcessNodeCreate)
    },
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.saved'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'nodes'] })
      setNodeModalOpen(false)
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })
  const delNodeMut = useMutation({
    mutationFn: (id: string) => serviceNode_delete(serviceId, id),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'nodes'] })
    },
  })
  const reorderMut = useMutation({
    mutationFn: (nodeIds: string[]) => serviceNodes_reorder(serviceId, nodeIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'nodes'] })
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })

  // ──────── 材料 Mutations ────────
  const saveMaterialMut = useMutation({
    mutationFn: async (values: any) => {
      if (editingMaterial) return serviceMaterial_update(materialNodeId!, editingMaterial.id, values as ServiceNodeMaterialUpdate)
      return serviceMaterial_create(materialNodeId!, values as ServiceNodeMaterialCreate)
    },
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.saved'))
      qc.invalidateQueries({ queryKey: nodeKey(materialNodeId!) })
      setMaterialNodeId(null)
      setEditingMaterial(null)
      materialForm.resetFields()
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })
  const delMaterialMut = useMutation({
    mutationFn: ({ nodeId, materialId }: { nodeId: string; materialId: string }) =>
      serviceMaterial_delete(nodeId, materialId),
    onSuccess: (_d, vars) => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: nodeKey(vars.nodeId) })
    },
  })

  // ──────── 系统 Mutations ────────
  const saveSystemMut = useMutation({
    mutationFn: async (values: any) => {
      if (editingSystem) return serviceSystem_update(serviceId, editingSystem.id, values)
      return serviceSystem_create(serviceId, values as ServiceRelatedSystemCreate)
    },
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.saved'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'systems'] })
      setSystemModalOpen(false)
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })
  const delSystemMut = useMutation({
    mutationFn: (id: string) => serviceSystem_delete(serviceId, id),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'systems'] })
    },
  })

  // ──────── Agent 关联 Mutations ────────
  const saveAgentMut = useMutation({
    mutationFn: async (values: any) => {
      if (editingAgent) return serviceAgentLink_update(serviceId, editingAgent.id, values as ServiceAgentLinkUpdate)
      return serviceAgentLink_create(serviceId, values as ServiceAgentLinkCreate)
    },
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.saved'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'agent-links'] })
      setAgentModalOpen(false)
      setEditingAgent(null)
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })
  const delLinkMut = useMutation({
    mutationFn: (id: string) => serviceAgentLink_delete(serviceId, id),
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.deleted'))
      qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'agent-links'] })
    },
  })

  // ──────── Modal 打开/提交 ────────
  const openNodeModal = (node?: ServiceProcessNode) => {
    setEditingNode(node ?? null)
    nodeForm.resetFields()
    if (node) {
      nodeForm.setFieldsValue(node as any)
    } else {
      nodeForm.setFieldsValue({
        sequence: nodes.length + 1,
        node_type: 'manual',
      })
    }
    setNodeModalOpen(true)
  }

  const openSystemModal = (sys?: any) => {
    setEditingSystem(sys ?? null)
    systemForm.resetFields()
    if (sys) systemForm.setFieldsValue(sys)
    else systemForm.setFieldsValue({ system_type: 'internal' })
    setSystemModalOpen(true)
  }

  const openAgentModal = (link?: any) => {
    setEditingAgent(link ?? null)
    agentForm.resetFields()
    if (link) {
      agentForm.setFieldsValue(link)
    } else {
      agentForm.setFieldsValue({ link_type: 'primary' })
    }
    setAgentModalOpen(true)
  }

  if (isLoading) return <PageContainer><Empty description="loading" /></PageContainer>
  if (!detail) return <PageContainer><Empty /></PageContainer>

  // ──────── 材料子表（节点展开行） ────────
  const MaterialsSubTable = ({ nodeId }: { nodeId: string }) => {
    const { data: materials = [] } = useQuery({
      queryKey: nodeKey(nodeId),
      queryFn: () => serviceMaterials_list(nodeId),
    })
    return (
      <div style={{ padding: '4px 0' }}>
        <Space style={{ marginBottom: 8 }}>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingMaterial(null)
              materialForm.resetFields()
              materialForm.setFieldsValue({ material_type: 'input' })
              setMaterialNodeId(nodeId)
            }}
          >
            {t('pages.serviceCatalog.actions.addMaterial')}
          </Button>
          <span style={{ fontWeight: 500 }}>{t('pages.serviceCatalog.columns.materials')}</span>
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={materials}
          pagination={false}
          columns={[
            {
              title: t('pages.serviceCatalog.columns.materialType'),
              dataIndex: 'material_type',
              width: 100,
              render: (v: string) => <Tag color={v === 'input' ? 'blue' : 'green'}>{v}</Tag>,
            },
            { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
            { title: t('pages.serviceCatalog.columns.description'), dataIndex: 'description' },
            {
              title: t('pages.serviceCatalog.columns.actions'),
              width: 140,
              render: (_: any, row: any) => (
                <Space>
                  <Button size="small" onClick={() => {
                    setEditingMaterial(row)
                    materialForm.resetFields()
                    materialForm.setFieldsValue(row)
                    setMaterialNodeId(nodeId)
                  }}>
                    {t('pages.serviceCatalog.actions.edit')}
                  </Button>
                  <Popconfirm
                    title={t('pages.serviceCatalog.actions.confirmDelete')}
                    onConfirm={() => delMaterialMut.mutate({ nodeId, materialId: row.id })}
                  >
                    <Button danger size="small">{t('pages.serviceCatalog.actions.delete')}</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>
    )
  }

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
        title={detail.service.name}
        subtitle={t('routes.serviceCatalog.serviceDetail.title')}
      />
      <Tabs
        items={[
          {
            key: 'overview',
            label: t('pages.serviceCatalog.tabs.overview'),
            children: (
              <Card>
                <Descriptions column={2}>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.code')}>
                    {detail.service.code}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.serviceLevel')}>
                    <Tag>{detail.service.service_level}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.status')}>
                    <Tag color={detail.service.status === 'active' ? 'green' : 'default'}>
                      {detail.service.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.organization')}>
                    {(() => {
                      const org = orgs.find((o: any) => o.id === detail.service.organization_id)
                      return org ? `${org.name} (${org.code})` : '-'
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.owner')}>
                    {(() => {
                      const u = users.find((usr: any) => usr.id === detail.service.owner_user_id)
                      return u ? `${u.full_name || u.email}` : detail.service.owner_user_id || '-'
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('pages.serviceCatalog.columns.description')}>
                    {detail.service.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'nodes',
            label: `${t('pages.serviceCatalog.tabs.nodes')} (${nodes.length})`,
            children: (
              <>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 12 }}
                  onClick={() => openNodeModal()}
                >
                  {t('pages.serviceCatalog.actions.addNode')}
                </Button>
                <Table
                  rowKey="id"
                  dataSource={nodes}
                  pagination={false}
                  expandable={{
                    expandedRowRender: (row: ServiceProcessNode) => (
                      <MaterialsSubTable nodeId={row.id} />
                    ),
                  }}
                  columns={[
                    { title: '#', dataIndex: 'sequence', width: 50 },
                    { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
                    {
                      title: t('pages.serviceCatalog.columns.nodeType'),
                      dataIndex: 'node_type',
                      render: (v: string) => <Tag>{v}</Tag>,
                    },
                    {
                      title: t('pages.serviceCatalog.columns.handlerRole'),
                      dataIndex: 'handler_role_id',
                      render: (v: string | null) => {
                        if (!v) return '-'
                        const role = roles.find((r) => r.id === v)
                        return role ? role.name : v
                      },
                    },
                    {
                      title: t('pages.serviceCatalog.columns.estimatedDuration'),
                      dataIndex: 'estimated_duration_minutes',
                      render: (v: number | null) => v ?? '-',
                    },
                    {
                      title: t('pages.serviceCatalog.columns.actions'),
                      render: (_: any, row: ServiceProcessNode, index: number) => (
                        <Space>
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => {
                              const ids = nodes.map((n) => n.id)
                              ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
                              reorderMut.mutate(ids)
                            }}
                          />
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={index === nodes.length - 1}
                            onClick={() => {
                              const ids = nodes.map((n) => n.id)
                              ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
                              reorderMut.mutate(ids)
                            }}
                          />
                          <Button size="small" onClick={() => openNodeModal(row)}>
                            {t('pages.serviceCatalog.actions.edit')}
                          </Button>
                          <Popconfirm
                            title={t('pages.serviceCatalog.actions.confirmDelete')}
                            onConfirm={() => delNodeMut.mutate(row.id)}
                          >
                            <Button danger size="small">
                              {t('pages.serviceCatalog.actions.delete')}
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'systems',
            label: `${t('pages.serviceCatalog.tabs.systems')} (${systems.length})`,
            children: (
              <>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 12 }}
                  onClick={() => openSystemModal()}
                >
                  {t('pages.serviceCatalog.actions.addSystem')}
                </Button>
                <Table
                  rowKey="id"
                  dataSource={systems}
                  pagination={false}
                  columns={[
                    { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
                    {
                      title: t('pages.serviceCatalog.columns.systemType'),
                      dataIndex: 'system_type',
                      render: (v: string) => <Tag>{v}</Tag>,
                    },
                    { title: 'URL', dataIndex: 'url', render: (v: string | null) => v || '-' },
                    {
                      title: t('pages.serviceCatalog.columns.interfaceDesc'),
                      dataIndex: 'interface_description',
                      ellipsis: true,
                    },
                    {
                      title: t('pages.serviceCatalog.columns.actions'),
                      render: (_: any, row: any) => (
                        <Space>
                          <Button size="small" onClick={() => openSystemModal(row)}>
                            {t('pages.serviceCatalog.actions.edit')}
                          </Button>
                          <Popconfirm
                            title={t('pages.serviceCatalog.actions.confirmDelete')}
                            onConfirm={() => delSystemMut.mutate(row.id)}
                          >
                            <Button danger size="small">
                              {t('pages.serviceCatalog.actions.delete')}
                            </Button>
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'agents',
            label: `${t('pages.serviceCatalog.tabs.agentLinks')} (${agentLinks.length})`,
            children: (
              <>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 12 }}
                  onClick={() => openAgentModal()}
                >
                  {t('pages.serviceCatalog.actions.addAgentLink')}
                </Button>
                <List
                  dataSource={agentLinks}
                  locale={{ emptyText: <Empty description={t('pages.serviceCatalog.actions.emptyAgentHint')} /> }}
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Button key="edit" size="small" onClick={() => openAgentModal(item)}>
                          {t('pages.serviceCatalog.actions.edit')}
                        </Button>,
                        <Popconfirm
                          key="del"
                          title={t('pages.serviceCatalog.actions.confirmDelete')}
                          onConfirm={() => delLinkMut.mutate(item.id)}
                        >
                          <Button danger size="small">
                            {t('pages.serviceCatalog.actions.delete')}
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{item.agent_id}</span>
                            <Tag color={item.link_type === 'primary' ? 'blue' : 'default'}>
                              {item.link_type}
                            </Tag>
                          </Space>
                        }
                        description={item.description || item.task_id || '-'}
                      />
                    </List.Item>
                  )}
                />
              </>
            ),
          },
        ]}
      />

      {/* ──────── 节点 新建/编辑 Modal ──────── */}
      <Modal
        title={
          editingNode
            ? t('pages.serviceCatalog.actions.editNode')
            : t('pages.serviceCatalog.actions.addNode')
        }
        open={nodeModalOpen}
        onCancel={() => setNodeModalOpen(false)}
        onOk={() => nodeForm.submit()}
        confirmLoading={saveNodeMut.isPending}
        forceRender
      >
        <Form
          form={nodeForm}
          layout="vertical"
          onFinish={(v) => saveNodeMut.mutate(v)}
        >
          <Form.Item name="name" label={t('pages.serviceCatalog.columns.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} size={16}>
            <Form.Item name="sequence" label={t('pages.serviceCatalog.columns.sequence')} rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="node_type" label={t('pages.serviceCatalog.columns.nodeType')} rules={[{ required: true }]}>
              <Select
                style={{ width: 180 }}
                options={NODE_TYPES.map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
          </Space>
          <Form.Item name="handler_role_id" label={t('pages.serviceCatalog.columns.handlerRole')}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('pages.serviceCatalog.actions.optionalPlaceholder')}
              options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
            />
          </Form.Item>
          <Form.Item
            name="estimated_duration_minutes"
            label={t('pages.serviceCatalog.columns.estimatedDuration')}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label={t('pages.serviceCatalog.columns.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ──────── 系统 新建/编辑 Modal ──────── */}
      <Modal
        title={
          editingSystem
            ? t('pages.serviceCatalog.actions.editSystem')
            : t('pages.serviceCatalog.actions.addSystem')
        }
        open={systemModalOpen}
        onCancel={() => setSystemModalOpen(false)}
        onOk={() => systemForm.submit()}
        confirmLoading={saveSystemMut.isPending}
        forceRender
      >
        <Form
          form={systemForm}
          layout="vertical"
          onFinish={(v) => saveSystemMut.mutate(v)}
        >
          <Form.Item name="name" label={t('pages.serviceCatalog.columns.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="system_type" label={t('pages.serviceCatalog.columns.systemType')} rules={[{ required: true }]}>
            <Select options={SYSTEM_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="url" label="URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="interface_description" label={t('pages.serviceCatalog.columns.interfaceDesc')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ──────── Agent 关联 Modal ──────── */}
      <Modal
        title={
          editingAgent
            ? t('pages.serviceCatalog.actions.editAgentLink')
            : t('pages.serviceCatalog.actions.addAgentLink')
        }
        open={agentModalOpen}
        onCancel={() => { setAgentModalOpen(false); setEditingAgent(null) }}
        onOk={() => agentForm.submit()}
        confirmLoading={saveAgentMut.isPending}
        forceRender
      >
        <Form
          form={agentForm}
          layout="vertical"
          onFinish={(v) => saveAgentMut.mutate(v)}
        >
          <Form.Item name="agent_id" label={t('pages.serviceCatalog.columns.agentId')} rules={[{ required: true }]}>
            <Input placeholder="e.g. k8s_capacity_assessor" disabled={!!editingAgent} />
          </Form.Item>
          <Form.Item name="link_type" label={t('pages.serviceCatalog.columns.linkType')} rules={[{ required: true }]}>
            <Select options={LINK_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="task_id" label={t('pages.serviceCatalog.columns.taskId')}>
            <Input placeholder={t('pages.serviceCatalog.actions.optionalPlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('pages.serviceCatalog.columns.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ──────── 添加/编辑材料 Modal ──────── */}
      <Modal
        title={
          editingMaterial
            ? t('pages.serviceCatalog.actions.editMaterial')
            : t('pages.serviceCatalog.actions.addMaterial')
        }
        open={!!materialNodeId}
        onCancel={() => { setMaterialNodeId(null); setEditingMaterial(null) }}
        onOk={() => materialForm.submit()}
        confirmLoading={saveMaterialMut.isPending}
        forceRender
      >
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={(v) => saveMaterialMut.mutate(v)}
        >
          <Form.Item name="material_type" label={t('pages.serviceCatalog.columns.materialType')} rules={[{ required: true }]}>
            <Select options={MATERIAL_TYPES.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="name" label={t('pages.serviceCatalog.columns.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('pages.serviceCatalog.columns.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="template_path" label={t('pages.serviceCatalog.columns.templatePath')}>
            <Input placeholder={t('pages.serviceCatalog.actions.optionalPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}
