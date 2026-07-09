# user-web 知识库管理与检索页面实现方案

## 背景

根据 `ai-generation-service-api(1).md` 第 118 行「知识库管理与检索」接口，AI Generation Service 已代理 RAGFlow 的知识库、文档和检索能力。前端需要在 `apps/user-web` 中提供一套用户侧页面，用于管理知识库、上传与解析文档，并验证知识检索结果。

## 命中经验

- EXP-DOCS-001：以最新 API 文档中的接口字段、状态流转和验收点作为实现输入。
- EXP-DOCS-002：参考既有页面时区分路由外壳、页面入口、数据 hook、交互组件等职责层级。
- EXP-DOCS-003：CRUD、列表、详情、表单规格需要覆盖布局、接口字段、分页、空态、错误态和反馈。
- EXP-ROUTE-001：知识库管理具备独立 URL、刷新恢复和导航语义，应使用独立路由。
- EXP-ROUTE-002：新增可见页面时同步路由、菜单、navKey、面包屑和 i18n 标题。
- EXP-STATE-001：分页状态由共享 hook 或稳定封装统一管理。
- EXP-STATE-002：筛选、搜索、切换知识库、pageSize 变化后回到第一页；刷新保留当前页。
- EXP-STATE-004：状态、权限、切片方式等业务映射建立单一来源。
- EXP-STYLE-001：普通 DOM 使用 Tailwind className；AntD 覆盖限制在局部作用域。
- EXP-STYLE-003：知识库页面属于高频管理工作流，优先信息密度和扫描效率。
- EXP-LAYOUT-001：左右分栏、Tabs 和表格滚动需要先确定主滚动边界，打通 `min-h-0` 高度链路。
- EXP-LAYOUT-002：Tabs、Drawer 内的表格和上传区域需要在可见后测量，避免隐藏容器测量异常。
- EXP-ABST-002：Tabs、状态文案、筛选选项和颜色从单一配置派生。
- EXP-ABST-005：页面入口、组件、hooks、utils、constants、types 按职责分层。
- EXP-VERIFY-003：接口暂缺或 RAGFlow 未配置时，mock 覆盖列表、上传、解析、删除和检索状态流转。

## 页面定位

新增 `user-web` 独立页面「知识库」，作为用户管理 RAGFlow 知识资产的入口。

页面目标：

1. 查看、新建、编辑、删除 RAGFlow 知识库。
2. 查看知识库内文档，支持上传、解析、删除。
3. 在指定知识库内发起检索，快速验证入库效果。
4. 后续可与 AI 生成任务中的 `knowledge.dataset_ids` 选择能力打通。

页面定位为专业 RAG 知识库工作台，不只呈现 CRUD。页面需要帮助用户完成「创建知识库 -> 上传文档 -> 解析切片 -> 建立索引 -> 检索验证 -> 配置调优」的完整链路。

## 路由与导航

### 路由

- 路径：`/knowledge`
- 页面入口：`apps/user-web/src/pages/knowledge/KnowledgeBase.tsx`
- 路由配置：`apps/user-web/src/router/routes.tsx`

建议路由元信息：

- `title`: `Knowledge Base`
- `titleKey`: `routes.knowledge.title`
- `icon`: `DatabaseOutlined` 或 `BookOutlined`
- `menuType`: `menu`
- `navKey`: `knowledge`
- `navOrder`: 建议放在工作台之后、智能体与工单之前或账单中心之前

### i18n

需要同步以下文件：

- `apps/user-web/src/i18n/resources/zh-CN/routes.ts`
- `apps/user-web/src/i18n/resources/en-US/routes.ts`
- `apps/user-web/src/i18n/resources/ar/routes.ts`
- `apps/user-web/src/i18n/resources/zh-CN/pages.ts`
- `apps/user-web/src/i18n/resources/en-US/pages.ts`
- `apps/user-web/src/i18n/resources/ar/pages.ts`

中文主文案建议：

- 路由标题：知识库
- 页面标题：知识库
- 页面副标题：管理 RAGFlow 知识库、文档上传、解析与检索

## 信息架构

页面采用 RAG Knowledge Studio 布局，围绕知识库治理、文档入库、解析索引和检索验证组织。

整体结构：

```text
顶部：页面标题 / RAGFlow 状态 / 全局刷新 / 新建知识库

左侧：Knowledge Spaces
- 搜索知识库
- 知识库列表
- 权限、文档数、解析状态概览
- 新建、编辑、删除

中间：Dataset Workspace
- Overview
- Documents
- Retrieval Lab
- Settings

右侧：Inspector
- 当前知识库详情
- 当前文档详情
- 最近解析任务
- 检索命中解释
```

首版可以先实现左侧 Knowledge Spaces 和中间 Dataset Workspace。右侧 Inspector 使用可折叠侧栏或详情 Drawer 承载，避免首版布局过重。

### 顶部区域

使用 `PageHeader`：

- 左侧：标题、副标题。
- 中间或标题下方：RAGFlow 运行状态提示。
- 右侧：刷新、新建知识库。

RAGFlow 状态来自 `/api/v1/ai-generation/runtime/status`：

- `ragflow_configured === true` 且 `ragflow_api_key_configured === true`：页面正常展示。
- RAGFlow 配置缺失：显示轻量 `Alert`，说明知识库能力需要配置 RAGFlow。
- 状态接口失败：不阻断知识库页面，主体区域按知识库接口自身状态展示。

### 左侧：Knowledge Spaces

宽度建议 320px 到 380px。左侧承担知识库选择和治理，优先使用紧凑列表，不使用多列表格堆叠字段。

功能：

- 列表查询。
- 按名称搜索。
- 新建知识库。
- 编辑知识库。
- 单个删除。
- 批量删除。
- 选中知识库后联动中间工作区。

列表项信息：

| 列 | 字段 | 说明 |
|---|---|---|
| 名称 | `name` | 主标题，副文本显示 `id`，支持复制 |
| 权限 | `permission` | 使用单一映射显示标签 |
| 入库概览 | 派生字段 | 文档数、解析中、失败数，接口缺失时显示 `-` |
| 切片方式 | `chunk_method` | 使用单一映射显示标签 |
| 更新时间 | `updated_at` / `create_time` / `created_at` | 优先使用更新时间 |
| 操作 | - | 更多菜单：编辑、删除 |

`description`、`embedding_model`、完整 `parser_config` 放到 Settings 或 Inspector 展示，避免左侧过宽。

空态：无数据时显示「暂无知识库，请新建后上传文档」。

错误态：列表加载失败时显示 `Alert`，提供重试按钮。

### 中间：Dataset Workspace

未选择知识库时显示空态：

- 标题：请选择知识库
- 描述：选择左侧知识库后，可管理文档、解析入库并验证检索结果。
- 操作：新建知识库。

选中知识库后使用 Tabs：

1. Overview：知识库健康概览。
2. Documents：文档资产管理。
3. Retrieval Lab：检索实验室。
4. Settings：知识库配置。

默认 Tab 为 Documents。用户选中知识库后的高频动作通常是上传、查看文档和触发解析。

### 右侧：Inspector

Inspector 用于承载上下文解释，首版可以使用 Drawer 或右侧可折叠面板。

触发场景：

- 点击知识库 ID 或「查看详情」：展示知识库配置、原始字段和最近更新时间。
- 点击文档行：展示文档 ID、解析状态、chunk 数、文件大小、上传时间和错误信息。
- 点击检索结果：展示命中文本、来源文档、score、chunk ID 和原始命中字段。

首版如果不实现固定右侧 Inspector，需要在 Documents 和 Retrieval Lab 内提供等价的详情展开能力。

## 专业 RAG 工作流

### Overview：知识库健康概览

Overview 展示当前知识库是否具备可检索能力。

指标：

| 指标 | 来源 | 说明 |
|---|---|---|
| 文档总数 | 文档列表或接口统计 | 无法派生时显示 `-` |
| 已索引文档数 | 文档状态派生 | `success` / `succeeded` |
| 解析中文档数 | 文档状态派生 | `running` / `processing` |
| 解析失败文档数 | 文档状态派生 | `failed` |
| chunk 总数 | `chunk_count` 汇总 | 无法派生时显示 `-` |
| Embedding 模型 | `embedding_model` | 缺失显示默认或 `-` |
| Chunk Method | `chunk_method` | 单一映射展示 |
| 最近更新时间 | `updated_at` / `create_time` / `created_at` | 格式化展示 |

Overview 需要提供进入 Documents 和 Retrieval Lab 的快捷入口。

### Documents：文档资产管理

Documents 是默认工作区，负责上传、解析、重试、删除和查看入库状态。

顶部操作：

- 上传文档。
- 刷新文档列表。
- 批量解析。
- 批量删除。
- 状态筛选：全部、待解析、解析中、已索引、解析失败。

文档表格列：

| 列 | 字段 | 说明 |
|---|---|---|
| 文件名 | `name` / `filename` | 主标题，副文本显示 `id`，支持复制 |
| 入库阶段 | `run` / `status` / `parse_status` | 使用 RAG 入库流水线映射 |
| Chunk 数 | `chunk_count` | 数字右对齐，无值显示 `-` |
| 文件大小 | `size` / `size_bytes` | 格式化为 KB/MB |
| Parser | `parser_id` / `chunk_method` | 缺失显示当前知识库 chunk method |
| 上传时间 | `create_time` / `created_at` | 格式化展示 |
| 最近解析 | `updated_at` / `parse_time` | 缺失显示 `-` |
| 操作 | - | 解析、重试、删除、查看详情 |

上传文档：

- 点击「上传文档」打开 Drawer。
- Drawer 内使用 AntD `Upload.Dragger`。
- 自定义上传，构造 `FormData`。
- 每个文件字段名必须为 `files`。
- 支持多文件上传。
- 可选 `parent_path`。
- 上传成功后刷新文档列表。
- 上传成功提示：文档已上传，请触发解析后入库。

批量操作：

- 选中文档后显示批量工具条：已选择 N 项、批量解析、批量删除、清空选择。
- 批量解析只提交可解析文档。
- `running` / `processing` 状态禁用解析按钮。
- `failed` 状态文档显示「重试解析」。

### Ingestion Pipeline：入库阶段

文档状态按 RAG 入库流水线表达：

```text
Uploaded -> Parsing -> Indexed -> Failed
```

状态映射集中放在 `constants.ts`：

| 原始状态 | 阶段 | 文案 | 颜色 |
|---|---|---|---|
| `pending` | Uploaded | 已上传 | default |
| `running` | Parsing | 解析中 | processing |
| `processing` | Parsing | 解析中 | processing |
| `success` | Indexed | 已索引 | success |
| `succeeded` | Indexed | 已索引 | success |
| `failed` | Failed | 解析失败 | error |
| 其他 | Unknown | 未知 | warning |

解析提交成功后提示「解析任务已提交」。首版不自动轮询，通过刷新按钮查看最新解析状态。

### Retrieval Lab：检索实验室

Retrieval Lab 用于验证当前知识库召回质量。

输入区：

- 当前知识库名称和 ID。
- `query` 多行输入，必填。
- `top_k` 数字输入，默认 5，范围 1 到 20。
- 检索按钮。

结果区：

| 字段 | 说明 |
|---|---|
| 排名 | 结果顺序 |
| 命中文本 | `content` / `text` |
| 来源文档 | `document_name` / `doc_name` |
| 分数 | `score` / `similarity` |
| Chunk ID | `chunk_id` / `id` |
| 原始字段 | 折叠展示，便于排查后端透传字段 |

交互规则：

- 检索使用 mutation，不随输入自动请求。
- 检索中按钮 loading，禁止重复提交。
- 命中文本和 Chunk ID 支持复制。
- 无命中时提示「暂无命中结果，请确认文档已解析完成或调整检索词」。
- 请求失败时在结果区展示后端返回信息，保留输入内容。

### Settings：知识库配置

Settings 展示和编辑影响 RAG 效果的关键配置。

分组：

- 基础信息：`name`、`description`、`permission`。
- Embedding：`embedding_model`。
- Chunking：`chunk_method`、`parser_config.chunk_token_num`、`parser_config.delimiter`。
- Parser Config：首版展示基础 `parser_config` 字段。

编辑时先调用 `GET /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}` 获取详情，再打开 Drawer。

## 知识库 CRUD

### 查询知识库列表

接口：

```http
GET /api/v1/ai-generation/api/ai/knowledge/datasets?page=1&page_size=30
```

说明：

- 文档写的是 RAGFlow 透传 query 参数，建议使用 `page`、`page_size`。
- 当前 `usePaginationParams` 输出 `skip`、`limit`，本页面应做一层适配：
  - `page = pagination.current`
  - `page_size = pagination.pageSize`
- 如果后端实际返回 RAGFlow 原始结构，前端需要在 API adapter 中统一归一化为 `{ data, count }`。

### 查询单个知识库

接口：

```http
GET /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}
```

使用场景：

- 编辑 Drawer 打开前拉取详情。
- Settings 刷新知识库配置。
- Inspector 展示知识库原始字段。

### 创建知识库

接口：

```http
POST /api/v1/ai-generation/api/ai/knowledge/datasets
```

请求体：

```json
{
  "name": "ff-ai-project-knowledge",
  "description": "项目知识库",
  "embedding_model": "text-embedding-v4@Tongyi-Qianwen",
  "permission": "me",
  "chunk_method": "naive",
  "parser_config": {
    "chunk_token_num": 256,
    "delimiter": "\n"
  }
}
```

表单规则：

- `name` 必填。
- `description` 选填。
- `embedding_model` 选填，默认可留空由后端或 RAGFlow 默认值处理。
- `permission` 默认 `me`。
- `chunk_method` 默认 `naive`。
- `parser_config.chunk_token_num` 默认 256。
- `parser_config.delimiter` 默认换行符。

成功反馈：

- Toast：知识库已创建。
- 关闭 Drawer。
- 刷新知识库列表。
- 自动选中新建知识库，如果响应中能拿到 ID。

### 修改知识库

接口：

```http
PUT /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}
```

请求体示例：

```json
{
  "name": "new-name",
  "description": "updated description",
  "permission": "me"
}
```

成功反馈：

- Toast：知识库已更新。
- 关闭 Drawer。
- invalidate 列表和详情 query。

### 删除知识库

单删接口：

```http
DELETE /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}
```

批量删除接口：

```http
DELETE /api/v1/ai-generation/api/ai/knowledge/datasets
```

批量删除请求体：

```json
{
  "ids": ["dataset-id-1", "dataset-id-2"]
}
```

交互规则：

- 删除前必须 `Modal.confirm`。
- 删除当前选中的知识库后，清空 Dataset Workspace 和 Inspector。
- 批量删除按钮仅在有选中项时启用。

## 文档管理接口

### 查询文档列表

接口：

```http
GET /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/documents
```

建议 query：

- `page`
- `page_size`
- 可预留 `keywords` 或 `name`，如果 RAGFlow 支持透传。

基础文档表格列与 Documents 工作区保持一致：

| 列 | 字段 | 说明 |
|---|---|---|
| 文件名 | `name` / `filename` | 主标题，副文本显示 `id` |
| 解析状态 | `run` / `status` / `parse_status` | 以实际返回为准，做兼容映射 |
| 切片数 | `chunk_count` | 无值显示 `-` |
| 大小 | `size` / `size_bytes` | 格式化为 KB/MB |
| 上传时间 | `create_time` / `created_at` | 以实际返回为准 |
| 操作 | - | 解析、删除 |

状态映射建议集中定义：

- `pending`：待解析
- `running` / `processing`：解析中
- `success` / `succeeded`：已解析
- `failed`：解析失败
- 其他：未知

### 上传文档

接口：

```http
POST /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/documents
Content-Type: multipart/form-data
```

表单字段：

| 字段 | 说明 |
|---|---|
| `files` | 一个或多个文件 |
| `parent_path` | 可选，RAGFlow 知识库内目录路径 |

实现要求：

- 使用 AntD `Upload.Dragger`。
- 自定义上传，构造 `FormData`。
- 文件字段名必须是 `files`，不是当前附件上传接口的 `file`。
- 支持多文件上传。
- 上传成功后刷新文档列表。

成功反馈：

- Toast：文档已上传。
- 如上传后需要用户手动解析，提示「请触发解析后入库」。

### 触发文档解析

接口：

```http
POST /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/documents/parse
```

请求体：

```json
{
  "document_ids": ["document-id"]
}
```

交互规则：

- 单个文档行内提供「解析」按钮。
- 文档列表支持多选后批量解析。
- 解析成功后刷新文档列表。
- 如果解析是异步任务，可提供刷新按钮，不在前端写死轮询；除非后端明确返回稳定解析状态。

### 删除文档

单删接口：

```http
DELETE /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/documents/{document_id}
```

批量删除接口：

```http
DELETE /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/documents
```

批量删除请求体：

```json
{
  "ids": ["document-id-1", "document-id-2"]
}
```

交互规则：

- 删除前必须确认。
- 删除成功后刷新文档列表。
- 批量删除按钮仅在选择文档后启用。

## 检索测试接口

### 指定知识库检索

接口：

```http
POST /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/search
```

请求体：

```json
{
  "query": "需要检索的知识",
  "top_k": 5
}
```

表单：

- `query`：必填，多行输入。
- `top_k`：数字输入，默认 5，建议范围 1 到 20。

结果展示：

- 使用 Retrieval Lab 结果列表或紧凑命中卡片。
- 展示命中文本、来源文档、分数、片段 ID。
- RAGFlow 返回字段可能透传，前端 API adapter 需要兼容常见字段：
  - `content`
  - `text`
  - `document_name`
  - `doc_name`
  - `score`
  - `similarity`

错误态：

- RAGFlow 未配置或失败时，接口可能降级返回。前端应展示后端返回信息，不阻断页面其他功能。

### 通用检索（二期）

接口：

```http
POST /api/v1/ai-generation/api/ai/knowledge/search
```

请求体：

```json
{
  "query": "需要检索的知识",
  "top_k": 5,
  "dataset_ids": ["dataset-id"]
}
```

建议二期在页面顶部增加「跨库检索」入口，支持多选知识库。

## API 封装建议

### 共享 API 包

新增文件：

- `packages/api/src/ai/knowledge.ts`
- `packages/api/src/ai/index.ts`

并在 `packages/api/src/index.ts` 导出。

建议类型：

- `KnowledgeDataset`
- `KnowledgeDatasetQuery`
- `KnowledgeDatasetCreatePayload`
- `KnowledgeDatasetUpdatePayload`
- `KnowledgeDocument`
- `KnowledgeDocumentQuery`
- `KnowledgeSearchPayload`
- `KnowledgeSearchResult`

建议 request factory：

- `listKnowledgeDatasetsRequest(params)`
- `createKnowledgeDatasetRequest(data)`
- `getKnowledgeDatasetRequest(datasetId)`
- `updateKnowledgeDatasetRequest(datasetId, data)`
- `deleteKnowledgeDatasetRequest(datasetId)`
- `deleteKnowledgeDatasetsRequest(ids)`
- `searchKnowledgeRequest(data)`
- `searchKnowledgeDatasetRequest(datasetId, data)`
- `listKnowledgeDocumentsRequest(datasetId, params)`
- `uploadKnowledgeDocumentsRequest(datasetId, params)`
- `getKnowledgeDocumentRequest(datasetId, documentId)`
- `parseKnowledgeDocumentsRequest(datasetId, documentIds)`
- `deleteKnowledgeDocumentRequest(datasetId, documentId)`
- `deleteKnowledgeDocumentsRequest(datasetId, ids)`

### user-web API 层

新增文件：

- `apps/user-web/src/api/knowledge.ts`

职责：

- 从 `@ff-ai-frontend/api` 导出知识库类型。
- 使用 `request(...)` 包装 request factory。
- 定义 query keys：
  - `knowledgeKeys.datasets(params)`
  - `knowledgeKeys.dataset(datasetId)`
  - `knowledgeKeys.documents(datasetId, params)`
  - `knowledgeKeys.search(datasetId, payload)`

注意：

- 文档上传使用 `FormData`，字段名为 `files`。
- DELETE 批量接口需要带 `data: { ids }`。
- 如果 AI 服务和平台后端不在同一 base URL，需要确认是否使用现有 `requestClient` 还是 `aiApiClient`；当前 `aiApiClient` 已存在但未使用，落地前需确认代理路径。

## API 响应归一化

共享 API 层定义请求工厂和基础类型，`apps/user-web/src/api/knowledge.ts` 面向页面提供稳定归一化结果。

统一列表输出：

```ts
type KnowledgeListResult<T> = {
  data: T[]
  count: number
}
```

归一化规则：

- `response.data` 为数组时，使用 `response.data`，`count` 取 `response.count`、`response.total` 或数组长度。
- `response.data` 为对象且包含 `data`、`items`、`list` 时，读取对应列表字段。
- 原始响应为数组时，直接作为 `data`。
- 无法识别时返回空列表，并在错误态展示后端返回信息。

页面消费稳定字段，字段兼容集中放在 adapter：

- 知识库时间：`updated_at` 优先，兼容 `create_time`、`created_at`。
- 文档名称：`name` 优先，兼容 `filename`。
- 文档状态：`parse_status` 优先，兼容 `status`、`run`。
- 检索内容：`content` 优先，兼容 `text`。
- 检索分数：`score` 优先，兼容 `similarity`。
- Chunk ID：`chunk_id` 优先，兼容 `id`。

## 组件拆分

建议目录：

```text
apps/user-web/src/pages/knowledge/
  KnowledgeBase.tsx
  components/
    KnowledgeSpaces.tsx
    DatasetFormDrawer.tsx
    OverviewPanel.tsx
    DocumentsPanel.tsx
    UploadDocumentsDrawer.tsx
    RetrievalLab.tsx
    SettingsPanel.tsx
    KnowledgeInspector.tsx
  hooks/
    useKnowledgeUrlState.ts
  utils/
    adapters.ts
    format.ts
  constants.ts
  types.ts
```

职责：

- `KnowledgeBase.tsx`：页面入口、布局、选中知识库状态。
- `KnowledgeSpaces.tsx`：左侧知识库列表、搜索、选择、批量删除。
- `DatasetFormDrawer.tsx`：新建和编辑知识库表单。
- `OverviewPanel.tsx`：知识库健康概览和入库状态统计。
- `DocumentsPanel.tsx`：文档列表、状态筛选、解析、删除。
- `UploadDocumentsDrawer.tsx`：多文件上传、`parent_path`、上传反馈。
- `RetrievalLab.tsx`：指定知识库检索表单和命中结果展示。
- `SettingsPanel.tsx`：知识库配置展示和编辑入口。
- `KnowledgeInspector.tsx`：知识库、文档、检索命中详情检查器。
- `useKnowledgeUrlState.ts`：管理 `dataset_id`、`tab`、`keyword`、分页等 URL 状态。
- `adapters.ts`：接口响应归一化和字段兼容。
- `format.ts`：时间、文件大小、分数格式化。
- `constants.ts`：权限、切片方式、解析状态等单一映射。

## 状态管理

页面内状态：

- `selectedDatasetId`
- `activeTab`
- `datasetFormOpen`
- `editingDatasetId`
- `selectedDatasetRowKeys`
- `selectedDocumentRowKeys`
- `documentStatusFilter`
- `uploadDrawerOpen`
- `inspectorTarget`

React Query：

- 列表 query 使用 `keepPreviousData`。
- 新建、编辑、删除成功后 invalidate dataset list。
- 上传、解析、删除文档成功后 invalidate document list。
- 检索使用 mutation，不建议把长 query 输入直接作为自动 query。

分页规则：

- 知识库列表和文档列表分别维护分页。
- 搜索条件变化回第一页。
- 刷新按钮保留当前页。
- 切换知识库时文档列表回第一页。

URL 状态：

| Query | 说明 |
|---|---|
| `dataset_id` | 当前选中的知识库 |
| `tab` | 当前工作区 Tab，取值 `overview`、`documents`、`retrieval`、`settings` |
| `keyword` | 知识库搜索词 |
| `page` | 知识库列表页码 |
| `page_size` | 知识库列表每页条数 |

规则：

- 页面初始化时从 query string 恢复状态。
- 选择知识库后更新 `dataset_id`，默认进入 Documents。
- 切换 Tab 后更新 `tab`。
- 删除当前知识库后清空 `dataset_id` 和中间工作区。
- 刷新按钮保留当前 query 状态。

## 布局与滚动约束

页面主容器使用 `PageHeader` + `PageContainer`，主工作区需要明确滚动边界。

布局规则：

- 页面外层使用 `flex min-h-0` 打通高度链路。
- 左侧 Knowledge Spaces 内部滚动，搜索和主操作固定在顶部。
- 中间 Dataset Workspace 内部滚动，Tabs 顶部保持可见。
- 表格使用稳定列宽，`scroll.x` 与列宽总和匹配。
- Tabs 内表格在激活后渲染或触发重测，避免隐藏容器首次测量异常。
- 窄屏下左侧和中间区域改为上下布局，Knowledge Spaces 在上，Workspace 在下。

## 异常与反馈

通用反馈：

- 创建成功：知识库已创建。
- 更新成功：知识库已更新。
- 删除成功：知识库已删除。
- 上传成功：文档已上传。
- 解析已触发：解析任务已提交。
- 检索失败：知识库检索失败，请稍后重试。
- 无命中：暂无命中结果，请确认文档已解析完成或调整检索词。

异常态：

- 知识库列表加载失败：显示 `Alert` 和重试按钮。
- 文档列表加载失败：显示 `Alert` 和重试按钮。
- 检索失败：结果区显示错误状态，保留输入内容。
- RAGFlow 未配置：展示后端返回的降级信息，不影响知识库列表之外的页面操作。

写操作禁用态：

- 创建知识库：提交按钮 loading。
- 编辑知识库：详情加载期间表单 skeleton 或 loading。
- 删除知识库：确认 Modal loading，删除当前选中知识库后清空工作区。
- 上传文档：上传中显示整体 loading，禁止重复提交。
- 解析文档：提交中禁用对应文档解析按钮。
- 删除文档：删除中禁用对应文档删除按钮。
- Retrieval Lab：检索中禁用提交按钮。

## 实施步骤

1. 在共享 API 包新增知识库类型和 request factory。
2. 在 `user-web` 新增 `src/api/knowledge.ts`。
3. 新增 `/knowledge` 路由、菜单元信息和多语言标题。
4. 实现 `KnowledgeBase.tsx` 的 RAG Knowledge Studio 布局和 URL 状态。
5. 实现 Knowledge Spaces：知识库搜索、选择、分页、新建、编辑、删除。
6. 实现 Overview：知识库健康指标和入库状态统计。
7. 实现 Documents：文档列表、上传 Drawer、状态筛选、解析、重试、删除。
8. 实现 Retrieval Lab：指定知识库检索实验台和命中结果展示。
9. 实现 Settings：知识库配置分组展示和编辑入口。
10. 实现 Inspector 或等价详情展开。
11. 补全中英文和阿语 i18n 文案。
12. 运行 `rtk npm run lint`。
13. 运行 `rtk npm run typecheck`。

## 验收标准

- 访问 `/knowledge` 可看到知识库页面，侧边栏高亮正确。
- 页面呈现 Knowledge Spaces + Dataset Workspace 的 RAG 工作台布局。
- 知识库列表可加载，分页参数以 `page/page_size` 发送。
- 新建、编辑、删除知识库后列表自动刷新。
- 创建知识库成功后自动选中新知识库并进入 Documents。
- `/knowledge?dataset_id=xxx&tab=documents` 刷新后恢复选中知识库和 Tab。
- 文档上传请求为 `multipart/form-data`，字段名为 `files`。
- 触发解析请求体为 `{ "document_ids": [...] }`。
- 文档入库状态按 Uploaded、Parsing、Indexed、Failed 映射展示。
- 解析失败文档支持重试解析。
- 文档删除批量请求体为 `{ "ids": [...] }`。
- 指定知识库检索请求体包含 `query` 和 `top_k`。
- Retrieval Lab 可展示命中文本、来源文档、score、chunk ID 和无命中状态。
- 筛选、搜索、切换知识库、pageSize 变化后回到第一页。
- 刷新按钮保留当前页。
- RAGFlow 未配置时页面显示可理解提示，并保留接口错误态重试入口。
- 左右布局和 Tabs 内表格在大量数据下滚动稳定。
- `rtk npm run lint` 通过。
- `rtk npm run typecheck` 通过。

## Mock 验收

本地 mock 至少覆盖以下状态：

- 知识库列表成功、空列表、加载失败。
- 创建知识库后列表新增并自动选中新 ID。
- 删除当前选中知识库后中间工作区清空。
- Overview 从文档状态派生统计。
- 文档上传成功后文档列表新增记录。
- 解析提交后文档状态进入 `running` 或 `processing`。
- 解析失败文档可重试并重新进入解析中。
- 文档删除后列表移除对应记录。
- 检索成功、无命中、接口失败三种结果区状态。

## 暂不纳入首版

- 跨库检索页面。
- 与 AI 生成任务创建表单联动选择 `knowledge.dataset_ids`。
- 文档解析状态自动轮询。
- 文档内容 chunk 详情管理。
- RAGFlow 高级 parser_config 全量配置。
