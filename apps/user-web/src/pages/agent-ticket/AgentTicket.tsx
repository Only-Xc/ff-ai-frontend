import { Tabs } from 'antd'
import { createStyles } from 'antd-style'

import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'

import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'

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
  const { styles } = useStyles()
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = getActiveTab(location.pathname)

  const tabItems = [
    {
      key: 'tickets',
      label: '工单列表',
    },
    {
      key: 'agents',
      label: '智能体列表',
    },
  ]

  // const overviewItems = [
  //   {
  //     label: '总任务数',
  //     value: formatCount(taskCountQuery.data?.count),
  //   },
  //   {
  //     label: '处理中',
  //     value: formatCount(activeTaskCountQuery.data?.count),
  //   },
  //   {
  //     label: '待跟进',
  //     value:
  //       pendingTaskCountQuery.data || failedTaskCountQuery.data
  //         ? formatCount(attentionCount)
  //         : '--',
  //   },
  // ]

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        subtitle="查看工单与智能体执行状态，支持筛选、分页和详情处理。"
        title="智能体与工单"
      >
        {/* <div
          aria-label="列表概览"
          className="grid min-w-84 grid-cols-3 gap-2.5 max-[1180px]:min-w-0 max-[760px]:grid-cols-1"
        >
          {overviewItems.map((item) => (
            <div
              className="rounded-xl border border-(--border) bg-(--panel) px-3.5 py-3 shadow-[0_1px_0_rgb(15_23_42/0.03)]"
              key={item.label}
            >
              <span className="mb-1 block text-xs text-(--muted)">
                {item.label}
              </span>
              <strong className="text-xl font-semibold leading-none tracking-normal text-(--text-strong) tabular-nums">
                {item.value}
              </strong>
            </div>
          ))}
        </div> */}
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-[0_1px_0_rgb(15_23_42/0.03)]">
        <Tabs
          activeKey={activeKey}
          className={styles.tabs}
          items={tabItems}
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
