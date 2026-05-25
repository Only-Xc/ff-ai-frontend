import type { ReactNode } from 'react'

export function DetailPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
