import { Button, Result } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <Result
      status="403"
      title={t('routes.forbidden.title')}
      subTitle={t('pages.forbidden.subtitle')}
      extra={
        <Button type="primary">
          <Link to="/chat">{t('pages.forbidden.backHome')}</Link>
        </Button>
      }
    />
  )
}
