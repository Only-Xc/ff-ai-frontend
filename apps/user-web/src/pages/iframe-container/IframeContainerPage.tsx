import { ReloadOutlined } from '@ant-design/icons'
import { Button, Result, Spin } from 'antd'
import { createStyles } from 'antd-style'
import { PageContainer } from '@ff-ai-frontend/components'
import WujieReact from '@/components/WujieReact'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { useMenuStore } from '@/store/useMenu'

const useStyles = createStyles(() => ({
  root: {
    height: 'calc(100vh - var(--ant-layout-header-height) - 10px)',
    minHeight: 480,
    overflow: 'hidden',
    background: 'var(--panel)',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
}))

const wujieIframeAttrs = {
  sandbox:
    'allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts',
}

function getLocalApiPreviewUrl(previewUrl: string) {
  try {
    const url = new URL(previewUrl, window.location.origin)
    const isApiPath =
      url.pathname === '/api' || url.pathname.startsWith('/api/')

    if (isApiPath) {
      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return previewUrl
  }

  return previewUrl
}

export function IframeContainerPage() {
  const { t } = useTranslation()
  const { styles } = useStyles()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const menuStatus = useMenuStore((state) => state.status)
  const appMenuNodes = useMenuStore((state) => state.appMenuNodes)
  const retryMenu = useMenuStore((state) => state.retryMenu)
  const getAppByTaskId = useMenuStore((state) => state.getAppByTaskId)

  const app = taskId ? getAppByTaskId(taskId) : undefined
  const previewUrl = app?.preview_url
    ? getLocalApiPreviewUrl(app.preview_url)
    : ''

  if (!taskId) {
    return (
      <Result
        status="warning"
        title={t('pages.iframe.missingAppId')}
        extra={
          <Button type="primary" onClick={() => void navigate('/chat')}>
            {t('pages.iframe.backToWorkspace')}
          </Button>
        }
      />
    )
  }

  if (menuStatus === 'error' && !appMenuNodes.length) {
    return (
      <Result
        status="error"
        title={t('pages.iframe.menuLoadFailed')}
        extra={
          <Button
            icon={<ReloadOutlined />}
            type="primary"
            onClick={() => void retryMenu()}
          >
            {t('common.actions.retry')}
          </Button>
        }
      />
    )
  }

  if (menuStatus === 'idle' || menuStatus === 'loading') {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Spin description={t('pages.iframe.loading')} />
        </div>
      </div>
    )
  }

  if (!app || !previewUrl) {
    return (
      <Result
        status="404"
        title={t('pages.iframe.notFound')}
        subTitle={t('pages.iframe.notFoundSubtitle')}
        extra={
          <Button type="primary" onClick={() => void navigate('/chat')}>
            {t('pages.iframe.backToWorkspace')}
          </Button>
        }
      />
    )
  }

  return (
    <PageContainer className="h-full w-full overflow-hidden">
      <WujieReact
        key={taskId}
        name={`iframe-container-${taskId}`}
        url={previewUrl}
        degrade
        attrs={wujieIframeAttrs}
      />
    </PageContainer>
  )
}

export default IframeContainerPage
