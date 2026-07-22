import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery } from '@tanstack/react-query'
import { Alert, Descriptions, Drawer, Empty, Skeleton, Tag } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  workflowAdminApp_get,
  workflowAdminAppDraft_get,
  workflowAdminKeys,
} from '@/api/workflow-admin'

const STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  pending_approval: 'gold',
  active: 'green',
  disabled: 'red',
}

const CATALOG_STATUS_COLOR: Record<string, string> = {
  active: 'cyan',
  pending_approval: 'orange',
  disabled: 'volcano',
}

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: '#1677ff',
  user_input: '#52c41a',
  permission_gate: '#faad14',
  knowledge_retrieval: '#1890ff',
  data_source_query: '#722ed1',
  variable_transform: '#13c2c2',
  template: '#eb2f96',
  condition: '#fa8c16',
  llm: '#2f54eb',
  answer: '#f5222d',
}

interface Props {
  appId: string | null
  open: boolean
  onClose: () => void
}

/**
 * Workflow 应用详情抽屉（只读）
 *
 * 展示应用元数据 + 画布只读预览。不允许修改画布。
 */
export function WorkflowAdminAppDetail({ appId, open, onClose }: Props) {
  const { t } = useTranslation()

  const { data: appData, isLoading: appLoading, isError: appError } = useQuery({
    queryKey: workflowAdminKeys.appDetail(appId ?? ''),
    queryFn: () => workflowAdminApp_get(appId!),
    enabled: open && appId !== null,
    retry: false,
  })

  const { data: draftData, isLoading: draftLoading } = useQuery({
    queryKey: workflowAdminKeys.appDraft(appId ?? ''),
    queryFn: () => workflowAdminAppDraft_get(appId!),
    enabled: open && appId !== null,
    retry: false,
  })

  const { nodes, edges } = useMemo(() => {
    const graph = draftData?.graph_json
    if (!graph) return { nodes: [] as Node[], edges: [] as Edge[] }

    const flowNodes: Node[] = (graph.nodes ?? []).map((n) => ({
      id: n.id,
      type: 'default',
      position: n.position ?? { x: 0, y: 0 },
      data: { label: n.type },
      style: {
        background: NODE_TYPE_COLORS[n.type] ?? '#f0f0f0',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 600,
      },
      draggable: false,
      selectable: false,
    }))

    const flowEdges: Edge[] = (graph.edges ?? []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.branch ?? undefined,
      type: 'smoothstep',
      animated: true,
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [draftData])

  return (
    <Drawer
      title={t('pages.workflowAdmin.detail.title', '应用详情')}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      {appLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : appError ? (
        <Alert
          type="error"
          showIcon
          message={t('pages.workflowAdmin.detail.loadError', '加载应用详情失败')}
          description={t('pages.workflowAdmin.detail.loadErrorHint', '请检查后端服务是否正常运行。')}
        />
      ) : appData ? (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.name', '应用名称')}>
              {appData.name}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.description', '描述')}>
              {appData.description ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.status', '状态')}>
              <Tag color={STATUS_COLOR[appData.status] ?? 'default'}>
                {appData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.catalogStatus', '目录状态')}>
              {appData.catalog_status ? (
                <Tag color={CATALOG_STATUS_COLOR[appData.catalog_status] ?? 'default'}>
                  {appData.catalog_status}
                </Tag>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.orgId', '租户 ID')}>
              {appData.org_id}
            </Descriptions.Item>
            <Descriptions.Item label="Owner ID">
              {appData.owner_id}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.workflowAdmin.apps.updatedAt', '更新时间')}>
              {appData.updated_at ? dayjs(appData.updated_at).format('YYYY-MM-DD HH:mm:ss') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {appData.created_at ? dayjs(appData.created_at).format('YYYY-MM-DD HH:mm:ss') : '—'}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 12 }}>
              {t('pages.workflowAdmin.detail.canvas', '画布（只读）')}
            </h4>
            {draftLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : nodes.length === 0 ? (
              <Empty
                description={t('pages.workflowAdmin.detail.noCanvas', '暂无画布数据')}
              />
            ) : (
              <div style={{ height: 400, minHeight: 300, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    zoomOnScroll
                    panOnScroll
                    fitView
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background />
                    <Controls showInteractive={false} />
                    <MiniMap
                      nodeColor={(n) =>
                        (n.style?.background as string) ?? '#f0f0f0'
                      }
                    />
                  </ReactFlow>
                </ReactFlowProvider>
              </div>
            )}
          </div>
        </>
      ) : null}
    </Drawer>
  )
}
