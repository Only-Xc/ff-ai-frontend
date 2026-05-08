import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, Drawer, Layout, Tooltip } from 'antd'
import { createStyles } from 'antd-style'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

import { useLocale } from '@/i18n/useLocale'
import { appRoutes } from '@/router/routes'
import { useAppStore } from '@/store/useApp'
import { getCurrentRouteMeta, getRouteTitle } from '@/utils/routeMeta'
import { Header } from './components/Header'
import { buildNavGroups, getActiveNavKey } from './components/Sidebar/layoutNav'
import { PageShellHeader } from './components/PageShellHeader'
import { Sidebar } from './components/Sidebar'

const {
  Header: LayoutHeader,
  Sider: LayoutSider,
  Content: LayoutContent,
} = Layout

const SIDEBAR_WIDTH = 220
const SIDEBAR_COLLAPSED_WIDTH = 63

const useStyles = createStyles(() => ({
  sidebarSider: {
    scrollbarColor: 'transparent transparent',
    scrollbarWidth: 'thin',

    '&:hover': {
      scrollbarColor: 'var(--scrollbar-thumb) transparent',
    },

    '&::-webkit-scrollbar': {
      width: 8,
      height: 8,
    },

    '&::-webkit-scrollbar-thumb': {
      background: 'transparent',
      borderRadius: 999,
    },

    '&:hover::-webkit-scrollbar-thumb': {
      background: 'var(--scrollbar-thumb)',
    },

    '&:hover::-webkit-scrollbar-thumb:hover': {
      background: 'var(--scrollbar-thumb-hover)',
    },

    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
  sidebarTrigger: {
    padding: 0,
    fontSize: 12,

    '&.ant-btn.ant-btn-icon-only': {
      width: 24,
      minWidth: 24,
      height: 24,
    },
  },
}))

export function AppLayout() {
  const { styles } = useStyles()
  const location = useLocation()
  const { direction } = useLocale()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebarCollapsed = useAppStore(
    (state) => state.toggleSidebarCollapsed,
  )
  const navGroups = useMemo(() => buildNavGroups(appRoutes, t), [t])
  const activeKey = useMemo(
    () => getActiveNavKey(location.pathname, navGroups),
    [location.pathname, navGroups],
  )
  const sidebarWidth = sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH
  const sidebarToggleLabel = sidebarCollapsed
    ? t('layout.sidebar.expand')
    : t('layout.sidebar.collapse')

  useEffect(() => {
    const current = getCurrentRouteMeta(appRoutes, location.pathname)
    const title = current ? getRouteTitle(current.meta, t) : ''
    const appTitle = t('common.appTitle')

    document.title = title ? `${title} - ${appTitle}` : appTitle
  }, [location.pathname, t])

  return (
    <Layout className="min-h-full">
      <LayoutHeader
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: 0,
          background: 'transparent',
        }}
      >
        <Header onOpenMenu={() => setMenuOpen(true)} />
      </LayoutHeader>

      <Layout hasSider>
        {/* 占位符，保证Content区域被撑开 */}
        <div
          aria-hidden="true"
          style={{
            width: sidebarWidth,
            flex: `0 0 ${sidebarWidth}px`,
            transition: 'width 160ms ease, flex-basis 160ms ease',
          }}
        />
        <LayoutSider
          className={styles.sidebarSider}
          collapsible
          collapsed={sidebarCollapsed}
          collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
          trigger={null}
          width={SIDEBAR_WIDTH}
          style={{
            overflow: 'auto',
            height: 'calc(100% - var(--ant-layout-header-height))',
            position: 'fixed',
            insetInlineStart: 0,
            top: 'var(--ant-layout-header-height)',
            scrollbarGutter: 'stable',
            background: 'transparent',
            // paddingBlockEnd: 64,
            transition: 'width 160ms ease, flex-basis 160ms ease',
          }}
        >
          <Sidebar
            activeKey={activeKey}
            collapsed={sidebarCollapsed}
            navGroups={navGroups}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              insetInlineStart: sidebarWidth - 12,
              zIndex: 10,
              transition: 'inset-inline-start 160ms ease',
            }}
          >
            <Tooltip
              title={sidebarToggleLabel}
              placement={direction === 'rtl' ? 'left' : 'right'}
            >
              <Button
                aria-label={sidebarToggleLabel}
                className={styles.sidebarTrigger}
                shape="circle"
                icon={
                  sidebarCollapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )
                }
                onClick={toggleSidebarCollapsed}
              />
            </Tooltip>
          </div>
        </LayoutSider>
        <LayoutContent
          style={{
            minHeight: 'calc(100vh - var(--ant-layout-header-height))',
            paddingBlock: '0 10px',
            paddingInlineEnd: 10,
          }}
        >
          <div className="h-full w-full px-8 pb-10 pt-6 bg-(--ant-color-bg-container) rounded-md">
            <PageShellHeader />
            <main>
              <Outlet />
            </main>
          </div>
        </LayoutContent>
      </Layout>
      <Drawer
        placement={direction === 'rtl' ? 'right' : 'left'}
        size={280}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        styles={{
          body: { padding: 0, background: 'var(--panel)' },
          header: { display: 'none' },
        }}
      >
        <Sidebar
          activeKey={activeKey}
          navGroups={navGroups}
          onNavigate={() => setMenuOpen(false)}
        />
      </Drawer>
    </Layout>
  )
}
