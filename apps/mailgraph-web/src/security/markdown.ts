import DOMPurify from 'dompurify'
import { marked } from 'marked'

const MARKDOWN_ALLOWED_TAGS = [
  'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'hr', 'li', 'ol', 'p', 'pre', 'strong', 'table', 'tbody',
  'td', 'th', 'thead', 'tr', 'ul',
]

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function renderSafeMarkdown(raw: string): string {
  return DOMPurify.sanitize(marked.parse(raw) as string, {
    ALLOWED_TAGS: MARKDOWN_ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
}
