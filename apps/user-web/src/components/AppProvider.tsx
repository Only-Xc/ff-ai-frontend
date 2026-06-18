import { App as AntdApp, ConfigProvider, theme } from 'antd'
import { setComponentsLocale } from '@ff-ai-frontend/components'
import { setDictLocale } from '@ff-ai-frontend/dictionaries'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { defaultSettings } from '@/config/defaultSettings'
import { syncDayjsLocale } from '@/i18n/dayjs'
import { useLocale } from '@/i18n/useLocale'
import { useAppStore } from '@/store/useApp'
import { GlobalMessageRegister } from '@/utils/message'

interface Props {
  children: ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const themeBackgroundTokens = {
  dark: {
    colorBgLayout: '#0a0c10',
    colorBgContainer: '#12141d',
    colorBgElevated: '#161823',
    colorBorderSecondary: '#262936',
  },
  light: {
    colorBgLayout: '#f5f7fb',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorderSecondary: '#e5e7ef',
  },
}

export function AppProvider({ children }: Props) {
  const colorPrimary = defaultSettings.colorPrimary

  // 深色模式
  const themeMode = useAppStore((state) => state.theme)
  useIsomorphicLayoutEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  // 多语言
  const { antdLocale, direction, locale } = useLocale()

  useIsomorphicLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = direction
    syncDayjsLocale(locale)
    setDictLocale(locale)
    setComponentsLocale(locale)
  }, [direction, locale])

  // antd 主题配置
  const antdTheme = useMemo(
    () => ({
      algorithm:
        themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary,
        colorLink: colorPrimary,
        ...themeBackgroundTokens[themeMode],
      },
      components: {
        Layout: {
          headerHeight: 52,
        },
        Table: {
          headerBorderRadius: 0,
        },
      },
    }),
    [colorPrimary, themeMode],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        direction={direction}
        locale={antdLocale}
        theme={antdTheme}
      >
        <AntdApp className="h-full">
          <GlobalMessageRegister />
          {children}
        </AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
