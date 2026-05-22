# Schema Renderer JSON Skill Design

## 背景

`apps/user-web/src/components/SchemaRenderer` 通过 JSON schema 渲染页面。当前 schema 根结构固定为 `schemaVersion` 和 `page.children`，所有可见内容都来自注册组件节点。

现有 `schema-renderer-json` skill 已覆盖组件说明，但整体更像组件文档。下一版要面向大模型生成任务，优先提升 JSON 合法性和结构稳定性，同时保留看板、报告、指标、图表和表格的表达能力。

## 目标

- 让大模型稳定输出单个合法 JSON object。
- 让大模型明确区分全局硬约束、组件局部契约和页面组合策略。
- 充分利用 skill references 的按需加载能力，减少主 `SKILL.md` 的上下文体积。
- 新增或调整组件时，只更新对应组件文档和主索引。

## 范围

本次优化只调整 skill 文档结构和内容组织。

涉及目录：

- `.codex/skills/schema-renderer-json/SKILL.md`
- `.codex/skills/schema-renderer-json/references/`

本次设计覆盖以下组件：

- `Header`
- `GridLayout`
- `PanelCard`
- `MarkdownBlock`
- `MetricStatistic`
- `DataTable`
- `LineChart`
- `PieChart`

## 推荐结构

```text
schema-renderer-json/
├── SKILL.md
└── references/
    ├── header.md
    ├── grid-layout.md
    ├── panel-card.md
    ├── markdown-block.md
    ├── metric-statistic.md
    ├── data-table.md
    ├── line-chart.md
    └── pie-chart.md
```

## 主 Skill 设计

`SKILL.md` 保持短小，承担全局指挥职责。

建议章节：

1. `Mission`
2. `Output Contract`
3. `Hard Rules`
4. `Component Index`
5. `Reference Loading Strategy`
6. `Composition Strategy`
7. `Self-Check`
8. `Minimal Complete Example`

### Mission

说明 skill 用于生成 `SchemaRenderer` 可渲染的 JSON schema。要求输出 JSON 本体，避免 Markdown 包裹、解释文字和注释。

### Output Contract

固定根结构：

```json
{
  "schemaVersion": "1.0",
  "page": {
    "children": []
  }
}
```

### Hard Rules

主 skill 集中放硬规则：

- `schemaVersion` 固定为 `"1.0"`。
- 每个节点必须有唯一的非空字符串 `id`。
- `id` 推荐 kebab-case。
- `component` 必须来自组件白名单。
- 所有可见内容都必须在 `page.children` 的节点里表达。
- `children` 只允许出现在 `GridLayout` 和 `PanelCard`。
- 叶子组件禁止 `children`。
- 最大深度为 6。
- 最大节点数为 80。
- props 中禁止出现 `script`、`style`、`html`、`dangerouslySetInnerHTML`、`onClick`、`dataSourceUrl`。

### Component Index

主 skill 只列组件索引、用途和 reference 路径：

- `Header`: 页面或区块标题，读 `references/header.md`
- `GridLayout`: 响应式布局容器，读 `references/grid-layout.md`
- `PanelCard`: 卡片容器，读 `references/panel-card.md`
- `MarkdownBlock`: 分析文本，读 `references/markdown-block.md`
- `MetricStatistic`: 单个指标，读 `references/metric-statistic.md`
- `DataTable`: 明细表格，读 `references/data-table.md`
- `LineChart`: 趋势图，读 `references/line-chart.md`
- `PieChart`: 占比图，读 `references/pie-chart.md`

### Reference Loading Strategy

主 skill 明确按需加载规则：

- 生成页面前先判断需要哪些组件。
- 指标卡场景读取 `panel-card.md` 和 `metric-statistic.md`。
- 多列布局读取 `grid-layout.md`。
- 图表卡片读取 `panel-card.md` 和对应图表文档。
- 明细表格读取 `panel-card.md` 和 `data-table.md`。
- 分析报告读取 `panel-card.md` 和 `markdown-block.md`。

### Composition Strategy

主 skill 给出页面组合策略：

1. `Header` 放页面标题和上下文。
2. `GridLayout` 承载 2-4 个指标卡。
3. `PanelCard + MarkdownBlock` 承载文字分析。
4. `GridLayout + PanelCard + LineChart/PieChart` 承载图表。
5. `PanelCard + DataTable` 承载明细。

大模型应优先生成结构化节点，减少把整页内容塞进一个 `MarkdownBlock`。

### Self-Check

输出前必须检查：

- JSON 可解析。
- 根结构正确。
- 节点 id 唯一。
- 组件名精确匹配白名单。
- 叶子组件没有 `children`。
- 容器节点 children 深度在限制内。
- 必填 props 已提供。
- `DataTable.columns[].dataIndex` 匹配数据行 key。
- `LineChart.xAxisKey` 和 `series[].dataKey` 匹配数据行 key。
- `PieChart.data[].value` 是有限数字。
- 输出中没有 unsafe keys。

## 组件 Reference 设计

每个组件 reference 使用统一结构：

```md
# ComponentName

## Purpose

## Children

## Props

## Valid Example

## Common Mistakes

## Use When
```

### Purpose

一句话说明组件用途，帮助大模型选组件。

### Children

明确是否允许 children。容器组件说明可放哪些子节点，叶子组件强调禁止 children。

### Props

列出 required props 和 optional props，给出类型、允许值、默认行为。

### Valid Example

提供最小合法 JSON 节点示例，便于大模型模仿。

### Common Mistakes

列出该组件最容易生成错的地方。示例：

- `DataTable` 的 `dataIndex` 与 row key 对齐。
- `LineChart` 的 `series[].dataKey` 指向数值字段。
- `GridLayout.span` 数量与 children 顺序对应。
- `Header.level` 只能是 1 到 5。

### Use When

说明什么场景使用该组件，提升表达能力。

## 验收标准

- `SKILL.md` 控制在短文档范围，适合作为入口加载。
- 每个组件都有独立 reference 文件。
- 主 skill 能指导大模型选择需要读取的 reference。
- 给大模型一个业务主题后，模型能输出单个合法 JSON object。
- 生成结果通过 `validateSchema` 的结构约束。
- 生成结果具备基本页面结构：标题、指标、分析、图表或表格。

## 后续验证

实施完成后，使用至少三个场景验证：

1. 服务健康看板：Header、指标卡、折线图、表格。
2. 模型调用分析：Header、指标卡、饼图、分析文本。
3. 异常排查报告：Header、MarkdownBlock、表格、趋势图。

每个场景都要检查 JSON 可解析、组件契约正确、字段引用对齐。
