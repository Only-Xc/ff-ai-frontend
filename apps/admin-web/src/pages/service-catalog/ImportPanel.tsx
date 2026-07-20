import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Space,
  Typography,
  Upload,
  message,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { serviceCatalog_export, serviceCatalog_import } from '@/api/service-catalog'

export default function ImportPanelPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const importMut = useMutation({
    mutationFn: (file: File) => serviceCatalog_import(file),
    onSuccess: (data: any) => {
      if (data.success) {
        message.success(t('pages.serviceCatalog.messages.imported', { summary: JSON.stringify(data.summary) }))
      } else {
        message.warning(t('pages.serviceCatalog.messages.importFailed'))
      }
    },
    onError: (e: any) => message.error(e?.message ?? 'error'),
  })
  const downloadTemplateMut = useMutation({
    mutationFn: async () => {
      const blob: any = await serviceCatalog_export({ template: 1 } as any)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'service-catalog-template.xlsx'; a.click()
      URL.revokeObjectURL(url)
    },
  })
  const downloadExportMut = useMutation({
    mutationFn: async () => {
      const blob: any = await serviceCatalog_export({} as any)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'service-catalog-export.xlsx'; a.click()
      URL.revokeObjectURL(url)
    },
  })

  return (
    <PageContainer>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => nav('/service-catalog/services')}
        style={{ marginBottom: 4 }}
      >
        {t('pages.serviceCatalog.actions.back')}
      </Button>
      <PageHeader title={t('routes.serviceCatalog.import.title')} />
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={t('pages.serviceCatalog.actions.downloadTemplate')}>
          <Space>
            <Button onClick={() => downloadTemplateMut.mutate()}>
              {t('pages.serviceCatalog.actions.downloadTemplateExcel')}
            </Button>
            <Button onClick={() => downloadExportMut.mutate()}>
              {t('pages.serviceCatalog.actions.downloadExport')}
            </Button>
          </Space>
        </Card>
        <Card title={t('pages.serviceCatalog.actions.uploadExcel')}>
          <Upload.Dragger
            accept=".xlsx"
            beforeUpload={(file: UploadFile) => {
              if (importMut.isPending) return false
              importMut.mutate(file as unknown as File)
              return false
            }}
            maxCount={1}
          >
            <Typography.Title level={5}>{t('pages.serviceCatalog.actions.dragHere')}</Typography.Title>
            <Typography.Text type="secondary">
              {t('pages.serviceCatalog.actions.supportXlsx')}
            </Typography.Text>
          </Upload.Dragger>
        </Card>
        {importMut.isError ? (
          <Alert type="error" message={t('pages.serviceCatalog.messages.importFailed')} />
        ) : null}
      </Space>
    </PageContainer>
  )
}
