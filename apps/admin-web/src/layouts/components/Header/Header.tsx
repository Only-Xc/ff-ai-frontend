import {
  GlobalOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Tooltip, type MenuProps } from 'antd'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { useLocale } from '@/i18n/useLocale'
import { useAppStore } from '@/store/useApp'
import { useAuthStore } from '@/store/useAuth'

import { Logo } from './Logo'

interface HeaderProps {
  onOpenMenu: () => void
}

const compactIconButtonStyle: CSSProperties = {
  width: 28,
  minWidth: 28,
  height: 28,
  padding: 0,
  fontSize: 12,
}

export function Header({ onOpenMenu: _onOpenMenu }: HeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { locale, localeOptions, setLocale } = useLocale()
  const themeMode = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const displayName = user?.full_name ?? user?.email ?? ''

  const isDarkMode = themeMode === 'dark'
  const themeToggleLabel = isDarkMode
    ? t('layout.header.themeLight')
    : t('layout.header.themeDark')
  const localeItems: MenuProps['items'] = localeOptions.map((option) => ({
    key: option.code,
    label: option.label,
  }))
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.user.logout'),
    },
  ]
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key !== 'logout') {
      return
    }

    clearAuth()
    void navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-full w-full items-center justify-between gap-3 bg-(--header-bg) px-4">
      <div className="flex h-full min-w-0 items-center gap-2">
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
            style={compactIconButtonStyle}
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
            style={compactIconButtonStyle}
          />
        </Dropdown>

        <Dropdown
          trigger={['hover']}
          placement="bottomRight"
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
        >
          <div className="flex cursor-pointer flex-row items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-(--sidebar-hover)">
            <Avatar size={28}>{displayName.slice(0, 1).toUpperCase()}</Avatar>
            <div className="leading-[1.15]">
              <div className="max-w-28 truncate text-xs font-semibold text-(--text-strong)">
                {displayName}
              </div>
              <span className="mt-0.5 block max-w-28 truncate text-[11px] text-(--dark-text)">
                {user?.email}
              </span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
