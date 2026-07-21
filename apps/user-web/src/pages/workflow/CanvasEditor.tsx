import {
  ArrowLeftOutlined,
  BugOutlined,
  CloudUploadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, message, Space, Tooltip } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { v4 as uuidv4 } from 'uuid'

import {
  getWorkflowApp,
  getWorkflowDraft,
  publishWorkflow,
  updateWorkflowDraft,
  validateWorkflow,
  workflowKeys,
  type WorkflowGraph,
  type WorkflowNode,
} from '@/api/workflow'

import { DebugDrawer } from './DebugDrawer'
import { NodeConfigPanel } from './NodeConfigPanel'
import { PublicationPanel } from './PublicationPanel'
import { WorkflowNodeCard } from './nodes/WorkflowNodeCard'

const NODE_PALETTE = [
  { type: 'user_input', label: 'User Input', color: '#52c41a' },
  { type: 'permission_gate', label: 'Permission Gate', color: '#faad14' },
  { type: 'knowledge_retrieval', label: 'Knowledge', color: '#1890ff' },
  { type: 'data_source_query', label: 'Data Source', color: '#722ed1' },
  { type: 'variable_transform', label: 'Transform', color: '#13c2c2' },
  { type: 'template', label: 'Template', color: '#eb2f96' },
  { type: 'condition', label: 'Condition', color: '#fa8c16' },
  { type: 'llm', label: 'LLM', color: '#2f54eb' },
  { type: 'answer', label: 'Answer', color: '#f5222d' },
]

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeCard,
}

function CanvasEditorInner() {
  const { t } = useTranslation()
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [revision, setRevision] = useState(0)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [debugOpen, setDebugOpen] = useState(false)
  const [publishPanelOpen, setPublishPanelOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load app info
  const { data: appData } = useQuery({
    queryKey: workflowKeys.app(appId!),
    queryFn: () => getWorkflowApp(appId!),
    enabled: !!appId,
  })

  // Load draft
  const { data: draftData } = useQuery({
    queryKey: workflowKeys.draft(appId!),
    queryFn: () => getWorkflowDraft(appId!),
    enabled: !!appId,
  })

  // Initialize canvas from draft
  if (draftData && !initialized) {
    const draft = draftData
    setRevision(draft.revision)
    if (draft.graph_json) {
      const graph = draft.graph_json
      setNodes(
        (graph.nodes || []).map((n: WorkflowNode) => ({
          id: n.id,
          type: 'workflowNode',
          position: n.position || { x: 0, y: 0 },
          data: { nodeType: n.type, config: n.config, label: n.type },
        })),
      )
      setEdges(
        (graph.edges || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: { branch: e.branch },
        })),
      )
    }
    setInitialized(true)
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  )
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, id: uuidv4() }, eds)),
    [],
  )

  // Save draft
  const saveMutation = useMutation({
    mutationFn: () => {
      const graph: WorkflowGraph = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: (n.data)?.nodeType as string || '',
          position: n.position,
          config: ((n.data)?.config as Record<string, unknown>) || {},
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          branch: (e.data!)?.branch as string | undefined,
        })),
      }
      return updateWorkflowDraft(appId!, { graph_json: graph }, revision)
    },
    onSuccess: (res: Awaited<ReturnType<typeof updateWorkflowDraft>>) => {
      setRevision(res.revision)
      void queryClient.invalidateQueries({ queryKey: workflowKeys.draft(appId!) })
      message.success(t('pages.workflow.saveSuccess'))
    },
    onError: (err: Error) => {
      if (err.message?.includes('412') || err.message?.includes('conflict')) {
        message.error(t('pages.workflow.revisionConflict'))
      } else {
        message.error(t('pages.workflow.saveFailed'))
      }
    },
  })

  // Validate
  const validateMutation = useMutation({
    mutationFn: () => validateWorkflow(appId!),
    onSuccess: (res: Awaited<ReturnType<typeof validateWorkflow>>) => {
      if (res.valid) {
        message.success(t('pages.workflow.validatePass'))
      } else {
        message.warning(
          t('pages.workflow.validateIssues', {
            blocking: res.blocking.length,
            warnings: res.warnings.length,
          }),
        )
      }
    },
  })

  // Publish
  const publishMutation = useMutation({
    mutationFn: () => publishWorkflow(appId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowKeys.app(appId!) })
      message.success(t('pages.workflow.publishSuccess'))
    },
    onError: () => message.error(t('pages.workflow.publishFailed')),
  })

  // Add node from palette
  const addNode = (nodeType: string, event: React.DragEvent) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const newNode: Node = {
      id: uuidv4(),
      type: 'workflowNode',
      position,
      data: { nodeType, config: {}, label: nodeType },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null
    const node = nodes.find((n) => n.id === selectedNode)
    if (!node) return null
    return {
      id: node.id,
      nodeType: (node.data)?.nodeType as string,
      config: ((node.data)?.config as Record<string, unknown>) || {},
    }
  }, [selectedNode, nodes])

  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
      ),
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => { void navigate('/workflow') }}
          />
          <span style={{ fontWeight: 600 }}>
            {appData?.name ?? t('pages.workflow.canvas')}
          </span>
        </Space>
        <Space>
          <Tooltip title={t('pages.workflow.debug')}>
            <Button icon={<BugOutlined />} onClick={() => setDebugOpen(true)}>
              {t('pages.workflow.debug')}
            </Button>
          </Tooltip>
          <Button
            icon={<SaveOutlined />}
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            {t('common.save')}
          </Button>
          <Button onClick={() => validateMutation.mutate()}>
            {t('pages.workflow.validate')}
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => publishMutation.mutate()}
            loading={publishMutation.isPending}
          >
            {t('pages.workflow.publish')}
          </Button>
          <Button
            icon={<CloudUploadOutlined />}
            onClick={() => setPublishPanelOpen(true)}
          >
            {t('pages.workflow.publicationPanel')}
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Node Palette */}
        <div
          style={{
            width: 180,
            borderRight: '1px solid #f0f0f0',
            padding: 12,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {t('pages.workflow.nodePalette')}
          </div>
          {NODE_PALETTE.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('nodeType', item.type)}
              style={{
                padding: '8px 12px',
                marginBottom: 6,
                borderRadius: 6,
                border: `1px solid ${item.color}40`,
                background: `${item.color}08`,
                cursor: 'grab',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: item.color,
                  marginRight: 8,
                }}
              />
              {item.label}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          style={{ flex: 1 }}
          onDrop={(e) => {
            e.preventDefault()
            const nodeType = e.dataTransfer.getData('nodeType')
            if (nodeType) addNode(nodeType, e)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNode(node.id)}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Node Config Panel */}
      <Drawer
        title={t('pages.workflow.nodeConfig')}
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        width={360}
      >
        {selectedNodeData && (
          <NodeConfigPanel
            nodeId={selectedNodeData.id}
            nodeType={selectedNodeData.nodeType}
            config={selectedNodeData.config}
            onChange={(config) => updateNodeConfig(selectedNodeData.id, config)}
          />
        )}
      </Drawer>

      {/* Debug Drawer */}
      <DebugDrawer
        open={debugOpen}
        onClose={() => setDebugOpen(false)}
        appId={appId!}
      />

      {/* Publication Panel Drawer */}
      <Drawer
        title={t('pages.workflow.publicationPanel')}
        open={publishPanelOpen}
        onClose={() => setPublishPanelOpen(false)}
        width={400}
      >
        <PublicationPanel
          appId={appId!}
          appStatus={appData?.status ?? 'draft'}
          activeVersionId={appData?.active_version_id ?? null}
        />
      </Drawer>
    </div>
  )
}

export default function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  )
}
