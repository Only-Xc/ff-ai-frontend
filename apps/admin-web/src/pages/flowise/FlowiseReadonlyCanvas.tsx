import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useMemo } from 'react'

import type {
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowReadonlyGraph,
} from '@/api/workflow-admin'

import './FlowiseReadonlyCanvas.css'

interface FlowiseReadonlyCanvasProps {
  graph: WorkflowReadonlyGraph
  ariaLabel: string
}

function readLabel(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readDimension(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

/** Flowise category → accent color mapping. */
const CATEGORY_COLORS: Record<string, string> = {
  Agents: '#1677ff',
  Agent: '#1677ff',
  LLMs: '#52c41a',
  LLM: '#52c41a',
  'Chat Models': '#52c41a',
  Prompts: '#fa8c16',
  Prompt: '#fa8c16',
  Tools: '#722ed1',
  Tool: '#722ed1',
  Memory: '#eb2f96',
  Chains: '#13c2c2',
  Chain: '#13c2c2',
  'Vector Stores': '#2f54eb',
  Embeddings: '#faad14',
  'Output Parsers': '#f5222d',
  'Text Splitters': '#a0d911',
  'Document Loaders': '#36cfc9',
  Retrievers: '#597ef7',
  Utilities: '#8c8c8c',
}

function resolveAccent(node: WorkflowGraphNode): string {
  const category =
    (node.data?.category as string | undefined) ??
    (node.data?.type as string | undefined) ??
    node.type ??
    ''
  return CATEGORY_COLORS[category] ?? '#1677ff'
}

function mapNode(node: WorkflowGraphNode, index: number): Node {
  const name =
    readLabel(node.data?.label) ??
    readLabel(node.data?.name) ??
    readLabel(node.label) ??
    readLabel(node.type) ??
    node.id
  const nodeType = readLabel(node.data?.name) ?? readLabel(node.type)
  const category = (node.data?.category as string | undefined) ?? ''
  const description = (node.data?.description as string | undefined) ?? ''
  const position = node.position ?? {
    x: (index % 4) * 320,
    y: Math.floor(index / 4) * 180,
  }
  const accent = resolveAccent(node)

  return {
    id: node.id,
    type: 'default',
    position,
    data: {
      label: (
        <div className="flowise-readonly-node__content">
          <div
            className="flowise-readonly-node__header"
            style={{ background: accent }}
          >
            <span className="flowise-readonly-node__name">{name}</span>
            {category ? (
              <span className="flowise-readonly-node__category">{category}</span>
            ) : null}
          </div>
          <div className="flowise-readonly-node__body">
            {nodeType && nodeType !== name ? (
              <span className="flowise-readonly-node__type">{nodeType}</span>
            ) : null}
            {description ? (
              <span className="flowise-readonly-node__desc">{description}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    className: 'flowise-readonly-node',
    style: {
      width: readDimension(node.width, 280),
      height: readDimension(node.height, 90),
    },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
  }
}

function mapEdge(edge: WorkflowGraphEdge, index: number): Edge {
  return {
    id: edge.id ?? `edge-${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    label: edge.label ?? edge.branch,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    selectable: false,
    focusable: false,
  }
}

function readViewport(graph: WorkflowReadonlyGraph): Viewport | undefined {
  const viewport = graph.viewport
  if (
    !viewport ||
    !Number.isFinite(viewport.x) ||
    !Number.isFinite(viewport.y) ||
    !Number.isFinite(viewport.zoom) ||
    viewport.zoom <= 0
  ) {
    return undefined
  }
  return viewport
}

export function FlowiseReadonlyCanvas({
  graph,
  ariaLabel,
}: FlowiseReadonlyCanvasProps) {
  const nodes = useMemo(() => graph.nodes.map(mapNode), [graph.nodes])
  const edges = useMemo(() => graph.edges.map(mapEdge), [graph.edges])
  const viewport = useMemo(() => readViewport(graph), [graph])

  return (
    <div className="flowise-readonly-canvas" aria-label={ariaLabel}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          defaultViewport={viewport}
          fitView={!viewport}
          fitViewOptions={{ padding: 0.16, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d9dee8" gap={24} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
          <MiniMap
            pannable
            zoomable
            position="bottom-left"
            nodeColor="#e9f2ff"
            nodeStrokeColor="#5b7fa3"
            maskColor="rgba(247, 249, 252, 0.78)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
