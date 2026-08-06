import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  EditOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Skeleton,
  Space,
  Spin,
  Typography,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { v4 as uuidv4 } from 'uuid'

import {
  buildFlowiseEditorUrl,
  createFlowiseBrowserSession,
  flowiseKeys,
  syncFlowiseDraft,
} from '@/api/flowise'
import {
  getWorkflowApp,
  listWorkflowAccessRoles,
  publishWorkflow,
  type WorkflowAccessScope,
  updateWorkflowApp,
  workflowKeys,
} from '@/api/workflow'
import { useFlowiseIframeSessionRefresh } from '@/hooks/useFlowiseIframeSessionRefresh'
import ResourceBindingsDrawer from './ResourceBindingsDrawer'

const { Text, Title } = Typography

/**
 * Flowise Design Page
 *
 * Embeds Flowise Editor in an iframe for workflow design.
 * Designers can:
 * - Create/edit chatflow visually
 * - Save drafts
 * - Submit for production approval
 *
 * Architecture:
 *   user-web → FF-AI Backend (JWT + RBAC) → Flowise Editor (iframe)
 */
export default function FlowiseDesignPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appId } = useParams<{ appId: string }>()
  const [sessionNonce] = useState(() => uuidv4())
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [accessScope, setAccessScope] = useState<WorkflowAccessScope>('tenant')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [draftName, setDraftName] = useState('')

  const { data: workflowApp, isLoading: workflowAppLoading } = useQuery({
    queryKey: workflowKeys.app(appId!),
    queryFn: () => getWorkflowApp(appId!),
    enabled: !!appId,
    retry: false,
  })

  // Establish the Flowise technical session only after ff-ai authorization.
  const {
    data: browserSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: [...flowiseKeys.browserSession(appId!), sessionNonce],
    queryFn: () => createFlowiseBrowserSession(appId!),
    enabled: !!appId,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: false,
    staleTime: 0,
  })
  const { iframeKey, refreshIframeSession } = useFlowiseIframeSessionRefresh({
    appId: appId ?? '',
    refetchSession,
  })
  const {
    data: accessRoles = [],
    isLoading: accessRolesLoading,
    isError: accessRolesError,
  } = useQuery({
    queryKey: ['workflow', 'access-roles'],
    queryFn: listWorkflowAccessRoles,
    enabled: publishModalOpen && accessScope === 'roles',
    staleTime: 60_000,
    retry: false,
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      await syncFlowiseDraft(appId!)
      return publishWorkflow(appId!, {
        change_summary: 'Published from Flowise designer',
        access_scope: accessScope,
        role_ids: accessScope === 'roles' ? selectedRoleIds : [],
      })
    },
    onSuccess: (result) => {
      if (result.status === 'approval_failed') {
        void message.error(
          t('pages.flowise.publishError', 'Approval submission failed'),
        )
        return
      }
      setPublishModalOpen(false)
      void message.success(
        t('pages.flowise.publishSuccess', 'Published for approval'),
      )
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      void navigate('/workflow')
    },
    onError: (error: Error) => {
      void message.error(
        error.message || t('pages.flowise.publishError', 'Publish failed'),
      )
    },
  })

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateWorkflowApp(appId!, { name }),
    onSuccess: (updatedApp) => {
      queryClient.setQueryData(workflowKeys.app(appId!), updatedApp)
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      setDraftName(updatedApp.name)
      setRenameModalOpen(false)
      void message.success(t('pages.flowise.renameSuccess'))
    },
    onError: (error: Error) => {
      void message.error(error.message || t('pages.flowise.renameError'))
    },
  })

  // Build iframe URL
  const iframeSrc = browserSession
    ? buildFlowiseEditorUrl(browserSession.ticket)
    : ''

  const handleReload = async () => {
    await refreshIframeSession()
  }

  const handlePublish = () => {
    if (accessScope === 'roles' && selectedRoleIds.length === 0) {
      void message.warning(t('pages.flowise.rolesRequired'))
      return
    }
    publishMutation.mutate()
  }

  const openRenameModal = () => {
    if (!workflowApp) return
    setDraftName(workflowApp.name)
    setRenameModalOpen(true)
  }

  const closeRenameModal = () => {
    setDraftName(workflowApp?.name ?? '')
    setRenameModalOpen(false)
  }

  const saveName = () => {
    const name = draftName.trim()
    if (!name) {
      void message.warning(t('pages.flowise.nameRequired'))
      return
    }
    if (name === workflowApp?.name) {
      setRenameModalOpen(false)
      return
    }
    renameMutation.mutate(name)
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space wrap style={{ minWidth: 0 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              void navigate('/workflow')
            }}
          >
            {t('common.back', 'Back')}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {t('pages.flowise.designTitle', 'Workflow Design')}
          </Title>
          <Text aria-hidden>:</Text>
          {workflowAppLoading ? (
            <Skeleton.Input active size="small" style={{ width: 160 }} />
          ) : (
            <Text
              ellipsis={{ tooltip: workflowApp?.name }}
              style={{
                color: 'var(--ant-color-link)',
                fontSize: 20,
                fontWeight: 400,
                lineHeight: 1.4,
                maxWidth: 320,
              }}
            >
              {workflowApp?.name ?? '—'}
            </Text>
          )}
        </Space>
        <Space>
          <Button
            disabled={!workflowApp}
            icon={<DatabaseOutlined />}
            onClick={() => setResourcesOpen(true)}
          >
            {t('pages.flowise.resources.title')}
          </Button>
          <Button
            disabled={!workflowApp}
            icon={<ExperimentOutlined />}
            onClick={() => {
              void navigate(`/workflow/flowise/${appId}/evaluations`)
            }}
          >
            {t('pages.workflow.evaluations.title')}
          </Button>
          <Button
            disabled={!workflowApp}
            icon={<EditOutlined />}
            onClick={openRenameModal}
          >
            {t('pages.flowise.rename')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void handleReload()}
            title={t('pages.flowise.reload', 'Reload canvas')}
          >
            {t('common.reload', 'Reload')}
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={publishMutation.isPending}
            onClick={() => setPublishModalOpen(true)}
          >
            {t('pages.flowise.publish', 'Publish')}
          </Button>
        </Space>
      </div>

      {sessionLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Spin
            size="large"
            tip={t('pages.flowise.loadingSession', 'Loading editor session...')}
          />
        </div>
      ) : browserSession ? (
        <iframe
          key={`${iframeKey}-${browserSession.ticket}`}
          src={iframeSrc}
          style={{
            width: '100%',
            height: 'calc(100vh - 160px)',
            border: 'none',
            borderRadius: '8px',
          }}
          title="Flowise Editor"
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {t('pages.flowise.sessionError', 'Failed to load editor session')}
        </div>
      )}

      <Modal
        open={renameModalOpen}
        title={t('pages.flowise.rename')}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={renameMutation.isPending}
        okButtonProps={{ disabled: !draftName.trim() }}
        onCancel={closeRenameModal}
        onOk={saveName}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label={t('pages.flowise.renameInputLabel')} required>
            <Input
              aria-label={t('pages.flowise.renameInputLabel')}
              autoFocus
              disabled={renameMutation.isPending}
              maxLength={255}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onPressEnter={saveName}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={publishModalOpen}
        title={t('pages.flowise.publishDialogTitle')}
        okText={t('pages.flowise.submitForApproval')}
        cancelText={t('common.cancel')}
        confirmLoading={publishMutation.isPending}
        onCancel={() => setPublishModalOpen(false)}
        onOk={handlePublish}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label={t('pages.flowise.accessScope')}>
            <Radio.Group
              value={accessScope}
              onChange={(event) => {
                const nextScope = event.target.value as WorkflowAccessScope
                setAccessScope(nextScope)
                if (nextScope === 'tenant') setSelectedRoleIds([])
              }}
            >
              <Radio.Button value="tenant">
                {t('pages.flowise.scopeTenant')}
              </Radio.Button>
              <Radio.Button value="roles">
                {t('pages.flowise.scopeRoles')}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          {accessScope === 'roles' ? (
            <Form.Item
              label={t('pages.flowise.allowedRoles')}
              required
              validateStatus={accessRolesError ? 'error' : undefined}
              help={
                accessRolesError ? t('pages.flowise.rolesLoadError') : undefined
              }
            >
              <Select
                mode="multiple"
                value={selectedRoleIds}
                loading={accessRolesLoading}
                placeholder={t('pages.flowise.rolesPlaceholder')}
                options={accessRoles.map((role) => ({
                  value: role.id,
                  label: `${role.name} (${role.code})`,
                }))}
                onChange={setSelectedRoleIds}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <ResourceBindingsDrawer
        appId={appId ?? ''}
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
      />
    </div>
  )
}
