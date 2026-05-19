import { theme } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { Welcome } from '@ant-design/x'

export function AgentWelcome() {
  const { token } = theme.useToken()

  return (
    <Welcome
      icon={<RobotOutlined />}
      title="Agent 工作台"
      description="输入需求后，我会基于当前上下文给出回复。"
      variant="borderless"
      styles={{
        root: {
          maxWidth: 520,
          background: token.colorBgContainer,
        },
      }}
    />
  )
}
