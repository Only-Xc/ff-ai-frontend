import { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'

let _messageApi: MessageInstance | null = null

export function GlobalMessageRegister() {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    _messageApi = message

    return () => {
      if (_messageApi === message) {
        _messageApi = null
      }
    }
  }, [message])

  return null
}

export const globalMessage = {
  info(msg: string) {
    void _messageApi?.info(msg)
  },
  success(msg: string) {
    void _messageApi?.success(msg)
  },
  warning(msg: string) {
    void _messageApi?.warning(msg)
  },
  error(msg: string) {
    void _messageApi?.error(msg)
  },
}
