import { requestClient } from '@/utils/request'

export type AdminSkillEnvironment = 'UAT' | 'PROD'
export type AdminSkillStatus = 'hot' | 'cold' | 'deprecated'

export interface AdminSkillCodeSnippet {
  language: string
  filename: string
  content: string
}

export interface AdminSkillListItem {
  skill_id: string
  name: string
  category: string
  description?: string
  environment: AdminSkillEnvironment
  status: AdminSkillStatus
  version: string
  call_count: number
  success_rate: number | null
  created_at: string
  updated_at: string
}

export interface AdminSkillDetail extends AdminSkillListItem {
  prompt: string
  code_snippets: AdminSkillCodeSnippet[]
  embedding_tags: string[]
  metadata: Record<string, unknown>
}

export interface AdminSkillListParams {
  category?: string
  environment?: AdminSkillEnvironment
  status?: AdminSkillStatus
  keyword?: string
  skip: number
  limit: number
}

export interface AdminSkillListResponse {
  data: AdminSkillListItem[]
  count: number
}

export interface AdminSkillCreateBody {
  name: string
  category: string
  description?: string
  prompt: string
  code_snippets?: AdminSkillCodeSnippet[]
  environment?: AdminSkillEnvironment
  status?: Exclude<AdminSkillStatus, 'deprecated'>
  embedding_tags?: string[]
  metadata?: Record<string, unknown>
}

export type AdminSkillUpdateBody = Partial<
  Omit<AdminSkillCreateBody, 'status'> & {
    status: AdminSkillStatus
  }
>

export interface AdminSkillActionResponse {
  message: string
  skill_id?: string
}

const useMockAdminSkills = import.meta.env.DEV

let mockSkills: AdminSkillDetail[] = [
  {
    skill_id: 'skill-python-etl',
    name: 'Python ETL 技能',
    category: 'python-etl',
    description: '基于 Pandas 的数据清洗与转换技能，支持 MySQL/PostgreSQL 数据源',
    prompt:
      '你是一个 Python ETL 专家。请根据用户需求编写数据清洗脚本，并保证 SQL 防注入、分批处理和日志输出。',
    code_snippets: [
      {
        language: 'python',
        filename: 'etl_pipeline.py',
        content:
          'import pandas as pd\nfrom sqlalchemy import create_engine\n\ndef extract(query, conn_str):\n    engine = create_engine(conn_str)\n    return pd.read_sql(query, engine)',
      },
    ],
    environment: 'PROD',
    status: 'hot',
    version: 'v1.2.3',
    call_count: 1280,
    success_rate: 0.973,
    embedding_tags: ['数据清洗', 'ETL', 'Pandas', 'MySQL', 'PostgreSQL'],
    metadata: {
      owner: 'data-platform',
      timeout_seconds: 120,
    },
    created_at: '2026-05-21T10:00:00+08:00',
    updated_at: '2026-05-21T16:00:00+08:00',
  },
  {
    skill_id: 'skill-react-admin',
    name: 'React Admin 页面生成',
    category: 'frontend-react',
    description: '生成 Ant Design 管理端页面，支持表格、表单和详情抽屉',
    prompt:
      '你是一个 React 管理端开发专家。请生成符合 Ant Design 和项目布局规范的页面代码。',
    code_snippets: [
      {
        language: 'typescript',
        filename: 'AdminTable.tsx',
        content:
          "import { Table } from 'antd'\n\nexport function AdminTable() {\n  return <Table pagination={false} />\n}",
      },
    ],
    environment: 'UAT',
    status: 'cold',
    version: 'v0.8.0',
    call_count: 326,
    success_rate: 0.918,
    embedding_tags: ['React', 'Ant Design', 'CRUD', 'Table'],
    metadata: {
      owner: 'frontend-platform',
    },
    created_at: '2026-05-19T09:30:00+08:00',
    updated_at: '2026-05-20T11:10:00+08:00',
  },
  {
    skill_id: 'skill-sql-review',
    name: 'SQL 审查技能',
    category: 'database',
    description: '检查 SQL 性能风险、索引使用和危险写操作',
    prompt:
      '你是一个数据库审查专家。请识别 SQL 中的性能风险、锁表风险和数据破坏风险。',
    code_snippets: [
      {
        language: 'sql',
        filename: 'index_check.sql',
        content: 'EXPLAIN ANALYZE SELECT * FROM orders WHERE tenant_id = ?;',
      },
    ],
    environment: 'PROD',
    status: 'deprecated',
    version: 'v1.0.1',
    call_count: 892,
    success_rate: null,
    embedding_tags: ['SQL', '索引', '审查'],
    metadata: {},
    created_at: '2026-05-10T14:15:00+08:00',
    updated_at: '2026-05-18T18:20:00+08:00',
  },
]

function toListItem(skill: AdminSkillDetail): AdminSkillListItem {
  return {
    skill_id: skill.skill_id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    environment: skill.environment,
    status: skill.status,
    version: skill.version,
    call_count: skill.call_count,
    success_rate: skill.success_rate,
    created_at: skill.created_at,
    updated_at: skill.updated_at,
  }
}

function filterSkills(params: AdminSkillListParams) {
  const keyword = params.keyword?.trim().toLowerCase()

  return mockSkills.filter((skill) => {
    if (params.category && skill.category !== params.category) return false
    if (params.environment && skill.environment !== params.environment) {
      return false
    }
    if (params.status && skill.status !== params.status) return false
    if (!keyword) return true

    return (
      skill.name.toLowerCase().includes(keyword) ||
      skill.description?.toLowerCase().includes(keyword)
    )
  })
}

function paginateSkills(params: AdminSkillListParams): AdminSkillListResponse {
  const filtered = filterSkills(params)

  return {
    data: filtered
      .slice(params.skip, params.skip + params.limit)
      .map(toListItem),
    count: filtered.length,
  }
}

function getMockSkill(skillId: string) {
  return mockSkills.find((skill) => skill.skill_id === skillId)
}

function createSkillId(name: string) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'custom'

  return `skill-${slug}-${Date.now()}`
}

export function adminSkills_list(
  params: AdminSkillListParams,
): Promise<AdminSkillListResponse> {
  if (useMockAdminSkills) {
    return Promise.resolve(paginateSkills(params))
  }

  return requestClient({
    url: '/api/admin/skills',
    method: 'GET',
    params,
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}

export function adminSkills_get(skillId: string): Promise<AdminSkillDetail> {
  if (useMockAdminSkills) {
    const skill = getMockSkill(skillId)

    if (!skill) {
      return Promise.reject(new Error('Skill 不存在'))
    }

    return Promise.resolve({
      ...skill,
      code_snippets: skill.code_snippets.map((snippet) => ({ ...snippet })),
      embedding_tags: [...skill.embedding_tags],
      metadata: { ...skill.metadata },
    })
  }

  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'GET',
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}

export function adminSkills_create(
  data: AdminSkillCreateBody,
): Promise<AdminSkillActionResponse> {
  if (useMockAdminSkills) {
    const now = new Date().toISOString()
    const skillId = createSkillId(data.name)

    mockSkills = [
      {
        skill_id: skillId,
        name: data.name,
        category: data.category,
        description: data.description,
        prompt: data.prompt,
        code_snippets: data.code_snippets ?? [],
        environment: data.environment ?? 'PROD',
        status: data.status ?? 'hot',
        version: 'v1.0.0',
        call_count: 0,
        success_rate: null,
        embedding_tags: data.embedding_tags ?? [],
        metadata: data.metadata ?? {},
        created_at: now,
        updated_at: now,
      },
      ...mockSkills,
    ]

    return Promise.resolve({
      message: 'created',
      skill_id: skillId,
    })
  }

  return requestClient({
    url: '/api/admin/skills',
    method: 'POST',
    data,
  })
}

export function adminSkills_update(
  skillId: string,
  data: AdminSkillUpdateBody,
): Promise<AdminSkillActionResponse> {
  if (useMockAdminSkills) {
    const skill = getMockSkill(skillId)

    if (!skill) {
      return Promise.reject(new Error('Skill 不存在'))
    }

    Object.assign(skill, data, {
      updated_at: new Date().toISOString(),
    })

    return Promise.resolve({
      message: 'updated',
      skill_id: skillId,
    })
  }

  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'PUT',
    data,
  })
}

export function adminSkills_delete(
  skillId: string,
): Promise<AdminSkillActionResponse> {
  if (useMockAdminSkills) {
    mockSkills = mockSkills.filter((skill) => skill.skill_id !== skillId)

    return Promise.resolve({
      message: 'deleted',
    })
  }

  return requestClient({
    url: `/api/admin/skills/${encodeURIComponent(skillId)}`,
    method: 'DELETE',
  })
}
