import { CloseCircleOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Space } from 'antd'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
        {t('pages.intervention.actions.reprompt')}
      </Button>
      <Button
        block={mode === 'card'}
        className="cursor-pointer"
        danger
        disabled={!canOperate}
        icon={<CloseCircleOutlined />}
        onClick={onOpenReject}
      >
        {t('pages.intervention.actions.reject')}
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
            title={t('pages.intervention.actions.viewOnly')}
          />
        )}
      </Space>
    )
  }

  return (
    <Card
      className={`rounded-lg! ${cardClassName ?? ''}`}
      title={t('pages.intervention.actions.title')}
    >
      <Space className="w-full" direction="vertical" size={12}>
        {actions}
        {canOperate ? null : (
          <Alert
            showIcon
            type="warning"
            title={t('pages.intervention.actions.viewOnly')}
          />
        )}
      </Space>
    </Card>
  )
}
