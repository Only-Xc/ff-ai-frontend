import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  disableWorkflow,
  enableWorkflow,
  listWorkflowVersions,
  publishWorkflow,
  rollbackWorkflow,
  workflowKeys,
  type WorkflowVersion,
} from '@/api/workflow'

const { Text } = Typography

interface PublicationPanelProps {
  appId: string
  appStatus: string
  activeVersionId: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  published: 'success',
  disabled: 'warning',
  archived: 'error',
}

export function PublicationPanel({
  appId,
  appStatus,
  activeVersionId,
}: PublicationPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rollbackTarget, setRollbackTarget] = useState<WorkflowVersion | null>(null)

  const { data: versions } = useQuery({
    queryKey: workflowKeys.versions(appId),
    queryFn: () => listWorkflowVersions(appId),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishWorkflow(appId),
    onSuccess: () => {
      message.success(t('pages.workflow.publishSuccess'))
      void queryClient.invalidateQueries({ queryKey: workflowKeys.app(appId) })
      void queryClient.invalidateQueries({ queryKey: workflowKeys.versions(appId) })
    },
    onError: () => {
      message.error(t('pages.workflow.publishFailed'))
    },
  })

  const disableMutation = useMutation({
    mutationFn: () => disableWorkflow(appId),
    onSuccess: () => {
      message.success(t('pages.workflow.disableSuccess'))
      void queryClient.invalidateQueries({ queryKey: workflowKeys.app(appId) })
    },
  })

  const enableMutation = useMutation({
    mutationFn: () => enableWorkflow(appId),
    onSuccess: () => {
      message.success(t('pages.workflow.enableSuccess'))
      void queryClient.invalidateQueries({ queryKey: workflowKeys.app(appId) })
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: (targetVersionId: string) =>
      rollbackWorkflow(appId, { target_version_id: targetVersionId }),
    onSuccess: () => {
      message.success(t('pages.workflow.rollbackSuccess'))
      setRollbackTarget(null)
      void queryClient.invalidateQueries({ queryKey: workflowKeys.app(appId) })
      void queryClient.invalidateQueries({ queryKey: workflowKeys.versions(appId) })
    },
  })

  const versionList = Array.isArray(versions) ? versions : []

  return (
    <div style={{ padding: 16 }}>
      {/* Current status */}
      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('pages.workflow.status')}>
          <Tag color={STATUS_COLORS[appStatus] || 'default'}>
            {appStatus.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('pages.workflow.activeVersion')}>
          {activeVersionId ? (
            <Text code>{activeVersionId.slice(0, 8)}...</Text>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Actions */}
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          block
          loading={publishMutation.isPending}
          onClick={() => publishMutation.mutate()}
        >
          {t('pages.workflow.publish')}
        </Button>

        {appStatus === 'published' && (
          <Button
            danger
            icon={<PauseCircleOutlined />}
            block
            loading={disableMutation.isPending}
            onClick={() => disableMutation.mutate()}
          >
            {t('pages.workflow.disable')}
          </Button>
        )}

        {appStatus === 'disabled' && (
          <Button
            icon={<PlayCircleOutlined />}
            block
            loading={enableMutation.isPending}
            onClick={() => enableMutation.mutate()}
          >
            {t('pages.workflow.enable')}
          </Button>
        )}
      </Space>

      <Divider />

      {/* Version history */}
      <Text strong>{t('pages.workflow.versionHistory')}</Text>
      <List
        size="small"
        dataSource={versionList}
        locale={{ emptyText: t('pages.workflow.noVersions') }}
        renderItem={(v: WorkflowVersion) => (
          <List.Item
            actions={[
              v.id !== activeVersionId ? (
                <Button
                  key="rb"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={() => setRollbackTarget(v)}
                >
                  {t('pages.workflow.rollback')}
                </Button>
              ) : (
                <Tag key="active" color="success" icon={<CheckCircleOutlined />}>
                  {t('pages.workflow.active')}
                </Tag>
              ),
            ]}
          >
            <List.Item.Meta
              title={`v${v.version}`}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(v.published_at).toLocaleString()}
                  </Text>
                  {v.change_summary && (
                    <Text style={{ fontSize: 12 }}>{v.change_summary}</Text>
                  )}
                  <Text code style={{ fontSize: 11 }}>
                    {v.checksum?.slice(0, 12)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      {/* Rollback confirmation modal */}
      <Modal
        title={t('pages.workflow.rollbackConfirm')}
        open={!!rollbackTarget}
        onOk={() =>
          rollbackTarget && rollbackMutation.mutate(rollbackTarget.id)
        }
        onCancel={() => setRollbackTarget(null)}
        confirmLoading={rollbackMutation.isPending}
      >
        <Alert
          type="warning"
          message={t('pages.workflow.rollbackWarning')}
          description={
            rollbackTarget
              ? `${t('pages.workflow.rollbackTo')} v${rollbackTarget.version}`
              : ''
          }
        />
      </Modal>
    </div>
  )
}
