import { InboxOutlined } from '@ant-design/icons'
import { Alert, App, Upload } from 'antd'
import { useState } from 'react'

import type { ComposeImportErrorDetail } from '@/api/plugins'

interface ComposeManifestWizardProps {
  submitting: boolean
  error?: ComposeImportErrorDetail
  onImport: (file: File) => Promise<void>
}

const MAX_COMPOSE_BYTES = 1_048_576

export function ComposeManifestWizard({
  submitting,
  error,
  onImport,
}: ComposeManifestWizardProps) {
  const { message } = App.useApp()
  const [fileName, setFileName] = useState<string>()

  return (
    <div>
      {error ? (
        <Alert
          className="mb-4"
          description={
            error.reasons.length ? (
              <ul className="mb-0 pl-5">
                {error.reasons.map((item, index) => (
                  <li key={`${item.code}-${item.service ?? index}`}>
                    <strong>
                      {[item.service, item.container].filter(Boolean).join(' / ') ||
                        item.code}
                    </strong>
                    ：{item.message}
                    {item.state ? ` 当前状态：${item.state}。` : ''}
                    {item.health ? ` 健康状态：${item.health}。` : ''}
                    <br />
                    处理建议：{item.resolution}
                  </li>
                ))}
              </ul>
            ) : undefined
          }
          showIcon
          title={error.message}
          type="error"
        />
      ) : null}
      <Upload.Dragger
        accept="application/yaml,application/x-yaml,.yml,.yaml"
        beforeUpload={(file) => {
          if (
            !file.name.toLowerCase().endsWith('.yml') &&
            !file.name.toLowerCase().endsWith('.yaml')
          ) {
            message.error('请上传 .yml 或 .yaml 文件')
            return Upload.LIST_IGNORE
          }
          if (file.size > MAX_COMPOSE_BYTES) {
            message.error('Docker Compose 文件不能超过 1 MiB')
            return Upload.LIST_IGNORE
          }
          setFileName(file.name)
          void onImport(file).catch(() => setFileName(undefined))
          return Upload.LIST_IGNORE
        }}
        disabled={submitting}
        maxCount={1}
        openFileDialogOnClick={!submitting}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p>{submitting ? '正在检测实际运行状态...' : '上传 docker-compose.yml'}</p>
        <p className="ant-upload-hint">
          {fileName ?? '将验证实际容器、镜像、端口、健康状态和 UI/API'}
        </p>
      </Upload.Dragger>
    </div>
  )
}
