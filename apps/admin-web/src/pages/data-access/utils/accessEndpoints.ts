import type {
  AdminAccessEndpoint,
  AdminAccessEndpointCreateBody,
  DataSourceType,
} from '@/api/data-access'

import type { EndpointFormValues, EndpointParameterFormValues } from '../types'

function normalizedFields(values: string[]) {
  return [
    ...new Set(
      values
        .flatMap((value) => value.split(/[\s,]+/))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]
}

export function accessEndpointToFormValues(
  endpoint: AdminAccessEndpoint,
): EndpointFormValues {
  const querySpec = endpoint.query_spec
  const parameters: EndpointParameterFormValues[] =
    endpoint.allowed_parameters.map((parameter) => ({
      ...parameter,
      target:
        querySpec.type === 'postgresql'
          ? (querySpec.parameter_columns[parameter.name] ?? parameter.name)
          : (querySpec.parameter_locations[parameter.name] ?? 'query'),
    }))

  return {
    name: endpoint.name,
    code: endpoint.endpoint_code,
    sourceId: endpoint.source_id,
    mode: endpoint.mode,
    table: querySpec.type === 'postgresql' ? querySpec.table : undefined,
    path: querySpec.type === 'http_api' ? querySpec.path : undefined,
    method: querySpec.type === 'http_api' ? querySpec.method : undefined,
    availableFields: endpoint.available_fields,
    parameters,
  }
}

export function accessEndpointFormToPayload(
  values: EndpointFormValues,
  sourceType: DataSourceType,
): AdminAccessEndpointCreateBody {
  const availableFields = normalizedFields(values.availableFields)
  const parameters = values.parameters
    .map((parameter) => ({
      ...parameter,
      name: parameter.name.trim(),
      target: parameter.target.trim(),
    }))
    .filter((parameter) => parameter.name && parameter.target)

  const querySpec =
    sourceType === 'postgresql'
      ? {
          type: 'postgresql' as const,
          table: values.table?.trim() ?? '',
          parameter_columns: Object.fromEntries(
            parameters.map((parameter) => [parameter.name, parameter.target]),
          ),
          default_fields: availableFields,
        }
      : {
          type: 'http_api' as const,
          path: values.path?.trim() ?? '',
          method: values.method ?? 'GET',
          parameter_locations: Object.fromEntries(
            parameters.map((parameter) => [
              parameter.name,
              parameter.target === 'body' ? 'body' : 'query',
            ]),
          ) as Record<string, 'body' | 'query'>,
          default_fields: availableFields,
        }

  return {
    source_id: values.sourceId,
    name: values.name.trim(),
    endpoint_code: values.code.trim(),
    mode: values.mode,
    query_spec: querySpec,
    allowed_parameters: parameters.map(({ name, required, type }) => ({
      name,
      required,
      type,
    })),
    available_fields: availableFields,
  }
}
