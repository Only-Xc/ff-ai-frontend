import { CopyOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Popconfirm,
  Result,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  stageSwitchKeys,
  stageSwitchTemplate_clone,
  stageSwitchTemplate_create,
  stageSwitchTemplate_get,
  stageSwitchTemplate_publish,
  stageSwitchTemplate_update,
  stageSwitchTemplate_validate,
  type StageSwitchDirection,
  type StageSwitchTemplateNodeInput,
} from '@/api/stage-switch'
import { usePermission } from '@/hooks/usePermission'

import { NodeEditor } from './components/NodeEditor'
import {
  DIRECTION_OPTIONS,
  templateStatusColor,
  templateStatusLabel,
} from './status'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TEMPLATE_KEY_PATTERN = /^[A-Za-z0-9_-]+$/

interface TemplateFields {
  templateKey: string
  name: string
  description: string
  direction: StageSwitchDirection
}

type NodeErrors = Partial<Record<StageSwitchTemplateNodeInput['node_key'], string[]>>

function createDefaultNodes(t: (key: string) => string): StageSwitchTemplateNodeInput[] {
  const createNode = (
    node_key: StageSwitchTemplateNodeInput['node_key'],
    sequence: number,
  ): StageSwitchTemplateNodeInput => ({
    node_key,
    name: t(`pages.stageSwitch.nodeEditor.nodes.${node_key}`),
    sequence,
    approval_mode: 'ALL',
    approver_source_type:
      node_key === 'SERVICE_OWNER' ? 'SERVICE_OWNER' : 'ROLE',
    approver_source_config:
      node_key === 'SERVICE_OWNER'
        ? { profile_field: 'service_owner_id' }
        : { role_ids: [] },
    sla_minutes: 1440,
    reminder_policy: {
      before_due_minutes: 60,
      repeat_interval_minutes: 120,
      escalation_threshold_minutes: 60,
      escalation_role_ids: [],
    },
  })

  return [
    createNode('MINISTRY', 1),
    createNode('INFOSEC', 2),
    createNode('GOVERNANCE', 3),
    createNode('SERVICE_OWNER', 4),
  ]
}

export default function TemplateEditor() {
  const { templateId = '' } = useParams()
  const isCreate = templateId === 'new'
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const canManage = hasPermission('admin.stage_switch.templates.manage')
  const [fields, setFields] = useState<TemplateFields>({
    templateKey: '',
    name: '',
    description: '',
    direction: 'PROMOTE',
  })
  const [nodes, setNodes] = useState<StageSwitchTemplateNodeInput[]>(() =>
    createDefaultNodes(t),
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TemplateFields, string>>>({})
  const [nodeErrors, setNodeErrors] = useState<NodeErrors>({})
  const [isDirty, setIsDirty] = useState(isCreate)

  const detailQuery = useQuery({
    queryKey: stageSwitchKeys.template(templateId),
    queryFn: () => stageSwitchTemplate_get(templateId),
    enabled: !isCreate && !!templateId,
  })

  const template = detailQuery.data?.template
  const isEditable = canManage && (isCreate || template?.status === 'DRAFT')

  useEffect(() => {
    if (!detailQuery.data) return
    const detail = detailQuery.data
    setFields({
      templateKey: detail.template.template_key,
      name: detail.template.name,
      description: detail.template.description,
      direction: detail.template.direction,
    })
    setNodes(
      [...detail.nodes]
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ id: _id, template_id: _templateId, ...node }) => node),
    )
    setFieldErrors({})
    setNodeErrors({})
    setIsDirty(false)
  }, [detailQuery.data])

  const invalidateTemplate = (id: string) => {
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.templateLists(),
    })
    void queryClient.invalidateQueries({ queryKey: stageSwitchKeys.template(id) })
  }

  const validateLocally = () => {
    const nextFieldErrors: Partial<Record<keyof TemplateFields, string>> = {}
    if (!fields.templateKey.trim()) {
      nextFieldErrors.templateKey = t(
        'pages.stageSwitch.templateEditor.validation.templateKeyRequired',
      )
    } else if (!TEMPLATE_KEY_PATTERN.test(fields.templateKey.trim())) {
      nextFieldErrors.templateKey = t(
        'pages.stageSwitch.templateEditor.validation.templateKeyFormat',
      )
    }
    if (!fields.name.trim()) {
      nextFieldErrors.name = t(
        'pages.stageSwitch.templateEditor.validation.nameRequired',
      )
    }

    const nextNodeErrors: NodeErrors = {}
    nodes.forEach((node) => {
      const errors: string[] = []
      if (!node.name.trim()) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.nodeNameRequired'),
        )
      }
      if (node.sla_minutes <= 0) {
        errors.push(t('pages.stageSwitch.templateEditor.validation.slaPositive'))
      }
      if (
        node.reminder_policy.before_due_minutes < 0 ||
        node.reminder_policy.before_due_minutes >= node.sla_minutes
      ) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.beforeDueRange'),
        )
      }
      if (node.reminder_policy.repeat_interval_minutes < 30) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.repeatMinimum'),
        )
      }
      if (node.reminder_policy.escalation_threshold_minutes < 0) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.escalationNonNegative'),
        )
      }

      const sourceIds =
        node.approver_source_type === 'ROLE'
          ? node.approver_source_config.role_ids ?? []
          : node.approver_source_type === 'USER'
            ? node.approver_source_config.user_ids ?? []
            : undefined
      if (sourceIds?.length === 0) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.approverRequired'),
        )
      }
      if (sourceIds?.some((id) => !UUID_PATTERN.test(id.trim()))) {
        errors.push(t('pages.stageSwitch.templateEditor.validation.uuidFormat'))
      }
      if (
        node.approver_source_type === 'SERVICE_OWNER' &&
        !node.approver_source_config.profile_field
      ) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.profileFieldRequired'),
        )
      }
      if (
        node.reminder_policy.escalation_role_ids.some(
          (id) => !UUID_PATTERN.test(id.trim()),
        )
      ) {
        errors.push(
          t('pages.stageSwitch.templateEditor.validation.escalationUuidFormat'),
        )
      }
      if (errors.length > 0) nextNodeErrors[node.node_key] = errors
    })

    setFieldErrors(nextFieldErrors)
    setNodeErrors(nextNodeErrors)
    const valid =
      Object.keys(nextFieldErrors).length === 0 &&
      Object.keys(nextNodeErrors).length === 0
    if (!valid) {
      void message.error(t('pages.stageSwitch.templateEditor.validation.fixErrors'))
    }
    return valid
  }

  const normalizedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        name: node.name.trim(),
        approver_source_config: {
          ...node.approver_source_config,
          role_ids: node.approver_source_config.role_ids?.map((id) => id.trim()),
          user_ids: node.approver_source_config.user_ids?.map((id) => id.trim()),
        },
        reminder_policy: {
          ...node.reminder_policy,
          escalation_role_ids:
            node.reminder_policy.escalation_role_ids.map((id) => id.trim()),
        },
      })),
    [nodes],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validateLocally()) throw new Error('LOCAL_VALIDATION_FAILED')
      if (isCreate) {
        return stageSwitchTemplate_create({
          template_key: fields.templateKey.trim(),
          name: fields.name.trim(),
          direction: fields.direction,
          description: fields.description.trim(),
          nodes: normalizedNodes,
        })
      }
      return stageSwitchTemplate_update(templateId, {
        name: fields.name.trim(),
        description: fields.description.trim(),
        node_updates: normalizedNodes,
      })
    },
    onSuccess: (savedTemplate) => {
      void message.success(t('pages.stageSwitch.templateEditor.saveSuccess'))
      invalidateTemplate(savedTemplate.id)
      setIsDirty(false)
      if (isCreate) {
        void navigate(`/stage-switch/templates/${savedTemplate.id}`, {
          replace: true,
        })
      }
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'LOCAL_VALIDATION_FAILED') {
        return
      }
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const validateMutation = useMutation({
    mutationFn: () => stageSwitchTemplate_validate(templateId),
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
    mutationFn: () => stageSwitchTemplate_publish(templateId),
    onSuccess: (publishedTemplate) => {
      void message.success(t('pages.stageSwitch.templates.publishSuccess'))
      invalidateTemplate(publishedTemplate.id)
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
    mutationFn: () => stageSwitchTemplate_clone(templateId),
    onSuccess: (clonedTemplate) => {
      void message.success(t('pages.stageSwitch.templates.cloneSuccess'))
      void queryClient.invalidateQueries({
        queryKey: stageSwitchKeys.templateLists(),
      })
      void navigate(`/stage-switch/templates/${clonedTemplate.id}`)
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  if (!isCreate && detailQuery.isLoading) {
    return (
      <PageContainer className="flex min-h-100 items-center justify-center p-5">
        <Spin />
      </PageContainer>
    )
  }

  if (!isCreate && (detailQuery.isError || !template)) {
    return (
      <PageContainer className="p-5">
        <Result
          status={detailQuery.isError ? 'error' : '404'}
          title={
            detailQuery.isError
              ? t('pages.stageSwitch.templateEditor.loadFailed')
              : t('pages.stageSwitch.templateEditor.notFound')
          }
          subTitle={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : undefined
          }
          extra={
            <Space>
              <Button onClick={() => void navigate('/stage-switch/templates')}>
                {t('pages.stageSwitch.templateEditor.backToList')}
              </Button>
              {detailQuery.isError ? (
                <Button type="primary" onClick={() => void detailQuery.refetch()}>
                  {t('common.actions.retry')}
                </Button>
              ) : null}
            </Space>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="p-5">
      <PageHeader
        title={
          isCreate
            ? t('pages.stageSwitch.templateEditor.createTitle')
            : fields.name
        }
        subtitle={
          isCreate
            ? t('pages.stageSwitch.templateEditor.createSubtitle')
            : t('pages.stageSwitch.templateEditor.versionSubtitle', {
                version: template?.version,
              })
        }
      >
        <Space wrap>
          <Button onClick={() => void navigate('/stage-switch/templates')}>
            {t('pages.stageSwitch.templateEditor.backToList')}
          </Button>
          {!isCreate && template ? (
            <Tag color={templateStatusColor(template.status)}>
              {templateStatusLabel(template.status, t)}
            </Tag>
          ) : null}
          {!isCreate && template?.status === 'DRAFT' ? (
            <Button
              disabled={isDirty}
              loading={validateMutation.isPending}
              title={
                isDirty
                  ? t('pages.stageSwitch.templateEditor.saveBeforeAction')
                  : undefined
              }
              onClick={() => validateMutation.mutate()}
            >
              {t('pages.stageSwitch.templates.actions.validate')}
            </Button>
          ) : null}
          {!isCreate && canManage && template?.status === 'DRAFT' ? (
            <Popconfirm
              title={
                isDirty
                  ? t('pages.stageSwitch.templateEditor.saveBeforeAction')
                  : t('pages.stageSwitch.templates.publishConfirm')
              }
              okText={t('common.actions.confirm')}
              cancelText={t('common.actions.cancel')}
              disabled={isDirty}
              onConfirm={() => publishMutation.mutate()}
            >
              <Button
                type="primary"
                disabled={isDirty}
                loading={publishMutation.isPending}
              >
                {t('pages.stageSwitch.templates.actions.publish')}
              </Button>
            </Popconfirm>
          ) : null}
          {!isCreate && canManage && template?.status !== 'DRAFT' ? (
            <Button
              icon={<CopyOutlined />}
              loading={cloneMutation.isPending}
              onClick={() => cloneMutation.mutate()}
            >
              {t('pages.stageSwitch.templates.actions.clone')}
            </Button>
          ) : null}
          {isEditable ? (
            <Button
              type={isCreate ? 'primary' : 'default'}
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {t('common.actions.save')}
            </Button>
          ) : null}
        </Space>
      </PageHeader>

      {!isEditable ? (
        <Alert
          showIcon
          className="mb-4"
          type="info"
          title={t(
            canManage
              ? 'pages.stageSwitch.templateEditor.readOnlyPublished'
              : 'pages.stageSwitch.templateEditor.readOnlyPermission',
          )}
        />
      ) : null}

      <Card size="small" className="mb-4">
        <Form layout="vertical" disabled={!isEditable}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              label={t('pages.stageSwitch.templateEditor.templateKey')}
              required
              validateStatus={fieldErrors.templateKey ? 'error' : undefined}
              help={fieldErrors.templateKey}
              extra={t('pages.stageSwitch.templateEditor.templateKeyHelp')}
            >
              <Input
                disabled={!isCreate || !isEditable}
                maxLength={128}
                value={fields.templateKey}
                onChange={(event) => {
                  setIsDirty(true)
                  setFields((current) => ({
                    ...current,
                    templateKey: event.target.value,
                  }))
                }}
              />
            </Form.Item>
            <Form.Item
              label={t('pages.stageSwitch.templateEditor.name')}
              required
              validateStatus={fieldErrors.name ? 'error' : undefined}
              help={fieldErrors.name}
            >
              <Input
                maxLength={255}
                value={fields.name}
                onChange={(event) => {
                  setIsDirty(true)
                  setFields((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }}
              />
            </Form.Item>
            <Form.Item label={t('pages.stageSwitch.filters.direction')}>
              <Select<StageSwitchDirection>
                disabled={!isCreate || !isEditable}
                value={fields.direction}
                options={DIRECTION_OPTIONS.map((item) => ({
                  value: item.value,
                  label: t(item.labelKey),
                }))}
                onChange={(direction) => {
                  setIsDirty(true)
                  setFields((current) => ({ ...current, direction }))
                }}
              />
            </Form.Item>
            <Form.Item label={t('pages.stageSwitch.templateEditor.description')}>
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 5 }}
                value={fields.description}
                onChange={(event) => {
                  setIsDirty(true)
                  setFields((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }}
              />
            </Form.Item>
          </div>
        </Form>
      </Card>

      <div className="mb-3">
        <Typography.Title level={4} className="mb-1!">
          {t('pages.stageSwitch.templateEditor.nodesTitle')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t('pages.stageSwitch.templateEditor.nodesHelp')}
        </Typography.Text>
      </div>

      {nodes.length === 0 ? (
        <Empty description={t('pages.stageSwitch.templateEditor.noNodes')} />
      ) : (
        <Form layout="vertical">
          <Space direction="vertical" size="middle" className="w-full">
            {nodes.map((node, index) => (
              <NodeEditor
                key={node.node_key}
                disabled={!isEditable}
                errors={nodeErrors[node.node_key]}
                value={node}
                onChange={(nextNode) => {
                  setIsDirty(true)
                  setNodes((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? nextNode : item,
                    ),
                  )
                }}
              />
            ))}
          </Space>
        </Form>
      )}
    </PageContainer>
  )
}
