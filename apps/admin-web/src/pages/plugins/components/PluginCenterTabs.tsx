import { Tabs } from 'antd'
import { useLocation, useNavigate } from 'react-router'

const tabItems = [
  { key: '/plugins', label: '插件目录' },
  { key: '/plugins/operations', label: '作业中心' },
  { key: '/plugins/workflow-publications', label: 'Workflow 发布' },
]

export function PluginCenterTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey =
    tabItems.find((item) => item.key === location.pathname)?.key ?? '/plugins'

  return (
    <Tabs
      activeKey={activeKey}
      className="mb-4"
      items={tabItems}
      onChange={(key) => void navigate(key)}
    />
  )
}
