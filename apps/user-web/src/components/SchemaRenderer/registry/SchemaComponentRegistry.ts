import type { SchemaComponentDefinition } from '../types'

export class SchemaComponentRegistry {
  private readonly components = new Map<string, SchemaComponentDefinition>()

  constructor(definitions: SchemaComponentDefinition[] = []) {
    definitions.forEach((definition) => this.register(definition))
  }

  register(definition: SchemaComponentDefinition): this {
    this.components.set(definition.name, definition)
    return this
  }

  get(name: string): SchemaComponentDefinition | undefined {
    return this.components.get(name)
  }

  has(name: string): boolean {
    return this.components.has(name)
  }

  listNames(): string[] {
    return Array.from(this.components.keys())
  }

  isContainer(name: string): boolean {
    return this.components.get(name)?.acceptsChildren ?? false
  }
}
