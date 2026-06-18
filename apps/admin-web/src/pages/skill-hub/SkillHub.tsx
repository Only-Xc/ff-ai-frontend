import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  Pagination,
  Popconfirm,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounceCallback } from 'usehooks-ts'

import {
  adminSkills_create,
  adminSkills_delete,
  adminSkills_get,
  adminSkillsKeys,
  adminSkills_list,
  adminSkills_update,
  type AdminSkillEnvironment,
  type AdminSkillListQuery,
  type AdminSkill,
  type AdminSkillStatus,
  type AdminSkillUpdateBody,
} from '@/api/skill-hub'
import {
  PageContainer,
  PageHeader,
  TableScrollYWrapper,
} from '@ff-ai-frontend/components'
import { numberUtils } from '@ff-ai-frontend/utils'
import { DictSelect } from '@ff-ai-frontend/dictionaries'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'

import { SkillDetailContent } from './components/SkillDetailContent'
import { SkillForm, type SkillFormRef } from './components/SkillForm'
import { EnvironmentTag, SkillStatusTag } from './components/SkillTags'
import type {
  SkillDrawerMode,
  SkillFilterValues,
  SkillFormValues,
} from './types'
import {
  buildSubmitBody,
  formatDateTime,
  getSkillFormValues,
  normalizeSkillFilters,
} from './utils'

export function SkillHub() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filterForm] = Form.useForm<SkillFilterValues>()
  const pagination = usePaginationParams()

  const [filters, setFilters] = useState<SkillFilterValues>({})
  const [drawerSkillId, setDrawerSkillId] = useState<string>()
  const [formDrawer, setFormDrawer] = useState<{
    initialValues: Partial<SkillFormValues>
    mode: SkillDrawerMode
    skillId?: string
  }>()
  const [editLoadingId, setEditLoadingId] = useState<string>()
  const skillFormRef = useRef<SkillFormRef>(null)
  const listParams = useMemo<AdminSkillListQuery>(
    () => ({
      ...filters,
      ...pagination.query,
    }),
    [filters, pagination.query],
  )

  const listQuery = useQuery({
    queryKey: adminSkillsKeys.list(listParams),
    queryFn: () => adminSkills_list(listParams),
    placeholderData: keepPreviousData,
  })

  const detailQuery = useQuery({
    queryKey: adminSkillsKeys.detail(drawerSkillId ?? ''),
    queryFn: () => adminSkills_get(drawerSkillId!),
    enabled: Boolean(drawerSkillId),
  })

  const closeFormDrawer = () => setFormDrawer(undefined)

  const createMutation = useMutation({
    mutationFn: adminSkills_create,
    onSuccess: () => {
      globalMessage.success(t('pages.skillHub.messages.createSuccess'))
      closeFormDrawer()
      pagination.reset()
      void queryClient.invalidateQueries({ queryKey: adminSkillsKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      skillId,
      data,
    }: {
      skillId: string
      data: AdminSkillUpdateBody
    }) => adminSkills_update(skillId, data),
    onSuccess: (_, { skillId }) => {
      globalMessage.success(t('pages.skillHub.messages.updateSuccess'))
      closeFormDrawer()
      void queryClient.invalidateQueries({ queryKey: adminSkillsKeys.lists() })

      if (drawerSkillId === skillId) {
        void queryClient.invalidateQueries({
          queryKey: adminSkillsKeys.detail(skillId),
        })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminSkills_delete,
    onSuccess: (_, skillId) => {
      globalMessage.success(t('pages.skillHub.messages.deleteSuccess'))

      if (drawerSkillId === skillId) {
        setDrawerSkillId(undefined)
      }

      if ((listQuery.data?.data.length ?? 0) === 1 && pagination.current > 1) {
        pagination.setCurrent(pagination.current - 1)
        return
      }

      void queryClient.invalidateQueries({ queryKey: adminSkillsKeys.lists() })
    },
  })

  const openCreateDrawer = () => {
    setFormDrawer({ initialValues: {}, mode: 'create' })
  }

  const openEditDrawer = async (skillId: string) => {
    setEditLoadingId(skillId)

    try {
      const skill = await adminSkills_get(skillId)

      setFormDrawer({
        initialValues: getSkillFormValues(skill),
        mode: 'edit',
        skillId,
      })
    } catch (error) {
      globalMessage.error(
        error instanceof Error
          ? error.message
          : t('pages.skillHub.errors.detailLoadFailed'),
      )
    } finally {
      setEditLoadingId(undefined)
    }
  }

  const columns: TableProps<AdminSkill>['columns'] = [
    {
      title: t('pages.skillHub.columns.name'),
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text copyable type="secondary">
            {record.skill_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.skillHub.columns.category'),
      dataIndex: 'category',
      width: 120,
      ellipsis: true,
    },
    {
      title: t('pages.skillHub.columns.environment'),
      dataIndex: 'environment',
      width: 100,
      render: (value: AdminSkillEnvironment) => (
        <EnvironmentTag environment={value} />
      ),
    },
    {
      title: t('pages.skillHub.columns.status'),
      dataIndex: 'status',
      width: 100,
      render: (value: AdminSkillStatus) => <SkillStatusTag status={value} />,
    },
    {
      title: t('pages.skillHub.columns.version'),
      dataIndex: 'version',
      width: 100,
    },
    {
      title: t('pages.skillHub.columns.callCount'),
      dataIndex: 'call_count',
      width: 120,
      render: (value: number) => numberUtils.formatNumber(value),
    },
    {
      title: t('pages.skillHub.columns.successRate'),
      dataIndex: 'success_rate',
      width: 120,
      render: (value: number | null) =>
        numberUtils.formatPercent(value, { decimals: 1 }),
    },
    {
      title: t('pages.skillHub.columns.updatedAt'),
      dataIndex: 'updated_at',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: t('pages.skillHub.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 300,
      render: (_, record) => (
        <Space size={4}>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => setDrawerSkillId(record.skill_id)}
          >
            {t('common.actions.detail')}
          </Button>
          <Button
            loading={editLoadingId === record.skill_id}
            icon={<EditOutlined />}
            type="link"
            onClick={() => void openEditDrawer(record.skill_id)}
          >
            {t('common.actions.edit')}
          </Button>
          <Popconfirm
            title={t('pages.skillHub.actions.deleteConfirmTitle')}
            description={t('pages.skillHub.actions.deleteConfirmDescription')}
            okText={t('common.actions.delete')}
            okButtonProps={{ danger: true }}
            cancelText={t('common.actions.cancel')}
            onConfirm={() => deleteMutation.mutate(record.skill_id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
              type="link"
            >
              {t('common.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleFilterValuesChange = useDebounceCallback(
    (_changedValues: SkillFilterValues, allValues: SkillFilterValues) => {
      setFilters(normalizeSkillFilters(allValues))
      pagination.reset()
    },
    300,
  )

  useEffect(() => {
    return () => handleFilterValuesChange.cancel()
  }, [handleFilterValuesChange])

  const handleFilterReset = () => {
    handleFilterValuesChange.cancel()
    filterForm.resetFields()
    setFilters({})
    pagination.reset()
  }

  const handleSkillSubmit = async () => {
    const values = await skillFormRef.current?.validate()

    if (!values) return

    let body: ReturnType<typeof buildSubmitBody>

    try {
      body = buildSubmitBody(values, t('common.errors.metadataJsonObject'))
    } catch (error) {
      skillFormRef.current?.setFields([
        {
          name: 'metadata',
          errors: [
            error instanceof Error
              ? error.message
              : t('common.errors.metadataJsonObject'),
          ],
        },
      ])
      return
    }

    if (formDrawer?.mode === 'edit' && formDrawer.skillId) {
      updateMutation.mutate({
        skillId: formDrawer.skillId,
        data: {
          ...body,
          status: values.status ?? 'hot',
        },
      })
      return
    }

    createMutation.mutate(body)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const skills = listQuery.data?.data ?? []
  const total = listQuery.data?.count ?? 0

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={t('pages.skillHub.page.title')}
        subtitle={t('pages.skillHub.page.subtitle')}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateDrawer}
        >
          {t('pages.skillHub.actions.newSkill')}
        </Button>
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-[0_1px_0_rgb(15_23_42/0.03)]">
        <div className="flex h-full min-h-0 w-full flex-col pt-4">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
            <Form
              form={filterForm}
              layout="inline"
              className="flex-1"
              onValuesChange={handleFilterValuesChange}
            >
              <Form.Item name="category">
                <Input
                  allowClear
                  className="w-40!"
                  placeholder={t('pages.skillHub.filters.allCategories')}
                />
              </Form.Item>
              <Form.Item name="environment">
                <DictSelect<AdminSkillEnvironment>
                  allowClear
                  className="w-35!"
                  placeholder={t('pages.skillHub.filters.allEnvironments')}
                  type="admin_skill_environment"
                />
              </Form.Item>
              <Form.Item name="status">
                <DictSelect<AdminSkillStatus>
                  allowClear
                  className="w-36!"
                  placeholder={t('pages.skillHub.filters.allStatuses')}
                  type="admin_skill_status"
                />
              </Form.Item>
              <Form.Item name="keyword">
                <Input
                  allowClear
                  className="w-56!"
                  placeholder={t('pages.skillHub.filters.keyword')}
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button onClick={handleFilterReset}>
                    {t('common.actions.reset')}
                  </Button>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={listQuery.isFetching}
                    onClick={() => void listQuery.refetch()}
                  >
                    {t('common.actions.refresh')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {listQuery.isError ? (
            <Alert
              showIcon
              className="mx-5 mb-4 shrink-0"
              action={
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={() => void listQuery.refetch()}
                >
                  {t('common.actions.retry')}
                </Button>
              }
              title={t('pages.skillHub.errors.listLoadFailed')}
              type="error"
            />
          ) : null}

          <TableScrollYWrapper
            className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
            refreshKey={`${listQuery.data?.data.length ?? 0}:${listQuery.isFetching}`}
          >
            <Table<AdminSkill>
              columns={columns}
              dataSource={skills}
              loading={listQuery.isFetching}
              pagination={false}
              rowKey="skill_id"
              scroll={{ x: 1430 }}
            />
          </TableScrollYWrapper>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
            <Typography.Text className="text-(--muted)!">
              {t('common.labels.totalCount', { total })}
            </Typography.Text>
            <Pagination {...pagination.props} total={total} />
          </div>
        </div>
      </PageContainer>

      <Drawer
        size={640}
        open={Boolean(drawerSkillId)}
        title={detailQuery.data?.name ?? t('pages.skillHub.drawer.detailTitle')}
        onClose={() => setDrawerSkillId(undefined)}
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={detailQuery.isFetching}
            onClick={() => void detailQuery.refetch()}
          >
            {t('common.actions.refresh')}
          </Button>
        }
      >
        {detailQuery.isLoading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Spin />
          </div>
        ) : detailQuery.isError ? (
          <Alert
            showIcon
            action={
              <Button size="small" onClick={() => void detailQuery.refetch()}>
                {t('common.actions.retry')}
              </Button>
            }
            title={t('pages.skillHub.errors.detailLoadFailed')}
            type="error"
          />
        ) : detailQuery.data ? (
          <SkillDetailContent skill={detailQuery.data} />
        ) : null}
      </Drawer>

      <Drawer
        destroyOnHidden
        size={720}
        open={Boolean(formDrawer)}
        title={
          formDrawer?.mode === 'edit'
            ? t('pages.skillHub.drawer.editTitle')
            : t('pages.skillHub.drawer.createTitle')
        }
        onClose={closeFormDrawer}
        extra={
          <Space>
            <Button onClick={closeFormDrawer}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={() => void handleSkillSubmit()}
            >
              {formDrawer?.mode === 'edit'
                ? t('common.actions.save')
                : t('common.actions.create')}
            </Button>
          </Space>
        }
      >
        <SkillForm
          ref={skillFormRef}
          initialValues={formDrawer?.initialValues ?? {}}
          mode={formDrawer?.mode}
          open={Boolean(formDrawer)}
        />
      </Drawer>
    </div>
  )
}

export default SkillHub
