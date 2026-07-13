# RBAC 前端接入与管理端页面详细设计

> 生成日期：2026-07-09  
> 范围：`ff-ai-frontend` React / TypeScript / Ant Design 管理端与用户端  
> 对应后端设计：`ff-ai-platform/docs/rbac-backend-design.md`

## 1. 现状核验结论

当前前端尚未实现完整 RBAC。现状主要是：

- `AuthUser` 类型包含 `is_superuser`，但前端基本没有读取使用。
- 管理端和用户端均使用静态路由表。
- 菜单由 route meta 中的 `hideInMenu` 等字段生成。
- 路由守卫只校验是否登录，不校验权限。
- 无角色/权限/组织/部门配置页面。
- 无集中式按钮权限、菜单权限、接口权限体验层封装。
- 前端项目缺少权限相关自动化测试。

关键现状文件：

- 认证类型：`packages/api/src/auth.ts`
- 管理端 auth store：`apps/admin-web/src/store/useAuth.ts`
- 管理端路由：`apps/admin-web/src/router/routes.tsx`
- 管理端路由守卫：`apps/admin-web/src/router/middleware/auth.ts`
- 管理端菜单构建：`apps/admin-web/src/layouts/components/Sidebar/layoutNav.tsx`
- 用户端路由：`apps/user-web/src/router/routes.tsx`
- 用户端菜单构建：`apps/user-web/src/layouts/components/Sidebar/layoutNav.tsx`

## 2. 前端设计目标

1. 登录后加载当前用户 RBAC Profile。
2. 管理端和用户端菜单按权限过滤。
3. 路由支持权限 meta，URL 直达无权限页面显示 403。
4. 页面按钮/操作支持权限判断。
5. 管理端新增角色权限配置页面。
6. 与后端权限模型对齐：角色、权限点、用户-角色、菜单权限、组织/部门。
7. 保持后端为最终权限裁决，前端只做体验层过滤。

## 3. API 类型设计

### 3.1 扩展 `AuthUser`

位置：

```text
packages/api/src/auth.ts
```

建议扩展：

```ts
export interface AuthUser {
  email: string
  is_active: boolean
  is_superuser: boolean
  full_name: string | null
  id: string
  created_at: string
  role_codes?: string[]
  permission_codes?: string[]
  menu_codes?: string[]
  organization_ids?: string[]
  primary_organization_id?: string | null
}
```

更推荐将权限画像拆成独立类型，避免 `AuthUser` 过重。

### 3.2 新增 RBAC 基础类型

建议新增文件：

```text
packages/api/src/rbac.ts
packages/api/src/admin/rbac.ts
```

类型建议：

```ts
export interface CurrentOrganization {
  id: string
  name: string
  type: 'tenant' | 'department' | 'team'
  is_primary: boolean
}

export interface CurrentRbacProfile {
  user_id: string
  is_superuser: boolean
  role_codes: string[]
  permission_codes: string[]
  menu_codes: string[]
  organizations: CurrentOrganization[]
}

export interface Permission {
  id: string
  code: string
  name: string
  description?: string | null
  group: string
  resource: string
  action: string
  is_menu: boolean
  is_api: boolean
  is_active: boolean
}

export interface Role {
  id: string
  code: string
  name: string
  description?: string | null
  scope_type: 'system' | 'organization'
  organization_id?: string | null
  is_system: boolean
  is_active: boolean
  permission_count?: number
  user_count?: number
}

export interface RoleDetail extends Role {
  permission_ids: string[]
  permission_codes: string[]
}

export interface OrganizationNode {
  id: string
  name: string
  code: string
  type: 'tenant' | 'department' | 'team'
  parent_id?: string | null
  status: 'active' | 'disabled'
  sort_order: number
  children?: OrganizationNode[]
}

export interface MenuNode {
  id: string
  code: string
  title: string
  app: 'admin' | 'user'
  path?: string | null
  parent_id?: string | null
  permission_code?: string | null
  icon?: string | null
  sort_order: number
  is_visible: boolean
  children?: MenuNode[]
}

export interface UserRoleAssignment {
  role_id: string
  organization_id?: string | null
  expires_at?: string | null
}
```

### 3.3 API Request 定义

建议新增 request factories：

```ts
export const getCurrentRbacProfileRequest = () =>
  createRequest<CurrentRbacProfile>('GET', '/api/v1/rbac/me')

export const listAdminRolesRequest = (params: RoleListQuery) =>
  createRequest<ListResult<Role>>('GET', '/api/v1/admin/roles', { params })

export const createAdminRoleRequest = (data: RoleCreate) =>
  createRequest<Role>('POST', '/api/v1/admin/roles', { data })

export const updateAdminRoleRequest = (roleId: string, data: RoleUpdate) =>
  createRequest<Role>('PATCH', path`/api/v1/admin/roles/${roleId}`, { data })

export const deleteAdminRoleRequest = (roleId: string) =>
  createRequest<void>('DELETE', path`/api/v1/admin/roles/${roleId}`)

export const getAdminRoleRequest = (roleId: string) =>
  createRequest<RoleDetail>('GET', path`/api/v1/admin/roles/${roleId}`)

export const updateRolePermissionsRequest = (
  roleId: string,
  permissionIds: string[],
) =>
  createRequest<void>('PUT', path`/api/v1/admin/roles/${roleId}/permissions`, {
    data: { permission_ids: permissionIds },
  })

export const listAdminPermissionsRequest = (params: PermissionListQuery) =>
  createRequest<ListResult<Permission>>('GET', '/api/v1/admin/permissions', {
    params,
  })

export const listOrganizationTreeRequest = () =>
  createRequest<OrganizationNode[]>('GET', '/api/v1/admin/organizations/tree')

export const getUserRolesRequest = (userId: string) =>
  createRequest<UserRoleAssignment[]>(
    'GET',
    path`/api/v1/admin/users/${userId}/roles`,
  )

export const updateUserRolesRequest = (
  userId: string,
  assignments: UserRoleAssignment[],
) =>
  createRequest<void>('PUT', path`/api/v1/admin/users/${userId}/roles`, {
    data: { assignments },
  })
```

并从 `packages/api/src/index.ts` 统一导出。

## 4. App API Wrapper 设计

管理端新增：

```text
apps/admin-web/src/api/rbac.ts
```

包装共享 request：

```ts
import {
  getCurrentRbacProfileRequest,
  listAdminRolesRequest,
  createAdminRoleRequest,
  updateAdminRoleRequest,
  deleteAdminRoleRequest,
  getAdminRoleRequest,
  updateRolePermissionsRequest,
  listAdminPermissionsRequest,
  listOrganizationTreeRequest,
  getUserRolesRequest,
  updateUserRolesRequest,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export const getCurrentRbacProfile = request(getCurrentRbacProfileRequest)
export const listAdminRoles = request(listAdminRolesRequest)
export const createAdminRole = request(createAdminRoleRequest)
export const updateAdminRole = request(updateAdminRoleRequest)
export const deleteAdminRole = request(deleteAdminRoleRequest)
export const getAdminRole = request(getAdminRoleRequest)
export const updateRolePermissions = request(updateRolePermissionsRequest)
export const listAdminPermissions = request(listAdminPermissionsRequest)
export const listOrganizationTree = request(listOrganizationTreeRequest)
export const getUserRoles = request(getUserRolesRequest)
export const updateUserRoles = request(updateUserRolesRequest)
```

建议同时定义 query keys：

```ts
export const rbacKeys = {
  profile: ['rbac', 'profile'] as const,
  roles: (params: RoleListQuery) => ['rbac', 'roles', params] as const,
  role: (roleId: string) => ['rbac', 'role', roleId] as const,
  permissions: (params: PermissionListQuery) =>
    ['rbac', 'permissions', params] as const,
  organizations: ['rbac', 'organizations'] as const,
  userRoles: (userId: string) => ['rbac', 'userRoles', userId] as const,
}
```

用户端可新增：

```text
apps/user-web/src/api/rbac.ts
```

至少提供 `getCurrentRbacProfile`。

## 5. Auth Store 设计

当前 store 只保存 token 和 user。建议管理端、用户端都扩展。

位置：

```text
apps/admin-web/src/store/useAuth.ts
apps/user-web/src/store/useAuth.ts
```

接口设计：

```ts
interface AuthState {
  accessToken: string
  user: AuthUser | null

  roleCodes: string[]
  permissionCodes: string[]
  menuCodes: string[]
  organizationIds: string[]

  setToken: (accessToken: string) => void
  setUserInfo: (user: AuthUser | null) => void
  setRbacProfile: (profile: CurrentRbacProfile) => void

  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  hasMenu: (code: string) => boolean

  clearAuth: () => void
}
```

实现规则：

```ts
hasPermission: (code) => {
  const { user, permissionCodes } = get()
  if (user?.is_superuser) return true
  return permissionCodes.includes(code)
}

hasMenu: (code) => {
  const { user, menuCodes } = get()
  if (user?.is_superuser) return true
  return menuCodes.includes(code)
}
```

`clearAuth` 应同步清空：

- token
- user
- roleCodes
- permissionCodes
- menuCodes
- organizationIds

## 6. 路由 Meta 设计

当前 `RouteMeta` 没有权限字段。建议管理端和用户端都新增：

```ts
export interface RouteMeta {
  title?: string
  titleKey?: string
  subtitleKey?: string
  icon?: ReactNode
  layout?: boolean
  standalone?: boolean
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  menuType?: 'catalog' | 'menu'
  menuMode?: 'group' | 'submenu'
  navKey?: string
  navOrder?: number

  permission?: string
  permissions?: string[]
  permissionMode?: 'all' | 'any'
  menuCode?: string
}
```

### 6.1 管理端路由权限示例

```tsx
{
  path: '/tickets',
  element: lazyLoad(() => import('@/pages/ticket-kanban/TicketKanban')),
  handle: {
    title: 'Global Tickets',
    titleKey: 'routes.tickets.title',
    icon: <FileTextOutlined />,
    navKey: 'tickets',
    navOrder: 2,
    hideInBreadcrumb: true,
    permission: 'admin.tickets.read',
    menuCode: 'menu.admin.tickets',
  },
}
```

```tsx
{
  path: '/rbac/roles',
  element: lazyLoad(() => import('@/pages/rbac/RoleList')),
  handle: {
    title: 'Role & Permissions',
    titleKey: 'routes.rbac.roles.title',
    navKey: 'rbac-roles',
    navOrder: 7,
    permission: 'admin.roles.read',
    menuCode: 'menu.admin.rbac',
  },
}
```

### 6.2 用户端路由权限示例

```tsx
{
  path: '/chat',
  element: lazyLoad(() => import('@/pages/chat/Chat')),
  handle: {
    title: 'Dashboard',
    titleKey: 'routes.chat.title',
    icon: <DesktopOutlined />,
    menuType: 'menu',
    navKey: 'chat',
    navOrder: 1,
    permission: 'user.chat.use',
    menuCode: 'menu.user.chat',
  },
}
```

## 7. 路由守卫设计

当前守卫只做 token 校验。建议改造管理端：

```text
apps/admin-web/src/router/middleware/auth.ts
```

流程：

1. 无 accessToken：redirect `/login`
2. 无 user：调用 `testAccessToken(accessToken)`
3. 无 RBAC profile：调用 `getCurrentRbacProfile()`
4. 写入 auth store
5. 获取当前 matched route meta
6. 判断 route permission / permissions
7. 无权限：redirect `/403`
8. 有权限：`next()`

新增 403 页面：

```text
apps/admin-web/src/pages/exception/ForbiddenPage.tsx
apps/user-web/src/pages/exception/ForbiddenPage.tsx
```

403 路由：

```tsx
{
  path: '/403',
  element: <ForbiddenPage />,
  handle: {
    title: '403',
    titleKey: 'routes.forbidden.title',
    layout: false,
    hideInMenu: true,
  },
}
```

## 8. 菜单过滤设计

当前管理端菜单构建只看 `hideInMenu`。建议 `buildNavItems` 支持访问判断：

```ts
export interface BuildNavOptions {
  canAccess?: (meta: RouteMeta) => boolean
}

export function buildNavItems(
  routes: AppRouteObject[],
  t: TFunction,
  options?: BuildNavOptions,
): NavTreeItem[] {
  return collectNavItems(routes, t, '', options).map(stripOrder)
}
```

判断逻辑：

```ts
function canAccessRoute(meta?: RouteMeta) {
  if (!meta) return true

  if (meta.menuCode && !auth.hasMenu(meta.menuCode)) {
    return false
  }

  if (meta.permission && !auth.hasPermission(meta.permission)) {
    return false
  }

  if (meta.permissions?.length) {
    return meta.permissionMode === 'any'
      ? auth.hasAnyPermission(meta.permissions)
      : auth.hasAllPermissions(meta.permissions)
  }

  return true
}
```

目录节点规则：

- 如果目录自身没有权限要求，但有可见子节点，则显示。
- 如果目录自身无权限且子节点全不可见，则隐藏。
- 如果目录自身有 `menuCode`，必须通过 `hasMenu(menuCode)`。

用户端菜单也按同样逻辑处理。动态应用菜单 `/api/tenant/apps` 应由后端按权限过滤，前端只做二次防御。

## 9. 按钮/操作权限设计

新增 hook：

```text
apps/admin-web/src/hooks/usePermission.ts
apps/user-web/src/hooks/usePermission.ts
```

接口：

```ts
export function usePermission() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions)

  return { hasPermission, hasAnyPermission, hasAllPermissions }
}
```

使用示例：

```tsx
const { hasPermission } = usePermission()

{hasPermission('admin.roles.create') && (
  <Button type="primary" onClick={openCreateDrawer}>
    新建角色
  </Button>
)}
```

注意：按钮隐藏只是体验优化，后端仍必须拒绝无权限调用。

## 10. 管理端 RBAC 页面设计

新增目录：

```text
apps/admin-web/src/pages/rbac/
```

建议结构：

```text
pages/rbac/
  RoleList.tsx
  RolePermissionDrawer.tsx
  RoleFormDrawer.tsx
  UserRoleDrawer.tsx
  OrganizationTreePanel.tsx
  components/
    PermissionTree.tsx
    RoleStatusTag.tsx
  types.ts
  utils.ts
```

### 10.1 `RoleList.tsx`

功能：

- 搜索角色。
- 按 scope 过滤：系统角色 / 组织角色。
- 按组织过滤。
- 表格展示角色。

表格列：

| 列 | 说明 |
|---|---|
| 角色名 | `name` |
| 角色编码 | `code` |
| 范围 | `scope_type` |
| 组织 | `organization_id` 映射组织名 |
| 权限数量 | `permission_count` |
| 用户数量 | `user_count` |
| 状态 | `is_active` |
| 系统角色 | `is_system` |
| 操作 | 编辑、配置权限、删除 |

按钮权限：

| 操作 | 权限 |
|---|---|
| 查看 | `admin.roles.read` |
| 新建 | `admin.roles.create` |
| 编辑 | `admin.roles.update` |
| 删除 | `admin.roles.delete` |
| 配置权限 | `admin.roles.update` |

布局建议遵循管理端高信息密度规则：紧凑筛选区、紧凑表格、主操作固定可达。

### 10.2 `RoleFormDrawer.tsx`

字段：

- 角色名称
- 角色编码
- 角色描述
- 范围：system / organization
- 组织选择
- 状态

校验：

- code 必填，仅允许小写字母、数字、下划线、点、横线。
- system 角色不需要 organization。
- organization 角色必须选择 organization。
- `is_system` 角色不允许编辑 code / scope。

### 10.3 `RolePermissionDrawer.tsx`

功能：

- 展示角色基本信息。
- 加载全部权限点。
- 加载角色已有权限。
- 使用 `PermissionTree` 勾选权限。
- 保存时调用 `PUT /api/v1/admin/roles/{role_id}/permissions`。

建议分 Tab：

1. 菜单权限
2. 接口权限
3. 组织/数据范围（第二阶段）

### 10.4 `PermissionTree.tsx`

使用 AntD `Tree`。

分组：

```text
系统管理
  用户管理
  角色权限
业务管理
  工单
  技能
  指标
考试管理
用户端
菜单权限
  管理端菜单
  用户端菜单
```

能力：

- 搜索权限。
- 按组全选。
- 展示 code、name、description。
- 区分 `is_menu` 和 `is_api`。
- 输出 checked permission ids。

### 10.5 `UserRoleDrawer.tsx`

用于给用户分配角色。

字段：

- 用户
- 组织/部门
- 角色
- 过期时间

接口：

```http
GET /api/v1/admin/users/{user_id}/roles
PUT /api/v1/admin/users/{user_id}/roles
```

### 10.6 `OrganizationTreePanel.tsx`

功能：

- 展示组织/部门树。
- 新增同级/子级。
- 编辑。
- 禁用。
- 删除。
- 调整排序。

权限：

- `admin.orgs.read`
- `admin.orgs.manage`

## 11. i18n 与路由标题

新增可见页面时需要同步：

- 路由 `titleKey`
- 菜单排序 `navOrder`
- `navKey`
- 面包屑
- 中英文 i18n 文案

建议新增 key：

```text
routes.rbac.title
routes.rbac.roles.title
routes.rbac.organizations.title
routes.forbidden.title
pages.rbac.roleList.title
pages.rbac.actions.createRole
pages.rbac.actions.configurePermissions
```

## 12. 403 与请求错误处理

当前请求层对 403 只 toast “无权限”。建议保留请求层 toast，同时路由级无权限进入 403 页面。

场景区分：

- 路由无权限：显示 403 页面。
- 按钮误触或直接调用接口无权限：toast。
- 权限失效：提示后重新拉 `/api/v1/rbac/me`。

## 13. 前端实施阶段

### 阶段 1：类型与权限状态

1. 新增 RBAC API 类型。
2. 新增 `getCurrentRbacProfileRequest`。
3. 扩展 admin/user auth store。
4. 登录/刷新时拉取 RBAC profile。

验收：

- superuser `hasPermission(...)` 恒为 true。
- 普通用户按 profile 判断权限。

### 阶段 2：路由与菜单过滤

1. 扩展 RouteMeta。
2. 为现有 admin/user 路由补 `permission`、`menuCode`。
3. 改造 `buildNavItems` 支持权限过滤。
4. 新增 403 页面。
5. auth middleware 增加路由权限判断。

验收：

- 不同权限用户看到不同菜单。
- URL 直达无权限页面跳 403。

### 阶段 3：RBAC 管理页面

1. 新增 `/rbac/roles` 路由。
2. 实现 RoleList。
3. 实现 RoleFormDrawer。
4. 实现 PermissionTree。
5. 实现 RolePermissionDrawer。
6. 实现 UserRoleDrawer。
7. 实现 OrganizationTreePanel。

验收：

- 管理员可以创建角色。
- 可以配置角色权限。
- 可以分配用户角色。
- 权限刷新后菜单与路由生效。

### 阶段 4：按钮级权限

1. 新增 `usePermission` hook。
2. 管理端核心页面按钮按权限隐藏。
3. 对危险操作增加 403 fallback。

重点页面：

- SkillHub
- TicketKanban / InterventionWorkbench
- OpsMetrics
- LifecycleOps
- Exam Management
- 新 RBAC 页面

### 阶段 5：测试与回归

1. 补 typecheck/build。
2. 如引入测试框架，使用 Vitest + Testing Library。
3. 覆盖权限 store、菜单过滤、路由判断、PermissionTree。

## 14. 前端测试建议

### 14.1 基础验证命令

```bash
pnpm run lint
pnpm run typecheck
pnpm --filter admin-web build
pnpm --filter user-web build
```

### 14.2 单元测试建议

如果补 Vitest，建议测试：

- `hasPermission`：superuser、普通有权限、普通无权限。
- `hasAnyPermission` / `hasAllPermissions`。
- `hasMenu`。
- `buildNavItems` 权限过滤。
- route meta 权限判断。
- PermissionTree 勾选和输出 permission ids。

### 14.3 手工验收

1. superuser 登录：看到全部菜单，能进入 RBAC 页面。
2. 只读管理员：只能看到被授权菜单，写按钮隐藏，直接调用写接口 403。
3. 考试管理员：只看到考试相关菜单。
4. 普通用户：看不到管理端菜单，用户端仅显示授权菜单。
5. 移除用户权限后：刷新页面，菜单消失，URL 直达显示 403。

## 15. 风险与注意事项

### 15.1 前端隐藏不等于安全

后端必须使用 `require_permissions(...)` 强制鉴权。前端只负责减少误操作。

### 15.2 权限变更刷新时机

第一阶段可以刷新页面生效。后续可增加权限版本：

- `rbac_policy_version`
- `user.permission_version`

权限变更后触发重新拉取 profile。

### 15.3 静态路由与后端菜单保持一致

前端 `menuCode` 必须和后端 seed 的 `menus.code` / `permissions.code` 对齐。建议将权限码维护为常量，避免字符串散落。

### 15.4 管理端信息密度

RBAC 页面属于高频配置页面，应优先信息密度：紧凑筛选区、紧凑表格、清晰状态色、主操作可达。

## 16. 推荐文件清单

预计新增/修改：

```text
packages/api/src/rbac.ts
packages/api/src/admin/rbac.ts
packages/api/src/index.ts
apps/admin-web/src/api/rbac.ts
apps/admin-web/src/store/useAuth.ts
apps/admin-web/src/router/routes.tsx
apps/admin-web/src/router/middleware/auth.ts
apps/admin-web/src/layouts/components/Sidebar/layoutNav.tsx
apps/admin-web/src/hooks/usePermission.ts
apps/admin-web/src/pages/exception/ForbiddenPage.tsx
apps/admin-web/src/pages/rbac/RoleList.tsx
apps/admin-web/src/pages/rbac/RoleFormDrawer.tsx
apps/admin-web/src/pages/rbac/RolePermissionDrawer.tsx
apps/admin-web/src/pages/rbac/UserRoleDrawer.tsx
apps/admin-web/src/pages/rbac/OrganizationTreePanel.tsx
apps/admin-web/src/pages/rbac/components/PermissionTree.tsx
apps/user-web/src/api/rbac.ts
apps/user-web/src/store/useAuth.ts
apps/user-web/src/router/routes.tsx
apps/user-web/src/router/middleware/auth.ts
apps/user-web/src/layouts/components/Sidebar/layoutNav.tsx
apps/user-web/src/hooks/usePermission.ts
apps/user-web/src/pages/exception/ForbiddenPage.tsx
```

## 17. 与后端联调顺序

1. 后端先提供 `/api/v1/rbac/me`。
2. 前端接入 store 和 `hasPermission`。
3. 后端提供 roles / permissions / organizations API。
4. 前端实现 RBAC 页面。
5. 后端逐步启用接口权限。
6. 前端同步隐藏按钮并完善 403 体验。
