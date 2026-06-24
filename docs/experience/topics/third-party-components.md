# 第三方组件

用途：处理 AntD 和其他第三方组件的 API、token、内部结构、样式覆盖和 Table 行为。

读取信号：third-party component、AntD API、component token、style override、AntD Table behavior。

关联 topic：`layout-measurement`、`styling-product-fit`、`abstraction-boundaries`。

## 经验

### EXP-THIRD-001 组件异常先核对输入契约

- 触发：AntD 或其他第三方组件出现展示异常、交互失效、受控状态异常或样式偏移。
- 经验：先核对项目传入的 props、派生值、token、父级容器和 wrapper 转换，再决定组件内部覆盖方案。
- 检查：受控 props；数据结构和 key/value；派生默认值；ConfigProvider/token；父级布局约束；wrapper 是否改写原生契约。
- 关联：wrapper 契约读 `abstraction-boundaries`；布局尺寸读 `layout-measurement`。

### EXP-THIRD-002 Table 滚动问题先看几何关系

- 触发：AntD Table 出现横向滚动、fixed column、列宽错位、右侧空白、滚动条背景或操作列挤压问题。
- 经验：先核对列宽总和、`scroll.x`、fixed 列宽和容器尺寸，再处理内部 DOM 样式。
- 检查：所有列 `width`；操作列内容最小宽度；fixed 列宽；`scroll.x` 与列宽总和；分页和表格容器宽度。
- 关联：容器高度和滚动边界读 `layout-measurement`。

### EXP-THIRD-003 样式覆盖使用最小作用域

- 触发：第三方组件需要调整内部间距、颜色、状态样式、弹层或 token 联动效果。
- 经验：先使用公开 props、token、className 和 style；内部 DOM 覆盖限定在目标组件根节点作用域内。
- 检查：公开 API 是否满足；token 是否已有对应项；选择器是否绑定局部根 class；hover、disabled、error 状态。
- 关联：产品视觉取舍读 `styling-product-fit`；封装层样式透传读 `abstraction-boundaries`。
