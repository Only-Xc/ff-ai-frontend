import { App as AntdApp, ConfigProvider, theme } from 'antd'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { defaultSettings } from '@/config/defaultSettings'
import { useLocale } from '@/i18n/useLocale'
import { useAppStore } from '@/store/useApp'

interface Props {
  children: ReactNode
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
  }, [direction, locale])

  // antd 主题配置
  const antdTheme = useMemo(
    () => ({
      algorithm:
        themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary,
      },
      components: {
        Layout: {
          headerHeight: 60,
        },
      },
    }),
    [colorPrimary, themeMode],
  )

  return (
    <ConfigProvider direction={direction} locale={antdLocale} theme={antdTheme}>
      <AntdApp className="h-full">{children}</AntdApp>
    </ConfigProvider>
  )
}
