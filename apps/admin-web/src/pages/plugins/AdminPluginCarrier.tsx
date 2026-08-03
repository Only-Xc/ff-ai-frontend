import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Result, Skeleton, Space, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

import { pluginKeys, plugins_createUiSession } from '@/api/plugins'
import { useAppStore } from '@/store/useApp'

const LOAD_TIMEOUT_MS = 15_000

function messageTargetOrigin(url: string | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.origin
      : null
  } catch {
    return null
  }
}

export default function AdminPluginCarrier() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { pluginId: routePluginId = '', '*': routePluginPath = '' } =
    useParams()
  const pathMatch = location.pathname.match(
    /^\/plugins\/([^/]+)\/app(?:\/(.*))?$/,
  )
  const pluginId = routePluginId || pathMatch?.[1] || ''
  const pluginPath = routePluginPath || pathMatch?.[2] || ''
  const themeMode = useAppStore((state) => state.theme)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const sessionQuery = useQuery({
    queryKey: pluginKeys.uiSession(pluginId),
    queryFn: () => plugins_createUiSession(pluginId),
    enabled: Boolean(pluginId),
    retry: false,
  })
  const targetOrigin = useMemo(
    () => messageTargetOrigin(sessionQuery.data?.url),
    [sessionQuery.data?.url],
  )

  useEffect(() => {
    if (!sessionQuery.data?.url || loaded) return
    const timeout = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [loaded, sessionQuery.data?.url])

  const syncTheme = useCallback(() => {
    if (!targetOrigin) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'ff-ai:theme', theme: themeMode },
      targetOrigin,
    )
  }, [targetOrigin, themeMode])

  useEffect(() => {
    if (loaded) syncTheme()
  }, [loaded, syncTheme])

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
            onClick={() => void navigate('/plugins')}
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
            <Button
              aria-label={t('pages.pluginCarrier.back')}
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => void navigate('/plugins')}
            />
            <div className="min-w-0">
              <Typography.Text className="block font-medium">
                {pluginId}
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
          title={t('pages.pluginCarrier.frameTitle', { pluginId })}
          onLoad={() => {
            setLoaded(true)
            setTimedOut(false)
            syncTheme()
          }}
        />
      </div>
    </div>
  )
}
