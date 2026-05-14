import { useTranslation } from 'react-i18next'

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
      <path d="M12 10.5l-3 6h6l-3-6z" />
    </svg>
  )
}

export function Logo() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full items-center gap-2">
      <LogoIcon className="size-7 text-(--primary)" />
      <div className="flex flex-col leading-1">
        <div className="text-sm font-bold leading-[1.15] tracking-normal text-(--text-strong)">
          {t('common.appTitle')}
        </div>
        <div className="mt-0.5 text-[10px] tracking-[1.2px] text-(--muted)">
          {t('common.appSubtitle')}
        </div>
      </div>
    </div>
  )
}
