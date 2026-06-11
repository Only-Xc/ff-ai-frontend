import { useCallback, useState } from 'react'
import type { UploadFile, UploadProps } from 'antd'
import { numberUtils } from '@ff-ai-frontend/utils'
import type { AxiosProgressEvent } from 'axios'

import { v4 as uuidV4 } from 'uuid'
import { fileUpload, type FileUploadResponse } from '@/api/file'
import { i18n } from '@/i18n'
import { globalMessage } from '@/utils/message'

export interface AgentSubmitPayload {
  content: string
  attachmentIds?: string[]
}

type AttachedFile = UploadFile<FileUploadResponse>
type CustomRequestOptions = Parameters<
  NonNullable<UploadProps['customRequest']>
>[0]
type OnRemove = NonNullable<UploadProps<FileUploadResponse>['onRemove']>
type UploadRequestFile = File & { uid?: string }

const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'csv', 'xlsx']
const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(',')

export interface AgentAttachmentsState {
  accept: string
  files: AttachedFile[]
  onRemove: OnRemove
  open: boolean
  setOpen: (open: boolean) => void
  upload: (options: CustomRequestOptions) => Promise<void>
  uploading: boolean
}

export interface UseAgentSenderResult {
  attachments: AgentAttachmentsState
  inputValue: string
  setInputValue: (value: string) => void
  submit: (payload: AgentSubmitPayload) => void
  submitWithAttachments: (message: string) => void
  cancel: () => void
}

export interface UseAgentSenderOptions {
  disabled: boolean
  submit: (payload: AgentSubmitPayload) => void | Promise<void>
  cancel: () => void
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function isAllowedAttachmentFile(file: File) {
  return ALLOWED_ATTACHMENT_EXTENSIONS.includes(getFileExtension(file.name))
}

function getAttachmentUid(file: UploadRequestFile) {
  return file.uid ?? uuidV4()
}

function upsertAttachmentFile(files: AttachedFile[], file: AttachedFile) {
  const existingIndex = files.findIndex((item) => item.uid === file.uid)

  if (existingIndex < 0) {
    return [...files, file]
  }

  const nextFiles = [...files]
  nextFiles[existingIndex] = { ...nextFiles[existingIndex], ...file }
  return nextFiles
}

function getUploadedAttachmentIds(files: AttachedFile[]) {
  const uploadedFiles = files.filter(
    (file): file is AttachedFile & { response: FileUploadResponse } =>
      file.status === 'done' && !!file.response?.id,
  )

  return uploadedFiles.map((file) => file.response.id)
}

export function useAgentSender(
  options: UseAgentSenderOptions,
): UseAgentSenderResult {
  const { cancel, disabled, submit: submitMessage } = options
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const uploading = attachedFiles.some((file) => file.status === 'uploading')
  const hasUploadError = attachedFiles.some((file) => file.status === 'error')
  const uploadAttachment: AgentAttachmentsState['upload'] = useCallback(
    async (uploadOptions) => {
      const file = uploadOptions.file

      if (!(file instanceof File)) {
        uploadOptions.onError?.(
          new Error(i18n.t('pages.chat.sender.errors.invalidFile')),
        )
        return
      }

      if (!isAllowedAttachmentFile(file)) {
        const separator = i18n.language.startsWith('zh') ? '、' : ', '
        const error = new Error(
          i18n.t('pages.chat.sender.errors.allowedFiles', {
            extensions: ALLOWED_ATTACHMENT_EXTENSIONS.join(separator),
          }),
        )

        globalMessage.warning(error.message)
        uploadOptions.onError?.(error)
        return
      }

      const uid = getAttachmentUid(file)

      setAttachedFiles((files) =>
        upsertAttachmentFile(files, {
          uid,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploading',
          percent: 0,
        }),
      )

      try {
        const response = await fileUpload({
          file,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percent = Math.min(
              numberUtils.calculatePercent(
                progressEvent.loaded,
                progressEvent.total,
                { decimals: 0 },
              ),
              99,
            )

            setAttachedFiles((files) =>
              upsertAttachmentFile(files, {
                uid,
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'uploading',
                percent,
              }),
            )
            uploadOptions.onProgress?.({ percent })
          },
        })

        setAttachedFiles((files) =>
          upsertAttachmentFile(files, {
            uid,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'done',
            percent: 100,
            response,
          }),
        )
        uploadOptions.onSuccess?.(response)
      } catch (error) {
        const uploadError =
          error instanceof Error
            ? error
            : new Error(i18n.t('pages.chat.sender.errors.uploadFailed'))

        setAttachedFiles((files) =>
          upsertAttachmentFile(files, {
            uid,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'error',
            error: uploadError,
          }),
        )
        uploadOptions.onError?.(uploadError)
        globalMessage.error(i18n.t('pages.chat.sender.errors.uploadFailed'))
      }
    },
    [],
  )
  const handleAttachmentRemove: AgentAttachmentsState['onRemove'] = useCallback(
    (file) => {
      setAttachedFiles((files) => files.filter((item) => item.uid !== file.uid))
      return true
    },
    [],
  )

  const submit = useCallback(
    (payload: AgentSubmitPayload) => {
      // 发送器先统一规整输入内容，再交给上层会话逻辑处理。
      const content = payload.content.trim()
      const attachmentIds = payload.attachmentIds ?? []

      if ((!content && attachmentIds.length === 0) || disabled) {
        return
      }

      // 先乐观清空输入框；真正的发送结果由上游会话状态维护。
      setInputValue('')

      void submitMessage({
        content,
        ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
      })
    },
    [disabled, submitMessage],
  )

  const submitWithAttachments = useCallback(
    (message: string) => {
      if (uploading) {
        globalMessage.warning(i18n.t('pages.chat.sender.errors.uploading'))
        return
      }

      if (hasUploadError) {
        globalMessage.warning(
          i18n.t('pages.chat.sender.errors.removeFailedBeforeSend'),
        )
        return
      }

      const content = message.trim()
      const attachmentIds = getUploadedAttachmentIds(attachedFiles)

      if (!content && attachmentIds.length === 0) return

      submit({
        content,
        ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
      })
      setAttachedFiles([])
      setAttachmentsOpen(false)
    },
    [attachedFiles, hasUploadError, submit, uploading],
  )

  return {
    attachments: {
      accept: ATTACHMENT_ACCEPT,
      files: attachedFiles,
      onRemove: handleAttachmentRemove,
      open: attachmentsOpen,
      setOpen: setAttachmentsOpen,
      upload: uploadAttachment,
      uploading,
    },
    inputValue,
    setInputValue,
    submit,
    submitWithAttachments,
    cancel,
  }
}
