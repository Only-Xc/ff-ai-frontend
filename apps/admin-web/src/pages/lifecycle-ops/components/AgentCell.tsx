import { Space, Typography } from 'antd'

interface AgentCellProps {
  agentId: string
  name: string
}

export function AgentCell({ agentId, name }: AgentCellProps) {
  return (
    <Space orientation="vertical" size={2}>
      <Typography.Text strong>{name}</Typography.Text>
      <Typography.Text copyable type="secondary">
        {agentId}
      </Typography.Text>
    </Space>
  )
}
