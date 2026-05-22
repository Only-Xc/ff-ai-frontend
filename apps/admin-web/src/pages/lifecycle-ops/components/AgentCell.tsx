import { Space, Typography } from 'antd'

import { formatText } from '../utils/lifecycleFormatters'

interface AgentCellProps {
  agentId: string
  name: string
}

export function AgentCell({ agentId, name }: AgentCellProps) {
  return (
    <Space direction="vertical" size={2}>
      <Typography.Text strong>{formatText(name)}</Typography.Text>
      <Typography.Text copyable type="secondary">
        {agentId}
      </Typography.Text>
    </Space>
  )
}
