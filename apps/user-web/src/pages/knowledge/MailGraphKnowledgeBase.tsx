/* eslint-disable react-dom/no-unsafe-iframe-sandbox -- Same-origin scripts are required for route, locale, and theme synchronization. */
import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Skeleton, Tooltip, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { useAppStore } from '@/store/useApp'

const LOAD_TIMEOUT_MS = 15_000
const MAILGRAPH_SECTIONS = new Set([
  'chat',
  'dashboard',
  'graph',
  'knowledge',
  'workbench',
])

const SECTION_TITLE_KEYS: Record<string, string> = {
  chat: 'routes.mailgraph.chat',
  dashboard: 'routes.mailgraph.dashboard',
  graph: 'routes.mailgraph.graph',
  knowledge: 'routes.mailgraph.knowledge',
  workbench: 'routes.mailgraph.workbench',
}

interface MailGraphRouteMessage {
  query?: Record<string, unknown>
  reason: 'ready' | 'route-change'
  section: string
  type: 'ff-mailgraph-route'
}

function isMailGraphRouteMessage(value: unknown): value is MailGraphRouteMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>

  return (
    message.type === 'ff-mailgraph-route' &&
    (message.reason === 'ready' || message.reason === 'route-change') &&
    typeof message.section === 'string' &&
    (message.query === undefined ||
      (typeof message.query === 'object' && message.query !== null))
  )
}

function serializeRouteQuery(query: Record<string, unknown> | undefined) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    const values = Array.isArray(value) ? value : [value]

    for (const item of values) {
      if (typeof item === 'string') params.append(key, item)
    }
  }

  return params.toString()
}

export default function MailGraphKnowledgeBase() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const frameRef = useRef<HTMLIFrameElement>(null)
  const theme = useAppStore((state) => state.theme)
  const locale = useAppStore((state) => state.locale)
  const [frameKey, setFrameKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  )
  const section = location.pathname.split('/').filter(Boolean).at(-1) ?? 'chat'
  const titleKey = SECTION_TITLE_KEYS[section] ?? SECTION_TITLE_KEYS.chat
  const frameUrl = useMemo(() => {
    const params = new URLSearchParams(location.search)
    params.set('embedded', '1')
    return `/mailgraph/${encodeURIComponent(section)}?${params.toString()}`
  }, [location.search, section])

  const syncPlatformContext = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'ff-platform-context',
        theme,
        locale,
        direction: locale === 'ar' ? 'rtl' : 'ltr',
      },
      window.location.origin,
    )
  }, [locale, theme])

  useEffect(() => {
    setLoaded(false)
    setTimedOut(false)
    const timeout = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [frameKey, frameUrl])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    syncPlatformContext()
  }, [syncPlatformContext])

  useEffect(() => {
    const handleMailGraphMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        !isMailGraphRouteMessage(event.data)
      ) {
        return
      }
      const nextSection = event.data.section
      if (!MAILGRAPH_SECTIONS.has(nextSection)) return
      // Query-only changes (for example selecting a graph folder) stay inside
      // the iframe. Reloading the iframe for every query update caused stale
      // ready messages to race and bounce between graph and file routes.
      if (event.data.reason !== 'route-change' || nextSection === section) return
      const query = serializeRouteQuery(event.data.query)
      void navigate(
        `/knowledge/mailgraph/${nextSection}${query ? `?${query}` : ''}`,
        { replace: true },
      )
    }
    window.addEventListener('message', handleMailGraphMessage)
    return () => window.removeEventListener('message', handleMailGraphMessage)
  }, [navigate, section])

  const reload = () => {
    setLoaded(false)
    setTimedOut(false)
    setFrameKey((value) => value + 1)
  }

  const workspace = (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 flex-col bg-(--panel) max-md:fixed max-md:inset-0 max-md:z-[1000] max-md:h-dvh">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-(--border) px-4">
        <div className="flex min-w-0 items-center">
          <Typography.Text className="truncate font-medium">{t(titleKey)}</Typography.Text>
        </div>
        <Tooltip title={t('common.actions.refresh')}>
          <Button
            aria-label={t('common.actions.refresh')}
            icon={<ReloadOutlined />}
            type="text"
            onClick={reload}
          />
        </Tooltip>
      </header>

      {timedOut && !loaded ? (
        <Alert
          action={<Button size="small" onClick={reload}>{t('common.actions.retry')}</Button>}
          showIcon
          title={t('pages.mailgraph.loadTimeout')}
          type="warning"
        />
      ) : null}

      <div className="relative min-h-0 flex-1">
        {!loaded && !timedOut ? (
          <div className="absolute inset-0 z-10 bg-(--panel) p-5">
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        ) : null}
        <iframe
          key={frameKey}
          ref={frameRef}
          className="size-full border-0"
          referrerPolicy="same-origin"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
          src={frameUrl}
          title={t(titleKey)}
          onLoad={() => {
            setLoaded(true)
            setTimedOut(false)
            syncPlatformContext()
          }}
        />
      </div>
    </div>
  )

  return isMobile ? createPortal(workspace, document.body) : workspace
}
