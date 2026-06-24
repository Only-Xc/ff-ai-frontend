# 布局与测量

用途：处理高度链路、滚动容器、测量时机、虚拟列表和布局回归。

读取信号：height chain、scroll container、measurement timing、hidden container、virtual list、layout regression。

关联 topic：`third-party-components`、`state-data-flow`。

## 经验

### EXP-LAYOUT-001 页面滚动先确定边界

- 触发：调整页面高度、滚动容器、表格高度、看板泳道、侧栏或主内容区域尺寸。
- 经验：先确定页面的主要滚动容器，再打通父子高度链路和 flex 收缩边界。
- 检查：根容器高度；`min-h-0`/`min-height: 0`；flex 子项收缩；`overflow` 所属节点；列表容器尺寸。
- 关联：AntD Table 内部滚动读 `third-party-components`。

### EXP-LAYOUT-002 测量型组件等待可见容器

- 触发：表格、图表、虚拟列表或测量型组件放在 Tabs、Collapse、Drawer、Modal 等初始隐藏容器中。
- 经验：首次测量放到容器可见后，或在可见状态变化后触发 resize/重新测量。
- 检查：初始尺寸是否为 0；挂载时机；ResizeObserver；Tab 切换、Drawer/Modal 打开后的重算路径。
- 关联：组件测量 API 读 `third-party-components`。

### EXP-LAYOUT-003 大列表使用成熟滚动方案

- 触发：列表数据量大、行高动态、滚动卡顿、需要行复用或滚动位置恢复。
- 经验：优先使用项目已有虚拟滚动能力或成熟库；业务层只管理数据、稳定 key、item 渲染和容器尺寸。
- 检查：已有依赖；item key；动态高度测量；空列表；数据插入删除；滚动容器高度。
- 关联：筛选分页影响数据切片读 `state-data-flow`。

### EXP-LAYOUT-004 布局修复覆盖真实交互状态

- 触发：布局修改影响表格、列表、Tabs、分页、fixed column、筛选栏或抽屉弹层。
- 经验：按真实操作路径验证相关交互状态。
- 检查：少量数据；大量数据；横向滚动；fixed column；Tab 切换；分页切换；筛选栏展开收起。
- 关联：分页和筛选状态读 `state-data-flow`；Table 几何读 `third-party-components`。

### EXP-LAYOUT-005 滚动闪烁先隔离页面绘制

- 触发：滚动时整页闪烁、白闪、局部面板反复重绘，尤其是代码块、图表、表格和详情面板混排页面。
- 经验：先确认主滚动容器，再在页面级卡片、代码块、图表 body 和可滚动面板上使用 `contain: paint`、实体背景、稳定高度和 `scrollbar-gutter: stable`，减少重绘扩散和滚动条抖动。
- 检查：主滚动容器；内层滚动容器数量；`contain: paint` 作用节点；滚动条占位；图表/代码块/表格高度稳定性。
- 关联：视觉效果收敛读 `styling-product-fit`；表格几何读 `third-party-components`。
