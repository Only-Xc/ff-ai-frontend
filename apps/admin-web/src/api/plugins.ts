import { createRequest, path } from '@ff-ai-frontend/api'

import { request } from './_request'

export type WorkflowPublicationStatus =
  | 'pending'
  | 'publishing'
  | 'published'
  | 'superseded'
  | 'failed'
  | 'disabled'
  | 'rolled_back'
  | 'archived'

export interface WorkflowPluginPublication {
  id: string
  organization_id: string
  workflow_app_id: string
  workflow_version_id: string
  plugin_definition_id: string | null
  plugin_version_id: string | null
  installation_id: string | null
  plugin_id: string | null
  name: string
  version: string
  idempotency_key: string
  status: WorkflowPublicationStatus
  current_step: string | null
  retry_count: number
  trace_id: string
  runtime_mode: 'mock' | 'workflow_runtime'
  last_error: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  published_at: string | null
  last_synced_at: string | null
}

export interface WorkflowPluginPublicationList {
  data: WorkflowPluginPublication[]
  count: number
}

export interface WorkflowPublicationQuery {
  organization_id?: string
  status?: WorkflowPublicationStatus
  keyword?: string
  skip?: number
  limit?: number
}

export const workflowPublicationKeys = {
  all: ['workflow-plugin-publications'] as const,
  list: (query: WorkflowPublicationQuery) =>
    [...workflowPublicationKeys.all, query] as const,
}

const listWorkflowPublicationsRequest = (params: WorkflowPublicationQuery) =>
  createRequest<WorkflowPluginPublicationList>(
    'GET',
    '/api/v1/plugins/internal/workflow-publications',
    { params },
  )

const workflowPublicationActionRequest = (
  publication: WorkflowPluginPublication,
  action: 'retry' | 'enable' | 'disable' | 'archive',
) =>
  createRequest<WorkflowPluginPublication>(
    'POST',
    path`/api/v1/plugins/internal/workflow-publications/${publication.workflow_version_id}/${action}`,
    { params: { organization_id: publication.organization_id }, data: {} },
  )

const rollbackWorkflowPublicationRequest = (
  publication: WorkflowPluginPublication,
  targetWorkflowVersionId: string,
) =>
  createRequest<WorkflowPluginPublication>(
    'POST',
    path`/api/v1/plugins/internal/workflow-publications/${publication.workflow_version_id}/rollback`,
    {
      params: { organization_id: publication.organization_id },
      data: { target_workflow_version_id: targetWorkflowVersionId },
    },
  )

export const workflowPublications_list = request(
  listWorkflowPublicationsRequest,
)
export const workflowPublications_action = request(
  workflowPublicationActionRequest,
)
export const workflowPublications_rollback = request(
  rollbackWorkflowPublicationRequest,
)

export interface PluginManifest {
  schema_version?: string
  plugin_id: string
  name: string
  version: string
  delivery: {
    type: string
    repository_url?: string | null
    ref?: string | null
  }
  runtime: {
    type: string
    port?: number
    resources?: PluginRuntimeResourceManifest[]
  }
  services: Record<string, unknown>
  menus: Array<{
    code: string
    title: string
    path: string
    service: string
    required_scope?: string | null
  }>
  permissions: Array<{
    code: string
    name: string
    type: string
  }>
  tenant_config_schema: Record<string, unknown>
  secrets: Array<{
    key: string
    required: boolean
    description?: string | null
  }>
  uninstall_policy: string
  compatibility: Record<string, unknown>
}

export interface PluginRuntimeResourceManifest {
  name: string
  type?: 'app' | 'service' | 'external'
  management?: 'managed' | 'external'
  role?: string
  dependency_order?: number
  depends_on?: string[]
  image?: string | null
  image_digest?: string | null
  port?: number | null
  upstream_url?: string | null
  browser_url?: string | null
  service_type?: 'postgres' | 'redis' | null
}

export interface PluginVersion {
  id: string
  plugin_definition_id: string
  version: string
  image: string
  image_digest: string | null
  migration_status: string
  manifest: PluginManifest
  created_at: string
  verified_at: string | null
}

export interface PluginDefinition {
  id: string
  plugin_id: string
  name: string
  description: string | null
  status: string
  source_type: string
  is_official: boolean
  version_count: number
  installation_count: number
  healthy_installation_count: number
  failed_installation_count: number
  install_in_progress: boolean
  install_block_reason: string | null
  can_delete: boolean
  delete_block_reason: string | null
  manifest: PluginManifest
  created_at: string
  updated_at: string
}

export interface PluginDefinitionDetail extends PluginDefinition {
  versions: PluginVersion[]
}

export interface PluginDefinitionUpdateBody {
  name?: string
  description?: string | null
}

export interface PluginDefinitionDeleteResult {
  plugin_id: string
  deleted: boolean
  deleted_at: string
}

export interface PluginInstallation {
  id: string
  organization_id: string
  plugin_definition_id: string
  plugin_version_id: string
  previous_plugin_version_id: string | null
  instance_id: string
  runtime_app_name: string
  status: string
  desired_status: string
  last_error: Record<string, unknown> | null
  installed_at: string
  updated_at: string
}

export interface PluginPermission {
  id: string
  code: string
  name: string
  description: string | null
  permission_type: string
  service_name: string | null
  path_pattern: string | null
  methods: string[]
  is_active: boolean
}

export interface PluginRuntimeResource {
  id: string
  resource_name: string
  resource_type: string
  resource_role: string
  runtime_name: string
  status: string
  last_error: Record<string, unknown> | null
}

export interface PluginService {
  id: string
  service_name: string
  service_type: string
  public_path: string
  upstream_url: string
  status: string
  last_error: Record<string, unknown> | null
}

export interface PluginRoute {
  id: string
  route_type: string
  path_prefix: string
  required_scope: string | null
  status: string
}

export interface PluginOperation {
  id: string
  trace_id: string
  installation_id: string
  operation: string
  status: string
  current_step: string | null
  steps: Array<Record<string, unknown>>
  attempt_count: number
  max_attempts: number
  last_error: Record<string, unknown> | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

export interface PluginInstallPreflight {
  plugin_id: string
  organization_id: string
  version: string
  runtime_app_name: string
  ready: boolean
  checks: Array<{
    code: string
    label: string
    status: 'passed' | 'warning' | 'failed'
    message: string
  }>
  compatibility: Record<string, unknown>
}

export interface PluginConfig {
  installation_id: string
  values: Record<string, unknown>
  secret_keys: string[]
  updated_at: string | null
}

export interface PluginAudit {
  id: string
  installation_id: string | null
  organization_id: string | null
  actor_id: string | null
  action: string
  status: string
  trace_id: string | null
  detail: Record<string, unknown>
  error_code: string | null
  error_message: string | null
  created_at: string
}

export interface PluginVerification {
  plugin_id: string
  valid: boolean
  version_count: number
  verified_versions: string[]
  checks: Array<Record<string, unknown>>
  verified_at: string
}

export interface PluginListQuery {
  keyword?: string
  skip?: number
  limit?: number
}

export interface PluginInstallBody {
  organization_id: string
  version: string
  runtime_app_name?: string
  config: Record<string, unknown>
  secrets: Record<string, string>
  execute_async: boolean
}

export interface PluginRegistrationBody {
  manifest: PluginManifest
  image?: string | null
  image_digest?: string | null
  description?: string | null
}

interface ListResult<T> {
  data: T[]
  count: number
}

export const pluginKeys = {
  all: ['plugins'] as const,
  list: (query: PluginListQuery) => [...pluginKeys.all, 'list', query] as const,
  detail: (pluginId: string) =>
    [...pluginKeys.all, 'detail', pluginId] as const,
  installations: (pluginId: string) =>
    [...pluginKeys.all, 'installations', pluginId] as const,
  permissions: (pluginId: string) =>
    [...pluginKeys.all, 'permissions', pluginId] as const,
  rolePermission: (
    pluginId: string,
    roleId?: string,
    organizationId?: string,
  ) =>
    [
      ...pluginKeys.all,
      'rolePermission',
      pluginId,
      roleId,
      organizationId,
    ] as const,
  runtime: (pluginId: string, installationId?: string) =>
    [...pluginKeys.all, 'runtime', pluginId, installationId] as const,
  operations: (installationId?: string, status?: string) =>
    [...pluginKeys.all, 'operations', installationId, status] as const,
  config: (pluginId: string, installationId?: string) =>
    [...pluginKeys.all, 'config', pluginId, installationId] as const,
  audits: (pluginId: string, installationId?: string) =>
    [...pluginKeys.all, 'audits', pluginId, installationId] as const,
}

export const plugins_register = request((data: PluginRegistrationBody) =>
  createRequest<PluginDefinitionDetail>('POST', '/api/v1/plugins', { data }),
)

export const plugins_createVersion = request(
  (pluginId: string, data: Omit<PluginRegistrationBody, 'description'>) =>
    createRequest<PluginVersion>(
      'POST',
      path`/api/v1/plugins/${pluginId}/versions`,
      { data },
    ),
)

export const plugins_list = request((params: PluginListQuery) =>
  createRequest<ListResult<PluginDefinition>>('GET', '/api/v1/plugins', {
    params,
  }),
)

export const plugins_get = request((pluginId: string) =>
  createRequest<PluginDefinitionDetail>(
    'GET',
    path`/api/v1/plugins/${pluginId}`,
  ),
)

export const plugins_update = request(
  (pluginId: string, data: PluginDefinitionUpdateBody) =>
    createRequest<PluginDefinitionDetail>(
      'PATCH',
      path`/api/v1/plugins/${pluginId}`,
      { data },
    ),
)

export const plugins_delete = request((pluginId: string) =>
  createRequest<PluginDefinitionDeleteResult>(
    'DELETE',
    path`/api/v1/plugins/${pluginId}`,
  ),
)

export const plugins_installations = request((pluginId: string) =>
  createRequest<ListResult<PluginInstallation>>(
    'GET',
    path`/api/v1/plugins/${pluginId}/installations`,
  ),
)

export const plugins_install = request(
  (pluginId: string, data: PluginInstallBody) =>
    createRequest<{
      installation: PluginInstallation
      operation: PluginOperation
    }>('POST', path`/api/v1/plugins/${pluginId}/install`, { data }),
)

export const plugins_installPreflight = request(
  (pluginId: string, data: PluginInstallBody) =>
    createRequest<PluginInstallPreflight>(
      'POST',
      path`/api/v1/plugins/${pluginId}/install-preflight`,
      { data },
    ),
)

export const plugins_lifecycle = request(
  (
    pluginId: string,
    action: 'enable' | 'disable' | 'restart' | 'uninstall-soft',
    installationId: string,
  ) =>
    createRequest<PluginOperation>(
      'POST',
      path`/api/v1/plugins/${pluginId}/${action}`,
      { data: { installation_id: installationId, execute_async: true } },
    ),
)

export const plugins_upgrade = request(
  (pluginId: string, installationId: string, version: string) =>
    createRequest<PluginOperation>(
      'POST',
      path`/api/v1/plugins/${pluginId}/upgrade`,
      {
        data: { installation_id: installationId, version, execute_async: true },
      },
    ),
)

export const plugins_rollback = request(
  (pluginId: string, installationId: string) =>
    createRequest<PluginOperation>(
      'POST',
      path`/api/v1/plugins/${pluginId}/rollback`,
      { data: { installation_id: installationId, execute_async: true } },
    ),
)

export const plugins_hardUninstall = request(
  (pluginId: string, installationId: string, instanceId: string) =>
    createRequest<PluginOperation>(
      'POST',
      path`/api/v1/plugins/${pluginId}/uninstall-hard`,
      {
        data: {
          installation_id: installationId,
          confirm_instance_id: instanceId,
          backup_acknowledged: true,
          backup_manifest: { acknowledged_at: new Date().toISOString() },
          execute_async: true,
        },
      },
    ),
)

export const plugins_permissions = request((pluginId: string) =>
  createRequest<ListResult<PluginPermission>>(
    'GET',
    path`/api/v1/plugins/${pluginId}/permissions`,
  ),
)

export const plugins_rolePermission = request(
  (pluginId: string, roleId: string, organizationId?: string) =>
    createRequest<{
      role_id: string
      organization_id: string | null
      permission_codes: string[]
    }>('GET', path`/api/v1/plugins/${pluginId}/permissions/roles/${roleId}`, {
      params: { organization_id: organizationId },
    }),
)

export const plugins_updateRolePermission = request(
  (
    pluginId: string,
    roleId: string,
    organizationId: string | undefined,
    permissionCodes: string[],
  ) =>
    createRequest<{
      role_id: string
      organization_id: string | null
      permission_codes: string[]
    }>('PUT', path`/api/v1/plugins/${pluginId}/permissions/roles/${roleId}`, {
      data: {
        organization_id: organizationId ?? null,
        permission_codes: permissionCodes,
      },
    }),
)

export const plugins_runtimeResources = request(
  (pluginId: string, installationId: string) =>
    createRequest<ListResult<PluginRuntimeResource>>(
      'GET',
      path`/api/v1/plugins/${pluginId}/runtime-resources`,
      { params: { installation_id: installationId } },
    ),
)

export const plugins_services = request(
  (pluginId: string, installationId: string) =>
    createRequest<ListResult<PluginService>>(
      'GET',
      path`/api/v1/plugins/${pluginId}/services`,
      { params: { installation_id: installationId } },
    ),
)

export const plugins_routes = request(
  (pluginId: string, installationId: string) =>
    createRequest<ListResult<PluginRoute>>(
      'GET',
      path`/api/v1/plugins/${pluginId}/routes`,
      { params: { installation_id: installationId } },
    ),
)

export const plugins_operations = request(
  (params: {
    installation_id?: string
    status?: string
    skip?: number
    limit?: number
  }) =>
    createRequest<ListResult<PluginOperation>>(
      'GET',
      '/api/v1/plugins/operations',
      {
        params,
      },
    ),
)

export const plugins_operation = request((operationId: string) =>
  createRequest<PluginOperation>(
    'GET',
    path`/api/v1/plugins/operations/${operationId}`,
  ),
)

export const plugins_retryOperation = request((operationId: string) =>
  createRequest<PluginOperation>(
    'POST',
    path`/api/v1/plugins/operations/${operationId}/retry`,
    { params: { execute_async: true } },
  ),
)

export const plugins_config = request(
  (pluginId: string, installationId: string) =>
    createRequest<PluginConfig>(
      'GET',
      path`/api/v1/plugins/${pluginId}/config`,
      {
        params: { installation_id: installationId },
      },
    ),
)

export const plugins_updateConfig = request(
  (
    pluginId: string,
    installationId: string,
    values: Record<string, unknown>,
    secrets: Record<string, string>,
  ) =>
    createRequest<PluginConfig>(
      'PUT',
      path`/api/v1/plugins/${pluginId}/config`,
      {
        params: { installation_id: installationId },
        data: { values, secrets, apply_to_runtime: true },
      },
    ),
)

export const plugins_logs = request(
  (
    pluginId: string,
    installationId: string,
    resourceName: string,
    lines = 200,
  ) =>
    createRequest<{
      installation_id: string
      resource_name: string
      runtime_name: string
      lines: number
      content: string
    }>('GET', path`/api/v1/plugins/${pluginId}/logs`, {
      params: {
        installation_id: installationId,
        resource_name: resourceName,
        lines,
      },
    }),
)

export const plugins_audits = request(
  (pluginId: string, installationId?: string) =>
    createRequest<ListResult<PluginAudit>>(
      'GET',
      path`/api/v1/plugins/${pluginId}/audit-logs`,
      { params: { installation_id: installationId, limit: 200 } },
    ),
)

export const plugins_verify = request(
  (pluginId: string, installationId?: string) =>
    createRequest<PluginVerification>(
      'POST',
      path`/api/v1/plugins/${pluginId}/verify`,
      { params: { installation_id: installationId } },
    ),
)

export const plugins_openapi = request(
  (pluginId: string, organizationId: string) =>
    createRequest<Record<string, unknown>>(
      'GET',
      path`/api/v1/plugins/${pluginId}/openapi`,
      { params: { organization_id: organizationId } },
    ),
)
