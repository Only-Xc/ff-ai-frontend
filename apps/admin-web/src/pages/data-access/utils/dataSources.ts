import type {
  AdminDataSource,
  AdminDataSourceCreateBody,
  DataSourceConfig,
  HttpApiDataSourceConfig,
  PostgreSQLDataSourceConfig,
} from '@/api/data-access'

import type { DataSourceFormValues } from '../types'

function normalizedCredentialValue(value?: string, authType?: string) {
  let trimmed = value?.trim()
  if (authType === 'bearer') {
    trimmed = trimmed?.replace(/^Bearer\s+/i, '')
  }
  return trimmed === '' ? undefined : trimmed
}

function normalizedOptionalValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed === '' ? undefined : trimmed
}

function parseJsonObject(value?: string) {
  if (!value?.trim()) return {}
  const parsed: unknown = JSON.parse(value)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('Expected a JSON object')
  }
  return parsed as Record<string, unknown>
}

function formatJsonObject(value?: Record<string, unknown> | null) {
  return value && Object.keys(value).length > 0
    ? JSON.stringify(value, null, 2)
    : undefined
}

export function dataSourceConnectionLabel(source: AdminDataSource) {
  if (source.source_type === 'postgresql') {
    const config = source.config as unknown as PostgreSQLDataSourceConfig
    return `${config.host}:${config.port}/${config.database}`
  }
  const config = source.config as unknown as HttpApiDataSourceConfig
  return config.base_url
}

export function dataSourceToFormValues(
  source: AdminDataSource,
): DataSourceFormValues {
  if (source.source_type === 'postgresql') {
    const config = source.config as unknown as PostgreSQLDataSourceConfig
    return {
      name: source.name,
      code: source.code,
      type: source.source_type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      schemaName: config.schema_name,
      sslMode: config.ssl_mode,
      connectTimeoutSeconds: config.connect_timeout_seconds,
      poolSize: config.pool_size,
    }
  }

  const config = source.config as unknown as HttpApiDataSourceConfig
  return {
    name: source.name,
    code: source.code,
    type: source.source_type,
    baseUrl: config.base_url,
    healthMethod: config.health_method ?? 'GET',
    healthPath: config.health_path,
    healthQueryJson: formatJsonObject(config.health_query),
    healthBodyJson: formatJsonObject(config.health_body),
    healthExpectedStatus: config.health_expected_status ?? 200,
    metadataPath: config.metadata_path ?? undefined,
    authType: config.auth_type,
    authHeader: config.auth_header,
    loginPath: config.login_path ?? undefined,
    loginBodyJson: formatJsonObject(config.login_body),
    tokenPath: config.token_path ?? 'data.token',
    credentialTransform: config.credential_transform ?? 'none',
    credentialTransformKey: config.credential_transform_key ?? undefined,
    credentialTransformIv: config.credential_transform_iv ?? undefined,
    timeoutSeconds: config.timeout_seconds,
    verifyTls: config.verify_tls,
    preserveResponseEnvelope: config.preserve_response_envelope ?? false,
  }
}

export function dataSourceFormToPayload(
  values: DataSourceFormValues,
): AdminDataSourceCreateBody {
  const credentialRef = normalizedCredentialValue(
    values.credentialRef,
    values.authType,
  )
  let config: DataSourceConfig

  if (values.type === 'postgresql') {
    config = {
      type: 'postgresql',
      host: values.host ?? '',
      port: values.port ?? 5432,
      database: values.database ?? '',
      username: values.username ?? '',
      credential_ref: credentialRef,
      schema_name: values.schemaName ?? 'public',
      ssl_mode: values.sslMode ?? 'prefer',
      connect_timeout_seconds: values.connectTimeoutSeconds ?? 5,
      pool_size: values.poolSize ?? 5,
    }
  } else {
    const metadataPath = values.metadataPath?.trim()
    const healthBody = parseJsonObject(values.healthBodyJson)
    const loginBody = parseJsonObject(values.loginBodyJson)
    config = {
      type: 'http_api',
      base_url: values.baseUrl ?? '',
      health_method: values.healthMethod ?? 'GET',
      health_path: values.healthPath ?? '/',
      health_query: parseJsonObject(values.healthQueryJson),
      health_body:
        values.healthMethod === 'POST' && Object.keys(healthBody).length > 0
          ? healthBody
          : undefined,
      health_expected_status: values.healthExpectedStatus ?? 200,
      metadata_path: metadataPath === '' ? undefined : metadataPath,
      auth_type: values.authType ?? 'none',
      auth_header: values.authHeader ?? 'Authorization',
      login_path: normalizedOptionalValue(values.loginPath),
      login_body:
        values.authType === 'login_bearer' && Object.keys(loginBody).length > 0
          ? loginBody
          : undefined,
      token_path: normalizedOptionalValue(values.tokenPath) ?? 'data.token',
      credential_transform: values.credentialTransform ?? 'none',
      credential_transform_key: normalizedOptionalValue(
        values.credentialTransformKey,
      ),
      credential_transform_iv: normalizedOptionalValue(
        values.credentialTransformIv,
      ),
      credential_ref: credentialRef,
      timeout_seconds: values.timeoutSeconds ?? 10,
      verify_tls: values.verifyTls ?? true,
      preserve_response_envelope: values.preserveResponseEnvelope ?? false,
    }
  }

  return {
    name: values.name.trim(),
    code: values.code.trim(),
    config,
  }
}
