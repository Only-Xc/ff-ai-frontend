import { requestClient } from '@/utils/request'

export type AdminTaskStatusFilter =
  | 'active'
  | 'pending_approval'
  | 'completed'
  | 'failed'

export type AdminTaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

export interface AdminTaskError {
  stage: string
  message: string
}

export interface AdminTaskSnapshotContextLine {
  line_no: number
  content: string
}

export interface AdminTaskSnapshotError {
  stage: string
  context: AdminTaskSnapshotContextLine[] | null
  message: string
  failed_at: string
  traceback: string | null
  error_type: string
  failed_file: string | null
  failed_line: number | null
}

export interface AdminTaskSourceCode {
  branch: string
  repo_url: string
  clone_url: string
  commit_sha: string
}

export interface AdminTaskSnapshot {
  error: AdminTaskSnapshotError | null
  title: string
  status: AdminTaskStatus
  task_id: string
  tenant_id: string
  retry_count: number
  snapshot_at: string
  source_code: AdminTaskSourceCode | null
  current_node: string
  payload_summary: Record<string, unknown>
}

export interface AdminTaskActionResponse {
  status: AdminTaskStatus
  message: string
  task_id: string
}

export interface AdminTaskRejectBody {
  reason: string
  operator_id?: string
}

export interface AdminTaskRepromptBody {
  prompt_hint: string
  operator_id?: string
}

export interface AdminTask {
  title: string
  status: AdminTaskStatus
  task_id: string
  tenant_id: string
  created_at: string
  updated_at: string
  last_error: AdminTaskError | null
  retry_count: number
  current_node: string
}

export interface AdminTaskListParams {
  status?: AdminTaskStatusFilter
  skip: number
  limit: number
}

export interface AdminTaskListAllParams {
  status?: AdminTaskStatusFilter
}

export interface AdminTaskListResponse {
  data: AdminTask[]
  count: number
}

const ADMIN_TASKS_PAGE_LIMIT = 500
const useMockAdminTasks = import.meta.env.DEV

const mockTasks: AdminTask[] = [
  {
    title: '合同审查智能体生成',
    status: 'ANALYZING',
    task_id: 'task-admin-20260521-001',
    tenant_id: 'tenant-finance-cn',
    created_at: '2026-05-21T08:30:00+08:00',
    updated_at: '2026-05-21T09:12:00+08:00',
    last_error: null,
    retry_count: 0,
    current_node: 'requirement_parser',
  },
  {
    title: '售后工单分流流程',
    status: 'CODING',
    task_id: 'task-admin-20260521-002',
    tenant_id: 'tenant-retail-sh',
    created_at: '2026-05-21T09:05:00+08:00',
    updated_at: '2026-05-21T10:18:00+08:00',
    last_error: null,
    retry_count: 1,
    current_node: 'agent_builder',
  },
  {
    title: '采购审批自动化助手',
    status: 'PENDING_APPROVAL',
    task_id: 'task-admin-20260521-003',
    tenant_id: 'tenant-ops-hz',
    created_at: '2026-05-21T09:40:00+08:00',
    updated_at: '2026-05-21T10:35:00+08:00',
    last_error: null,
    retry_count: 0,
    current_node: 'approval_gate',
  },
  {
    title: '发票核验服务部署',
    status: 'DEPLOYING',
    task_id: 'task-admin-20260520-004',
    tenant_id: 'tenant-tax-bj',
    created_at: '2026-05-20T16:20:00+08:00',
    updated_at: '2026-05-21T10:02:00+08:00',
    last_error: null,
    retry_count: 0,
    current_node: 'container_deploy',
  },
  {
    title: '知识库同步巡检任务',
    status: 'FAILED',
    task_id: 'task-admin-20260520-005',
    tenant_id: 'tenant-support-gz',
    created_at: '2026-05-20T13:45:00+08:00',
    updated_at: '2026-05-20T14:06:00+08:00',
    last_error: {
      stage: 'vector_index',
      message: '知识库向量索引构建超时，请检查源数据连接。',
    },
    retry_count: 3,
    current_node: 'vector_index',
  },
  {
    title: '客户咨询摘要应用',
    status: 'TESTING',
    task_id: 'task-admin-20260520-006',
    tenant_id: 'tenant-sales-sz',
    created_at: '2026-05-20T10:10:00+08:00',
    updated_at: '2026-05-21T09:50:00+08:00',
    last_error: null,
    retry_count: 0,
    current_node: 'quality_gate',
  },
  {
    title: '企业费用问答助手',
    status: 'COMPLETED',
    task_id: 'task-admin-20260519-007',
    tenant_id: 'tenant-hr-cd',
    created_at: '2026-05-19T15:00:00+08:00',
    updated_at: '2026-05-19T17:24:00+08:00',
    last_error: null,
    retry_count: 0,
    current_node: 'completed',
  },
  {
    title: '异常测试工单 - 支付回调修复',
    status: 'PENDING_APPROVAL',
    task_id: 'task-admin-local-redcard-001',
    tenant_id: 'tenant-test-local',
    created_at: '2026-05-21T11:05:00+08:00',
    updated_at: '2026-05-21T11:18:00+08:00',
    last_error: {
      stage: 'TESTING',
      message:
        '支付回调测试失败：签名校验分支缺少空 payload 保护，等待人工介入。',
    },
    retry_count: 2,
    current_node: 'quality_gate',
  },
]

const mockSnapshotOverrides: Record<
  string,
  Pick<
    AdminTaskSnapshot,
    'error' | 'source_code' | 'payload_summary' | 'snapshot_at'
  >
> = {
  'task-admin-20260521-003': {
    snapshot_at: '2026-05-21T10:36:20+08:00',
    source_code: {
      branch: 'feature/procurement-approval-agent',
      repo_url:
        'https://git.example.com/ff-ai/tasks/procurement-approval-agent.git',
      clone_url:
        'https://deploy-token:***@git.example.com/ff-ai/tasks/procurement-approval-agent.git',
      commit_sha: '7c0b9b80a4b6b0d61019a2a6f8fd25755f2dd47b',
    },
    error: {
      stage: 'TESTING',
      context: [
        { line_no: 1, content: 'from main import parse_approval_payload' },
        { line_no: 2, content: '' },
        { line_no: 3, content: 'def test_parse_approval_payload():' },
        { line_no: 4, content: '    result = parse_approval_payload({})' },
        { line_no: 5, content: "    assert result['approved'] is True" },
      ],
      message:
        "pytest 执行失败：KeyError: 'approved'。采购审批 payload 缺少默认审批结论，测试阶段进入人工介入。",
      failed_at: '2026-05-21T10:35:48+08:00',
      traceback:
        'E   KeyError: approved\n\ntests/test_main.py:5: KeyError\n=========================== short test summary info ===========================\nFAILED tests/test_main.py::test_parse_approval_payload',
      error_type: 'KeyError',
      failed_file: 'tests/test_main.py',
      failed_line: 5,
    },
    payload_summary: {
      routing_result: '采购审批自动化助手',
      generated_files: ['main.py', 'tests/test_main.py', 'README.md'],
      failed_command: 'pytest -q',
    },
  },
  'task-admin-local-redcard-001': {
    snapshot_at: '2026-05-21T11:18:36+08:00',
    source_code: {
      branch: 'feature/payment-callback-fix',
      repo_url:
        'https://git.example.com/ff-ai/tasks/payment-callback-agent.git',
      clone_url:
        'https://deploy-token:***@git.example.com/ff-ai/tasks/payment-callback-agent.git',
      commit_sha: '2a4a0f7c8f24d9b3d13b41d5780f859afda4a11c',
    },
    error: {
      stage: 'TESTING',
      context: [
        { line_no: 17, content: 'def verify_callback(payload, signature):' },
        { line_no: 18, content: '    digest = build_digest(payload)' },
        {
          line_no: 19,
          content: '    return hmac.compare_digest(digest, signature)',
        },
        { line_no: 20, content: '' },
        { line_no: 21, content: 'def handle_callback(payload, signature):' },
        {
          line_no: 22,
          content: '    if not verify_callback(payload, signature):',
        },
        {
          line_no: 23,
          content: "        raise ValueError('invalid signature')",
        },
      ],
      message:
        'pytest 执行失败：TypeError: object supporting the buffer API required。空 payload 进入签名校验后未被拦截。',
      failed_at: '2026-05-21T11:17:54+08:00',
      traceback:
        'E   TypeError: object supporting the buffer API required\n\nsrc/payment/callback.py:18: TypeError\nFAILED tests/test_payment_callback.py::test_empty_payload_returns_bad_request',
      error_type: 'TypeError',
      failed_file: 'src/payment/callback.py',
      failed_line: 18,
    },
    payload_summary: {
      failed_command: 'pytest tests/test_payment_callback.py -q',
      generated_files: [
        'src/payment/callback.py',
        'tests/test_payment_callback.py',
      ],
      suggested_fix:
        '在 handle_callback 入口增加空 payload 校验，并返回明确的 bad request 结果。',
    },
  },
}

function isActiveTaskStatus(status: AdminTaskStatus) {
  return [
    'CREATED',
    'ANALYZING',
    'ROUTING',
    'CODING',
    'TESTING',
    'DEPLOYING',
    'PENDING_APPROVAL',
  ].includes(status)
}

function filterTasks(status?: AdminTaskStatusFilter) {
  if (!status) return mockTasks

  if (status === 'active') {
    return mockTasks.filter((task) => isActiveTaskStatus(task.status))
  }

  const statusMap: Record<
    Exclude<AdminTaskStatusFilter, 'active'>,
    AdminTaskStatus
  > = {
    completed: 'COMPLETED',
    failed: 'FAILED',
    pending_approval: 'PENDING_APPROVAL',
  }

  return mockTasks.filter((task) => task.status === statusMap[status])
}

function paginate(
  tasks: AdminTask[],
  params: AdminTaskListParams,
): AdminTaskListResponse {
  return {
    data: tasks.slice(params.skip, params.skip + params.limit),
    count: tasks.length,
  }
}

function getMockTask(taskId: string) {
  return mockTasks.find((task) => task.task_id === taskId)
}

function createMockError(task: AdminTask): AdminTaskSnapshotError | null {
  if (!task.last_error) return null

  return {
    stage: task.last_error.stage,
    context: null,
    message: task.last_error.message,
    failed_at: task.updated_at,
    traceback: null,
    error_type: 'RuntimeError',
    failed_file: null,
    failed_line: null,
  }
}

function createMockSnapshot(task: AdminTask): AdminTaskSnapshot {
  const override = mockSnapshotOverrides[task.task_id]

  return {
    title: task.title,
    status: task.status,
    task_id: task.task_id,
    tenant_id: task.tenant_id,
    retry_count: task.retry_count,
    snapshot_at: override?.snapshot_at ?? task.updated_at,
    source_code: override?.source_code ?? null,
    current_node: task.current_node,
    payload_summary: override?.payload_summary ?? {},
    error: override?.error ?? createMockError(task),
  }
}

export function adminTasks_list(
  params: AdminTaskListParams,
): Promise<AdminTaskListResponse> {
  if (useMockAdminTasks) {
    return Promise.resolve(paginate(filterTasks(params.status), params))
  }

  return requestClient({
    url: '/api/admin/tasks',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}

export async function adminTasks_listAll({
  status,
}: AdminTaskListAllParams): Promise<AdminTaskListResponse> {
  const firstPage = await adminTasks_list({
    status,
    skip: 0,
    limit: ADMIN_TASKS_PAGE_LIMIT,
  })

  if (firstPage.data.length >= firstPage.count) {
    return firstPage
  }

  const requests: Promise<AdminTaskListResponse>[] = []

  for (
    let skip = ADMIN_TASKS_PAGE_LIMIT;
    skip < firstPage.count;
    skip += ADMIN_TASKS_PAGE_LIMIT
  ) {
    requests.push(
      adminTasks_list({
        status,
        skip,
        limit: ADMIN_TASKS_PAGE_LIMIT,
      }),
    )
  }

  const restPages = await Promise.all(requests)

  return {
    count: firstPage.count,
    data: [...firstPage.data, ...restPages.flatMap((page) => page.data)],
  }
}

export function adminTasks_getSnapshot(
  taskId: string,
): Promise<AdminTaskSnapshot> {
  if (useMockAdminTasks) {
    const task = getMockTask(taskId)

    if (!task) {
      return Promise.reject(new Error('工单不存在'))
    }

    return Promise.resolve(createMockSnapshot(task))
  }

  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/snapshot`,
    method: 'GET',
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}

export function adminTasks_reprompt(
  taskId: string,
  data: AdminTaskRepromptBody,
): Promise<AdminTaskActionResponse> {
  if (useMockAdminTasks) {
    const task = getMockTask(taskId)

    if (!task) {
      return Promise.reject(new Error('工单不存在'))
    }

    task.status = 'CODING'
    task.current_node = 'agent_builder'
    task.last_error = null
    task.retry_count += 1
    task.updated_at = new Date().toISOString()

    return Promise.resolve({
      status: task.status,
      message: data.prompt_hint ? '已注入 Prompt，工单回到编码节点' : '已重跑',
      task_id: task.task_id,
    })
  }

  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/reprompt`,
    method: 'POST',
    data,
  })
}

export function adminTasks_reject(
  taskId: string,
  data: AdminTaskRejectBody,
): Promise<AdminTaskActionResponse> {
  if (useMockAdminTasks) {
    const task = getMockTask(taskId)

    if (!task) {
      return Promise.reject(new Error('工单不存在'))
    }

    task.status = 'FAILED'
    task.current_node = 'rejected'
    task.last_error = {
      stage: 'TASK_REJECTED',
      message: data.reason,
    }
    task.updated_at = new Date().toISOString()

    return Promise.resolve({
      status: task.status,
      message: '已驳回工单',
      task_id: task.task_id,
    })
  }

  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/reject`,
    method: 'POST',
    data,
  })
}
