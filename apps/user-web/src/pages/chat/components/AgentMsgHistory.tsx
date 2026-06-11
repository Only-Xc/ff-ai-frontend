import { DeleteOutlined, FormOutlined } from '@ant-design/icons'
import type { ConversationsProps } from '@ant-design/x'
import { Conversations } from '@ant-design/x'
import type { GetProp, MenuProps } from 'antd'
import { Empty, Spin, theme } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type { ChatSummary } from '@/pages/chat/types'
import { sessionTitle } from '@/pages/chat/hooks/useAgentSessions'

interface AgentMsgHistoryProps {
  sessions: ChatSummary[]
  streamingChatIdSet: ReadonlySet<string>
  activeKey: string | null
  loading: boolean
  onNewChat: () => void
  onSelect: (key: string) => void
  onDelete: (key: string) => void
}

function groupLabel(session: ChatSummary, t: TFunction): string {
  const dateText = session.updatedAt ?? session.createdAt
  const date = dateText ? dayjs(dateText) : null

  if (!date?.isValid()) {
    return t('pages.chat.history.older')
  }

  if (date.isSame(dayjs(), 'day')) {
    return t('pages.chat.history.today')
  }

  if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return t('pages.chat.history.yesterday')
  }

  return t('pages.chat.history.older')
}

export function AgentMsgHistory({
  activeKey,
  loading,
  onDelete,
  onNewChat,
  onSelect,
  sessions,
  streamingChatIdSet,
}: AgentMsgHistoryProps) {
  const { t } = useTranslation()
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
          <span className="truncate">{sessionTitle(session, t)}</span>
          {streamingChatIdSet.has(session.chatId) ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-(--ant-color-text-description)">
              <Spin size="small" />
              <span>{t('pages.chat.history.generating')}</span>
            </span>
          ) : null}
        </span>
      ),
      group: groupLabel(session, t),
    }),
  )

  const menu: ConversationsProps['menu'] = (conversation): MenuProps => ({
    items: [
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined />,
        label: t('pages.chat.history.delete'),
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
      return group !== t('pages.chat.history.today')
    },
  }

  const hasMsg = sessions.length !== 0

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <Conversations
        activeKey={activeKey ?? undefined}
        creation={{
          label: t('pages.chat.history.newChat'),
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
                  {t('pages.chat.history.empty')}
                  <br />
                  {t('pages.chat.history.emptyHint')}
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
