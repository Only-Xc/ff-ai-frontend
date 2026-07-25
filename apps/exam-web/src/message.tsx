import { App as AntdApp } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import { useEffect } from 'react'

let messageApi: MessageInstance | null = null

export function GlobalMessageRegister() {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    messageApi = message

    return () => {
      if (messageApi === message) {
        messageApi = null
      }
    }
  }, [message])

  return null
}

export const globalMessage = {
  success(message: string) {
    void messageApi?.success(message)
  },
  error(message: string) {
    void messageApi?.error(message)
  },
}
