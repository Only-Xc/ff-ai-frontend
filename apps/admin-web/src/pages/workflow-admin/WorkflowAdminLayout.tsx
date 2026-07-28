import { Outlet } from 'react-router'

/**
 * Workflow 管理台布局容器（spec: Workflow 平台应用与管理台补丁）
 *
 * 主侧边栏已提供导航，此处仅作为 Outlet 容器。
 */
export function WorkflowAdminLayout() {
  return <Outlet />
}

export default WorkflowAdminLayout
