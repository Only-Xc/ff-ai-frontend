import { configureExamCenterPlugin } from '@ff-ai-frontend/exam-center-plugin'
import {
  AdminAttemptOverviewPage,
  AdminExamDetailPage,
  AdminExamListPage,
} from '@ff-ai-frontend/exam-center-plugin/admin'
import {
  TenantAttemptStatePage,
  TenantExamListPage,
  TenantExamResultPage,
  TenantExamRoomPage,
} from '@ff-ai-frontend/exam-center-plugin/tenant'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider, theme } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, BrowserRouter, Routes } from 'react-router'

import { GlobalMessageRegister, globalMessage } from './message'
import { requestClient } from './request'

configureExamCenterPlugin({
  requestClient,
  message: globalMessage,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function detectBasename() {
  const marker = '/api/v1/plugins/exam/ui'
  const index = window.location.pathname.indexOf(marker)

  return index >= 0
    ? window.location.pathname.slice(0, index + marker.length)
    : '/'
}

type ThemeMode = 'light' | 'dark'

function getInitialTheme(): ThemeMode {
  if (document.documentElement.dataset.theme === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return
      if (event.data?.type !== 'ff-ai:theme') return
      if (event.data.theme !== 'light' && event.data.theme !== 'dark') return
      setThemeMode(event.data.theme)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const antdTheme = useMemo(
    () => ({
      algorithm:
        themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#6b43f7',
        colorLink: '#6b43f7',
        ...(themeMode === 'dark'
          ? {
              colorBgLayout: '#0a0c10',
              colorBgContainer: '#12141d',
              colorBgElevated: '#161823',
              colorBorderSecondary: '#262936',
            }
          : {
              colorBgLayout: '#f5f7fb',
              colorBgContainer: '#ffffff',
              colorBgElevated: '#ffffff',
              colorBorderSecondary: '#e5e7ef',
            }),
      },
      components: {
        Table: {
          headerBorderRadius: 0,
        },
      },
    }),
    [themeMode],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <AntdApp className="h-full">
          <GlobalMessageRegister />
          <BrowserRouter basename={detectBasename()}>
            <Routes>
              <Route path="/" element={<Navigate replace to="/exams" />} />
              <Route path="/exams" element={<TenantExamListPage />} />
              <Route
                path="/exams/:paperId/attempt"
                element={<TenantAttemptStatePage />}
              />
              <Route
                path="/attempts"
                element={<Navigate replace to="/exams?tab=attempts" />}
              />
              <Route
                path="/attempts/:attemptId"
                element={<TenantExamRoomPage />}
              />
              <Route
                path="/attempts/:attemptId/result"
                element={<TenantExamResultPage />}
              />
              <Route
                path="/admin"
                element={<Navigate replace to="/admin/exams" />}
              />
              <Route path="/admin/exams" element={<AdminExamListPage />} />
              <Route
                path="/admin/exams/:paperId"
                element={<AdminExamDetailPage />}
              />
              <Route
                path="/admin/exam-attempts"
                element={<AdminAttemptOverviewPage />}
              />
              <Route path="*" element={<Navigate replace to="/exams" />} />
            </Routes>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default App
