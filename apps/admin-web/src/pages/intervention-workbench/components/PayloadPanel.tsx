import { CodeOutlined } from '@ant-design/icons'
import { Card, Empty, Space } from 'antd'

import { CodeBlock } from './CodeBlock'

export function PayloadPanel({
  cardClassName,
  payloadText,
}: {
  cardClassName?: string
  payloadText: string
}) {
  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <CodeOutlined />
          上下文摘要
        </Space>
      }
    >
      {payloadText ? (
        <CodeBlock fill text={payloadText} />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无上下文摘要"
        />
      )}
    </Card>
  )
}
