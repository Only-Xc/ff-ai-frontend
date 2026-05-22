import { CloseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space } from 'antd'

interface ActionPanelProps {
  cardClassName?: string
  canOperate: boolean
  mode?: 'card' | 'inline'
  onOpenReject: () => void
  onOpenReprompt: () => void
}

export function ActionPanel({
  cardClassName,
  canOperate,
  mode = 'card',
  onOpenReject,
  onOpenReprompt,
}: ActionPanelProps) {
  const actions = (
    <>
      <Button
        block={mode === 'card'}
        className="cursor-pointer"
        disabled={!canOperate}
        icon={<SendOutlined />}
        type="primary"
        onClick={onOpenReprompt}
      >
        注入 Prompt 重跑
      </Button>
      <Button
        block={mode === 'card'}
        className="cursor-pointer"
        danger
        disabled={!canOperate}
        icon={<CloseCircleOutlined />}
        onClick={onOpenReject}
      >
        驳回关闭
      </Button>
    </>
  )

  if (mode === 'inline') {
    return (
      <Space wrap size={8}>
        {actions}
        {canOperate ? null : (
          <Alert
            showIcon
            className="py-1!"
            type="warning"
            title="当前状态仅支持查看"
          />
        )}
      </Space>
    )
  }

  return (
    <Card className={`rounded-lg! ${cardClassName ?? ''}`} title="处理动作">
      <Space className="w-full" direction="vertical" size={12}>
        {actions}
        {canOperate ? null : (
          <Alert showIcon type="warning" title="当前状态仅支持查看" />
        )}
      </Space>
    </Card>
  )
}
