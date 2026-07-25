/**
 * API client — fetch wrapper for all MailGraph REST + SSE endpoints.
 */

const BASE = '/api/v1/mailgraph'
const PLATFORM_TOKEN_KEY = 'ff-user-access-token'

function platformAccessToken(): string {
  const raw = window.localStorage.getItem(PLATFORM_TOKEN_KEY)
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { value?: unknown }
    return typeof parsed?.value === 'string' ? parsed.value : ''
  } catch {
    return raw
  }
}

function platformAuthHeaders(): Record<string, string> {
  const token = platformAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ── Active account context ──
// 后端按 X-Account-Id 头区分账户数据；这里保存当前账户 id，由 account store 保持同步，
// 每个 REST / SSE 请求都带上，缺失时后端 fallback 到默认（第一个）账户。
let activeAccountId: string | null = null
export function setActiveAccountId(id: string | null) {
  activeAccountId = id
}
function accountHeaders(): Record<string, string> {
  return activeAccountId ? { 'X-Account-Id': activeAccountId } : {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: optionHeaders, ...requestOptions } = options ?? {}
  const res = await fetch(`${BASE}${path}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...platformAuthHeaders(),
      ...accountHeaders(),
      ...optionHeaders,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── SSE stream helper ──
export function sseStream(
  path: string,
  body: unknown,
  handlers: {
    onProgress?: (data: any) => void
    onComplete?: (data: any) => void
    onError?: (msg: string) => void
    onDone?: () => void
  },
): AbortController {
  const controller = new AbortController()

  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...platformAuthHeaders(),
      ...accountHeaders(),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }))
      handlers.onError?.(body.detail || `HTTP ${res.status}`)
      handlers.onDone?.()
      return
    }
    const reader = res.body?.getReader()
    if (!reader) return
    const decoder = new TextDecoder()
    let buffer = ''
    let streamDone = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Parse SSE frames
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let eventType = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          try {
            // Sanitize NaN/Infinity before parsing (Python json.dumps may emit them)
            const sanitized = dataStr.replace(/: *NaN/g, ': null').replace(/: *Infinity/g, ': null').replace(/: *-Infinity/g, ': null')
            const data = JSON.parse(sanitized)
            if (eventType === 'progress') handlers.onProgress?.(data)
            else if (eventType === 'complete') handlers.onComplete?.(data)
            else if (eventType === 'error') handlers.onError?.(data.msg || String(data))
            else if (eventType === 'done') { handlers.onDone?.(); streamDone = true }
            else if (eventType === 'result') {
              console.log('[SSE] result event parsed, keys:', Object.keys(data).join(', '), 'entities:', data?.entities?.length, 'chunks:', data?.chunks?.length)
              handlers.onComplete?.(data)
            }
            else handlers.onProgress?.(data)
          } catch (e) {
            console.warn('SSE parse error for event', eventType, e)
          }
          eventType = ''
        }
      }
    }
    // Fallback: only fire if the server didn't send an explicit "done" event
    if (!streamDone) handlers.onDone?.()
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      handlers.onError?.(err.message)
    }
  })

  return controller
}

// ═══════════════════════════════════════════════════════════════
// Account API
// ═══════════════════════════════════════════════════════════════

export interface Account {
  id: string
  label: string
  imap_server: string
  imap_port: number
  email_user: string
  provider: string
  is_default?: boolean
}

export const accountsApi = {
  list: () => request<Account[]>('/accounts'),
  get: (id: string) => request<Account>(`/accounts/${id}`),
  create: (data: {
    label: string; imap_server: string; imap_port: number
    email_user: string; email_pass: string; provider: string
  }) => request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  setDefault: (id: string) => request<{ default_account_id: string }>(`/accounts/${id}/default`, { method: 'POST' }),
  migrateFromEnv: () => request<{ migrated: boolean; account_count: number }>('/accounts/migrate-from-env', { method: 'POST' }),
}

// ═══════════════════════════════════════════════════════════════
// Mail API
// ═══════════════════════════════════════════════════════════════

export interface MailStats {
  total: number; done: number; pending: number
  failed: number; skipped: number; ingested: number; indexed: number
  processing?: number
}

export interface MailItem {
  message_id: string; subject: string; from_addr: string
  from_name: string; date: string; status: string
  attachment_count: number; attachments: { filename: string }[]
  folder?: string; source_type?: string
}

export interface BrowseFile {
  path: string; name: string; size: number; ext: string
}

export interface BrowseDir {
  path: string; name: string
}

export interface BrowseResponse {
  dir: string; parent: string | null; dirs: BrowseDir[]; files: BrowseFile[]
}

export interface PickResponse {
  paths: string[]; canceled: boolean
}

export interface MailDetail extends MailItem {
  body: string; to_addrs: string[]; cc_addrs: string[]
}

export interface MailQueryRequest {
  start_time?: string
  end_time?: string
  status?: string
  sender?: string
  has_attachment?: boolean
  message_ids?: string[]
  topic?: string
  aggregation?: 'count' | 'list' | 'rate' | 'top_senders'
  limit?: number
}

export interface PaginatedMails {
  items: MailItem[]
  total: number
  page: number
  page_size: number
}

export const mailsApi = {
  stats: () => request<MailStats>('/mails/stats'),
  list: (params?: { filter?: 'all' | 'todo' | 'done'; page?: number; page_size?: number }) => {
    const p = params || {}
    return request<PaginatedMails>(`/mails/list?filter=${p.filter ?? 'all'}&page=${p.page ?? 1}&page_size=${p.page_size ?? 200}`)
  },
  pending: (params?: { page?: number; page_size?: number }) => {
    const p = params || {}
    return request<PaginatedMails>(`/mails/pending?page=${p.page ?? 1}&page_size=${p.page_size ?? 50}`)
  },
  done: (params?: { page?: number; page_size?: number }) => {
    const p = params || {}
    return request<PaginatedMails>(`/mails/done?page=${p.page ?? 1}&page_size=${p.page_size ?? 20}`)
  },
  recent: (params?: { page?: number; page_size?: number }) => {
    const p = params || {}
    return request<PaginatedMails>(`/mails/recent?page=${p.page ?? 1}&page_size=${p.page_size ?? 20}`)
  },
  detail: (id: string) => request<MailDetail>(`/mails/${id}`),
  query: (data: MailQueryRequest) => request<any>('/mails/query', { method: 'POST', body: JSON.stringify(data) }),

  fetch: (folder: string, limit: number, handlers: Parameters<typeof sseStream>[2]) =>
    sseStream('/mails/fetch', { folder, limit }, handlers),
  ingest: (limit: number | null, handlers: Parameters<typeof sseStream>[2], messageIds?: string[]) =>
    sseStream('/mails/ingest', { limit, message_ids: messageIds || null }, handlers),
  reprocess: (messageIds: string[], handlers: Parameters<typeof sseStream>[2]) =>
    sseStream('/mails/reprocess', { message_ids: messageIds }, handlers),
  delete: (messageIds: string[]) =>
    request<{ deleted: number; not_found: string[] }>('/mails', {
      method: 'DELETE', body: JSON.stringify({ message_ids: messageIds }),
    }),

  // ── File import (.eml/.msg/.pst/.ost) ──
  pick: (mode: 'folder' | 'files' = 'folder') => request<PickResponse>(`/mails/pick?mode=${mode}`),
  browse: (dir?: string) => request<BrowseResponse>(`/mails/browse${dir ? `?dir=${encodeURIComponent(dir)}` : ''}`),
  indexed: (params?: { page?: number; page_size?: number; status?: 'pending' | 'done' | 'all' }) => {
    const p = params || {}
    return request<PaginatedMails>(`/mails/indexed?status=${p.status ?? 'pending'}&page=${p.page ?? 1}&page_size=${p.page_size ?? 50}`)
  },
  indexFiles: (paths: string[], handlers: Parameters<typeof sseStream>[2]) =>
    sseStream('/mails/index', { paths }, handlers),
  parseSelected: (messageIds: string[], handlers: Parameters<typeof sseStream>[2]) =>
    sseStream('/mails/parse-selected', { message_ids: messageIds }, handlers),
}

// ═══════════════════════════════════════════════════════════════
// Conversation API
// ═══════════════════════════════════════════════════════════════

export interface ConvSession {
  id: string; title: string; created_at: number
  updated_at: number; message_count: number
}

export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string
  result?: any; created_at: number
}

export interface AgentMemory {
  preferences: string[]; pinned_context: string[]
  last_topics: string[]; summary: string; updated_at: number
}

export const conversationsApi = {
  list: () => request<ConvSession[]>('/conversations'),
  create: (title = '新对话') => request<ConvSession>('/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  get: (id: string) => request<ConvSession>(`/conversations/${id}`),
  rename: (id: string, title: string) => request<ConvSession>(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  delete: (id: string) => request<void>(`/conversations/${id}`, { method: 'DELETE' }),
  messages: (id: string) => request<ChatMessage[]>(`/conversations/${id}/messages`),
  addMessage: (id: string, role: string, content: string, result?: any) =>
    request<ChatMessage>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ role, content, result }) }),
  context: (id: string) => request<{ role: string; content: string }[]>(`/conversations/${id}/context`),
  memory: () => request<AgentMemory>('/conversations/memory'),
  updateMemory: (question: string, answer: string) =>
    request<{ ok: boolean }>(`/conversations/memory?question=${encodeURIComponent(question)}&answer=${encodeURIComponent(answer)}`, { method: 'POST' }),
}

// ═══════════════════════════════════════════════════════════════
// Query API
// ═══════════════════════════════════════════════════════════════

export interface QueryResult {
  question: string; answer: string
  entities: any[]; relationships: any[]; chunks: any[]
  rows?: any[]; columns?: string[]; total_rows: number
  trace: any[]; error?: string; query_plan?: any; total_duration_ms: number
  source_scope?: QuerySourceScope
}

export interface QuerySourceScope {
  type: 'global' | 'folder' | 'file' | 'mail'
  id: string
  label: string
}

export interface QuerySourceFilter {
  folder_id?: string
  file_id?: string
  mail_id?: string
}

export const queryApi = {
  run: (
    question: string,
    sessionId: string | null,
    source: QuerySourceFilter | undefined,
    handlers: Parameters<typeof sseStream>[2],
  ) => sseStream('/query', { question, session_id: sessionId, ...(source || {}) }, handlers),
}

// ═══════════════════════════════════════════════════════════════
// Graph API
// ═══════════════════════════════════════════════════════════════

export interface GraphStatus {
  graph: { entities: number; relationships: number }
  docs: { pending: number; processing: number; processed: number; failed: number; duplicate?: number }
  pipeline: { busy: boolean; latest_message: string; job_name: string }
}

export interface GraphFilter {
  folder_id?: string
  file_id?: string
  mail_id?: string
}

function graphQuery(page: number, pageSize: number, filter?: GraphFilter): string {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (filter?.folder_id) params.set('folder_id', filter.folder_id)
  if (filter?.file_id) params.set('file_id', filter.file_id)
  if (filter?.mail_id) params.set('mail_id', filter.mail_id)
  return params.toString()
}

export const graphApi = {
  entities: (page = 1, pageSize = 500, filter?: GraphFilter) =>
    request<{ entities: any[]; page: number }>(`/graph/entities?${graphQuery(page, pageSize, filter)}`),
  relationships: (page = 1, pageSize = 1000, filter?: GraphFilter) =>
    request<{ relationships: any[]; page: number }>(`/graph/relationships?${graphQuery(page, pageSize, filter)}`),
  sources: () => request<GraphSources>('/graph/sources'),
  status: () => request<GraphStatus>('/graph/status'),
  build: (timeout: number, handlers: Parameters<typeof sseStream>[2]) =>
    sseStream('/graph/build', { timeout }, handlers),
  visualize: (entityTypes: string[] | null) =>
    request<{ html: string }>('/graph/visualize', { method: 'POST', body: JSON.stringify({ entity_types: entityTypes }) }),
  resolveEntities: (dryRun: boolean) =>
    request<{ dry_run: boolean; groups: Array<{ type: string; canonical: string; merged: string[]; error?: string }>; merged_groups: number; merged_entities: number; rejected: number }>(
      `/graph/resolve-entities?dry_run=${dryRun}`, { method: 'POST' }),
}

// ═══════════════════════════════════════════════════════════════
// Knowledge library API
// ═══════════════════════════════════════════════════════════════

export interface KnowledgeFolder {
  id: string
  name: string
  parent_id: string
  path: string
  file_count: number
  children: KnowledgeFolder[]
  created_at: string
  updated_at: string
}

export interface KnowledgeFile {
  id: string
  folder_id: string
  folder_path: string
  name: string
  extension: string
  mime_type: string
  size: number
  sha256: string
  status: 'uploaded' | 'processing' | 'done' | 'failed'
  error: string
  created_at: string
  updated_at: string
}

export interface KnowledgeSearchChunk {
  id: string
  content: string
  source_name: string
  source_type: 'file'
  folder_path: string
  document_id: string
  document_keyword: string
  similarity: number
  vector_similarity: number
  term_similarity: number
  score: number
}

export interface KnowledgeSearchResponse {
  scope: {
    type: 'folder'
    id: string
    label: string
  }
  embedding_model: string
  total: number
  best_similarity: number | null
  chunks: KnowledgeSearchChunk[]
}

export interface GraphSources {
  folders: KnowledgeFolder[]
  files: KnowledgeFile[]
  mails: Array<{ id: string; name: string; date: string }>
}

export const knowledgeApi = {
  tree: () => request<{ items: KnowledgeFolder[] }>('/knowledge/folders/tree'),
  createFolder: (name: string, parentId: string | null) =>
    request<KnowledgeFolder>('/knowledge/folders', {
      method: 'POST', body: JSON.stringify({ name, parent_id: parentId }),
    }),
  updateFolder: (id: string, data: { name?: string; parent_id?: string }) =>
    request<KnowledgeFolder>(`/knowledge/folders/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }),
  deleteFolder: (id: string) =>
    request<void>(`/knowledge/folders/${id}`, { method: 'DELETE' }),
  files: (folderId?: string, recursive = false) => {
    const params = new URLSearchParams({ recursive: String(recursive) })
    if (folderId) params.set('folder_id', folderId)
    return request<{ items: KnowledgeFile[] }>(`/knowledge/files?${params.toString()}`)
  },
  detail: (id: string) => request<KnowledgeFile>(`/knowledge/files/${id}`),
  upload: async (folderId: string, files: File[]) => {
    const form = new FormData()
    form.set('folder_id', folderId)
    files.forEach(file => form.append('files', file))
    const res = await fetch(`${BASE}/knowledge/files/upload`, {
      method: 'POST',
      headers: { ...platformAuthHeaders(), ...accountHeaders() },
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(body.detail || `HTTP ${res.status}`)
    }
    return res.json() as Promise<{ items: KnowledgeFile[]; accepted: number }>
  },
  deleteFile: (id: string) => request<void>(`/knowledge/files/${id}`, { method: 'DELETE' }),
  search: (data: { query: string; folder_id: string; top_k?: number; similarity_threshold?: number }) =>
    request<KnowledgeSearchResponse>('/knowledge/search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ═══════════════════════════════════════════════════════════════
// Status API
// ═══════════════════════════════════════════════════════════════

export interface ServiceStatus {
  redis: boolean; neo4j: boolean; milvus: boolean
}

export interface StatusResponse {
  services: ServiceStatus
  active_account_id: string | null
  accounts: Account[]
}

export const statusApi = {
  health: () => request<StatusResponse>('/status'),
  tokens: () => request<{ prompt_tokens: number; completion_tokens: number }>('/usage/tokens'),
  logs: (service: string, lines = 50) => request<{ log: string }>(`/logs/${service}?lines=${lines}`),
}

// ═══════════════════════════════════════════════════════════════
// Project API
// ═══════════════════════════════════════════════════════════════

export interface ProjectSummary {
  overview: string
  stage: string
  key_dates: string
  core_people: string[]
}

export interface ProjectReport {
  overview: string
  stage: string
  contract: string
  key_dates: string
  core_people: string
  companies: string
  recent_activity: string
}

export interface ProjectAnalysis {
  project_name: string
  summary: ProjectSummary | null
  report: ProjectReport | null
  generated_at: number
  cached: boolean
}

export interface NeighborEntity {
  name: string
  type: string
}

export interface ProjectItem {
  name: string
  description: string
  people: NeighborEntity[]
  companies: NeighborEntity[]
  tasks: NeighborEntity[]
  events: NeighborEntity[]
  documents: NeighborEntity[]
  systems: NeighborEntity[]
  locations: NeighborEntity[]
  other_neighbors: NeighborEntity[]
  ai_summary: ProjectSummary | null
}

export interface PaginatedProjects {
  projects: ProjectItem[]
  total: number
  page: number
  page_size: number
}

export interface AnalysisHistoryItem {
  id: string
  generated_at: number
  summary: ProjectSummary | null
  report: ProjectReport | null
  is_latest: boolean
}

export interface AnalysisHistory {
  project_name: string
  items: AnalysisHistoryItem[]
}

export const projectsApi = {
  list: (page = 1, pageSize = 20) =>
    request<PaginatedProjects>(`/projects?page=${page}&page_size=${pageSize}`),

  delete: (name: string) =>
    request<{ deleted: boolean; project_name: string }>(`/projects/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  getAnalysis: (name: string) =>
    request<ProjectAnalysis>(`/projects/${encodeURIComponent(name)}/analysis`),

  getHistory: (name: string) =>
    request<AnalysisHistory>(`/projects/${encodeURIComponent(name)}/history`),

  analyze: (name: string, handlers: Parameters<typeof sseStream>[2]) =>
    sseStream(`/projects/${encodeURIComponent(name)}/analyze`, {}, handlers),
}
