import { Handle, Position, type NodeProps } from '@xyflow/react'

const NODE_COLORS: Record<string, string> = {
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

const NODE_LABELS: Record<string, string> = {
  user_input: 'User Input',
  permission_gate: 'Permission Gate',
  knowledge_retrieval: 'Knowledge Retrieval',
  data_source_query: 'Data Source Query',
  variable_transform: 'Variable Transform',
  template: 'Template',
  condition: 'Condition',
  llm: 'LLM',
  answer: 'Answer',
}

export function WorkflowNodeCard({ data, selected }: NodeProps) {
  const nodeData = data as Record<string, unknown> | undefined
  const nodeType = (nodeData?.nodeType as string) || 'unknown'
  const color = NODE_COLORS[nodeType] || '#999'
  const label = NODE_LABELS[nodeType] || nodeType

  return (
    <div
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        border: `2px solid ${selected ? color : `${color}60`}`,
        background: '#fff',
        boxShadow: selected ? `0 0 0 2px ${color}30` : '0 1px 4px rgba(0,0,0,0.08)',
        minWidth: 140,
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          marginRight: 6,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  )
}
