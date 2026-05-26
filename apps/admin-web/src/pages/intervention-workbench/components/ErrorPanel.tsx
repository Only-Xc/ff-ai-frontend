import { FileTextOutlined } from '@ant-design/icons'
import { Alert, Card, Collapse, Descriptions, Empty, Space } from 'antd'
import type { DescriptionsProps } from 'antd'

import type { AdminTaskSnapshotError } from '@/api/ticket-kanban'

import { CodeBlock } from './CodeBlock'

interface ErrorPanelProps {
  cardClassName?: string
  contextText: string
  error?: AdminTaskSnapshotError | null
  items: DescriptionsProps['items']
}

export function ErrorPanel({
  cardClassName,
  contextText,
  error,
  items,
}: ErrorPanelProps) {
  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <FileTextOutlined />
          错误诊断
        </Space>
      }
    >
      {error ? (
        <Space className="w-full" orientation="vertical" size={14}>
          <Descriptions column={{ md: 2, xs: 1 }} items={items} size="small" />
          <Alert showIcon type="error" title={error.message || '执行异常'} />
          {contextText ? <CodeBlock text={contextText} /> : null}
          {error.traceback ? (
            <Collapse
              items={[
                {
                  key: 'traceback',
                  label: '完整堆栈',
                  children: <CodeBlock text={error.traceback} />,
                },
              ]}
            />
          ) : null}
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无错误信息"
        />
      )}
    </Card>
  )
}
