import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Result, Skeleton, Space, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

import {
  pluginCatalogKeys,
  plugins_catalog,
  plugins_createUiSession,
} from '@/api/plugins'
import { useLocale } from '@/i18n/useLocale'
import { useAppStore } from '@/store/useApp'

const LOAD_TIMEOUT_MS = 15_000
const SESSION_REFRESH_BUFFER_MS = 60_000

export default function PluginCarrier() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { pluginId = '', '*': pluginPath = '' } = useParams()
  const themeMode = useAppStore((state) => state.theme)
  const { locale } = useLocale()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const sessionQuery = useQuery({
    queryKey: pluginCatalogKeys.uiSession(pluginId),
    queryFn: () => plugins_createUiSession(pluginId),
    enabled: Boolean(pluginId),
    retry: false,
  })
  const sessionExpiresAt = sessionQuery.data?.expires_at
  const refreshSession = sessionQuery.refetch
  const catalogQuery = useQuery({
    queryKey: pluginCatalogKeys.list(false, pluginId),
    queryFn: () => plugins_catalog({ keyword: pluginId }),
    enabled: Boolean(pluginId),
  })
  const pluginName =
    catalogQuery.data?.data.find((item) => item.plugin_id === pluginId)?.name ??
    pluginId

  useEffect(() => {
    if (!sessionQuery.data?.url || loaded) return
    const timeout = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [loaded, sessionQuery.data?.url])

  useEffect(() => {
    if (!sessionExpiresAt) return
    const expiresAt = Date.parse(sessionExpiresAt)
    if (!Number.isFinite(expiresAt)) return
    const refreshDelay = Math.max(1_000, expiresAt - Date.now() - SESSION_REFRESH_BUFFER_MS)
    const timeout = window.setTimeout(() => {
      void refreshSession()
    }, refreshDelay)
    return () => window.clearTimeout(timeout)
  }, [refreshSession, sessionExpiresAt])

  const syncPreferences = useCallback(() => {
    const target = iframeRef.current?.contentWindow
    target?.postMessage({ type: 'ff-ai:theme', theme: themeMode }, '*')
    target?.postMessage({ type: 'ff-ai:locale', locale }, '*')
  }, [locale, themeMode])

  useEffect(() => {
    if (loaded) syncPreferences()
  }, [loaded, syncPreferences])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.source === iframeRef.current?.contentWindow &&
        event.data?.type === 'ff-ai:plugin-ready'
      ) {
        syncPreferences()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [syncPreferences])

  const retry = async () => {
    setLoaded(false)
    setTimedOut(false)
    await sessionQuery.refetch()
  }

  if (sessionQuery.isPending) {
    return <Skeleton active className="p-5" paragraph={{ rows: 12 }} />
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <Result
        status="error"
        title={t('pages.pluginCarrier.sessionFailed')}
        subTitle={t('pages.pluginCarrier.sessionFailedHint')}
        extra={[
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => void navigate('/platform-apps')}
          >
            {t('pages.pluginCarrier.back')}
          </Button>,
          <Button key="retry" type="primary" onClick={() => void retry()}>
            {t('common.actions.retry')}
          </Button>,
        ]}
      />
    )
  }

  const frameUrl = `${sessionQuery.data.url.replace(/\/$/, '')}/${pluginPath}${location.search}`

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 flex-col bg-(--panel)">
      {pluginId !== 'exam' ? (
        <header className="flex shrink-0 items-center justify-between border-b border-(--border) px-4 py-2">
          <Space>
            {pluginId !== 'kb-pipeline' ? (
              <Button
                aria-label={t('pages.pluginCarrier.back')}
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => void navigate('/platform-apps')}
              />
            ) : null}
            <div className="min-w-0">
              <Typography.Text className="block font-medium">
                {pluginName}
              </Typography.Text>
              <Typography.Text className="block text-xs" type="secondary">
                {t('pages.pluginCarrier.connected')}
              </Typography.Text>
            </div>
          </Space>
          <Button
            aria-label={t('common.actions.refresh')}
            icon={<ReloadOutlined />}
            type="text"
            onClick={() => void retry()}
          />
        </header>
      ) : null}

      {timedOut && !loaded ? (
        <Alert
          action={
            <Button size="small" onClick={() => void retry()}>
              {t('common.actions.retry')}
            </Button>
          }
          title={t('pages.pluginCarrier.timeout')}
          showIcon
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
          className="size-full border-0"
          ref={iframeRef}
          referrerPolicy="no-referrer"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
          src={frameUrl}
          title={t('pages.pluginCarrier.frameTitle', { pluginId: pluginName })}
          onLoad={() => {
            setLoaded(true)
            setTimedOut(false)
            syncPreferences()
          }}
        />
      </div>
    </div>
  )
}
