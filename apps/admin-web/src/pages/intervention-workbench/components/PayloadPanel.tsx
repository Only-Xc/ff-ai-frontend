import { CodeOutlined } from '@ant-design/icons'
import { Card, Empty, Space } from 'antd'
import { useTranslation } from 'react-i18next'

import { CodeBlock } from './CodeBlock'

export function PayloadPanel({
  cardClassName,
  payloadText,
}: {
  cardClassName?: string
  payloadText: string
}) {
  const { t } = useTranslation()

  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={
        <Space>
          <CodeOutlined />
          {t('pages.intervention.panels.payload')}
        </Space>
      }
    >
      {payloadText ? (
        <CodeBlock fill text={payloadText} />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.intervention.empty.payload')}
        />
      )}
    </Card>
  )
}
