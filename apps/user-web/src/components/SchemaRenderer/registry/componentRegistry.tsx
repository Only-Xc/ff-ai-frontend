import { SchemaComponentRegistry } from './SchemaComponentRegistry'
import { builtinComponents } from './builtinComponents'

export const builtinSchemaComponentRegistry = new SchemaComponentRegistry(
  builtinComponents,
)

export const componentRegistry = builtinSchemaComponentRegistry
