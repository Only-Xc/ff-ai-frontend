import { Card, Descriptions, Empty, Steps, Tag, Typography } from 'antd'
import type { StepsProps } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import type {
  StageSwitchAssignee,
  StageSwitchNode,
} from '@/api/stage-switch'

import { nodeStatusColor, nodeStatusLabel } from '../status'

interface ApprovalProgressProps {
  nodes: StageSwitchNode[]
  assignees: StageSwitchAssignee[]
}

function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export function ApprovalProgress({
  assignees,
  nodes,
}: ApprovalProgressProps) {
  const { t } = useTranslation()
  const orderedNodes = [...nodes].sort((a, b) => a.sequence - b.sequence)

  if (orderedNodes.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.stageSwitch.detail.noNodes')}
      />
    )
  }

  return (
    <Steps
      direction="vertical"
      size="small"
      items={orderedNodes.map<NonNullable<StepsProps['items']>[number]>((node) => {
        const nodeAssignees = assignees.filter(
          (assignee) => assignee.node_id === node.id,
        )
        const isFinished = ['APPROVED', 'REJECTED', 'SKIPPED', 'CANCELLED'].includes(
          node.status,
        )
        const isActive = ['PENDING', 'OVERDUE'].includes(node.status)
        const stepStatus: NonNullable<StepsProps['items']>[number]['status'] =
          node.status === 'REJECTED' || node.status === 'OVERDUE'
            ? 'error'
            : isFinished
              ? 'finish'
              : isActive
                ? 'process'
                : 'wait'

        return {
          status: stepStatus,
          title: (
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Text strong>{node.name}</Typography.Text>
              <Tag color={nodeStatusColor(node.status)}>
                {nodeStatusLabel(node.status, t)}
              </Tag>
              <Typography.Text type="secondary">
                {t('pages.stageSwitch.detail.approvalMode', {
                  mode: t(
                    node.approval_mode === 'ALL'
                      ? 'pages.stageSwitch.approvalMode.all'
                      : 'pages.stageSwitch.approvalMode.any',
                  ),
                })}
              </Typography.Text>
            </div>
          ),
          description: (
            <Card size="small" className="mt-2 mb-3">
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 3 }}
                items={[
                  {
                    key: 'progress',
                    label: t('pages.stageSwitch.detail.nodeProgress'),
                    children: t('pages.stageSwitch.detail.nodeProgressValue', {
                      approved: node.approved_count,
                      rejected: node.rejected_count,
                      required: node.required_count,
                    }),
                  },
                  {
                    key: 'activated',
                    label: t('pages.stageSwitch.detail.activatedAt'),
                    children: formatDateTime(node.activated_at),
                  },
                  {
                    key: 'due',
                    label: t('pages.stageSwitch.detail.dueAt'),
                    children: formatDateTime(node.due_at),
                  },
                ]}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {nodeAssignees.length > 0 ? (
                  nodeAssignees.map((assignee) => (
                    <Tag
                      key={assignee.id}
                      color={
                        assignee.assignee_status === 'APPROVED'
                          ? 'green'
                          : assignee.assignee_status === 'REJECTED'
                            ? 'red'
                            : assignee.assignee_status === 'PENDING'
                              ? 'blue'
                              : 'default'
                      }
                    >
                      {assignee.user_id} ·{' '}
                      {t(
                        `pages.stageSwitch.assigneeStatus.${assignee.assignee_status.toLowerCase()}`,
                        assignee.assignee_status,
                      )}
                    </Tag>
                  ))
                ) : (
                  <Typography.Text type="secondary">
                    {t('pages.stageSwitch.detail.noAssignees')}
                  </Typography.Text>
                )}
              </div>
            </Card>
          ),
        }
      })}
    />
  )
}
