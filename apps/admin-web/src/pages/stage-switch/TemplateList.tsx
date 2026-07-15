import {
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  stageSwitchKeys,
  stageSwitchTemplate_clone,
  stageSwitchTemplate_publish,
  stageSwitchTemplate_retire,
  stageSwitchTemplate_validate,
  stageSwitchTemplates_list,
  type StageSwitchDirection,
  type StageSwitchTemplate,
  type StageSwitchTemplateListQuery,
  type StageSwitchTemplateStatus,
} from '@/api/stage-switch'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { usePermission } from '@/hooks/usePermission'

import {
  DIRECTION_OPTIONS,
  TEMPLATE_STATUS_OPTIONS,
  directionColor,
  directionLabel,
  templateStatusColor,
  templateStatusLabel,
} from './status'

function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export default function TemplateList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const pagination = usePaginationParams()
  const [keyword, setKeyword] = useState('')
  const [direction, setDirection] = useState<StageSwitchDirection>()
  const [status, setStatus] = useState<StageSwitchTemplateStatus>()
  const canManage = hasPermission('admin.stage_switch.templates.manage')

  const query = useMemo<StageSwitchTemplateListQuery>(
    () => ({
      keyword: keyword || undefined,
      direction,
      status,
      ...pagination.query,
    }),
    [direction, keyword, pagination.query, status],
  )

  const templatesQuery = useQuery({
    queryKey: stageSwitchKeys.templateList(query),
    queryFn: () => stageSwitchTemplates_list(query),
    placeholderData: keepPreviousData,
  })

  const invalidateTemplate = (templateId: string) => {
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.templateLists(),
    })
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.template(templateId),
    })
  }

  const validateMutation = useMutation({
    mutationFn: (templateId: string) => stageSwitchTemplate_validate(templateId),
    onSuccess: (result) => {
      if (result.valid) {
        void message.success(t('pages.stageSwitch.templates.validationPassed'))
        return
      }
      modal.error({
        title: t('pages.stageSwitch.templates.validationFailed'),
        content: (
          <ul className="mb-0 ps-5">
            {(result.errors ?? []).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ),
      })
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const publishMutation = useMutation({
    mutationFn: (templateId: string) => stageSwitchTemplate_publish(templateId),
    onSuccess: (template) => {
      void message.success(t('pages.stageSwitch.templates.publishSuccess'))
      invalidateTemplate(template.id)
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const retireMutation = useMutation({
    mutationFn: (templateId: string) => stageSwitchTemplate_retire(templateId),
    onSuccess: (template) => {
      void message.success(t('pages.stageSwitch.templates.retireSuccess'))
      invalidateTemplate(template.id)
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const cloneMutation = useMutation({
    mutationFn: (templateId: string) => stageSwitchTemplate_clone(templateId),
    onSuccess: (template) => {
      void message.success(t('pages.stageSwitch.templates.cloneSuccess'))
      void queryClient.invalidateQueries({
        queryKey: stageSwitchKeys.templateLists(),
      })
      void navigate(`/stage-switch/templates/${template.id}`)
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const mutationPending =
    validateMutation.isPending ||
    publishMutation.isPending ||
    retireMutation.isPending ||
    cloneMutation.isPending

  const columns = useMemo<TableProps<StageSwitchTemplate>['columns']>(
    () => [
      {
        title: t('pages.stageSwitch.templates.columns.name'),
        dataIndex: 'name',
        width: 240,
        render: (value: string, record) => (
          <Button
            type="link"
            className="h-auto p-0!"
            onClick={(event) => {
              event.stopPropagation()
              void navigate(`/stage-switch/templates/${record.id}`)
            }}
          >
            {value}
          </Button>
        ),
      },
      {
        title: t('pages.stageSwitch.templates.columns.templateKey'),
        dataIndex: 'template_key',
        width: 190,
        ellipsis: true,
      },
      {
        title: t('pages.stageSwitch.columns.direction'),
        dataIndex: 'direction',
        width: 110,
        render: (value: StageSwitchDirection) => (
          <Tag color={directionColor(value)}>{directionLabel(value, t)}</Tag>
        ),
      },
      {
        title: t('pages.stageSwitch.templates.columns.version'),
        dataIndex: 'version',
        width: 90,
      },
      {
        title: t('pages.stageSwitch.templates.columns.status'),
        dataIndex: 'status',
        width: 120,
        render: (value: StageSwitchTemplateStatus) => (
          <Tag color={templateStatusColor(value)}>
            {templateStatusLabel(value, t)}
          </Tag>
        ),
      },
      {
        title: t('pages.stageSwitch.templates.columns.updatedAt'),
        dataIndex: 'updated_at',
        width: 170,
        render: formatDateTime,
      },
      {
        title: t('pages.stageSwitch.templates.columns.actions'),
        key: 'actions',
        fixed: 'right',
        width: 300,
        render: (_, record) => (
          <Space size="small" wrap onClick={(event) => event.stopPropagation()}>
            <Button
              size="small"
              disabled={record.status !== 'DRAFT'}
              loading={
                validateMutation.isPending &&
                validateMutation.variables === record.id
              }
              onClick={() => validateMutation.mutate(record.id)}
            >
              {t('pages.stageSwitch.templates.actions.validate')}
            </Button>
            {canManage && record.status === 'DRAFT' ? (
              <Popconfirm
                title={t('pages.stageSwitch.templates.publishConfirm')}
                okText={t('common.actions.confirm')}
                cancelText={t('common.actions.cancel')}
                onConfirm={() => publishMutation.mutate(record.id)}
              >
                <Button
                  size="small"
                  type="primary"
                  loading={
                    publishMutation.isPending &&
                    publishMutation.variables === record.id
                  }
                >
                  {t('pages.stageSwitch.templates.actions.publish')}
                </Button>
              </Popconfirm>
            ) : null}
            {canManage && record.status === 'PUBLISHED' ? (
              <Popconfirm
                title={t('pages.stageSwitch.templates.retireConfirm')}
                okText={t('common.actions.confirm')}
                cancelText={t('common.actions.cancel')}
                onConfirm={() => retireMutation.mutate(record.id)}
              >
                <Button
                  size="small"
                  danger
                  loading={
                    retireMutation.isPending &&
                    retireMutation.variables === record.id
                  }
                >
                  {t('pages.stageSwitch.templates.actions.retire')}
                </Button>
              </Popconfirm>
            ) : null}
            {canManage && record.status !== 'DRAFT' ? (
              <Button
                size="small"
                icon={<CopyOutlined />}
                loading={
                  cloneMutation.isPending && cloneMutation.variables === record.id
                }
                onClick={() => cloneMutation.mutate(record.id)}
              >
                {t('pages.stageSwitch.templates.actions.clone')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [
      canManage,
      cloneMutation,
      navigate,
      publishMutation,
      retireMutation,
      t,
      validateMutation,
    ],
  )

  return (
    <PageContainer className="p-5">
      <PageHeader
        title={t('routes.stageSwitch.templates.title')}
        subtitle={t('routes.stageSwitch.templates.subtitle')}
      >
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            loading={templatesQuery.isFetching}
            onClick={() => void templatesQuery.refetch()}
          >
            {t('common.actions.refresh')}
          </Button>
          {canManage ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => void navigate('/stage-switch/templates/new')}
            >
              {t('pages.stageSwitch.templates.actions.create')}
            </Button>
          ) : null}
        </Space>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input.Search
          allowClear
          className="w-64"
          placeholder={t('pages.stageSwitch.templates.filters.keyword')}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onSearch={(value) => {
            setKeyword(value.trim())
            pagination.reset()
          }}
        />
        <Select<StageSwitchDirection>
          allowClear
          className="w-36"
          placeholder={t('pages.stageSwitch.filters.direction')}
          value={direction}
          options={DIRECTION_OPTIONS.map((item) => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
          onChange={(value) => {
            setDirection(value)
            pagination.reset()
          }}
        />
        <Select<StageSwitchTemplateStatus>
          allowClear
          className="w-40"
          placeholder={t('pages.stageSwitch.templates.filters.status')}
          value={status}
          options={TEMPLATE_STATUS_OPTIONS.map((item) => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
          onChange={(value) => {
            setStatus(value)
            pagination.reset()
          }}
        />
        <Button
          onClick={() => {
            setKeyword('')
            setDirection(undefined)
            setStatus(undefined)
            pagination.reset()
          }}
        >
          {t('common.actions.reset')}
        </Button>
      </div>

      {templatesQuery.isError ? (
        <Alert
          showIcon
          className="mb-4"
          type="error"
          title={t('pages.stageSwitch.templates.loadFailed')}
          description={
            templatesQuery.error instanceof Error
              ? templatesQuery.error.message
              : t('common.errors.requestFailed')
          }
          action={
            <Button size="small" onClick={() => void templatesQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
        />
      ) : null}

      <Table<StageSwitchTemplate>
        rowKey="id"
        columns={columns}
        dataSource={templatesQuery.data?.data ?? []}
        loading={templatesQuery.isFetching || mutationPending}
        scroll={{ x: 1220 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.stageSwitch.templates.empty')}
            />
          ),
        }}
        pagination={{
          ...pagination.props,
          total: templatesQuery.data?.total ?? 0,
          showTotal: (total) => t('common.labels.totalCount', { total }),
        }}
        onRow={(record) => ({
          className: 'cursor-pointer',
          onClick: () => void navigate(`/stage-switch/templates/${record.id}`),
        })}
      />
    </PageContainer>
  )
}
