import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  FileSearchOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { Alert, App, Space, Typography, Upload } from 'antd'
import { createStyles } from 'antd-style'
import { useState } from 'react'

import type { ComposeImportErrorDetail } from '@/api/plugins'

interface ComposeManifestWizardProps {
  submitting: boolean
  error?: ComposeImportErrorDetail
  onImport: (file: File) => Promise<void>
}

const MAX_COMPOSE_BYTES = 1_048_576

const useComposeWizardStyles = createStyles(({ css, token }) => ({
  shell: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  intro: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: ${token.margin}px;
    align-items: center;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: linear-gradient(135deg, ${token.colorFillQuaternary}, ${token.colorBgContainer});
  `,
  introIcon: css`
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    font-size: 22px;
  `,
  dropzone: css`
    .ant-upload-wrapper .ant-upload-drag {
      min-height: 260px;
      border-color: ${token.colorBorder};
      background: ${token.colorBgContainer};
      transition:
        border-color ${token.motionDurationMid},
        background ${token.motionDurationMid},
        box-shadow ${token.motionDurationMid};
    }

    .ant-upload-wrapper .ant-upload-drag:not(.ant-upload-disabled):hover {
      border-color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
      box-shadow: ${token.boxShadowTertiary};
    }

    .ant-upload-drag-icon {
      margin-bottom: ${token.margin}px;
    }
  `,
  uploadIcon: css`
    color: ${token.colorPrimary};
    font-size: 46px;
  `,
  checks: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    margin-top: ${token.marginLG}px;
    color: ${token.colorTextSecondary};
  `,
  checkItem: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    padding: 4px 10px;
    border-radius: ${token.borderRadiusSM}px;
    background: ${token.colorFillQuaternary};
  `,
}))

export function ComposeManifestWizard({
  submitting,
  error,
  onImport,
}: ComposeManifestWizardProps) {
  const { message } = App.useApp()
  const { styles } = useComposeWizardStyles()
  const [fileName, setFileName] = useState<string>()

  return (
    <div className={styles.shell}>
      <div className={styles.intro}>
        <Space direction="vertical" size={2}>
          <Typography.Text strong>从 Docker Compose 自动识别插件</Typography.Text>
          <Typography.Text type="secondary">
            上传后会检测容器、镜像、端口、健康状态和 UI/API 映射。
          </Typography.Text>
        </Space>
        <span className={styles.introIcon}>
          <FileSearchOutlined />
        </span>
      </div>
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
      <div className={styles.dropzone}>
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
            {submitting ? (
              <InboxOutlined className={styles.uploadIcon} />
            ) : (
              <CloudUploadOutlined className={styles.uploadIcon} />
            )}
          </p>
          <Typography.Title level={4}>
            {submitting ? '正在检测实际运行状态...' : '上传 docker-compose.yml'}
          </Typography.Title>
          <Typography.Text type="secondary">
            {fileName ?? '支持 .yml / .yaml，最大 1 MiB'}
          </Typography.Text>
          <div className={styles.checks}>
            {['容器状态', '服务健康', 'UI/API 路由'].map((item) => (
              <span className={styles.checkItem} key={item}>
                <CheckCircleOutlined />
                {item}
              </span>
            ))}
          </div>
        </Upload.Dragger>
      </div>
    </div>
  )
}
