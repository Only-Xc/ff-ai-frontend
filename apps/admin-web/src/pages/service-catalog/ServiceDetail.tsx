import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Descriptions, Empty, List, Popconfirm, Table, Tabs, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  serviceAgentLink_delete,
  serviceAgentLinks_list,
  serviceCatalogService_get,
  serviceNode_delete,
  serviceNodes_list,
  serviceSystem_delete,
  serviceSystems_list,
} from '@/api/service-catalog'

export default function ServiceDetailPage() {
  const { t } = useTranslation()
  const { serviceId = '' } = useParams<{ serviceId: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { data: detail, isLoading } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId],
    queryFn: () => serviceCatalogService_get(serviceId),
    enabled: !!serviceId && serviceId !== 'new',
  })
  const { data: nodes = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'nodes'],
    queryFn: () => serviceNodes_list(serviceId),
    enabled: !!serviceId && serviceId !== 'new',
  })
  const { data: systems = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'systems'],
    queryFn: () => serviceSystems_list(serviceId),
    enabled: !!serviceId && serviceId !== 'new',
  })
  const { data: agentLinks = [] } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId, 'agent-links'],
    queryFn: () => serviceAgentLinks_list(serviceId),
    enabled: !!serviceId && serviceId !== 'new',
  })

  const delNodeMut = useMutation({
    mutationFn: (id: string) => serviceNode_delete(serviceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'nodes'] }),
  })
  const delSystemMut = useMutation({
    mutationFn: (id: string) => serviceSystem_delete(serviceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'systems'] }),
  })
  const delLinkMut = useMutation({
    mutationFn: (id: string) => serviceAgentLink_delete(serviceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-catalog', 'service', serviceId, 'agent-links'] }),
  })

  if (isLoading) return <PageContainer><Empty description="loading" /></PageContainer>
  if (!detail) return <PageContainer><Empty /></PageContainer>

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
              <Table
                rowKey="id"
                dataSource={nodes}
                pagination={false}
                columns={[
                  { title: '#', dataIndex: 'sequence' },
                  { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
                  { title: t('pages.serviceCatalog.columns.nodeType'), dataIndex: 'node_type', render: (v: string) => <Tag>{v}</Tag> },
                  { title: t('pages.serviceCatalog.columns.estimatedDuration'), dataIndex: 'estimated_duration_minutes' },
                  {
                    title: t('pages.serviceCatalog.columns.actions'),
                    render: (_: any, row: any) => (
                      <Popconfirm title={t('pages.serviceCatalog.actions.confirmDelete')} onConfirm={() => delNodeMut.mutate(row.id)}>
                        <Button danger size="small">{t('pages.serviceCatalog.actions.delete')}</Button>
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'systems',
            label: `${t('pages.serviceCatalog.tabs.systems')} (${systems.length})`,
            children: (
              <Table
                rowKey="id"
                dataSource={systems}
                pagination={false}
                columns={[
                  { title: t('pages.serviceCatalog.columns.name'), dataIndex: 'name' },
                  { title: t('pages.serviceCatalog.columns.systemType'), dataIndex: 'system_type', render: (v: string) => <Tag>{v}</Tag> },
                  { title: 'URL', dataIndex: 'url' },
                  {
                    title: t('pages.serviceCatalog.columns.actions'),
                    render: (_: any, row: any) => (
                      <Popconfirm title={t('pages.serviceCatalog.actions.confirmDelete')} onConfirm={() => delSystemMut.mutate(row.id)}>
                        <Button danger size="small">{t('pages.serviceCatalog.actions.delete')}</Button>
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'agents',
            label: `${t('pages.serviceCatalog.tabs.agentLinks')} (${agentLinks.length})`,
            children: (
              <List
                dataSource={agentLinks}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Popconfirm key="del" title={t('pages.serviceCatalog.actions.confirmDelete')} onConfirm={() => delLinkMut.mutate(item.id)}>
                        <Button danger size="small">{t('pages.serviceCatalog.actions.delete')}</Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={`${item.agent_id} · ${item.link_type}`}
                      description={item.description || item.task_id || '-'}
                    />
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
