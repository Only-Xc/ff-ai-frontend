# admin-web 设计风格与 Layout 规格

## 背景

`apps/admin-web` 是 AI 应用平台的管理端应用，基于 Vite、React、React Router、Ant Design 6、Tailwind CSS utilities、antd-style 和 Zustand 构建。

当前管理端已经形成一套稳定的深浅色主题、应用骨架、侧边栏导航、页面标题区和基础交互模式。本规格从现有实现中抽离可复用规则，用于后续管理端页面、相邻应用或设计文档对齐。

## 目标

- 抽离当前 `admin-web` 的视觉语言，包括颜色、字体、背景、边框、状态色和组件基调。
- 抽离当前应用级 Layout，包括顶栏、侧边栏、内容区、移动抽屉和页面壳层。
- 抽离路由元信息驱动导航、面包屑和页面标题的规则。
- 记录系统公告相关实现的当前检索结果。
- 保持规格与当前代码一致，避免加入尚未落地的功能能力。

## 技术与依赖基线

`admin-web` 使用以下前端栈：

- React 与 React DOM。
- React Router 7，使用 `BrowserRouter` 和 `useRoutes`。
- Ant Design 6，使用中文 locale 和主题算法。
- Tailwind CSS v4 utilities，关闭 Preflight，只引入 `theme.css` 和 `utilities.css`。
- `antd-style` 管理 Ant Design 组件覆盖样式。
- Zustand 管理主题模式和侧边栏折叠状态。
- `@ff-ai-frontend/utils` 提供浏览器 `local` 存储封装。

## 设计风格

### 主题模式

主题通过 `document.documentElement.dataset.theme` 驱动，取值为：

```ts
type ThemeMode = 'light' | 'dark'
```

初始主题读取顺序：

1. 从 local storage 读取 `ff-admin-theme-mode`。
2. 根据 `window.matchMedia('(prefers-color-scheme: dark)')` 选择系统偏好。

主题切换由 Header 中的圆形 icon 按钮触发，并通过 Zustand 写回 local storage。

### 应用品牌

应用标题和主色集中在 `src/config/defaultSettings.ts`：

```ts
export const defaultSettings = {
  title: 'AI 应用平台',
  colorPrimary: '#6b43f7',
}
```

Logo 区由三角形 SVG 图标、中文品牌名和英文副标题组成：

- 中文品牌名：`AI 应用平台`
- 英文副标题：`AI APP PLATFORM`
- 图标颜色：`var(--primary)`

### 颜色变量

全局颜色变量定义在 `src/index.css`。暗色主题作为 `:root` 和 `[data-theme='dark']` 默认值，浅色主题通过 `[data-theme='light']` 覆盖。

核心语义变量：

```css
--bg: var(--admin-bg);
--panel: var(--admin-panel);
--card: var(--admin-card);
--border: var(--admin-border);
--border-strong: var(--admin-border-strong);
--primary: var(--admin-primary);
--primary-hover: var(--admin-primary-2);
--text: var(--admin-text);
--text-strong: #ffffff;
--muted: var(--admin-text-muted);
--dark-text: var(--admin-text-subtle);
--green: var(--admin-success);
--blue: var(--admin-info);
--purple: #8b5cf6;
--orange: var(--admin-warning);
```

暗色主题主基调：

- 页面背景：`#0a0c10`
- 面板背景：`#12141d`
- 卡片背景：`#161823`
- 边框：`#262936`
- 主色：`#6b43f7`
- 正文：`#e2e8f0`
- 次级文本：`#8b93a5`

浅色主题主基调：

- 页面背景：`#f5f7fb`
- 面板与卡片背景：`#ffffff`
- 边框：`#e5e7ef`
- 主色：`#6b43f7`
- 正文：`#1f2937`
- 次级文本：`#596377`

状态色：

- 成功：暗色 `#2dd4bf`，浅色 `#0f9f8f`
- 信息：暗色 `#3b82f6`，浅色 `#2563eb`
- 警告：暗色 `#f59e0b`，浅色 `#d97706`
- 危险：暗色 `#ef4444`，浅色 `#dc2626`

### 字体与全局基础样式

页面根节点规则：

- `html`、`body`、`#root` 高度为 `100%`。
- `body` 背景使用 `var(--bg)`，文本使用 `var(--text)`。
- `body` 禁止横向溢出。
- 字体栈优先使用 `Inter`，并回退到系统 UI 字体。
- 开启 `optimizeLegibility`、`-webkit-font-smoothing` 和 `-moz-osx-font-smoothing`。
- 滚动条使用 `var(--scrollbar-thumb)`，宽度为浏览器 thin 模式。

### Ant Design 主题

`AppProvider` 使用 `ConfigProvider` 包裹应用，并应用：

- `locale: zhCN`
- 暗色主题：`theme.darkAlgorithm`
- 浅色主题：`theme.defaultAlgorithm`
- `token.colorPrimary: '#6b43f7'`
- `components.Layout.headerHeight: 60`

Ant Design 组件负责基础组件状态和交互。Tailwind utilities 负责布局、间距、尺寸和少量局部视觉辅助。

## Layout 结构

### 应用根布局

`AppLayout` 使用 Ant Design `Layout` 组成三层结构：

```text
Layout
  Layout.Header
    Header
  Layout hasSider
    sidebar placeholder
    Layout.Sider
      Sidebar
      sidebar collapse trigger
    Layout.Content
      page shell
        PageShellHeader
        main
          Outlet
  Drawer
    Sidebar
```

顶层 `Layout` 使用 `min-h-full`，保证占满根容器高度。

### Header

Header 高度由 Ant Design Layout token 控制，为 `60px`。

布局规则：

- `Layout.Header` sticky 固定在页面顶部。
- `top: 0`，`zIndex: 9`，宽度 `100%`。
- Header 背景透明，由内部 header 使用 `backdrop-blur-sm` 形成玻璃感。
- 内部 header 左侧展示 Logo，右侧展示主题切换、头像和用户信息。
- 主题切换按钮使用圆形 Ant Design `Button` 和 Tooltip。
- 暗色模式显示 `SunOutlined`，浅色模式显示 `MoonOutlined`。

用户信息当前为静态展示：

- 头像文本：`张`
- 用户名：`张三`
- 角色：`企业管理员`

### Sidebar

Sidebar 有展开和折叠两种宽度：

```ts
const SIDEBAR_WIDTH = 220
const SIDEBAR_COLLAPSED_WIDTH = 63
```

布局规则：

- `Layout.Sider` 为 fixed 定位。
- 顶部从 `var(--ant-layout-header-height)` 开始。
- 高度为 `calc(100% - var(--ant-layout-header-height))`。
- 背景透明。
- 滚动条默认透明，hover 后显示。
- 宽度和 flex-basis 使用 `160ms ease` 过渡。
- 通过一个同宽占位元素撑开 Content 区域。

折叠按钮规则：

- 使用圆形 Ant Design `Button`。
- 展开态图标为 `MenuFoldOutlined`。
- 折叠态图标为 `MenuUnfoldOutlined`。
- 固定在侧边栏右边缘附近，`bottom: 20`。
- Tooltip 文案随状态切换：`收起侧边栏` / `展开侧边栏`。

侧边栏状态通过 Zustand 存储：

- storage key：`ff-admin-sidebar-collapsed`
- 默认值：`false`
- 切换后写入 local storage。

### 移动抽屉

`AppLayout` 预留移动菜单抽屉：

- 使用 Ant Design `Drawer`。
- 位置为左侧。
- `size: 280`。
- body padding 为 `0`。
- body 背景为 `var(--panel)`。
- header 隐藏。
- Drawer 内复用同一个 `Sidebar` 组件。
- 导航点击后执行 `onNavigate` 关闭抽屉。

当前 Header 中移动端菜单按钮处于注释状态，抽屉能力保留在布局层。

### Content

Content 区规则：

- 最小高度：`calc(100vh - var(--ant-layout-header-height))`。
- 外层 padding：`0 10px 10px 0px`。
- 内层 page shell 使用：
  - 高度：`h-full`
  - 宽度：`w-full`
  - padding：`px-8 pb-10 pt-6`
  - 背景：`bg-(--ant-color-bg-container)`
  - 圆角：`rounded-md`

page shell 内部先渲染 `PageShellHeader`，再渲染页面主内容 `Outlet`。

### BareLayout

`BareLayout` 只渲染 `Outlet`。它用于 `handle.layout === false` 的路由，例如 404 页面。

## 路由、导航与页面标题

### 路由元信息

路由对象扩展 `handle` 字段：

```ts
export interface RouteMeta {
  title?: string
  icon?: ReactNode
  layout?: boolean
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  navGroup?: string
  navKey?: string
  navOrder?: number
}
```

元信息用途：

- `title`：页面标题、导航标题、面包屑标题和 document title。
- `icon`：侧边栏导航图标。
- `layout: false`：使用 `BareLayout`。
- `hideInMenu`：从侧边栏隐藏。
- `hideInBreadcrumb`：从面包屑隐藏。
- `navGroup`：侧边栏分组名称。
- `navKey`：侧边栏唯一 key。
- `navOrder`：同组排序。

### Layout 路由拆分

路由入口按 `handle.layout` 拆分：

- `handle.layout === false` 的路由挂载到 `BareLayout`。
- 其他路由挂载到 `AppLayout`。

根路径 `/` 重定向到 `/usage`。

### 侧边栏导航生成

`buildNavGroups(appRoutes)` 从路由配置收集导航项。

收集规则：

- 路由包含 `handle.title` 和 `handle.navGroup` 时进入导航候选。
- `handle.hideInMenu` 为 true 时跳过。
- 路径支持父子拼接，子路由路径继承父路径。
- 每个导航项包含 `group`、`key`、`label`、`path`、`icon` 和 `order`。
- 同一分组内按 `navOrder` 升序排列。

当前导航分组包括：

- 工作空间：工作台、应用生成、我的工单。
- 业务管理：我的应用、我的看板、应用数据。
- 平台管理：用量与余额、设置。

### 侧边栏选中态

`getActiveNavKey(pathname, navGroups)` 先查找精确路径匹配，再查找最长父路径匹配。

选中态样式：

- 背景：`color-mix(in srgb, var(--admin-primary) 10%, transparent)`。
- 文本：`var(--text-strong)`。
- 字重：`600`。
- 图标：`var(--admin-primary)`。
- 左侧显示 2px 主色竖条，高度 18px，圆角 999。

hover 样式：

- 背景：`color-mix(in srgb, var(--admin-primary) 6%, transparent)`。
- 文本：`var(--text-strong)`。

折叠态规则：

- 隐藏分组标题。
- 分组间距缩小。
- item 宽度保持 `100%`。

### 面包屑与页面标题

`PageShellHeader` 根据当前 pathname 读取：

- `getCurrentRouteMeta(appRoutes, location.pathname)`
- `buildBreadcrumbs(appRoutes, location.pathname)`

标题规则：

- 默认标题为 `用量与余额`。
- 当前路由有标题时使用当前路由标题。
- document title 格式为：`{当前标题} - AI 应用平台`。
- 当前路由缺少标题时使用 `AI 应用平台`。

副标题规则：

- 标题为 `用量与余额` 时：`查看资源消耗、套餐额度、账单与余额`。
- 其他标题时：`查看平台任务、应用和资源状态`。

页面操作区当前包含：

- 主按钮：`充值`，图标 `CreditCardOutlined`。
- 下拉按钮：`更多操作`，图标 `MoreOutlined`。
- 下拉菜单项：`升级套餐`、`下载账单`。

## 组件职责

`AppProvider`：

- 注入 Ant Design locale 和主题。
- 同步 `data-theme`。
- 提供 Ant Design `App` 容器。

`AppRouter`：

- 创建 `BrowserRouter`。
- 根据路由元信息选择 `AppLayout` 或 `BareLayout`。

`AppLayout`：

- 组合 Header、Sidebar、Content、Drawer 和页面 Outlet。
- 管理移动抽屉打开状态。
- 计算当前侧边栏选中项。
- 同步 document title。

`Header`：

- 展示 Logo。
- 展示主题切换按钮。
- 展示当前用户静态信息。

`Sidebar`：

- 接收导航分组、激活 key 和折叠状态。
- 渲染 Ant Design `Menu`。
- 点击菜单后执行路由跳转。

`layoutNav`：

- 从路由元信息生成侧边栏分组。
- 根据当前 pathname 计算激活导航项。

`PageShellHeader`：

- 生成面包屑。
- 展示页面标题、副标题和操作区。

`useAppStore`：

- 管理主题模式。
- 管理侧边栏折叠状态。
- 持久化主题和侧边栏偏好。

## 系统公告当前状态

对 `apps/admin-web/src` 和 `apps/admin-web/README.md` 执行以下关键词检索：

```bash
rg -n "公告|announcement|notice|notification|banner|message|alert|系统" apps/admin-web/src apps/admin-web/README.md
```

当前检索结果数量为 0。

当前代码中可确认的公告相关状态：

- 公告组件数量：0。
- 公告路由数量：0。
- 公告 store 状态数量：0。
- 公告 API 调用数量：0。
- 顶栏公告入口数量：0。
- 页面公告横幅数量：0。

本规格只记录当前实现状态。公告能力的组件形态、交互、数据结构、接口和权限策略由后续明确需求驱动。

## 验收标准

- 另一个工程师可以根据本文档复刻当前 `admin-web` 的主题基调、色彩语义、字体规则和 Ant Design 主题配置。
- 另一个工程师可以根据本文档复刻当前 `admin-web` 的 Header、Sidebar、Content、PageShellHeader 和 BareLayout 结构。
- 另一个工程师可以根据本文档理解路由元信息如何驱动导航、面包屑、页面标题和 document title。
- 文档中的变量名、组件名、storage key、路由元信息字段与当前代码一致。
- 系统公告章节只记录当前检索结果和实现状态。

## 验证方式

文档完成后执行：

```bash
rg -n "公告|announcement|notice|notification|banner|message|alert|系统" apps/admin-web/src apps/admin-web/README.md
pnpm --filter @ff-ai-frontend/admin-web typecheck
```

人工检查：

- 设计风格章节包含暗色、浅色、主色、文本、边框、背景和字体。
- Layout 章节包含 Header、Sidebar、Content、PageShellHeader 和 BareLayout。
- 公告章节记录检索结果数量。
- 文档只抽离当前 `admin-web` 已有实现。
