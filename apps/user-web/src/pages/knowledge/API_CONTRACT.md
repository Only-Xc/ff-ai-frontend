# Knowledge API Contract

本文档记录知识库页面当前使用的接口契约、数据来源和字段语义。页面实现以这里列出的确定字段为准，不增加候选字段回退或页面级数据适配层。

## 契约来源

按以下优先级确认字段：

1. AI Generation Service 对外代理映射和浏览器实际响应。
2. RAGFlow HTTP API 文档：`/Users/xc/Documents/github/ragflow/docs/references/http_api_reference.md`。
3. 当前 RAGFlow 源码：`/Users/xc/Documents/github/ragflow`。

本次核对的 RAGFlow 版本：

```text
commit: 0b01171a86426be9935aa33a7297303d51b9b321
date:   2026-07-10T14:26:54+08:00
```

相关源码位置：

- 数据集接口：`api/apps/restful_apis/dataset_api.py`
- 数据集服务：`api/apps/services/dataset_api_service.py`
- 文档接口：`api/apps/restful_apis/document_api.py`
- 文档字段转换：`api/apps/services/document_api_service.py`
- 文档解析与检索：`api/apps/restful_apis/chunk_api.py`
- 数据模型：`api/db/db_models.py`
- 数据集字段转换：`api/utils/api_utils.py`

## 代理响应层级

AI Generation Service 在 RAGFlow 响应外增加一层平台响应：

```json
{
  "code": 0,
  "data": {
    "code": 0,
    "data": {}
  }
}
```

`packages/api/src/ai/knowledge.ts` 负责按端点固定结构解包：

- 数据集列表：`response.data.data`，总数为 `response.data.total_datasets`。
- 数据集详情：`response.data.data[0]`。
- 文档列表：`response.data.data.docs`，总数为 `response.data.data.total`。
- 文档详情：`response.data.data.docs[0]`。
- 创建、更新、上传、检索：业务数据位于 `response.data.data`。

页面组件直接使用解包后的接口字段。

## 代理路由映射

| AI 服务接口                                                              | RAGFlow 接口                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `POST /api/ai/knowledge/search`                                          | `POST /api/v1/retrieval`                                                              |
| `GET /api/ai/knowledge/datasets`                                         | `GET /api/v1/datasets`                                                                |
| `POST /api/ai/knowledge/datasets`                                        | `POST /api/v1/datasets`                                                               |
| `GET /api/ai/knowledge/datasets/{dataset_id}`                            | `GET /api/v1/datasets?id={dataset_id}`                                                |
| `PUT /api/ai/knowledge/datasets/{dataset_id}`                            | `PUT /api/v1/datasets/{dataset_id}`                                                   |
| `DELETE /api/ai/knowledge/datasets`                                      | `DELETE /api/v1/datasets`                                                             |
| `DELETE /api/ai/knowledge/datasets/{dataset_id}`                         | `DELETE /api/v1/datasets`，请求体为 `{ "ids": [dataset_id] }`                         |
| `POST /api/ai/knowledge/datasets/{dataset_id}/search`                    | `POST /api/v1/retrieval`                                                              |
| `GET /api/ai/knowledge/datasets/{dataset_id}/documents`                  | `GET /api/v1/datasets/{dataset_id}/documents`                                         |
| `POST /api/ai/knowledge/datasets/{dataset_id}/documents`                 | `POST /api/v1/datasets/{dataset_id}/documents`                                        |
| `GET /api/ai/knowledge/datasets/{dataset_id}/documents/{document_id}`    | `GET /api/v1/datasets/{dataset_id}/documents?id={document_id}`                        |
| `POST /api/ai/knowledge/datasets/{dataset_id}/documents/parse`           | `POST /api/v1/datasets/{dataset_id}/chunks`                                           |
| `DELETE /api/ai/knowledge/datasets/{dataset_id}/documents`               | `DELETE /api/v1/datasets/{dataset_id}/documents`                                      |
| `DELETE /api/ai/knowledge/datasets/{dataset_id}/documents/{document_id}` | `DELETE /api/v1/datasets/{dataset_id}/documents`，请求体为 `{ "ids": [document_id] }` |

上传时前端向 AI 服务提交多个 `files` 字段，AI 服务负责转换为 RAGFlow 的多个 `file` 字段。

## 数据集契约

### 列表请求

```http
GET /api/v1/ai-generation/api/ai/knowledge/datasets
```

页面使用的 query：

```ts
{
  page: number
  page_size: number
  keywords?: string
}
```

当前 AI 服务代理响应没有文档状态聚合字段。知识库概览只展示响应中直接提供的 `document_count` 和 `chunk_count`；文档入库阶段通过文档列表的 `run` 字段展示。

### 数据集字段

页面直接使用：

| 字段              | 用途           |
| ----------------- | -------------- |
| `id`              | 数据集 ID      |
| `name`            | 名称           |
| `description`     | 描述           |
| `embedding_model` | Embedding 模型 |
| `permission`      | `me` 或 `team` |
| `chunk_method`    | 默认切片方式   |
| `parser_config`   | Parser 配置    |
| `document_count`  | 文档总数       |
| `chunk_count`     | Chunk 总数     |
| `create_time`     | 创建时间戳     |
| `update_time`     | 更新时间戳     |

RAGFlow 内部字段由服务转换为对外字段：

| 内部字段    | 对外字段          |
| ----------- | ----------------- |
| `embd_id`   | `embedding_model` |
| `parser_id` | `chunk_method`    |
| `doc_num`   | `document_count`  |
| `chunk_num` | `chunk_count`     |

## 文档契约

### 文档列表响应

```json
{
  "code": 0,
  "data": {
    "docs": [],
    "total": 0
  }
}
```

RAGFlow HTTP 文档中的部分示例使用 `total_datasets`，当前 RAGFlow 源码实际返回 `total`。前端使用当前源码字段 `total`。

### 文档列表字段

| 字段               | 用途                          |
| ------------------ | ----------------------------- |
| `id`               | 文档 ID                       |
| `name`             | 文件名                        |
| `dataset_id`       | 数据集 ID                     |
| `chunk_method`     | 切片方式                      |
| `parser_config`    | Parser 配置                   |
| `run`              | 入库阶段                      |
| `progress`         | 解析进度，范围由 RAGFlow 返回 |
| `progress_msg`     | 解析进度或失败信息            |
| `chunk_count`      | Chunk 数量                    |
| `token_count`      | Token 数量                    |
| `size`             | 文件大小，单位 Byte           |
| `type`             | 文档类型                      |
| `source_type`      | 来源类型                      |
| `process_begin_at` | 解析开始时间                  |
| `process_duration` | 解析耗时                      |
| `create_time`      | 上传时间戳                    |
| `update_time`      | 更新时间戳                    |

RAGFlow 文档字段转换：

| 内部字段    | 对外字段       |
| ----------- | -------------- |
| `kb_id`     | `dataset_id`   |
| `parser_id` | `chunk_method` |
| `chunk_num` | `chunk_count`  |
| `token_num` | `token_count`  |

### 上传响应

上传响应字段少于文档列表字段，使用独立类型 `KnowledgeUploadedDocument`：

```ts
interface KnowledgeUploadedDocument {
  id: string
  name: string
  dataset_id: string
  chunk_method: KnowledgeChunkMethod
  parser_config: KnowledgeParserConfig
  run: KnowledgeDocumentRunStatus
  size: number
  type: string
  location?: string | null
  created_by?: string
  thumbnail?: string | null
}
```

上传成功后页面刷新文档列表，以列表接口作为完整文档状态来源。

## 入库阶段

页面直接读取 `document.run`，不读取 `status`、`parse_status` 或其他候选字段。

| RAGFlow 内部值 | 接口 `run` | 页面语义 | 页面颜色   |
| -------------- | ---------- | -------- | ---------- |
| `0`            | `UNSTART`  | 待解析   | 默认       |
| `1`            | `RUNNING`  | 解析中   | Processing |
| `2`            | `CANCEL`   | 已取消   | Warning    |
| `3`            | `DONE`     | 已索引   | Success    |
| `4`            | `FAIL`     | 解析失败 | Error      |

操作规则：

- `RUNNING` 禁止重复提交解析。
- `UNSTART` 可以提交解析。
- `CANCEL` 可以重新提交解析。
- `DONE` 可以重新解析，RAGFlow 会清理旧 Chunk 后执行新任务。
- `FAIL` 可以重试解析。
- 失败信息读取 `progress_msg`。

页面映射定义位于 `constants.ts`：

```ts
DOCUMENT_RUN_STATUS_LABEL_KEYS
DOCUMENT_RUN_STATUS_COLORS
```

## 检索契约

### 请求

指定知识库检索：

```http
POST /api/v1/ai-generation/api/ai/knowledge/datasets/{dataset_id}/search
```

请求体：

```ts
{
  question: string
  top_k: number
}
```

AI 服务负责将路径中的 `dataset_id` 转换为 RAGFlow 检索请求的 `dataset_ids`。

### 响应

```ts
interface KnowledgeRetrievalResult {
  total: number
  chunks: KnowledgeRetrievalChunk[]
  doc_aggs: KnowledgeRetrievalDocumentAggregation[]
}
```

Chunk 页面字段：

| 字段                | 用途                                        |
| ------------------- | ------------------------------------------- |
| `id`                | Chunk ID                                    |
| `content`           | 命中文本                                    |
| `document_id`       | 来源文档 ID                                 |
| `document_keyword`  | 来源文档名称                                |
| `dataset_id`        | 数据集 ID，当前 RAGFlow 源码由 `kb_id` 转换 |
| `similarity`        | 综合相似度                                  |
| `vector_similarity` | 向量相似度                                  |
| `term_similarity`   | 关键词相似度                                |
| `highlight`         | 高亮文本，可选                              |

文档聚合字段：

```ts
interface KnowledgeRetrievalDocumentAggregation {
  count: number
  doc_id: string
  doc_name: string
}
```

## 实现边界

- `packages/api/src/ai/knowledge.ts` 定义接口类型、请求工厂和固定响应解包。
- `apps/user-web/src/api/knowledge.ts` 绑定请求客户端并导出 query keys。
- `KnowledgeBase.tsx` 负责请求、mutation 和页面状态编排。
- `components/` 直接消费接口字段。
- `constants.ts` 维护状态、权限和切片方式的展示映射。
- `utils/format.ts` 只负责时间、文件大小和分数格式化。
- knowledge 页面不保留 mock 数据和字段适配器。

## 维护规则

接口变化时按以下顺序更新：

1. 核对 AI Generation Service 代理契约和浏览器 Network 响应。
2. 核对 RAGFlow HTTP API 文档。
3. 核对当前 RAGFlow 路由与字段转换源码。
4. 更新 `packages/api/src/ai/knowledge.ts`。
5. 更新本文档。
6. 搜索并清理失效字段名，不增加候选字段兼容逻辑。
