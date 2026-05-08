import { GlobalOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Tooltip, type MenuProps } from 'antd'
import { useTranslation } from 'react-i18next'

import { useLocale } from '@/i18n/useLocale'
import { useAppStore } from '@/store/useApp'

import { Logo } from './Logo'

interface HeaderProps {
  onOpenMenu: () => void
}

export function Header({ onOpenMenu: _onOpenMenu }: HeaderProps) {
  const { t } = useTranslation()
  const { locale, localeOptions, setLocale } = useLocale()
  const themeMode = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)

  const isDarkMode = themeMode === 'dark'
  const themeToggleLabel = isDarkMode
    ? t('layout.header.themeLight')
    : t('layout.header.themeDark')
  const localeItems: MenuProps['items'] = localeOptions.map((option) => ({
    key: option.code,
    label: option.label,
  }))

  return (
    <header className="flex h-full w-full items-center justify-between gap-5 px-5 backdrop-blur-sm">
      <div className="flex h-full min-w-0 items-center gap-3">
        <Logo></Logo>
        {/* <Button
          className="hidden max-[860px]:inline-flex"
          shape="circle"
          icon={<MenuOutlined />}
          onClick={onOpenMenu}
        /> */}
      </div>
      <div className="flex min-w-0 flex-none items-center gap-3">
        {/* <Input
          className="w-[min(28vw,360px)] max-[860px]:hidden"
          prefix={<SearchOutlined />}
          placeholder="搜索应用、账单、工单"
        /> */}
        <Tooltip title={themeToggleLabel}>
          <Button
            aria-label={themeToggleLabel}
            shape="circle"
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>

        <Dropdown
          menu={{
            items: localeItems,
            selectedKeys: [locale],
            onClick: ({ key }) => {
              void setLocale(key as typeof locale)
            },
          }}
        >
          <Button
            aria-label={t('layout.header.language')}
            shape="circle"
            icon={<GlobalOutlined />}
          />
        </Dropdown>

        <Avatar>{t('common.user.avatar')}</Avatar>
        <div className="leading-[1.2]">
          <div className="text-[13px] font-semibold text-(--text-strong)">
            {t('common.user.name')}
          </div>
          <span className="mt-1 block text-xs text-(--dark-text)">
            {t('common.user.role')}
          </span>
        </div>
      </div>
    </header>
  )
}
