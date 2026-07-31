import {
  AppstoreOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { Space } from 'antd'
import type { ReactNode } from 'react'

type AdminPageTitleSection = 'serviceCatalog' | 'stageSwitch' | 'governance'

const SECTION_ICONS: Record<AdminPageTitleSection, ReactNode> = {
  serviceCatalog: <AppstoreOutlined />,
  stageSwitch: <SwapOutlined />,
  governance: <SafetyCertificateOutlined />,
}

export function AdminPageTitle({
  children,
  section,
}: {
  children: ReactNode
  section: AdminPageTitleSection
}) {
  return (
    <Space>
      {SECTION_ICONS[section]}
      {children}
    </Space>
  )
}
