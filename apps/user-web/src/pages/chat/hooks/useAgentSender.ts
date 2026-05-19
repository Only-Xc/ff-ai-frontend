import { useCallback, useState } from 'react'

export interface UseAgentSenderOptions {
  disabled: boolean
  submit: (content: string) => void | Promise<void>
  cancel: () => void
}

export function useAgentSender(options: UseAgentSenderOptions) {
  const { cancel, disabled, submit: submitMessage } = options
  const [inputValue, setInputValue] = useState('')

  const submit = useCallback(
    (message: string) => {
      // 发送器先统一规整输入内容，再交给上层会话逻辑处理。
      const content = message.trim()

      if (!content || disabled) {
        return
      }

      // 先乐观清空输入框；真正的发送结果由上游会话状态维护。
      setInputValue('')

      void submitMessage(content)
    },
    [disabled, submitMessage],
  )

  return {
    inputValue,
    setInputValue,
    submit,
    cancel,
  }
}
