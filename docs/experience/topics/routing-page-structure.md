# 路由与页面结构

用途：处理路由级页面、目录层级、导航元信息、菜单、面包屑和 `navKey`。

读取信号：route page、page directory、navigation metadata、sidebar、breadcrumb、navKey。

关联 topic：`docs-to-implementation`、`abstraction-boundaries`。

## 经验

### EXP-ROUTE-001 独立任务页面使用独立路由

- 触发：新增详情页、看板页、编辑页、配置页，或将页面提升为可直达任务入口。
- 经验：拥有独立 URL、刷新恢复、权限或面包屑语义的任务页面使用独立路由承载生命周期。
- 检查：URL 参数；权限和路由 meta；浏览器刷新；面包屑；父页面返回路径。
- 关联：页面规格读 `docs-to-implementation`。

### EXP-ROUTE-002 页面入口放在目录根层

- 触发：新增页面目录、路由级页面组件和页面局部 UI 片段。
- 经验：路由组件放页面目录根层；局部 UI 放 `components`；非渲染逻辑放同层职责目录。
- 检查：路由导入位置；页面入口文件名；筛选区、表格行、弹窗片段归属；utils/constants/hooks/types。
- 关联：页面模块边界读 `abstraction-boundaries`。

### EXP-ROUTE-003 可见页面同步导航元信息

- 触发：新增侧边栏可见页面、调整隐藏路由可见性，或改变页面所属导航层级。
- 经验：同步 URL 层级、菜单排序、侧边栏高亮、`navKey`、面包屑策略和 i18n 标题。
- 检查：路由路径；菜单配置；`navKey`；父级高亮；面包屑；中英文标题；权限可见性。
- 关联：页面规格读 `docs-to-implementation`。
