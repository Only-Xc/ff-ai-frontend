# 样式与产品适配

用途：处理样式来源、管理端信息密度、产品视觉适配和视觉效果收敛。

读取信号：style source、Tailwind、antd-style、admin UI、visual cleanup、product visual fit。

关联 topic：`third-party-components`、`layout-measurement`。

## 经验

### EXP-STYLE-001 样式来源跟随组件边界

- 触发：新增或调整页面布局、普通 DOM 样式、AntD 内部结构样式、token 联动或第三方组件覆盖。
- 经验：普通页面结构使用 Tailwind；AntD 内部结构、token 联动和第三方覆盖使用 `antd-style` 或局部样式封装。
- 检查：目标是普通 DOM 还是组件内部 DOM；token 是否参与；className 是否能到达目标节点；样式是否越过组件边界。
- 关联：第三方内部覆盖读 `third-party-components`。

### EXP-STYLE-002 移除视觉效果时清理来源

- 触发：移除或弱化渐变、阴影、毛玻璃、装饰背景、主题色字段或视觉特效。
- 经验：同步清理 token、CSS 条件样式、主题字段和组件入参，让样式来源与当前视觉保持一致。
- 检查：gradient/shadow/glass token；未使用 className；主题配置字段；组件 props；暗色/亮色条件样式。
- 关联：第三方 token 或内部样式读 `third-party-components`。

### EXP-STYLE-003 管理端优先信息密度

- 触发：优化管理端、运营台、数据看板、配置页、审批页或高频工作流页面。
- 经验：优先保证信息密度、层级清晰、状态色稳定、数字易扫和主操作可达。
- 检查：表格和卡片密度；数字对齐；状态色语义；筛选区收纳；主次操作层级；窄屏可读性。
- 关联：布局密度影响滚动容器读 `layout-measurement`。

### EXP-STYLE-004 管理端 Apple 风格服务业务效率

- 触发：用户明确要求管理端、运营页面或业务工具呈现 Apple 风格。
- 经验：用细边框、轻阴影、半透明层级、清晰排版和自然动效表达质感，同时保持管理端扫描效率。
- 检查：边框层级；阴影强度；透明背景可读性；间距密度；操作按钮可见性；表格和表单效率。
- 关联：第三方组件视觉适配读 `third-party-components`；布局密度读 `layout-measurement`。

### EXP-STYLE-005 管理端滚动页收敛毛玻璃

- 触发：管理端页面上下滚动出现闪烁、白闪、抖动、重绘卡顿，且页面内存在 `backdrop-filter`、`backdrop-blur`、透明渐变或多层透明背景。
- 经验：滚动内容区域优先使用实体背景、细边框和轻阴影；大面积卡片、图表、表格、代码块和详情面板移除毛玻璃效果，并使用页面级样式处理，保持应用级 Layout 样式稳定。
- 检查：滚动区域内 blur/透明背景；卡片背景是否为实体色；阴影和 hover transition 强度；暗色/浅色主题可读性；变更范围是否限制在页面级。
- 关联：滚动容器和绘制边界读 `layout-measurement`。
