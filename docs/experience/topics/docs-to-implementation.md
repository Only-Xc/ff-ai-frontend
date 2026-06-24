# 文档到实现

用途：把用户文档、页面规格、参考页面和验收条件转成实现约束。

读取信号：docs-first implementation、page spec、reference page、CRUD spec、acceptance criteria。

关联 topic：`state-data-flow`、`routing-page-structure`、`styling-product-fit`。

## 经验

### EXP-DOCS-001 实现遵循最新规格

- 触发：用户先给出文档、设计稿、规格或验收说明，随后要求实现或修改代码。
- 经验：编码前重新读取最新规格，把布局、接口、状态和验收点作为实现输入。
- 检查：文档更新时间；目标模块；接口字段；状态流转；验收条件；旧实现差异。
- 关联：分页筛选读 `state-data-flow`；页面路由读 `routing-page-structure`。

### EXP-DOCS-002 参考对象先识别职责层级

- 触发：用户要求参考某个既有页面、组件、目录或交互实现。
- 经验：先判断参考对象属于路由外壳、页面入口、核心交互组件、数据 hook 还是样式片段，再复用同层级模式。
- 检查：参考文件职责；数据获取位置；核心交互位置；路由和导航元信息；样式来源。
- 关联：结构边界读 `abstraction-boundaries`。

### EXP-DOCS-003 页面规格写到可执行层级

- 触发：编写、补全或实现 CRUD、列表、详情、表单、看板等页面规格。
- 经验：规格覆盖布局、接口、状态、筛选分页、表格列、表单校验、操作反馈和异常态。
- 检查：页面结构；API 字段；状态流转；筛选分页规则；权限；loading、empty、error 和成功反馈。
- 关联：状态规则读 `state-data-flow`；可见页面读 `routing-page-structure`。
