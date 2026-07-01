import { ReloadOutlined } from '@ant-design/icons'
import { Button, Result, Spin } from 'antd'
import { createStyles } from 'antd-style'
import { PageContainer } from '@ff-ai-frontend/components'
import WujieReact from '@/components/WujieReact'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { useAuthStore } from '@/store/useAuth'
import { useMenuStore } from '@/store/useMenu'
import { buildAuthenticatedPreviewUrl } from '@/utils/previewUrl'

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

export function IframeContainerPage() {
  const { t } = useTranslation()
  const { styles } = useStyles()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const menuStatus = useMenuStore((state) => state.status)
  const appMenuNodes = useMenuStore((state) => state.appMenuNodes)
  const retryMenu = useMenuStore((state) => state.retryMenu)
  const getAppByTaskId = useMenuStore((state) => state.getAppByTaskId)
  const accessToken = useAuthStore((state) => state.accessToken)

  const app = taskId ? getAppByTaskId(taskId) : undefined
  const previewUrl = buildAuthenticatedPreviewUrl(
    app?.preview_url,
    accessToken,
    taskId,
  )
  const useNativeIframe = previewUrl.includes('/api/tasks/')

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
      {useNativeIframe ? (
        <iframe
          key={taskId}
          src={previewUrl}
          title={app.title}
          className="block h-full w-full border-0"
          sandbox={wujieIframeAttrs.sandbox}
        />
      ) : (
        <WujieReact
          key={taskId}
          name={`iframe-container-${taskId}`}
          url={previewUrl}
          degrade
          attrs={wujieIframeAttrs}
        />
      )}
    </PageContainer>
  )
}

export default IframeContainerPage
