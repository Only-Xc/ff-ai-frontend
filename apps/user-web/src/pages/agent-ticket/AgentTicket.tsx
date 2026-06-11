import { Tabs } from 'antd'
import { createStyles } from 'antd-style'
import { useTranslation } from 'react-i18next'

import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'

import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'
import { agentTicketTabs } from './constants'

const useStyles = createStyles(() => ({
  tabs: {
    paddingTop: 18,
    '.ant-tabs-nav': {
      margin: 0,
      padding: '0 20px',

      '&::before': {
        display: 'none',
      },
    },

    '.ant-tabs-tab': {
      padding: '0 0 12px',
      color: 'var(--muted)',
      fontSize: 14,
      fontWeight: 600,
    },

    '.ant-tabs-tab-active .ant-tabs-tab-btn': {
      color: 'var(--text-strong) !important',
    },

    '.ant-tabs-ink-bar': {
      background: 'var(--admin-primary)',
    },
  },
}))

function getActiveTab(pathname: string) {
  if (pathname === '/agent-ticket/agents') return 'agents'

  return 'tickets'
}

export function AgentTicketPage() {
  const { t } = useTranslation()
  const { styles } = useStyles()
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = getActiveTab(location.pathname)

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        subtitle={t('pages.agentTicket.subtitle')}
        title={t('pages.agentTicket.title')}
      />

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-[0_1px_0_rgb(15_23_42/0.03)]">
        <Tabs
          activeKey={activeKey}
          className={styles.tabs}
          items={agentTicketTabs.map((item) => ({
            key: item.key,
            label: t(item.labelKey),
          }))}
          tabBarGutter={20}
          onChange={(key) => void navigate(`/agent-ticket/${key}`)}
        />
        <div className="min-h-0 flex-1 pt-4">
          <Outlet />
        </div>
      </PageContainer>
    </div>
  )
}

export function AgentTicketIndexRedirect() {
  return <Navigate replace to="tickets" />
}

export default AgentTicketPage
