# 状态与数据流

用途：处理分页、筛选、排序、派生状态、前端分页、业务映射和统计口径。

读取信号：pagination、filters、derived state、client pagination、mapping、stats source。

关联 topic：`docs-to-implementation`、`layout-measurement`。

## 经验

### EXP-STATE-001 共享分页返回稳定对象

- 触发：分页状态、分页回调或分页默认值出现在多个页面、hook 或表格封装中。
- 经验：共享分页能力返回一个稳定对象，默认 page/pageSize 和 reset 行为由 hook 内部管理。
- 检查：page；pageSize；total；onChange；reset；默认值；调用方业务差异；对象引用稳定性。
- 关联：分页组件布局读 `layout-measurement`。

### EXP-STATE-002 结果集变化回到第一页

- 触发：筛选条件、搜索词、Tab、排序、pageSize 或数据范围改变列表结果集。
- 经验：结果集语义变化后回到第一页；同一查询条件下的刷新保留当前页。
- 检查：筛选变化；搜索提交；Tab 切换；排序变化；pageSize 变化；刷新按钮；查询对象比较方式。
- 关联：规格定义分页规则读 `docs-to-implementation`。

### EXP-STATE-003 前端分页固定派生顺序

- 触发：接口一次返回完整候选列表，页面本地执行筛选、排序、分组或分页展示。
- 经验：保留完整数据源，按筛选、排序、分组、分页的固定顺序派生当前页数据。
- 检查：完整数据源；筛选结果；排序规则；分页切片；Tab 切换；刷新后数据替换；当前页越界。
- 关联：大列表性能读 `layout-measurement`。

### EXP-STATE-004 业务映射建立单一来源

- 触发：状态、分组、泳道、阶段、类型等业务映射同时影响查询参数、筛选 options、看板列、统计或展示文案。
- 经验：建立标准业务映射单一来源，再派生查询结构、筛选选项、展示文案、颜色和统计。
- 检查：标准 key；接口值映射；UI options；统计口径；颜色和文案；新增状态的修改位置。
- 关联：规格定义状态流转读 `docs-to-implementation`。
