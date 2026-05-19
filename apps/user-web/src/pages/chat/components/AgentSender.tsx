import { useState } from 'react'

import { Button, type UploadFile } from 'antd'
import { PaperClipOutlined } from '@ant-design/icons'
import { Attachments, Sender, type SenderProps } from '@ant-design/x'

export function AgentSender(props: SenderProps) {
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([])

  const senderHeader = (
    <Sender.Header
      title="附件"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
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
        <Button
          type="text"
          icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
          onClick={() => setAttachmentsOpen(!attachmentsOpen)}
        />
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
      />
    </div>
  )
}
