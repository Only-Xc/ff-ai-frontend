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

  return index >= 0 ? window.location.pathname.slice(0, index + marker.length) : '/'
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#6b43f7',
            colorLink: '#6b43f7',
            colorBgLayout: '#f5f7fb',
            colorBgContainer: '#ffffff',
            colorBgElevated: '#ffffff',
            colorBorderSecondary: '#e5e7ef',
          },
          components: {
            Table: {
              headerBorderRadius: 0,
            },
          },
        }}
      >
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
              <Route path="/attempts" element={<Navigate replace to="/exams?tab=attempts" />} />
              <Route path="/attempts/:attemptId" element={<TenantExamRoomPage />} />
              <Route
                path="/attempts/:attemptId/result"
                element={<TenantExamResultPage />}
              />
              <Route path="/admin" element={<Navigate replace to="/admin/exams" />} />
              <Route path="/admin/exams" element={<AdminExamListPage />} />
              <Route path="/admin/exams/:paperId" element={<AdminExamDetailPage />} />
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
