import { ReloadOutlined } from '@ant-design/icons'
import { Button, Result, Spin } from 'antd'
import { createStyles } from 'antd-style'
import { PageContainer } from '@/components/Container'
import WujieReact from '@/components/WujieReact'
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
    const isApiPath = url.pathname === '/api' || url.pathname.startsWith('/api/')

    if (isApiPath) {
      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return previewUrl
  }

  return previewUrl
}

export function IframeContainerPage() {
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
        title="缺少应用 ID"
        extra={
          <Button type="primary" onClick={() => void navigate('/chat')}>
            返回工作台
          </Button>
        }
      />
    )
  }

  if (menuStatus === 'error' && !appMenuNodes.length) {
    return (
      <Result
        status="error"
        title="应用菜单加载失败"
        extra={
          <Button
            icon={<ReloadOutlined />}
            type="primary"
            onClick={() => void retryMenu()}
          >
            重试
          </Button>
        }
      />
    )
  }

  if (menuStatus === 'idle' || menuStatus === 'loading') {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Spin description="应用加载中" />
        </div>
      </div>
    )
  }

  if (!app || !previewUrl) {
    return (
      <Result
        status="404"
        title="应用不存在"
        subTitle="当前应用未出现在应用菜单中。"
        extra={
          <Button type="primary" onClick={() => void navigate('/chat')}>
            返回工作台
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
