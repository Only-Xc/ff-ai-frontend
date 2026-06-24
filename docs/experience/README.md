# 企业经验库

这是 AI 编码任务的轻量经验库。目标是稳定召回、少读文件、少消耗 token。

## 读取方式

1. 先读本文件。
2. 根据任务选择 1 个主 topic。
3. 只读命中的 topic 文件。
4. 跨领域任务最多再读 1 个关联 topic。
5. 最终汇报可列出已应用的经验 ID。

## 读取预算

| 任务复杂度 | 读取范围 |
| --- | --- |
| 小改动 | 本文件 + 1 个 topic |
| 跨文件改动 | 本文件 + 1 个主 topic + 1 个关联 topic |
| 审查或方案 | 本文件 + 相关 topic，按风险展开 |
| 维护经验库 | 本文件 + `authoring.md` + 被修改 topic |

## Topic 路由

| Topic | 读取信号 |
| --- | --- |
| `topics/docs-to-implementation.md` | 用户给了文档、规格、设计目标、验收条件，或要求按参考页面实现 |
| `topics/routing-page-structure.md` | 新增页面、路由、菜单、面包屑、`navKey`、页面目录结构 |
| `topics/state-data-flow.md` | 分页、筛选、排序、派生状态、前端分页、状态映射、统计口径 |
| `topics/third-party-components.md` | AntD 或第三方组件 API、Table、Form、Modal、Select、token、样式覆盖 |
| `topics/layout-measurement.md` | 高度、滚动容器、虚拟列表、Tabs/Drawer/Modal 内测量、布局回归 |
| `topics/styling-product-fit.md` | Tailwind、antd-style、管理端视觉、信息密度、产品风格适配 |
| `topics/abstraction-boundaries.md` | wrapper、hook、共享组件、页面模块分层、公共工具、复用边界 |
| `topics/verification-reporting.md` | dirty worktree、验证失败归因、mock 主流程、最终汇报 |

## 使用原则

- 以任务信号选 topic，以经验 ID 做检查点。
- 经验只覆盖稳定、可复用的工程判断。
- 读取关联 topic 需要当前任务真实触发关联领域。
- 新经验优先补到已有 topic；新增 topic 需要有独立高频场景。
