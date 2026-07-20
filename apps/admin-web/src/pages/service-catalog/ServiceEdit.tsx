import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Select, Space, message } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { adminOrganizations_list, adminUsers_list } from '@/api/rbac'
import { useAuthStore } from '@/store/useAuth'
import {
  serviceCategories_list,
  serviceCatalogService_create,
  serviceCatalogService_get,
  serviceCatalogService_update,
  type ServiceCategory,
  type ServiceDefinitionCreate,
  type ServiceLevel,
} from '@/api/service-catalog'

const LEVELS: ServiceLevel[] = ['P0', 'P1', 'P2', 'P3']

export default function ServiceEditPage() {
  const { t } = useTranslation()
  const { serviceId } = useParams<{ serviceId: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()
  const isNew = serviceId === 'new' || !serviceId
  const [form] = Form.useForm<ServiceDefinitionCreate>()
  // 当前登录用户（auth store），新建服务时作为默认 owner_user_id
  const currentUser = useAuthStore((s) => s.user)

  const { data: cats = [] } = useQuery({
    queryKey: ['service-catalog', 'categories'],
    queryFn: () => serviceCategories_list() as unknown as Promise<ServiceCategory[]>,
  })
  const { data: orgsData } = useQuery({
    queryKey: ['rbac', 'organizations', 'for-service-catalog'],
    queryFn: () => adminOrganizations_list({ skip: 0, limit: 100 }),
  })
  const orgs = orgsData?.data ?? []
  const { data: usersData } = useQuery({
    queryKey: ['rbac', 'users', 'for-service-catalog'],
    queryFn: () => adminUsers_list({ skip: 0, limit: 200 }),
  })
  const users = usersData?.data ?? []
  const { data: existing } = useQuery({
    queryKey: ['service-catalog', 'service', serviceId],
    queryFn: () => serviceCatalogService_get(serviceId!),
    enabled: !isNew,
  })

  useEffect(() => {
    if (existing) form.setFieldsValue(existing.service as any)
    else if (currentUser) form.setFieldsValue({ owner_user_id: currentUser.id } as any)
  }, [existing, form, currentUser])

  const saveMut = useMutation({
    mutationFn: async (body: ServiceDefinitionCreate) => {
      if (isNew) return serviceCatalogService_create({ ...body, owner_user_id: body.owner_user_id || currentUser?.id || '' })
      return serviceCatalogService_update(serviceId!, body)
    },
    onSuccess: () => {
      message.success(t('pages.serviceCatalog.messages.saved'))
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
      nav('/service-catalog/services')
    },
    onError: (e: any) => message.error(e?.response?.data?.detail ?? 'error'),
  })

  const submit = async () => {
    const v = await form.validateFields()
    saveMut.mutate(v as ServiceDefinitionCreate)
  }

  return (
    <PageContainer>
      <PageHeader
        title={isNew ? t('pages.serviceCatalog.actions.createService') : t('pages.serviceCatalog.actions.editService')}
      />
      <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
        <Form.Item name="name" label={t('pages.serviceCatalog.columns.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label={t('pages.serviceCatalog.columns.code')} rules={[{ required: true }]}>
          <Input disabled={!isNew} />
        </Form.Item>
        <Form.Item name="category_id" label={t('pages.serviceCatalog.columns.categoryCode')} rules={[{ required: true }]}>
          <Select options={cats.map((c: any) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="organization_id" label={t('pages.serviceCatalog.columns.organization')}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('pages.serviceCatalog.actions.optionalPlaceholder')}
            options={orgs.map((o: any) => ({ value: o.id, label: `${o.name} (${o.code})` }))}
          />
        </Form.Item>
        <Form.Item name="owner_user_id" label={t('pages.serviceCatalog.columns.owner')} rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={users.map((u: any) => ({ value: u.id, label: `${u.full_name || u.email} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="service_level" label={t('pages.serviceCatalog.columns.serviceLevel')} rules={[{ required: true }]}>
          <Select options={LEVELS.map((v) => ({ value: v, label: v }))} />
        </Form.Item>
        <Form.Item name="status" label={t('pages.serviceCatalog.columns.status')}>
          <Select options={[{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }]} />
        </Form.Item>
        <Form.Item name="description" label={t('pages.serviceCatalog.columns.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Space>
          <Button type="primary" loading={saveMut.isPending} onClick={submit}>
            {t('pages.serviceCatalog.actions.save')}
          </Button>
          <Button onClick={() => nav(-1)}>{t('pages.serviceCatalog.actions.cancel')}</Button>
        </Space>
      </Form>
    </PageContainer>
  )
}
