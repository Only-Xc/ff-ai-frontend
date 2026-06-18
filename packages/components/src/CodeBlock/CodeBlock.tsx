import { createStyles } from 'antd-style'

const useStyles = createStyles(({ css }) => ({
  codeBlock: css`
    max-height: 360px;
    margin: 0;
    overflow: auto;
    contain: paint;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--control-bg);
    padding: 12px;
    color: var(--text);
    font-size: 12px;
    line-height: 1.65;
    white-space: pre;
    scrollbar-gutter: stable;
    scrollbar-color: var(--scrollbar-thumb) transparent;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 999px;
    }
  `,
  fill: css`
    height: 100%;
    max-height: none;
    min-height: 0;
  `,
}))

export interface CodeBlockProps {
  className?: string
  fill?: boolean
  language?: string
  text: string
}

export function CodeBlock({
  className,
  fill,
  language,
  text,
}: CodeBlockProps) {
  const { styles } = useStyles()
  const rootClassName = [
    styles.codeBlock,
    fill ? styles.fill : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <pre className={rootClassName}>
      <code className={language ? `language-${language}` : undefined}>
        {text}
      </code>
    </pre>
  )
}
