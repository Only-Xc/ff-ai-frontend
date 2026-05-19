import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import type { ConversationsProps } from '@ant-design/x'
import { Conversations } from '@ant-design/x'
import type { GetProp, MenuProps } from 'antd'
import { Empty, Spin, theme } from 'antd'
import { isToday, isValid, isYesterday, parseISO } from 'date-fns'

import type { ChatSummary } from '@/api/types'
import { sessionTitle } from '@/pages/chat/hooks/useAgentSessions'

interface AgentMsgHistoryProps {
  sessions: ChatSummary[]
  activeKey: string | null
  loading: boolean
  onNewChat: () => void
  onSelect: (key: string) => void
  onDelete: (key: string) => void
}

function groupLabel(session: ChatSummary): string {
  const dateText = session.updatedAt ?? session.createdAt
  const date = dateText ? parseISO(dateText) : null

  if (!date || !isValid(date)) {
    return '更早'
  }

  if (isToday(date)) {
    return '今天'
  }

  if (isYesterday(date)) {
    return '昨天'
  }

  return '更早'
}

export function AgentMsgHistory({
  activeKey,
  loading,
  onDelete,
  onNewChat,
  onSelect,
  sessions,
}: AgentMsgHistoryProps) {
  const { token } = theme.useToken()
  const style = {
    width: '100%',
    padding: 0,
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
  }

  const items: GetProp<ConversationsProps, 'items'> = sessions.map(
    (session) => ({
      key: session.key,
      label: (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{sessionTitle(session)}</span>
          {session.isStreaming ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-(--ant-color-text-description)">
              <Spin size="small" />
              <span>生成中</span>
            </span>
          ) : null}
        </span>
      ),
      group: groupLabel(session),
    }),
  )

  const menu: ConversationsProps['menu'] = (conversation): MenuProps => ({
    items: [
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined />,
        label: '删除',
      },
    ],
    onClick: (info) => {
      info.domEvent.stopPropagation()
      if (info.key === 'delete') {
        onDelete(conversation.key)
      }
    },
  })

  const groupable: GetProp<typeof Conversations, 'groupable'> = {
    label: (group, { groupInfo }) => (
      <>
        {group}({groupInfo.data.length})
      </>
    ),
    collapsible: (group) => {
      return group !== '今天'
    },
  }

  const hasMsg = sessions.length !== 0

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <Conversations
        activeKey={activeKey ?? undefined}
        creation={{
          label: '新建对话',
          align: 'start',
          icon: <FormOutlined />,
          onClick: onNewChat,
        }}
        groupable={groupable}
        items={items}
        menu={menu}
        onActiveChange={(key) => onSelect(key)}
        style={style}
        className={hasMsg ? 'min-h-0 flex-1 overflow-auto' : undefined}
      />
      {!hasMsg && (
        <div className="flex flex-1 items-center justify-center">
          {loading ? (
            <Spin size="small" />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无会话
                  <br />
                  （请点击新建）
                </span>
              }
              className="mt-8"
            />
          )}
        </div>
      )}
    </div>
  )
}
