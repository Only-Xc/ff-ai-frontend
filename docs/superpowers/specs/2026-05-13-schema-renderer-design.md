# SchemaRenderer 页面级渲染器设计规格

## 背景

`SchemaRenderer` 是面向 AI 生成页面的独立 React 渲染组件，用于承载 LLM 生成的页面级 `PageSchema`，把结构化 JSON 渲染为可嵌入任意业务容器的 React 页面。

该能力面向 AI 生成场景：前端提前封装稳定的组件积木，LLM 只生成受控 schema，渲染器负责校验、分发和兜底展示。

## 目标

- 提供页面级 `PageSchema` 渲染能力。
- 提供固定组件注册表，支持布局、卡片、Markdown、指标、表格和图表。
- 支持静态数据注入，图表、指标、表格数据来自 `node.props`。
- 提供 schema 校验和错误兜底，单个节点异常时保留其他节点渲染。
- 提供清晰的组件输入输出契约，调用方负责 schema 来源、持久化和业务容器集成。

## 后续范围

- `dataSourceUrl` 动态懒加载。
- `ApiSandbox` 接口测试组件。
- 表单提交、按钮动作、组件联动和条件渲染。
- 用户自定义组件注册。
- 多页面应用 schema 和路由生成。

## 架构总览

```text
PageSchema JSON
  -> SchemaRenderer 接收 schema
  -> validateSchema 校验结构和组件约束
  -> renderNode 递归渲染页面
  -> ComponentRegistry 分发白名单组件
  -> AntD / ECharts / XMarkdown 组件适配层
```

第一版采用受控 `PageSchema` 渲染器。渲染器只接收标准 JSON AST，React 实现集中在组件适配层。业务侧通过 props 传入 schema，并自行决定 schema 的生成、提取、保存和展示位置。

## 目录结构

新增目录放在 `apps/user-web/src/features/schema-renderer`：

```text
schema-renderer/
  index.ts
  types.ts
  constants.ts
  SchemaRenderer.tsx
  registry/
    componentRegistry.tsx
  runtime/
    validateSchema.ts
    renderNode.tsx
    normalizeProps.ts
  components/
    GridLayout.tsx
    PanelCard.tsx
    MarkdownBlock.tsx
    MetricStatistic.tsx
    DataTable.tsx
    LineChart.tsx
    PieChart.tsx
    RenderErrorBlock.tsx
```

## Schema 模型

```ts
export interface PageSchema {
  schemaVersion: '1.0'
  page: {
    title?: string
    description?: string
    children: SchemaNode[]
  }
}

export interface SchemaNode {
  id: string
  component: RegisteredComponentName
  props?: Record<string, unknown>
  children?: SchemaNode[]
}

export type RegisteredComponentName =
  | 'GridLayout'
  | 'PanelCard'
  | 'MarkdownBlock'
  | 'MetricStatistic'
  | 'DataTable'
  | 'LineChart'
  | 'PieChart'
```

规则：

- `schemaVersion` 固定为 `1.0`。
- `id` 必填，用作 React key 和错误定位标识。
- `component` 必须来自注册表。
- `children` 只允许用于 `GridLayout` 和 `PanelCard`。
- `props` 只传给组件适配层，适配层负责默认值和容错。
- 第一版 schema 使用静态数据，表格和图表数据直接写入 `props.data`。

## 组件注册表

注册表维护组件名到 React 实现的白名单映射。

```ts
export interface RegistryItem<TProps = Record<string, unknown>> {
  name: RegisteredComponentName
  acceptsChildren: boolean
  render: (ctx: {
    node: SchemaNode
    props: TProps
    children?: React.ReactNode
  }) => React.ReactNode
}
```

渲染分发：

```text
SchemaRenderer
  -> validateSchema(schema)
  -> schema.page.children.map(renderNode)
  -> renderNode 根据 node.component 查 registry
  -> registry item 接收 { node, props, children }
  -> 组件适配层渲染 AntD / ECharts / XMarkdown
```

## 组件 Props 契约

### GridLayout

```ts
interface GridLayoutProps {
  columns?: 24
  gutter?: number | [number, number]
  span?: number[]
}
```

`children` 按顺序渲染到 AntD `Col`。`span[index]` 缺省时使用 `24`。移动端使用全宽布局。

### PanelCard

```ts
interface PanelCardProps {
  title?: string
  bordered?: boolean
  size?: 'default' | 'small'
}
```

基于 AntD `Card`，用于承载子节点。

### MarkdownBlock

```ts
interface MarkdownBlockProps {
  content: string
}
```

使用当前项目已有 `@ant-design/x-markdown` 渲染 Markdown 内容。HTML 内容由 Markdown 渲染层按安全规则处理。

### MetricStatistic

```ts
interface MetricStatisticProps {
  title: string
  value: string | number
  prefix?: string
  suffix?: string
  precision?: number
  status?: 'success' | 'warning' | 'error' | 'default'
}
```

基于 AntD `Statistic`。`status` 映射为指标值颜色。

### DataTable

```ts
interface DataTableProps {
  columns: Array<{
    title: string
    dataIndex: string
    width?: number
  }>
  data: Array<Record<string, string | number | boolean | null>>
  pagination?: boolean | {
    pageSize?: number
  }
}
```

基于 AntD `Table`。`rowKey` 优先使用行数据 `id` 字段，缺省时使用行索引。第一版只消费静态 `data`。

### LineChart

```ts
interface LineChartProps {
  data: Array<Record<string, string | number>>
  xAxisKey: string
  series: Array<{
    dataKey: string
    name?: string
  }>
  height?: number
}
```

基于 ECharts React 封装，支持多条折线。

### PieChart

```ts
interface PieChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
}
```

基于 ECharts React 封装，支持静态饼图。

## LLM 输出规范

LLM 生成时使用以下约束：

- 输出内容为 `PageSchema` JSON。
- `schemaVersion` 固定为 `1.0`。
- `component` 从组件注册表中选择。
- 每个节点提供稳定 `id`。
- `children` 只用于 `GridLayout` 和 `PanelCard`。
- 第一版数据全部通过静态 `props.data` 注入。
- 安全字段交给校验层拦截，包括 `script`、`style`、`html`、`dangerouslySetInnerHTML`、`onClick`、`dataSourceUrl`。

## 校验策略

校验分两层执行。

结构校验：

- `schemaVersion === '1.0'`。
- `page.children` 为数组。
- `node.id` 为非空字符串。
- `node.component` 命中注册表。
- `children` 只出现在容器组件。
- 树深度最多 6 层。
- 节点总数最多 80 个。

组件 props 校验：

- 按组件名分发校验函数。
- 必填 props 缺失时返回节点级错误。
- 数据类型异常时返回节点级错误。
- 图表空数据时展示空状态。
- 表格 columns 或 data 异常时展示错误块。

错误展示：

- 整体 schema 非法时，渲染区域展示全局错误。
- 单个 node 非法时，在节点位置展示 `RenderErrorBlock`。
- 未注册组件时展示“组件未注册：xxx”。
- schema 缺省时由调用方展示空态，`SchemaRenderer` 专注渲染合法输入和错误兜底。

## 组件 API

`SchemaRenderer` 作为独立组件对外暴露：

```ts
export interface SchemaRendererProps {
  schema?: PageSchema | null
  className?: string
  style?: React.CSSProperties
  onError?: (error: SchemaRenderError) => void
}
```

使用规则：

- `schema` 由调用方传入。
- `className` 和 `style` 用于适配宿主容器。
- `onError` 接收整体 schema 校验错误和节点级错误。
- `SchemaRenderer` 内部完成校验、组件分发和节点级兜底。
- 空态、加载态、schema 来源解析由调用方负责。

## 依赖策略

当前应用已包含 AntD、`@ant-design/x` 和 `@ant-design/x-markdown`。

图表依赖建议添加到 `apps/user-web`：

- `echarts`
- `echarts-for-react`

依赖只添加在应用包内，保持共享包 `packages/utils` 职责纯净。

## 测试计划

`validateSchema`：

- 合法 schema。
- 未注册组件。
- 非容器节点携带 children。
- 树深度超限。
- 节点总数超限。
- 安全字段命中。
- 组件必填 props 缺失。

`SchemaRenderer`：

- 合法组件树渲染。
- 节点级错误兜底。
- 空 children。
- 嵌套 `GridLayout` 和 `PanelCard`。

## 示例 Schema

```json
{
  "schemaVersion": "1.0",
  "page": {
    "title": "销售分析看板",
    "description": "基于本周销售数据生成的经营概览",
    "children": [
      {
        "id": "metrics-grid",
        "component": "GridLayout",
        "props": {
          "columns": 24,
          "gutter": 16,
          "span": [8, 8, 8]
        },
        "children": [
          {
            "id": "gmv-card",
            "component": "PanelCard",
            "props": {
              "title": "GMV"
            },
            "children": [
              {
                "id": "gmv",
                "component": "MetricStatistic",
                "props": {
                  "title": "本周 GMV",
                  "value": 128900,
                  "prefix": "¥",
                  "precision": 0,
                  "status": "success"
                }
              }
            ]
          },
          {
            "id": "orders-card",
            "component": "PanelCard",
            "props": {
              "title": "订单"
            },
            "children": [
              {
                "id": "orders",
                "component": "MetricStatistic",
                "props": {
                  "title": "订单数",
                  "value": 9821,
                  "status": "default"
                }
              }
            ]
          },
          {
            "id": "conversion-card",
            "component": "PanelCard",
            "props": {
              "title": "转化率"
            },
            "children": [
              {
                "id": "conversion",
                "component": "MetricStatistic",
                "props": {
                  "title": "访问转化率",
                  "value": 8.6,
                  "suffix": "%",
                  "precision": 1,
                  "status": "warning"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "trend-card",
        "component": "PanelCard",
        "props": {
          "title": "销售趋势",
          "bordered": false
        },
        "children": [
          {
            "id": "sales-trend",
            "component": "LineChart",
            "props": {
              "height": 320,
              "xAxisKey": "date",
              "data": [
                { "date": "周一", "sales": 18000, "orders": 1200 },
                { "date": "周二", "sales": 22000, "orders": 1400 },
                { "date": "周三", "sales": 19500, "orders": 1300 }
              ],
              "series": [
                { "dataKey": "sales", "name": "销售额" },
                { "dataKey": "orders", "name": "订单数" }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

## 验收标准

- `SchemaRenderer` 可以接收合法 `PageSchema` 并渲染页面。
- 注册表组件全部可由 schema 渲染。
- 非法 schema 展示明确错误。
- 单个异常节点展示错误块，其他节点继续渲染。
- 组件 API 保持独立，业务容器集成由调用方完成。
- 第一版只处理静态数据展示。
