import type { ReactNode } from 'react'

import { RenderErrorBlock } from '../components/RenderErrorBlock'
import { componentRegistry } from '../registry/componentRegistry'
import { normalizeProps } from './normalizeProps'
import type { SchemaNode, SchemaRenderError } from '../types'

export function renderNode(
  node: SchemaNode,
  errorsByNode: Map<string, SchemaRenderError[]>,
): ReactNode {
  const nodeErrors = errorsByNode.get(node.id)

  if (nodeErrors && nodeErrors.length > 0) {
    return (
      <RenderErrorBlock
        key={node.id}
        title={`节点渲染失败：${node.id}`}
        errors={nodeErrors}
      />
    )
  }

  const registryItem = componentRegistry.get(node.component)

  if (!registryItem) {
    return (
      <RenderErrorBlock
        key={node.id}
        errors={[
          {
            scope: 'node',
            code: 'node.component',
            message: `组件未注册：${node.component}`,
            path: `node.${node.id}.component`,
            nodeId: node.id,
          },
        ]}
      />
    )
  }

  const children = registryItem.acceptsChildren
    ? node.children?.map((child) => renderNode(child, errorsByNode))
    : undefined

  return (
    <div key={node.id} className="min-w-0" data-schema-node-id={node.id}>
      {registryItem.render({
        node,
        props: normalizeProps(node.props),
        children,
      })}
    </div>
  )
}
