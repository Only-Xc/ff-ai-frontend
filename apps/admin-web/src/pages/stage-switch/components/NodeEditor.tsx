import { Alert, Card, Form, Input, InputNumber, Select, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type {
  StageSwitchApprovalMode,
  StageSwitchApproverSourceType,
  StageSwitchTemplateNodeInput,
} from '@/api/stage-switch'

interface NodeEditorProps {
  disabled?: boolean
  errors?: string[]
  onChange: (value: StageSwitchTemplateNodeInput) => void
  value: StageSwitchTemplateNodeInput
}

export function NodeEditor({
  disabled = false,
  errors = [],
  onChange,
  value,
}: NodeEditorProps) {
  const { t } = useTranslation()
  const identifierKey =
    value.approver_source_type === 'ROLE' ? 'role_ids' : 'user_ids'
  const identifiers = value.approver_source_config[identifierKey] ?? []

  const update = (patch: Partial<StageSwitchTemplateNodeInput>) => {
    onChange({ ...value, ...patch })
  }

  const updateReminder = (
    patch: Partial<StageSwitchTemplateNodeInput['reminder_policy']>,
  ) => {
    update({ reminder_policy: { ...value.reminder_policy, ...patch } })
  }

  const sourceOptions: Array<{
    label: string
    value: StageSwitchApproverSourceType
  }> = [
    {
      value: 'ROLE',
      label: t('pages.stageSwitch.nodeEditor.source.role'),
    },
    {
      value: 'USER',
      label: t('pages.stageSwitch.nodeEditor.source.user'),
    },
  ]
  if (value.node_key === 'SERVICE_OWNER') {
    sourceOptions.push({
      value: 'SERVICE_OWNER',
      label: t('pages.stageSwitch.nodeEditor.source.serviceOwner'),
    })
  }

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Typography.Text strong>
            {t(`pages.stageSwitch.nodeEditor.nodes.${value.node_key}`)}
          </Typography.Text>
          <Typography.Text code>{value.node_key}</Typography.Text>
          <Typography.Text type="secondary">
            {t('pages.stageSwitch.nodeEditor.sequence', {
              sequence: value.sequence,
            })}
          </Typography.Text>
        </Space>
      }
    >
      {errors.length > 0 ? (
        <Alert
          showIcon
          className="mb-3"
          type="error"
          title={t('pages.stageSwitch.nodeEditor.validationTitle')}
          description={
            <ul className="mb-0 ps-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-4">
        <Form.Item label={t('pages.stageSwitch.nodeEditor.name')}>
          <Input
            disabled={disabled}
            maxLength={255}
            value={value.name}
            onChange={(event) => update({ name: event.target.value })}
          />
        </Form.Item>
        <Form.Item label={t('pages.stageSwitch.nodeEditor.approvalMode')}>
          <Select<StageSwitchApprovalMode>
            disabled={disabled}
            value={value.approval_mode}
            options={[
              {
                value: 'ALL',
                label: t('pages.stageSwitch.approvalMode.all'),
              },
              {
                value: 'ANY',
                label: t('pages.stageSwitch.approvalMode.any'),
              },
            ]}
            onChange={(approval_mode) => update({ approval_mode })}
          />
        </Form.Item>
        <Form.Item label={t('pages.stageSwitch.nodeEditor.approverSource')}>
          <Select<StageSwitchApproverSourceType>
            disabled={disabled}
            value={value.approver_source_type}
            options={sourceOptions}
            onChange={(approver_source_type) =>
              update({
                approver_source_type,
                approver_source_config:
                  approver_source_type === 'ROLE'
                    ? { role_ids: [] }
                    : approver_source_type === 'USER'
                      ? { user_ids: [] }
                      : { profile_field: 'service_owner_id' },
              })
            }
          />
        </Form.Item>
        <Form.Item label={t('pages.stageSwitch.nodeEditor.slaMinutes')}>
          <InputNumber
            className="w-full"
            disabled={disabled}
            min={1}
            precision={0}
            value={value.sla_minutes}
            onChange={(sla_minutes) => update({ sla_minutes: sla_minutes ?? 1 })}
          />
        </Form.Item>
      </div>

      {value.approver_source_type === 'SERVICE_OWNER' ? (
        <Alert
          showIcon
          className="mb-4"
          type="info"
          title={t('pages.stageSwitch.nodeEditor.serviceOwnerNotice')}
        />
      ) : (
        <Form.Item
          label={t(
            value.approver_source_type === 'ROLE'
              ? 'pages.stageSwitch.nodeEditor.roleIds'
              : 'pages.stageSwitch.nodeEditor.userIds',
          )}
          extra={t('pages.stageSwitch.nodeEditor.uuidTagsHelp')}
        >
          <Select
            mode="tags"
            open={false}
            disabled={disabled}
            tokenSeparators={[',', ' ']}
            value={identifiers}
            placeholder={t('pages.stageSwitch.nodeEditor.uuidTagsPlaceholder')}
            onChange={(ids: string[]) =>
              update({ approver_source_config: { [identifierKey]: ids } })
            }
          />
        </Form.Item>
      )}

      <Typography.Title level={5} className="mt-0!">
        {t('pages.stageSwitch.nodeEditor.reminderPolicy')}
      </Typography.Title>
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-4">
        <Form.Item label={t('pages.stageSwitch.nodeEditor.beforeDueMinutes')}>
          <InputNumber
            className="w-full"
            disabled={disabled}
            min={0}
            precision={0}
            value={value.reminder_policy.before_due_minutes}
            onChange={(before_due_minutes) =>
              updateReminder({ before_due_minutes: before_due_minutes ?? 0 })
            }
          />
        </Form.Item>
        <Form.Item label={t('pages.stageSwitch.nodeEditor.repeatIntervalMinutes')}>
          <InputNumber
            className="w-full"
            disabled={disabled}
            min={30}
            precision={0}
            value={value.reminder_policy.repeat_interval_minutes}
            onChange={(repeat_interval_minutes) =>
              updateReminder({
                repeat_interval_minutes: repeat_interval_minutes ?? 30,
              })
            }
          />
        </Form.Item>
        <Form.Item
          label={t('pages.stageSwitch.nodeEditor.escalationThresholdMinutes')}
        >
          <InputNumber
            className="w-full"
            disabled={disabled}
            min={0}
            precision={0}
            value={value.reminder_policy.escalation_threshold_minutes}
            onChange={(escalation_threshold_minutes) =>
              updateReminder({
                escalation_threshold_minutes:
                  escalation_threshold_minutes ?? 0,
              })
            }
          />
        </Form.Item>
        <Form.Item
          label={t('pages.stageSwitch.nodeEditor.escalationRoleIds')}
          extra={t('pages.stageSwitch.nodeEditor.optionalUuidTagsHelp')}
        >
          <Select
            mode="tags"
            open={false}
            disabled={disabled}
            tokenSeparators={[',', ' ']}
            value={value.reminder_policy.escalation_role_ids}
            placeholder={t('pages.stageSwitch.nodeEditor.uuidTagsPlaceholder')}
            onChange={(escalation_role_ids: string[]) =>
              updateReminder({ escalation_role_ids })
            }
          />
        </Form.Item>
      </div>
    </Card>
  )
}
