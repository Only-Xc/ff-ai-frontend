import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({
  children,
  className,
  subtitle,
  title,
}: PageHeaderProps) {
  const rootClassName = [
    'mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 max-[1180px]:grid-cols-1',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={rootClassName}>
      <div>
        <h1 className="m-0 text-2xl font-semibold leading-[1.2] tracking-normal text-(--text-strong)">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 mb-0 max-w-170 text-sm leading-normal text-(--muted)">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children ? <div className="min-w-0">{children}</div> : null}
    </header>
  )
}
