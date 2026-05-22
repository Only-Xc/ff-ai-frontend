import {
  MAX_SCHEMA_DEPTH,
  MAX_SCHEMA_NODES,
  SCHEMA_VERSION,
  UNSAFE_SCHEMA_KEYS,
} from '../constants'
import { componentRegistry } from '../registry/componentRegistry'
import { isRecord, normalizeProps } from './normalizeProps'
import type {
  SchemaNode,
  SchemaRenderError,
  SchemaValidationResult,
} from '../types'

interface WalkState {
  count: number
  errors: SchemaRenderError[]
}

export function validateSchema(schema: unknown): SchemaValidationResult {
  const errors: SchemaRenderError[] = []

  if (!isRecord(schema)) {
    return {
      schema: null,
      errors: [
        createSchemaError('schema.invalid', 'schema 必须是对象', 'schema'),
      ],
    }
  }

  if (schema.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      createSchemaError(
        'schema.version',
        `schemaVersion 必须是 ${SCHEMA_VERSION}`,
        'schema.schemaVersion',
      ),
    )
  }

  if (!isRecord(schema.page)) {
    errors.push(
      createSchemaError('schema.page', 'page 必须是对象', 'schema.page'),
    )
    return { schema: null, errors }
  }

  if (!Array.isArray(schema.page.children)) {
    errors.push(
      createSchemaError(
        'schema.children',
        'page.children 必须是数组',
        'schema.page.children',
      ),
    )
    return { schema: null, errors }
  }

  const state: WalkState = { count: 0, errors }
  schema.page.children.forEach((node, index) => {
    validateNode(node, `schema.page.children.${index}`, 1, state)
  })

  return {
    schema: schema as unknown as SchemaValidationResult['schema'],
    errors,
  }
}

function validateNode(
  node: unknown,
  path: string,
  depth: number,
  state: WalkState,
): void {
  state.count += 1

  if (state.count > MAX_SCHEMA_NODES) {
    state.errors.push(
      createSchemaError(
        'schema.nodes.limit',
        `节点数量不能超过 ${MAX_SCHEMA_NODES}`,
        path,
      ),
    )
    return
  }

  if (depth > MAX_SCHEMA_DEPTH) {
    state.errors.push(
      createNodeError(
        node,
        'node.depth.limit',
        `节点深度不能超过 ${MAX_SCHEMA_DEPTH}`,
        path,
      ),
    )
    return
  }

  if (!isRecord(node)) {
    state.errors.push(
      createNodeError(node, 'node.invalid', '节点必须是对象', path),
    )
    return
  }

  const nodeId =
    typeof node.id === 'string' && node.id.trim() ? node.id : undefined
  if (!nodeId) {
    state.errors.push(
      createNodeError(
        node,
        'node.id',
        '节点 id 必须是非空字符串',
        `${path}.id`,
      ),
    )
  }

  const component = node.component
  const componentDefinition =
    typeof component === 'string' ? componentRegistry.get(component) : undefined

  if (!componentDefinition) {
    state.errors.push(
      createNodeError(
        node,
        'node.component',
        `组件未注册：${String(component)}`,
        `${path}.component`,
      ),
    )
  }

  const props = normalizeProps(node.props)
  validateUnsafeKeys(props, `${path}.props`, nodeId, state)

  if (componentDefinition) {
    componentDefinition.validateProps?.(props, {
      nodeId,
      path,
      addError: (code, message, propPath) => {
        state.errors.push({
          scope: 'node',
          code,
          message,
          path: `${path}.props.${propPath}`,
          nodeId,
        })
      },
    })
  }

  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) {
      state.errors.push(
        createNodeError(
          node,
          'node.children',
          'children 必须是数组',
          `${path}.children`,
        ),
      )
      return
    }

    if (!componentDefinition?.acceptsChildren) {
      state.errors.push(
        createNodeError(
          node,
          'node.children.container',
          'children 只允许用于容器组件',
          `${path}.children`,
        ),
      )
      return
    }

    node.children.forEach((child, index) => {
      validateNode(child, `${path}.children.${index}`, depth + 1, state)
    })
  }
}

function validateUnsafeKeys(
  value: unknown,
  path: string,
  nodeId: string | undefined,
  state: WalkState,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      validateUnsafeKeys(item, `${path}.${index}`, nodeId, state)
    })
    return
  }

  if (!isRecord(value)) return

  Object.entries(value).forEach(([key, child]) => {
    const currentPath = `${path}.${key}`

    if (UNSAFE_SCHEMA_KEYS.has(key)) {
      state.errors.push({
        scope: 'node',
        code: 'node.props.unsafe',
        message: `props 中不允许使用 ${key}`,
        path: currentPath,
        nodeId,
      })
    }

    validateUnsafeKeys(child, currentPath, nodeId, state)
  })
}

function createSchemaError(
  code: string,
  message: string,
  path: string,
): SchemaRenderError {
  return {
    scope: 'schema',
    code,
    message,
    path,
  }
}

function createNodeError(
  node: unknown,
  code: string,
  message: string,
  path: string,
): SchemaRenderError {
  const nodeId =
    isRecord(node) && typeof node.id === 'string' ? node.id : undefined

  return {
    scope: 'node',
    code,
    message,
    path,
    nodeId,
  }
}

export function groupNodeErrors(
  errors: SchemaRenderError[],
): Map<string, SchemaRenderError[]> {
  const groups = new Map<string, SchemaRenderError[]>()

  errors.forEach((error) => {
    if (error.scope !== 'node' || !error.nodeId) return

    const current = groups.get(error.nodeId) ?? []
    current.push(error)
    groups.set(error.nodeId, current)
  })

  return groups
}

export function hasSchemaErrors(errors: SchemaRenderError[]): boolean {
  return errors.some((error) => error.scope === 'schema')
}

export function isSchemaNode(value: unknown): value is SchemaNode {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.component === 'string' &&
    componentRegistry.has(value.component)
  )
}
