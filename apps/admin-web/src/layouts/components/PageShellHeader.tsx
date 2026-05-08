import { CreditCardOutlined, MoreOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Dropdown, type MenuProps } from 'antd'
import { createStyles } from 'antd-style'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { appRoutes } from '@/router/routes'
import {
  buildBreadcrumbs,
  getCurrentRouteMeta,
  getRouteTitle,
} from '@/utils/routeMeta'

const useStyles = createStyles(({ prefixCls, token }) => {
  const antCls = `.${prefixCls}`

  return {
    breadcrumb: {
      '&, a': {
        color: 'var(--muted)',
      },
      [`${antCls}-breadcrumb-separator`]: {
        color: 'var(--muted)',
      },
      'a:hover': {
        color: 'var(--text-strong)',
      },
    },
    actions: {
      [`${antCls}-btn`]: {
        borderRadius: token.borderRadius,
      },
    },
  }
})

export function PageShellHeader() {
  const { styles } = useStyles()
  const location = useLocation()
  const { t } = useTranslation()
  const current = getCurrentRouteMeta(appRoutes, location.pathname)
  const breadcrumbs = buildBreadcrumbs(appRoutes, location.pathname, t)
  const title = current
    ? getRouteTitle(current.meta, t)
    : t('routes.usage.title')
  const subtitle = current?.meta.subtitleKey
    ? t(current.meta.subtitleKey)
    : t('pages.shell.defaultSubtitle')
  const moreItems: MenuProps['items'] = [
    { key: 'upgrade', label: t('layout.pageActions.upgrade') },
    { key: 'download', label: t('layout.pageActions.download') },
  ]

  return (
    <header className="mb-6 flex items-start justify-between gap-6 max-[860px]:block">
      <div>
        {breadcrumbs.length ? (
          <Breadcrumb
            className={`mb-2.5 text-xs ${styles.breadcrumb}`}
            items={breadcrumbs.map((item, index) => ({
              title:
                item.clickable && index < breadcrumbs.length - 1 ? (
                  <Link to={item.path}>{item.title}</Link>
                ) : (
                  item.title
                ),
            }))}
          />
        ) : null}
        <h1 className="m-0 text-[22px] font-semibold leading-tight tracking-normal text-(--text-strong)">
          {title}
        </h1>
        <div className="mt-2 text-(--muted)">{subtitle}</div>
      </div>
      <div
        className={`flex flex-wrap items-center justify-end gap-2 max-[860px]:mt-4 max-[860px]:justify-start ${styles.actions}`}
      >
        <Button type="primary" icon={<CreditCardOutlined />}>
          {t('layout.pageActions.topUp')}
        </Button>
        <Dropdown menu={{ items: moreItems }}>
          <Button icon={<MoreOutlined />}>
            {t('layout.pageActions.more')}
          </Button>
        </Dropdown>
      </div>
    </header>
  )
}
