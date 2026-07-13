# GRC 前端实现文档

> 生成日期：2026-07-11  
> 范围：`ff-ai-frontend`  
> 关联设计：`GRC-design.md`、`GRC-backend-docs.md`

## 1. 目录结构

```
ff-ai-frontend/
├── packages/
│   └── api/
│       └── src/
│           └── admin/
│               ├── grc.ts              # 类型定义 + 请求工厂 (574 行)
│               └── index.ts            # 导出 grc.ts
└── apps/
    └── admin-web/
        ├── src/
        │   ├── api/
        │   │   └── grc.ts              # API 客户端封装 (191 行)
        │   ├── pages/
        │   │   └── grc/
        │   │       ├── GrcDashboard.tsx        # GRC 仪表盘 (216 行)
        │   │       ├── RuleLibrary.tsx         # 合规规则库 (84 行)
        │   │       ├── RuleEditorDrawer.tsx    # 规则编辑抽屉 (124 行)
        │   │       ├── ReviewQueue.tsx         # 审批队列 (167 行)
        │   │       ├── ReviewDetail.tsx        # 审批详情 (295 行)
        │   │       ├── ExceptionManagement.tsx # 例外管理 (214 行)
        │   │       └── GovernanceReports.tsx   # 治理报表 (218 行)
        │   ├── router/
        │   │   └── routes.tsx          # 注册 7 条 GRC 路由
        │   └── i18n/
        │       └── resources/
        │           ├── zh-CN/
        │           │   ├── routes.ts   # +18 GRC 路由 key
        │           │   └── pages.ts    # +80 GRC 页面 key
        │           ├── en-US/
        │           │   ├── routes.ts   # +18 GRC 路由 key
        │           │   └── pages.ts    # +80 GRC 页面 key
        │           └── ar/
        │               ├── routes.ts   # +18 GRC 路由 key
        │               └── pages.ts    # +80 GRC 页面 key
```

## 2. API 层架构

### 2.1 分层设计

```
┌─────────────────────────────────────────────┐
│  pages/grc/*.tsx                            │  ← 页面组件
│  import { grcDashboard_get } from '@/api/grc'│
├─────────────────────────────────────────────┤
│  apps/admin-web/src/api/grc.ts              │  ← API 客户端
│  export const grcDashboard_get = request(...)│
│  export const grcKeys = { ... }             │
├─────────────────────────────────────────────┤
│  packages/api/src/admin/grc.ts              │  ← 类型 + 请求工厂
│  export const getDashboardOverviewRequest   │
│  export type GrcDashboardOverview           │
├─────────────────────────────────────────────┤
│  packages/utils/src/request/               │  ← HTTP 客户端
│  createRequestClient() → request()          │
└─────────────────────────────────────────────┘
```

### 2.2 `packages/api/src/admin/grc.ts` — 类型与请求工厂

**类型定义**（全部导出）：

```typescript
// 枚举
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EvaluationResult = 'PASS' | 'PASS_WITH_NOTICE' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'ERROR'
export type ReviewStatus = 'DRAFT' | 'OPEN' | 'IN_REVIEW' | 'APPROVED' | ...  // 11 个值
export type ExceptionStatus = 'requested' | 'active' | 'rejected' | 'revoked' | 'expired'
export type TreatmentStatus = 'open' | 'in_progress' | 'verified' | 'closed' | 'overdue'
export type TreatmentType = 'mitigate' | 'avoid' | 'transfer' | 'accept'

// 接口（每个表模型对应一个）
export interface GrcRiskProfile { ... }
export interface GrcRule { ... }
export interface GrcRuleVersion { ... }
export interface GrcEvaluation { ... }
export interface GrcEvaluationResult { ... }
export interface GrcReviewCase { ... }
export interface GrcReviewDecision { ... }
export interface GrcException { ... }
export interface GrcRiskTreatment { ... }
export interface GrcAuditEvent { ... }
export interface GrcDashboardOverview { ... }
// ... 以及对应的 Create/Update DTO
```

**请求工厂**（使用 `createRequest` + `path`）：

```typescript
// 示例：规则列表请求
export const listGrcRulesRequest = (params: GrcRuleListQuery) =>
  createRequest<ListResult<GrcRule>>('GET', '/api/admin/grc/rules', { params })

// 示例：带路径参数的请求
export const getReviewCaseRequest = (id: string) =>
  createRequest<GrcReviewCase>('GET', path`/api/admin/grc/reviews/${id}`)
```

### 2.3 `apps/admin-web/src/api/grc.ts` — 客户端封装

使用 `createApiCaller` 模式绑定请求函数：

```typescript
import { request } from './_request'

// Query key 工厂（用于 TanStack Query 缓存管理）
export const grcKeys = {
  all: ['grc'] as const,
  dashboard: () => [...grcKeys.all, 'dashboard'] as const,
  rules: (query) => [...grcKeys.all, 'rules', query] as const,
  reviewCase: (id) => [...grcKeys.all, 'reviewCase', id] as const,
  // ...
}

// 绑定后的可调用函数
export const grcDashboard_get = request(getDashboardOverviewRequest)
export const grcRules_list = request(listGrcRulesRequest)
export const grcReviewCases_list = request(listReviewCasesRequest)
// ...

// 便利包装函数
export const getExceptions = (params) => grcExceptions_list(params).then(r => r.data)
export const approveException = (id) => grcException_approve(id)
export const rejectException = (id, reason) => grcException_reject(id, reason)
```

## 3. 页面详解

### 3.1 GrcDashboard — GRC 仪表盘

**路由**: `/grc/dashboard`  
**权限**: `admin.grc.dashboard.read`

**布局**：
- 顶部：PageHeader（标题 + 刷新按钮）
- 第一行（4 列）：Total Agents | Pass Rate | Block Rate | Overdue Treatments
- 第二行（2 列）：Risk Distribution（彩色 Tag 标签）| Reviews & Exceptions
- 底部：Top Failing Rules 表格

**数据流**：
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['grc', 'dashboard', 'overview'],
  queryFn: () => grcDashboard_get(30, orgId),  // 返回 GrcDashboardOverview
})
```

**关键组件**：`PageContainer`, `PageHeader`, `Card`, `Row/Col`, `Statistic`, `Table`, `Tag`

### 3.2 RuleLibrary — 合规规则库

**路由**: `/grc/rules`  
**权限**: `admin.grc.rules.read`

**布局**：
- 顶部：PageHeader + "Create Rule" 按钮
- 主体：规则列表表格（code, name, category, version, severity, exception_allowed, status, actions）
- 抽屉：RuleEditorDrawer（创建/编辑规则 + 创建新版本）

**数据流**：
```typescript
const { data } = useQuery({
  queryKey: ['grc', 'rules', filters],
  queryFn: () => grcRules_list({ ...filters, skip: 0, limit: 50 }),
})
```

### 3.3 RuleEditorDrawer — 规则编辑抽屉

**触发**：RuleLibrary 页面的 Create/Edit 按钮

**功能**：
- 创建模式：输入 code, name, category, description
- 编辑模式：修改 name, description + 创建新版本
- 版本创建表单：version, severity, risk_score, block_on_fail, exception_allowed, change_note

### 3.4 ReviewQueue — 审批队列

**路由**: `/grc/reviews`  
**权限**: `admin.grc.reviews.read`

**布局**：
- 顶部：PageHeader + Segmented（我的待办 / 全部）+ 刷新按钮
- 主体：审批列表表格

**表格列**：
| 列 | 数据字段 | 宽度 | 特性 |
|----|---------|------|------|
| Case No | case_no | 160px | 链接到 ReviewDetail |
| Title | title | flex | 省略 |
| Risk Level | risk_level | 100px | 彩色 Tag |
| Risk Score | risk_score | 100px | 可排序 |
| Status | status | 150px | 彩色 Tag |
| SLA | due_at | 140px | 相对时间 + 逾期红色 |
| Opened | opened_at | 120px | MM-DD HH:mm |

**跳转**：点击行跳转到 `/grc/reviews/{case_id}`

### 3.5 ReviewDetail — 审批详情

**路由**: `/grc/reviews/:caseId`  
**权限**: `admin.grc.reviews.read`

**布局**：
1. **PageHeader**：Case No + 标题 + "Decide" 按钮（未决定时显示）
2. **风险概览**：Risk Level（Statistic）+ Risk Score（Statistic）+ Status（Tag）
3. **Case Info**：Descriptions 组件（subject, agent, requester, assignee, opened, due）
4. **规则命中表格**：Rule, Result（Tag）, Severity, Message
5. **审计时间线**：Timeline 组件，显示所有历史决策
6. **决策抽屉**：Decision 下拉框 + Rationale 文本框 + 提交按钮

**决策状态流转**：
```typescript
// 已决定的状态不允许再次决策
const isDecided = caseData && !['OPEN', 'IN_REVIEW', 'REMEDIATION_REQUIRED', 'EXCEPTION_REQUESTED'].includes(caseData.status)
```

### 3.6 ExceptionManagement — 例外管理

**路由**: `/grc/exceptions`  
**权限**: `admin.grc.exceptions.read`

**布局**：
- 顶部：PageHeader + 刷新按钮
- 统计行：Total | Active | Requested
- 主体：例外列表表格

**操作按钮**：
| 状态 | 可用操作 |
|------|---------|
| requested | Approve / Reject |
| active | Revoke |

### 3.7 GovernanceReports — 治理报表

**路由**: `/grc/reports`  
**权限**: `admin.grc.reports.read`

**布局**：
- 顶部：PageHeader + 时间范围选择器（7/30/90 天）+ 刷新按钮
- 主体：Tabs 组件，5 个标签页

| Tab | 数据源 | 内容 |
|-----|-------|------|
| Risk Distribution | `grcReports_riskDistribution` | 按日期+风险等级的计数表格 |
| Compliance Trend | `grcReports_complianceTrend` | 按日期+评估结果的计数表格 |
| Review SLA | `grcReports_reviewSla` | 4 个 Statistic 卡片 |
| Exceptions | `grcReports_exceptions` | 4 个 Statistic 卡片 |
| Treatments | `grcReports_treatments` | 2 个 Statistic 卡片 |

## 4. 路由配置

### 4.1 路由定义

```typescript
// router/routes.tsx 中的 GRC 路由
{
  path: '/grc/dashboard',
  element: lazyLoad(() => import('@/pages/grc/GrcDashboard')),
  handle: {
    title: 'GRC Dashboard',
    titleKey: 'routes.grc.dashboard.title',
    subtitleKey: 'routes.grc.dashboard.subtitle',
    icon: <SafetyCertificateOutlined />,
    navKey: 'grc-dashboard',
    navOrder: 8,
    permission: 'admin.grc.dashboard.read',
    menuCode: 'menu.admin.grc',
  },
},
// ... 共 7 条路由
```

### 4.2 路由与菜单关系

所有 GRC 路由共享 `menuCode: 'menu.admin.grc'`，在侧边栏菜单中作为同一分组展示。

| 路由 | navKey | navOrder | 权限 |
|------|--------|----------|------|
| `/grc/dashboard` | grc-dashboard | 8 | admin.grc.dashboard.read |
| `/grc/rules` | grc-rules | 9 | admin.grc.rules.read |
| `/grc/reviews` | grc-reviews | 10 | admin.grc.reviews.read |
| `/grc/reviews/:caseId` | grc-reviews | — | admin.grc.reviews.read |
| `/grc/exceptions` | grc-exceptions | 11 | admin.grc.exceptions.read |
| `/grc/reports` | ggr-reports | 12 | admin.grc.reports.read |

## 5. 国际化

### 5.1 命名空间

所有 GRC i18n key 以 `pages.grc.*` 或 `routes.grc.*` 开头：

```
routes.grc.dashboard.title    → 'GRC 仪表盘' / 'GRC Dashboard' / 'لوحة حوكمة GRC'
routes.grc.dashboard.subtitle → '风险概况、合规趋势与审批监控'
pages.grc.dashboard.riskLow   → '低' / 'Low' / 'منخفض'
pages.grc.common.refresh      → '刷新' / 'Refresh' / 'تحديث'
```

### 5.2 Key 分类

| 分类 | Key 数量 | 示例 |
|------|---------|------|
| routes（路由标题） | 18 | `routes.grc.dashboard.title` |
| pages.dashboard（仪表盘） | 10 | `pages.grc.dashboard.passRate` |
| pages.rules（规则库） | 16 | `pages.grc.rules.code`, `pages.grc.rules.publish` |
| pages.reviews（审批） | 16 | `pages.grc.reviews.decide`, `pages.grc.reviews.rationale` |
| pages.exceptions（例外） | 16 | `pages.grc.exceptions.approve`, `pages.grc.exceptions.scope` |
| pages.treatments（处置） | 8 | `pages.grc.treatments.verify`, `pages.grc.treatments.close` |
| pages.reports（报表） | 8 | `pages.grc.reports.riskDistribution` |
| pages.common（通用） | 16 | `pages.grc.common.confirm`, `pages.grc.common.refresh` |
| pages.riskLevel（风险等级） | 4 | `pages.grc.riskLevel.low` |

### 5.3 使用方式

```typescript
const { t } = useTranslation()

// 带 fallback 的安全调用
<h1>{t('routes.grc.dashboard.title', 'GRC Dashboard')}</h1>

// 动态 key
<Tag color={RISK_LEVEL_COLORS[level]}>
  {t(`pages.grc.riskLevel.${level.toLowerCase()}`, level)}
</Tag>
```

## 6. 组件依赖

### 6.1 共享组件库

所有页面使用 `@ff-ai-frontend/components`：

```typescript
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
```

| 组件 | 用途 |
|------|------|
| `PageContainer` | 页面外层容器（圆角 + 边框） |
| `PageHeader` | 标题 + 副标题 + 右侧操作区 |

### 6.2 Ant Design 组件使用

| 组件 | 使用场景 |
|------|---------|
| `Table` | 所有列表页 |
| `Card` | 统计卡片容器 |
| `Row` / `Col` | 响应式网格布局 |
| `Statistic` | KPI 数字展示 |
| `Tag` | 状态标签（含风险等级颜色） |
| `Button` | 操作按钮 |
| `Form` / `Drawer` | 表单和抽屉 |
| `Select` | 筛选和选择 |
| `Segmented` | 切换（我的待办/全部） |
| `Tabs` | 报表标签页 |
| `Descriptions` | 详情信息展示 |
| `Timeline` | 审计时间线 |
| `Space` | 间距布局 |

### 6.3 其他依赖

| 库 | 用途 |
|----|------|
| `@tanstack/react-query` | 数据获取和缓存 |
| `react-i18next` | 国际化 |
| `dayjs` | 日期格式化 |
| `@ant-design/icons` | 图标（ReloadOutlined, PlusOutlined） |

## 7. 状态管理

### 7.1 数据获取

全部使用 `useQuery` + `useMutation`（TanStack Query）：

```typescript
// 查询
const { data, isLoading, refetch } = useQuery({
  queryKey: grcKeys.dashboard(),
  queryFn: () => grcDashboard_get(30, orgId),
})

// 变更
const mutation = useMutation({
  mutationFn: approveException,
  onSuccess: () => {
    message.success('Approved')
    queryClient.invalidateQueries({ queryKey: grcKeys.exceptions() })
  },
})
```

### 7.2 缓存失效策略

| 操作 | 失效范围 |
|------|---------|
| 规则 CRUD | `grcKeys.rules()` |
| 审批决策 | `grcKeys.reviewCase(id)` + `grcKeys.reviewCases()` |
| 例外操作 | `grcKeys.exceptions()` |
| 规则发布 | `grcKeys.rules()` + `grcKeys.dashboard()` |
| 报表刷新 | 手动 refetch 各报表 query |

### 7.3 用户信息

```typescript
import { useAuthStore } from '@/store/useAuth'

const orgId = useAuthStore(state => state.user?.organization_id)
```

## 8. 风险等级视觉规范

### 8.1 颜色映射

| 等级 | Ant Design Tag Color | 用途 |
|------|---------------------|------|
| LOW | `green` | 低风险标签 |
| MEDIUM | `blue` | 中风险标签 |
| HIGH | `orange` | 高风险标签 |
| CRITICAL | `red` | 严重风险标签 |

### 8.2 非颜色表达

风险等级**不依赖颜色单独表达**，必须同时显示文字标签。满足可访问性要求。

## 9. 待办事项

- [ ] `ExceptionManagement` 状态 i18n key 修正（当前使用 `pages.grc.exceptions.status*` 拼接，需统一）
- [ ] `ReviewQueue` 状态 Tag 翻译 key 修正（同上）
- [ ] Lifecycle Ops 页面集成 GRC 风险显示（Phase 8）
- [ ] 人工干预工作台 GRC 面板扩展（复用壳层）
- [ ] 前端路由守卫测试
- [ ] 前端可访问性测试（RTL、键盘导航、非纯颜色表达）
- [ ] 前端页面单元测试
- [ ] 端到端集成测试
