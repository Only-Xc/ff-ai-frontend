export function CodeBlock({
  children,
  language,
}: {
  children: string
  language?: string
}) {
  return (
    <pre className="m-0 max-h-80 overflow-auto rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-fill-quaternary) p-3 text-xs leading-5 text-(--text)">
      <code className={language ? `language-${language}` : undefined}>
        {children}
      </code>
    </pre>
  )
}
