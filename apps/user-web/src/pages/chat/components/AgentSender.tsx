import { PaperClipOutlined } from '@ant-design/icons'
import { Attachments, Sender, type SenderProps } from '@ant-design/x'

import type { UseAgentSenderResult } from '@/pages/chat/hooks/useAgentSender'

type AgentSenderProps = Omit<SenderProps, 'onSubmit'> & {
  attachments: UseAgentSenderResult['attachments']
  onSubmit?: (message: string) => void
}

export function AgentSender({ attachments, ...props }: AgentSenderProps) {
  const {
    accept,
    files,
    onRemove,
    open,
    setOpen,
    upload,
    uploading,
  } = attachments
  const attachedCount = files.length
  const hasAttachments = attachedCount > 0
  const attachmentActive = open || hasAttachments || uploading
  const attachmentButtonLabel = hasAttachments
    ? `${open ? '收起' : '展开'}附件，已添加 ${attachedCount} 个`
    : `${open ? '收起' : '添加'}附件`

  const senderHeader = (
    <Sender.Header
      title="附件"
      open={open}
      onOpenChange={setOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        accept={accept}
        customRequest={(options) => {
          void upload(options)
        }}
        items={files}
        onRemove={onRemove}
        placeholder={(type) =>
          type === 'drop'
            ? { title: '拖拽文件到这里' }
            : {
                icon: <PaperClipOutlined />,
                title: '上传文件',
                description: '点击或拖拽文件到这里',
              }
        }
      />
    </Sender.Header>
  )

  const senderFooter: SenderProps['footer'] = (actionNode) => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={attachmentButtonLabel}
          aria-pressed={open}
          title={attachmentButtonLabel}
          onClick={() => setOpen(!open)}
          className={[
            'inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-medium leading-none transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--panel)',
            attachmentActive
              ? 'border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--panel))] text-(--primary) shadow-[0_1px_0_rgb(15_23_42/0.03)]'
              : 'border-transparent bg-transparent text-(--muted) hover:bg-(--control-hover-bg) hover:text-(--text)',
          ].join(' ')}
        >
          <PaperClipOutlined className="text-[15px]" />
          <span>附件</span>
          {uploading ? (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-(--primary) animate-pulse"
            />
          ) : null}
          {hasAttachments ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--primary) px-1.5 text-[11px] font-semibold leading-none text-white">
              +{attachedCount}
            </span>
          ) : null}
        </button>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-(--muted)">⌘/Ctrl + Enter 发送</span>
        {actionNode}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 w-full">
      <Sender
        header={senderHeader}
        footer={senderFooter}
        allowSpeech
        placeholder="提问或输入..."
        suffix={false}
        {...props}
        loading={uploading ? true : props.loading}
      />
    </div>
  )
}
