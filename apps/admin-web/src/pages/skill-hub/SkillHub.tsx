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
  Select,
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
import { numberUtils } from '@ff-ai-frontend/utils'
import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'

import { SkillDetailContent } from './components/SkillDetailContent'
import { SkillForm, type SkillFormRef } from './components/SkillForm'
import { EnvironmentTag, SkillStatusTag } from './components/SkillTags'
import { environmentOptions, statusOptions } from './constants'
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
      globalMessage.success('Skill 创建成功')
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
      globalMessage.success('Skill 更新成功')
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
      globalMessage.success('Skill 删除成功')

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
        error instanceof Error ? error.message : 'Skill 详情加载失败',
      )
    } finally {
      setEditLoadingId(undefined)
    }
  }

  const columns: TableProps<AdminSkill>['columns'] = [
    {
      title: 'Skill 名称',
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
      title: '分类',
      dataIndex: 'category',
      width: 120,
      ellipsis: true,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      width: 100,
      render: (value: AdminSkillEnvironment) => (
        <EnvironmentTag environment={value} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: AdminSkillStatus) => <SkillStatusTag status={value} />,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 100,
    },
    {
      title: '调用次数',
      dataIndex: 'call_count',
      width: 120,
      render: (value: number) => numberUtils.formatNumber(value),
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      width: 120,
      render: (value: number | null) =>
        numberUtils.formatPercent(value, { decimals: 1 }),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
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
            详情
          </Button>
          <Button
            loading={editLoadingId === record.skill_id}
            icon={<EditOutlined />}
            type="link"
            onClick={() => void openEditDrawer(record.skill_id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该 Skill？"
            description="删除后会同步移除向量索引数据。"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(record.skill_id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
              type="link"
            >
              删除
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
      body = buildSubmitBody(values)
    } catch (error) {
      skillFormRef.current?.setFields([
        {
          name: 'metadata',
          errors: [
            error instanceof Error
              ? error.message
              : 'metadata 必须是合法 JSON 对象',
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
        title="技能库"
        subtitle="维护平台 Skill，支持检索、创建、编辑、删除和详情查看。"
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateDrawer}
        >
          新建 Skill
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
                <Input allowClear className="w-40!" placeholder="全部分类" />
              </Form.Item>
              <Form.Item name="environment">
                <Select<AdminSkillEnvironment>
                  allowClear
                  className="w-35!"
                  options={environmentOptions}
                  placeholder="全部环境"
                />
              </Form.Item>
              <Form.Item name="status">
                <Select<AdminSkillStatus>
                  allowClear
                  className="w-36!"
                  options={statusOptions}
                  placeholder="全部状态"
                />
              </Form.Item>
              <Form.Item name="keyword">
                <Input
                  allowClear
                  className="w-56!"
                  placeholder="搜索名称或描述"
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button onClick={handleFilterReset}>重置</Button>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={listQuery.isFetching}
                    onClick={() => void listQuery.refetch()}
                  >
                    刷新
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
                  重试
                </Button>
              }
              title="Skill 列表加载失败"
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
              共 {total} 条
            </Typography.Text>
            <Pagination {...pagination.props} total={total} />
          </div>
        </div>
      </PageContainer>

      <Drawer
        size={640}
        open={Boolean(drawerSkillId)}
        title={detailQuery.data?.name ?? 'Skill 详情'}
        onClose={() => setDrawerSkillId(undefined)}
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={detailQuery.isFetching}
            onClick={() => void detailQuery.refetch()}
          >
            刷新
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
                重试
              </Button>
            }
            title="Skill 详情加载失败"
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
        title={formDrawer?.mode === 'edit' ? '编辑 Skill' : '新建 Skill'}
        onClose={closeFormDrawer}
        extra={
          <Space>
            <Button onClick={closeFormDrawer}>取消</Button>
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={() => void handleSkillSubmit()}
            >
              {formDrawer?.mode === 'edit' ? '保存' : '创建'}
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
