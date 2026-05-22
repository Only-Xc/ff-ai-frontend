import { useEffect, useMemo } from 'react'

import { RenderErrorBlock } from './components/RenderErrorBlock'
import { renderNode } from './runtime/renderNode'
import {
  groupNodeErrors,
  hasSchemaErrors,
  validateSchema,
} from './runtime/validateSchema'
import type { SchemaRendererProps } from './types'

export function SchemaRenderer({
  schema,
  className,
  style,
  onError,
}: SchemaRendererProps) {
  const validation = useMemo(() => validateSchema(schema), [schema])
  const schemaErrors = validation.errors.filter(
    (error) => error.scope === 'schema',
  )
  const errorsByNode = useMemo(
    () => groupNodeErrors(validation.errors),
    [validation.errors],
  )

  useEffect(() => {
    if (!onError) return

    validation.errors.forEach((error) => onError(error))
  }, [onError, validation.errors])

  if (!schema) return null

  if (!validation.schema || hasSchemaErrors(validation.errors)) {
    return (
      <div className={className} style={style}>
        <RenderErrorBlock errors={schemaErrors} />
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <div className="flex flex-col gap-4 min-w-0">
        {validation.schema.page.children.map((node) =>
          renderNode(node, errorsByNode),
        )}
      </div>
    </div>
  )
}
