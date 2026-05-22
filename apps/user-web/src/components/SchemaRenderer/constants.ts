export const SCHEMA_VERSION = '1.0'
export const MAX_SCHEMA_DEPTH = 6
export const MAX_SCHEMA_NODES = 80

export const UNSAFE_SCHEMA_KEYS = new Set([
  'script',
  'style',
  'html',
  'dangerouslySetInnerHTML',
  'onClick',
  'dataSourceUrl',
])
