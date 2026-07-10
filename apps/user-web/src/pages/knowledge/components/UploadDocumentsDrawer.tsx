import { InboxOutlined } from '@ant-design/icons'
import { Button, Drawer, Form, Input, Space, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const { Dragger } = Upload

export interface UploadDocumentsDrawerProps {
  confirmLoading?: boolean
  open: boolean
  onClose: () => void
  onSubmit: (payload: { files: File[]; parentPath?: string }) => void
}

interface UploadDocumentsFormValues {
  parentPath?: string
}

export function UploadDocumentsDrawer({
  confirmLoading,
  open,
  onClose,
  onSubmit,
}: UploadDocumentsDrawerProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<UploadDocumentsFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    if (!open) return

    setFileList([])
    form.resetFields()
  }, [form, open])

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    fileList,
    multiple: true,
    onChange: (info) => setFileList(info.fileList),
  }

  const handleSubmit = (values: UploadDocumentsFormValues) => {
    const files = fileList
      .map((item) => item.originFileObj)
      .filter((file): file is NonNullable<typeof file> => Boolean(file))

    onSubmit({
      files,
      parentPath: values.parentPath,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button
            disabled={fileList.length === 0}
            loading={confirmLoading}
            type="primary"
            onClick={() => void form.submit()}
          >
            {t('pages.knowledge.actions.uploadDocuments')}
          </Button>
        </Space>
      }
      open={open}
      placement="right"
      title={t('pages.knowledge.drawer.uploadTitle')}
      width={560}
      onClose={onClose}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={t('pages.knowledge.fields.parentPath')}
          name="parentPath"
        >
          <Input placeholder="/" />
        </Form.Item>

        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {t('pages.knowledge.upload.dragTitle')}
          </p>
          <p className="ant-upload-hint">
            {t('pages.knowledge.upload.dragHint')}
          </p>
        </Dragger>
      </Form>
    </Drawer>
  )
}
