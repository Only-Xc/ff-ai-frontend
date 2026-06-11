import { FileTextOutlined } from '@ant-design/icons'
import { Alert, Card, Collapse, Descriptions, Empty, Space } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <FileTextOutlined />
          {t('pages.intervention.panels.error')}
        </Space>
      }
    >
      {error ? (
        <Space className="w-full" orientation="vertical" size={14}>
          <Descriptions column={{ md: 2, xs: 1 }} items={items} size="small" />
          <Alert
            showIcon
            type="error"
            title={error.message || t('pages.intervention.errors.execution')}
          />
          {contextText ? <CodeBlock text={contextText} /> : null}
          {error.traceback ? (
            <Collapse
              items={[
                {
                  key: 'traceback',
                  label: t('pages.intervention.panels.traceback'),
                  children: <CodeBlock text={error.traceback} />,
                },
              ]}
            />
          ) : null}
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.intervention.empty.error')}
        />
      )}
    </Card>
  )
}
