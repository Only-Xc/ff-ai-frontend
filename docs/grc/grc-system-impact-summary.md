# GRC（治理合规）模块 — 系统改动与影响总览

> 面向开发者的一站式参考，汇总 GRC 模块对前端/后端/数据库/权限/部署的全链路改动。
>
> **已有深度文档**（拆分明细见各章节）：
> - 后端实现：[`ff-ai-platform/docs/grc/grc-backend-design.md`](../ff-ai-platform/docs/grc/grc-backend-design.md)
> - 前端实现：[`ff-ai-frontend/docs/grc/grc-frontend-design.md`](../ff-ai-frontend/docs/grc/grc-frontend-design.md)
> - 审计&评估详解：[`ff-ai-platform/docs/grc/GRC审计与评估服务详解.md`](../ff-ai-platform/docs/grc/GRC审计与评估服务详解.md)
> - 数据库表结构：[`ff-ai-platform/docs/grc/GRC数据库表结构详解.md`](../ff-ai-platform/docs/grc/GRC数据库表结构详解.md)
> - 开发规划与进度：[`ff-ai-platform/docs/grc/GRC规则引擎开发阶段规划与进度.md`](../ff-ai-platform/docs/grc/GRC规则引擎开发阶段规划与进度.md)

---

## 目录

1. [项目概览](#1-项目概览)
2. [模块全景图](#2-模块全景图)
3. [后端改动详解](#3-后端改动详解)
4. [前端改动详解](#4-前端改动详解)
5. [数据库改动详解](#5-数据库改动详解)
6. [RBAC 权限与角色](#6-rbac-权限与角色)
7. [对既有系统的集成与影响](#7-对既有系统的集成与影响)
8. [开发与部署注意事项](#8-开发与部署注意事项)

---

## 1. 项目概览

| 项目 | 路径 |
|------|------|
| 后端（Python FastAPI） | `ff-ai-platform/backend/` |
| 前端（React TypeScript monorepo） | `ff-ai-frontend/` |
| 前端子项目 | `apps/admin-web/`（管理后台），`apps/user-web/`（用户端） |
| Monorepo 工具 | pnpm workspace + Turbo |
| 后端 ORM / 迁移 | SQLModel / Alembic |
| 前端 UI | Ant Design 5.x + ECharts |

**GRC 模块代码量估算**（不含迁移 & 测试）：
- 后端服务层：~3000+ 行 Python（9 个服务模块）
- 后端路由层：~2000+ 行 Python（1 个路由文件，57 个端点）
- 后端数据模型：~600 行（+ 2 个迁移文件）
- 前端页面：14 个文件（13 个 .tsx + 1 个 .ts）
- 前端 API 层：~120 个导出函数

---

## 2. 模块全景图

```
┌───────────────────────────────────────────────────┐
│                     前端页面                        │
│  GrcDashboard | RuleLibrary | RuleDetail          │
│  ReviewQueue  | ReviewDetail | EvaluationList     │
│  EvaluationDetail | ExceptionManagement           │
│  GovernanceReports                                │
└───────────────┬───────────────────────────────────┘
                │ API 调用 (约 50+ API 函数)
                ▼
┌───────────────────────────────────────────────────┐
│           后端 API 层 (routes/grc.py)              │
│    57 个端点，统一前缀 /admin/grc/*                │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│              GRC 服务层 (services/grc/ )            │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐     │
│  │policy    │ │evaluation│ │ review_service │     │
│  │_service  │ │_service  │ │                │     │
│  └──────────┘ └──────────┘ └────────────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐     │
│  │exception │ │audit     │ │ report_service │     │
│  │_service  │ │_service  │ │                │     │
│  └──────────┘ └──────────┘ └────────────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐     │
│  │rule_     │ │json_logic│ │ post_deploy     │     │
│  │evaluators│ │          │ │ _service  │     │     │
│  └──────────┘ └──────────┘ └────────────────┘     │
│  ┌──────────┐                                      │
│  │release   │                                      │
│  │_gate     │                                      │
│  └──────────┘                                      │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│           数据库 (11 张 grc_* 表)                  │
│  风险画像 → 规则 → 评估 → 审批 → 处置 → 审计     │
└───────────────────────────────────────────────────┘
```

---

## 3. 后端改动详解

### 3.1 新增文件

#### 3.1.1 API 路由

| 文件 | 说明 |
|------|------|
| `app/api/routes/grc.py` | 新增，约 2000+ 行，注册为 `/admin/grc/*` 路径 |

从 `app/api/main.py` 第 44 号 `include_router` 注册：
```
api_router.include_router(grc.router)     # line 44
```

#### 3.1.2 服务模块（`app/services/grc/` 目录）

共 10 个文件，分 9 个功能域：

| 模块 | 文件 | 核心职责 |
|------|------|----------|
| **规则引擎** | `policy_service.py` | 风险画像 CRUD、规则 CRUD、规则版本管理（草稿→发布→作废） |
| **评估引擎** | `evaluation_service.py` | 创建/执行评估、多规则逐条执行、风险评分聚合、幂等性保障 |
| **规则评估器** | `rule_evaluators.py` | **10 个内置评估器**（见下表）+ 配置校验 `validate_rule_evaluator_config` + 执行入口 `evaluate_builtin`/`evaluate_manual` |
| **JSON Logic** | `json_logic.py` | 自定义规则引擎：解析 JSON Logic DSL 并执行用户自定义判定逻辑，支持嵌套操作符、变量引用、集合运算 |

**评估器类型**（`RuleEvaluatorType` 枚举）分 3 种：
- `builtin` — 10 个内置评估器（`rule_evaluators.py:37` 的 `BUILTIN_EVALUATOR_SPECS`）
- `json_logic` — 用户自定义 JSON Logic 表达式（`json_logic.py`）
- `manual` — 人工评估（`evaluate_manual`）

**10 个内置评估器**（`rule_evaluators.py`）：

| 评估器 key | 检查函数 | 检查内容 |
|-----------|----------|----------|
| `plaintext_secrets_detected` | `_check_plaintext_secrets` | 明文密钥检测 |
| `external_network` | `_check_external_network` | 外部网络访问白名单 |
| `human_oversight` | `_check_human_oversight` | 人工监督机制 |
| `restricted_data` | `_check_restricted_data` | 受限数据访问 |
| `pii_mitigation` | `_check_pii_mitigation` | PII 脱敏处理 |
| `model_approved` | `_check_model_approved` | 模型是否已审批 |
| `deployment_complete` | `_check_deployment_complete` | 部署完整性 |
| `audit_logging` | `_check_audit_logging` | 审计日志开启 |
| `min_permissions` | `_check_min_permissions` | 最小权限原则 |
| `owner_sla` | `_check_owner_sla` | 负责人 SLA 达标 |
| **审批服务** | `review_service.py` | 审批单 CRUD、分配审批人、提交审批决定、证据上传、取消审批 |
| **例外管理** | `exception_service.py` | 例外申请、审批（含审批级别路由：critical → 组织管理员）、撤销 |
| **审计服务** | `audit_service.py` | 防篡改审计链（哈希链）、事件记录与查询、哈希链完整性校验 |
| **报表服务** | `report_service.py` | 风险分布、合规趋势、SLA 达标率、规则命中 TOP N、例外统计、报表导出（异步） |
| **上线门禁** | `release_gate.py` | Agent promote/上线前 GRC 合规检查、阻断判定 |
| **上线监控** | `post_deploy_service.py` | 上线后监控项 CRUD、到期检查、确认/关闭 |

**模块依赖关系**（评估是核心枢纽）：
```
policy_service ──→ evaluation_service ──→ rule_evaluators / json_logic
                      │                     review_service
                      │                     exception_service
                      │                     audit_service
                      │                     report_service (只读)
                      ↓
                 release_gate ← post_deploy_service
```

> 详见：`GRC审计与评估服务详解.md` 中"两个服务如何被调用（上下文）"章节

### 3.2 新增运维脚本（`scripts/`）

| 脚本 | 用途 |
|------|------|
| `scripts/grc_data_governance.py` | P0-3：扫描并修复已发布规则版本的配置错误、清理脏评估数据 |
| `scripts/grc_audit_hash_migrate.py` | P4：统一审计哈希规范后，重算并修复历史审计事件的哈希链 |
| `scripts/seed_grc_dashboard.py` | 用真实评估管线生成 DEMO 仪表盘数据，可重复运行（先清后写） |

### 3.3 新增测试（`tests/`）

| 文件 | 覆盖阶段 | 说明 |
|------|----------|------|
| `tests/services/test_grc_p3.py` | P3 | 100% mock、无 DB 操作。覆盖多租户 org 作用域隔离（`get_rule_stats`、`get_active_published_versions`、`get_active_risk_profile`）、幂等键 org 作用域 |
| `tests/services/test_grc_p4.py` | P4 | 100% mock、无 DB 操作。覆盖审计哈希链（`compute_event_hash` 确定性、`record_audit_event` 建链、`verify_hash_chain` 篡改检测） |

> 遵循项目约定：后端测试全部 Mock，不操作数据库。

### 3.4 API 端点索引（57 个）

所有端点前缀 `/admin/grc/`，注册于 `app/api/routes/grc.py`。

| 分类 | 端点 | 方法 | 说明 |
|------|------|------|------|
| **仪表盘** | `dashboard/overview` | GET | 全局概览指标 |
| **风险画像** | `risk-profiles` | GET | 列表 |
| | `risk-profiles/{id}` | GET | 单个详情 |
| | `risk-profiles/assess` | POST | 评估/创建风险画像 |
| | `risk-profiles/{id}` | PUT | 更新画像评分 |
| **规则** | `rules` | GET | 规则库列表 |
| | `rules` | POST | 创建 |
| | `rules/{id}` | GET/PATCH/PUT | 详情/更新 |
| | `rules/{id}/versions` | GET | 版本列表 |
| | `rules/{id}/versions` | POST | 创建版本 |
| | `rules/{id}/versions/{v}/publish` | POST | 发布版本（草稿→已发布） |
| | `rules/{id}/versions/{v}/retire` | POST | 作废版本（已发布→已作废） |
| | `rules/{id}/stats` | GET | 规则统计 |
| | `rules/validate` | POST | 规则配置校验 |
| | `rules/test` | POST | 规则试运行 |
| **评估** | `evaluations` | GET | 评估历史 |
| | `evaluations` | POST | 触发评估（主入口） |
| | `evaluations/{id}` | GET | 评估详情 |
| | `evaluations/{id}/results` | GET | 逐规则结果 |
| | `evaluations/{id}/rerun` | POST | 重跑 |
| | `agents/{aid}/release-status` | GET | Agent 上线准入状态 |
| **审批** | `reviews` | GET | 审批队列 |
| | `reviews/{id}` | GET | 审批单详情 |
| | `reviews/{id}/assign` | POST | 分配审批人 |
| | `reviews/{id}/decisions` | GET/POST | 提交/查看审批决定 |
| | `reviews/{id}/evidence` | POST | 上传审批证据 |
| | `reviews/{id}/cancel` | POST | 取消审批 |
| | `reviews/{id}/treatments` | GET/POST | 关联处置记录 |
| | `reviews/{id}/exceptions` | POST | 关联例外申请 |
| **例外** | `exceptions` | GET | 例外列表 |
| | `exceptions/{id}/approve` | POST | 批准 |
| | `exceptions/{id}/reject` | POST | 驳回 |
| | `exceptions/{id}/revoke` | POST | 撤销 |
| **处置** | `treatments` | GET | 处置记录列表 |
| | `treatments/{id}` | PATCH | 更新处置 |
| | `treatments/{id}/verify` | POST | 验证处置有效性 |
| | `treatments/{id}/close` | POST | 关闭处置 |
| **报表** | `reports/risk-distribution` | GET | 风险分布 |
| | `reports/compliance-trend` | GET | 合规趋势 |
| | `reports/review-sla` | GET | 审批 SLA |
| | `reports/exceptions` | GET | 例外统计 |
| | `reports/treatments` | GET | 处置统计 |
| | `reports/rule-hits` | GET | 规则命中统计 |
| | `reports/exports` | POST | 导出报表（异步） |
| | `reports/exports/{job_id}` | GET | 导出进度/下载 |
| **审计** | `audit-events` | GET | 审计日志列表 |
| | `audit-events/verify-chain` | GET | 哈希链完整性校验 |
| | `audit-events/{id}` | GET | 单条详情 |
| **上线监控** | `agents/{aid}/monitors` | GET | 监控项列表 |
| | `agents/{aid}/monitor` | POST | 创建监控项 |
| | `monitors` | GET | 标签/状态筛选 |
| | `monitors/check-due` | POST | 到期自动检查 |
| | `monitors/{id}/acknowledge` | POST | 确认 |
| | `monitors/{id}/stop` | POST | 停止 |

> 每个端点的请求/响应结构详见 `grc-backend-design.md` 的 [4.2 端点清单]()

---

## 4. 前端改动详解

### 4.1 新增页面（`apps/admin-web/src/pages/grc/`）

| 页面文件 | 功能 | 关键交互 |
|----------|------|----------|
| `GrcDashboard.tsx` | GRC 仪表盘 | ECharts 图表展示全局指标、通过率/阻断率、逾期处置 |
| `RuleLibrary.tsx` | 合规规则库 | 规则筛选+列表、创建规则按钮 |
| `RuleDetail.tsx` | 规则详情 | 版本管理（草稿→发布→作废）、配置查看 |
| `RuleEditorDrawer.tsx` | 规则编辑抽屉 | 弹窗形式编辑规则配置，嵌套 `RuleTemplatePicker` |
| `RuleTemplatePicker.tsx` | 规则模板选择器 | 从模板库选取预设规则配置 |
| `ruleTemplates.ts` | 规则模板定义 | 纯数据文件，内置 7 个规则模板（secrets/externalAllowlist/restrictedData/minPermissions/auditLogging/humanOversight/dataClassificationRouting） |
| `RuleTestPanel.tsx` | 规则试运行面板 | 模拟输入→评估器执行→输出校验 |
| `EvaluationList.tsx` | 评估历史列表 | 资产评估历史、重新评估 |
| `EvaluationDetail.tsx` | 评估详情 | 逐规则结果展示、风险等级/评分 |
| `RunEvaluationModal.tsx` | 触发评估弹窗 | 选择 Agent+画像，确认运行 |
| `ReviewQueue.tsx` | 审批队列 | 待审批/已审批/已取消筛选 |
| `ReviewDetail.tsx` | 审批详情 | 审批单信息、决定提交、证据查看、关联处置记录 |
| `ExceptionManagement.tsx` | 例外管理 | 例外申请、审批、撤销 |
| `GovernanceReports.tsx` | 治理报表 | ECharts 风险分布/合规趋势图表、报表导出 |

### 4.2 新增 API 层

两层架构：

**共享 API 层（`packages/api/src/admin/grc.ts`）**：
- 定义请求类型、响应类型、URL 路径常量
- 导出 API 请求工厂函数
- 在 `packages/api/src/admin/index.ts` re-export

**应用层 API 封装（`apps/admin-web/src/api/grc.ts`）**：
- 基于共享层封装 response 处理
- 导出前端可直接调用的函数（约 50+ 个导出项）
- 提供 React Query `queryKey` 工厂（`grcKeys` 对象）

前端 API 函数分类：

| 分类 | 函数数 | 例如 |
|------|--------|------|
| 仪表盘 | 1 | `grcDashboard_get` |
| 风险画像 | 4 | `grcRiskProfiles_list`, `grcRiskProfile_*` |
| 规则 | 10 | `grcRules_list`, `grcRule_*`, `grcRuleVersions_*`, `grcRuleVersion_publish/retire` |
| 评估 | 6 | `grcEvaluations_create/list/get`, `grcEvaluation_rerun`, `grcAgentReleaseStatus_get` |
| 审批 | 5 | `grcReviewCases_list/get/assign`, `grcReviewDecision_submit`, `grcReviewDecisions_list` |
| 例外 | 6 | `grcExceptions_list`, `grcException_request/approve/reject/revoke` |
| 处置 | 5 | `grcTreatments_list/create/update/verify/close` |
| 报表 | 8 | `grcReports_*`（riskDistribution, complianceTrend, reviewSla, exports...） |

### 4.3 路由注册（`apps/admin-web/src/router/routes.tsx`）

新增 8 个路由路径，均使用 `React.lazy` 懒加载：

| 路径 | 页面 | 权限 | 菜单码 |
|------|------|------|--------|
| `/grc/dashboard` | GrcDashboard | `admin.grc.dashboard.read` | `menu.admin.grc` |
| `/grc/rules` | RuleLibrary | `admin.grc.rules.read` | `menu.admin.grc` |
| `/grc/rules/:ruleId` | RuleDetail | `admin.grc.rules.read` | `menu.admin.grc` |
| `/grc/reviews` | ReviewQueue | `admin.grc.reviews.read` | `menu.admin.grc` |
| `/grc/reviews/:caseId` | ReviewDetail | `admin.grc.reviews.read` | `menu.admin.grc` |
| `/grc/evaluations` | EvaluationList | `admin.grc.evaluations.read` | `menu.admin.grc` |
| `/grc/evaluations/:evaluationId` | EvaluationDetail | `admin.grc.evaluations.read` | `menu.admin.grc` |
| `/grc/exceptions` | ExceptionManagement | `admin.grc.exceptions.read` | `menu.admin.grc` |
| `/grc/reports` | GovernanceReports | `admin.grc.reports.read` | `menu.admin.grc` |

特点：
- **统一菜单码** `menu.admin.grc`：所有 GRC 页面挂在同一个顶层菜单项下
- **全局懒加载**：按需加载页面代码
- **权限守卫**：每个路由配置了最小权限 `admin.grc.xxx.read`

### 4.4 国际化改动（i18n）

在 `apps/admin-web/src/i18n/resources/{zh-CN,en-US,ar}/` 下**三语同步新增**：

- **`routes.ts`**：约 16 行 key，覆盖路由标题和副标题（routes.grc.*）
- **`pages.ts`**：约 **370 个 key**，覆盖页面所有 UI 文字（pages.grc.*），命名空间细分：
  - `pages.grc.dashboard.*`（~20）
  - `pages.grc.rules.*`（~111，含 10 个内置评估器名称/描述）
  - `pages.grc.reviews.*`（~61，含 11 个审批状态）
  - `pages.grc.evaluations.*`（~29）
  - `pages.grc.exceptions.*`（~45）
  - `pages.grc.reports.*`（~53）
  - `pages.grc.treatments.*`（~18）
  - `pages.grc.templates.*`（~14，7 个模板的名称/描述）
  - `pages.grc.common.*`（~16）
  - `pages.grc.riskLevel.*`（4）

**必须三语同步**（zh-CN / en-US / ar）：zh-CN ~371、en-US ~369、ar ~369，阿拉伯语（RTL）同样全覆盖。

### 4.5 前端依赖

GRC 模块**未引入新的前端依赖**，全部复用 `apps/admin-web/package.json` 中已有的库：

| 依赖 | 用于 | 是否 GRC 新增 |
|------|------|--------------|
| `echarts` ^6.0.0 | 仪表盘 & 报表图表 | 否（ops-metrics、user-web 已在用） |
| `echarts-for-react` ^3.0.6 | React ECharts 封装 | 否 |
| `@ant-design/icons` ^6.2.2 | UI 图标 | 否 |
| `uuid` ^11.1.1 | RunEvaluationModal 生成 idempotency_key | 否 |
| `dayjs` | 日期格式化 | 否 |
| `@tanstack/react-query` | 服务端状态管理 | 否 |

> 详见 `grc-frontend-design.md` 的[组件依赖]章节

### 4.6 页面内权限控制

前端页面内使用 `hasPermission('admin.grc.xxx.action')` 做细粒度按钮级权限守卫：

| 页面 | 权限点 | 控制 |
|------|--------|------|
| EvaluationList | `admin.grc.evaluations.run` | 重新评估按钮 |
| EvaluationDetail | `admin.grc.evaluations.run` | 重新评估按钮 |
| RuleLibrary | `admin.grc.rules.update` / `create` | 编辑/创建按钮 |
| RuleDetail | `admin.grc.rules.update` / `create` / `publish` | 编辑/创建版本/发布/作废按钮 |

---

## 5. 数据库改动详解

### 5.1 数据库表（11 张 `grc_*` 表）

所有表使用 UUID 主键，统一含 `organization_id` 多租户字段和 `created_at` / `updated_at` 时间戳。

| # | 表名 | 所属流程 | 说明 |
|---|------|----------|------|
| 1 | `grc_risk_profiles` | 风险画像 | Agent 风险等级配置，按组织隔离，每 Agent 一个活跃版本 |
| 2 | `grc_rules` | 规则 | 规则稳定标识（code 全局唯一） |
| 3 | `grc_rule_versions` | 规则版本 | 不可变规则版本（草稿→已发布→已作废），关联 rule_id |
| 4 | `grc_evaluations` | 评估批次 | 一次合规评估入口，关联 profile，幂等（idempotency_key） |
| 5 | `grc_evaluation_results` | 逐规则结果 | 每条规则的评估结果（pass/fail/error），关联 evaluation+rule |
| 6 | `grc_review_cases` | 审批单 | 触发审批（PASS_WITH_NOTICE / REVIEW_REQUIRED / ERROR 结论时） |
| 7 | `grc_review_decisions` | 审批决定 | 审批人决定（approved/rejected + 处置措施） |
| 8 | `grc_exceptions` | 例外豁免 | 规则豁免申请，含截止日期、审批链路 |
| 9 | `grc_risk_treatments` | 风险处置 | 处置措施（接受/缓解/转移/规避），有验证机制 |
| 10 | `grc_audit_events` | 审计事件 | 防篡改哈希链审计日志 |
| 11 | `grc_metrics_daily` | 指标聚合 | 每日风险指标缓存，用于仪表盘快速加载 |
| 12 | `grc_post_deploy_monitors` | 上线监控 | 上线后监控项（状态、检查频率、到期检测） |

### 5.2 核心数据流（流程串联）

```
grc_risk_profiles (Agent 风险画像)
        │
        ▼ evaluation_service.create_evaluation
grc_evaluations (评估批次)
        │
        ▼ 逐规则评估
grc_evaluation_results (逐规则结果)
        │
        ▼ 评分聚合
        ├─ PASS ──────────────→ 正常（结束）
        ├─ PASS_WITH_NOTICE ──→ grc_review_cases (审批)
        ├─ REVIEW_REQUIRED ───→ grc_review_cases (审批)
        │                           │
        │                           ├─ grc_review_decisions (审批决定)
        │                           ├─ grc_exceptions (例外申请)
        │                           └─ grc_risk_treatments (处置记录)
        ├─ BLOCKED ────────────→ release_gate 阻断上线
        └─ ERROR ──────────────→ 系统级错误

所有流程节点的关键事件自动记录到 grc_audit_events（哈希链审计）
每日汇总写入 grc_metrics_daily 供仪表盘查询
```

### 5.3 迁移文件

| 迁移 | 说明 |
|------|------|
| `a1b2c3d4e5f6_add_grc_tables.py`<br>(down_revision=`fc41c66802e9`) | 初始建表：一次性创建 11 张 `grc_*` 表（risk_profiles / rules / rule_versions / evaluations / evaluation_results / review_cases / review_decisions / exceptions / risk_treatments / audit_events / metrics_daily）及全部索引/唯一约束。**注意**：此迁移不含 `grc_post_deploy_monitors` 表和 `agent_version` 等列 |
| `b2c3d4e5f6a7_sync_grc_schema.py`<br>(down_revision=`a1b2c3d4e5f6`) | 模式同步（全部 additive/nullable，可逆）：为 `grc_evaluations` / `grc_review_cases` / `grc_review_decisions` 追加 `agent_version`、`deployment_id`；为 `grc_audit_events` 追加 4 个 `related_*_id` 关联字段（各带索引）；**新建 `grc_post_deploy_monitors` 整表** |

> 完整表结构（字段类型、约束、索引、外键）详见 `GRC数据库表结构详解.md`

---

## 6. RBAC 权限与角色

### 6.1 新增权限码（`rbac_seed_service.py:50-73`）

约 24 个权限码，统一命名空间 `admin.grc.*`：

```
admin.grc.dashboard.read        — 查看仪表盘
admin.grc.risks.read/manage     — 查看/管理风险画像
admin.grc.rules.read/create/update/publish — 规则 CRUD+发布
admin.grc.evaluations.read/run  — 查看/执行评估
admin.grc.reviews.read/assign/decide       — 审批相关
admin.grc.exceptions.read/request/approve/approve_critical/revoke — 例外管理
admin.grc.treatments.read/manage/verify    — 处置管理
admin.grc.reports.read/export   — 报表查看/导出
admin.grc.audit.read            — 审计日志
menu.admin.grc                  — 菜单项（控制后台侧边栏可见性）
```

### 6.2 新增内置角色（`rbac_seed_service.py:100-103`）

| 角色代码 | 说明 | 授权级别 |
|----------|------|----------|
| `grc_admin` | GRC 管理员 | organization |
| `grc_reviewer` | GRC 审核员 | organization |
| `grc_auditor` | GRC 审计员 | organization |
| `risk_owner` | 风险责任人 | organization |

> `system_admin` / `tenant_admin` 自动含全部 GRC 权限。

### 6.3 角色权限矩阵（来自 `rbac_seed_service.py:156-219`）

| 权限 | grc_admin | grc_reviewer | grc_auditor | risk_owner |
|------|-----------|-------------|-------------|-----------|
| dashboard.read | ✓ | ✓ | ✓ | ✓ |
| risks.read/manage | ✓ | ✓ | ✓ | 侧重处置 |
| rules.read/create/update/publish | ✓ | | | |
| evaluations.read/run | ✓ | ✓ | | |
| reviews.read/assign/decide | ✓ | ✓ | | |
| exceptions.read/request | ✓ | ✓ | | |
| exceptions.approve | ✓ | | | |
| exceptions.approve_critical | ✓ | | | |
| exceptions.revoke | ✓ | | | |
| treatments.read/manage/verify | ✓ | ✓ | | ✓ |
| reports.read/export | ✓ | | ✓ | |
| audit.read | ✓ | | ✓ | |

> 大致分工：`grc_admin` 全量、`grc_reviewer` 侧重审批评估、`grc_auditor` 只读+导出+审计、`risk_owner` 侧重风险处置。

---

## 7. 对既有系统的集成与影响

### 7.1 上线门禁集成（最关键的既有系统改动）

**涉及文件**：`app/services/task_factory_service.py:955-998`

Agent 晋升流程（`sandbox → running`）在晋升前强制调用 GRC 发布门禁：

```python
# task_factory_service.py:978
from app.services.grc.release_gate import assert_agent_release_allowed
# trigger_type="promote", idempotency_key=f"promote-{agent_id}-{task.task_id}"
```

- 门禁内部会取/建风险画像 → 复用未过期评估或新建评估 → 按评估结果构建门禁结果
- `PASS` / `PASS_WITH_NOTICE` → 放行；`BLOCKED` / `REVIEW_REQUIRED` → 拒绝并自动建审批单，抛 **HTTP 403**（附 reasons + review_case_id）
- 评估器异常 → 抛 **HTTP 500**（`GRC evaluation error`）
- 这是 GRC 对既有工作流**唯一的强制阻断点**

**影响**：任何 Agent sandbox→running 晋升都会经过完整 GRC 评估，即使是已有的 Agent

### 7.2 后端主路由注册

**涉及文件**：`app/api/main.py:44`

```python
api_router.include_router(grc.router)   # line 44
```

在所有既有路由（login, users, items, ai_runtime...）之后注册。

### 7.3 前端路由接入

**涉及文件**：`apps/admin-web/src/router/routes.tsx`

新增 9 个 GRC 路由路径，均使用 `React.lazy` 懒加载。GRC 各页面共享同一个菜单码 `menu.admin.grc`，在侧边栏合并为一个菜单项。

### 7.4 前端共享 API 层

**涉及文件**：
- `packages/api/src/admin/grc.ts`（新增）
- `packages/api/src/admin/index.ts`（修改：re-export grc）

前端 monorepo 的 shared API package 新增了 GRC 模块的导出，对包消费者透明可用。

### 7.5 国际化三语同步

**涉及文件**（6 个文件，2 个 namespaces × 3 种语言）：

| 文件 | 新增 key 数量 |
|------|--------------|
| `routes.ts` (zh-CN / en-US / ar) | ~16 个 |
| `pages.ts` (zh-CN / en-US / ar) | ~370 个 |

**影响**：国际化资源增加约 25%（按 key 数量估算）

### 7.6 前端依赖

**无新增依赖**。GRC 图表复用已有的 `echarts` / `echarts-for-react`（ops-metrics 模块和 user-web 均已使用）。

### 7.7 已知缺口（供后续开发注意）

- **`/grc/risks` 路由缺失**：i18n 三语已定义 `routes.grc.risks.title/subtitle`，风险画像的后端 API（`risk-profiles`）和前端 API 函数（`grcRiskProfile_*`）均已实现，但**尚无对应的前端页面路由**。属于预留/待开发功能。
- **Treatment 无独立管理页**：处置相关 API 已完整（`grcTreatment_*`），但前端仅在 `GovernanceReports` 中通过报表端点间接展示，无独立的处置管理页面。
- **`ReviewDetail` 导航方式不统一**：`ReviewQueue` 行点击使用 `window.location.href`（整页重载）而非 `useNavigate()`（SPA 内导航），建议后续统一。

---

## 8. 开发与部署注意事项

### 8.1 初始化流程

首次部署需按以下顺序操作：

```bash
# 1. 执行数据库迁移（创建所有 grc_* 表）
cd ff-ai-platform/backend
alembic upgrade head

# 2. 运行种子脚本（注入权限码、内置角色、菜单配置）
#    脚本会在 app/services/rbac_seed_service.py 自动执行

# 3. 启动服务后可通过 API 验证
curl http://localhost:8000/admin/grc/dashboard/overview
```

### 8.2 数据治理

如果是从旧代码升级，或者发现数据不一致：

```bash
# 扫描并修复规则版本配置
python scripts/grc_data_governance.py

# 修复审计哈希链
python scripts/grc_audit_hash_migrate.py

# 生成 DEMO 仪表盘数据（开发/测试环境）
python scripts/seed_grc_dashboard.py
```

### 8.3 环境变量与配置

- **无新增环境变量**：GRC 复用已有的数据库和配置。
- **无新增第三方依赖**：JSON Logic 引擎为手写实现（`json_logic.py`），未引入 `json-logic` 等第三方包；哈希用标准库 `hashlib`。
- **无 Celery/定时任务**：`app/worker/tasks.py` 和 `app/core/celery_app.py` 中**没有** GRC 相关的异步任务或 beat 调度。上线后监控的到期检查依赖**外部调度器/cron** 定期调用 `POST /admin/grc/monitors/check-due` 端点触发。风险阈值、评估过期时间（24h）、监控默认间隔（1440min）、漂移阈值等均为**服务层硬编码常量**。

### 8.4 已知约束

- **两个迁移必须都应用**：只跑 `a1b2c3d4e5f6` 会缺 `grc_post_deploy_monitors` 表和 `agent_version` / `deployment_id` / 审计事件关联列，导致 ORM 与 DB 不一致。务必 `alembic upgrade head`。
- **幂等性**：评估接口通过 `grc_evaluations.idempotency_key` 保障，同一 key 多次请求不会重复执行（幂等键在 org 作用域内唯一）。
- **多租户**：所有表通过 `organization_id` 隔离，服务层需显式传入 org（`get_rule_stats`、`get_active_published_versions` 等），P3 测试专门守护该行为。
- **审计链不可篡改**：`grc_audit_events` 是**全局单链**（按整型 `id` 排序，非按 org 分链）。`audit_service.compute_event_hash` 是唯一权威哈希实现，任何绕过它写入都会使 `verify_hash_chain` 报断链；重置需跑 `grc_audit_hash_migrate.py`。
- **manual 规则语义**：`manual` 类型规则永远先产出 `review_required`，直到审批 `submit_decision` 经 `resolve_manual_rule_results` 回填 pass/fail 并重算评估聚合（存在 `evaluation_service ↔ review_service` 的循环调用，通过函数内延迟 import 规避导入环）。
- **上线门禁是硬阻断**：任何 Agent sandbox→running 晋升都会跑一次完整 GRC 评估；评估器异常会导致 HTTP 500 阻断晋升（`task_factory_service.py:997`）。
- **审批级别路由**：例外审批中 `risk_level=CRITICAL` 需 `admin.grc.exceptions.approve_critical` 权限（仅 grc_admin 拥有），普通审批人无此权限。

### 8.5 与前端设计的映射速查

| 后端模块 | 对应前端页面 |
|----------|-------------|
| policy_service | RuleLibrary, RuleDetail, RuleEditorDrawer |
| evaluation_service | EvaluationList, EvaluationDetail, RunEvaluationModal |
| review_service | ReviewQueue, ReviewDetail |
| exception_service | ExceptionManagement |
| report_service | GovernanceReports |
| 聚合查询 | GrcDashboard |

---

## 附录 A：新增文件清单

### 后端

```
app/api/routes/grc.py                        # 路由层（57 端点）
app/services/grc/__init__.py                  # 服务包
app/services/grc/policy_service.py            # 规则+画像服务
app/services/grc/evaluation_service.py        # 评估引擎
app/services/grc/rule_evaluators.py           # 内置评估器
app/services/grc/json_logic.py                # JSON Logic 自定义规则
app/services/grc/review_service.py            # 审批服务
app/services/grc/exception_service.py         # 例外管理
app/services/grc/audit_service.py             # 防篡改审计链
app/services/grc/report_service.py            # 报表服务
app/services/grc/release_gate.py              # 上线门禁
app/services/grc/post_deploy_service.py       # 上线监控
app/alembic/versions/a1b2c3d4e5f6_add_grc_tables.py       # 迁移 1
app/alembic/versions/b2c3d4e5f6a7_sync_grc_schema.py      # 迁移 2
scripts/grc_data_governance.py                # 数据治理脚本
scripts/grc_audit_hash_migrate.py             # 审计哈希修复脚本
scripts/seed_grc_dashboard.py                 # 种子数据脚本
tests/services/test_grc_p3.py                 # P3 测试
tests/services/test_grc_p4.py                 # P4 测试
```

### 前端

```
apps/admin-web/src/pages/grc/GrcDashboard.tsx          # 仪表盘
apps/admin-web/src/pages/grc/RuleLibrary.tsx            # 规则库
apps/admin-web/src/pages/grc/RuleDetail.tsx             # 规则详情
apps/admin-web/src/pages/grc/RuleEditorDrawer.tsx       # 规则编辑
apps/admin-web/src/pages/grc/RuleTemplatePicker.tsx     # 模板选择
apps/admin-web/src/pages/grc/ruleTemplates.ts           # 模板数据
apps/admin-web/src/pages/grc/RuleTestPanel.tsx          # 试运行
apps/admin-web/src/pages/grc/EvaluationList.tsx         # 评估历史
apps/admin-web/src/pages/grc/EvaluationDetail.tsx       # 评估详情
apps/admin-web/src/pages/grc/RunEvaluationModal.tsx     # 运行评估
apps/admin-web/src/pages/grc/ReviewQueue.tsx            # 审批队列
apps/admin-web/src/pages/grc/ReviewDetail.tsx           # 审批详情
apps/admin-web/src/pages/grc/ExceptionManagement.tsx    # 例外管理
apps/admin-web/src/pages/grc/GovernanceReports.tsx      # 治理报表
apps/admin-web/src/api/grc.ts                           # API 封装
packages/api/src/admin/grc.ts                           # 共享 API 定义
```

## 附录 B：被改动既有文件清单

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `app/api/main.py:44` | 修改 | 添加 `include_router(grc.router)` |
| `app/services/task_factory_service.py:955-998` | 修改 | Agent sandbox→running 晋升流程接入 GRC release_gate（硬阻断） |
| `app/services/rbac_seed_service.py:50-219` | 修改 | 新增 24 权限码 + 4 角色（grc_admin/reviewer/auditor/risk_owner）+ 1 菜单项 |
| `app/models.py:1614-2150` | 修改 | 新增 6 个枚举 + 12 个表模型 + 大量 DTO/Public schema |
| `apps/admin-web/src/router/routes.tsx:202-325` | 修改 | 新增 9 个 GRC 路由配置（7 个入菜单 + 2 个详情页 hideInMenu） |
| `apps/admin-web/src/i18n/resources/{zh-CN,en-US,ar}/routes.ts` | 修改 | 新增 ~16 行 routes.grc.* key |
| `apps/admin-web/src/i18n/resources/{zh-CN,en-US,ar}/pages.ts` | 修改 | 新增 ~370 个 pages.grc.* key |
| `packages/api/src/admin/index.ts` | 修改 | `export * from './grc.js'` |

---

*本文档基于 `2026-07-15` 的代码版本生成。如有新变更请同步更新。*
