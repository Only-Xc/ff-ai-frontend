import { theme } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { Welcome } from '@ant-design/x'
import { useTranslation } from 'react-i18next'

export function AgentWelcome() {
  const { t } = useTranslation()
  const { token } = theme.useToken()

  return (
    <Welcome
      icon={<RobotOutlined />}
      title={t('pages.chat.welcome.title')}
      description={t('pages.chat.welcome.description')}
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
