import { createStyles } from 'antd-style'
import { memo, useEffect, useRef, type CSSProperties } from 'react'
import { startApp, type startOptions } from 'wujie'

type WujieStartOptions = Omit<Partial<startOptions>, 'el'>

export type WujieReactProps = WujieStartOptions & {
  height?: string
  width?: string
  style?: CSSProperties
}

const startAppQueues = new Map<string, Promise<void>>()

const useStyles = createStyles({
  root: {
    width: '100%',
    height: '100%',
    '& iframe': {
      width: '100%',
      height: '100%',
      border: 0,
      display: 'block',
    },
  },
})

/**
 * 清理 startApp 串行队列，防止组件销毁后队列长期持有
 * 已卸载实例的 Promise 链，造成内存泄漏。
 * 仅当队列仍指向当前实例的链尾时才删除，避免误删被同名新实例接管的队列。
 */
function clearStartAppQueue(name: string | undefined, queue: Promise<void>) {
  if (!name) return
  if (startAppQueues.get(name) === queue) {
    startAppQueues.delete(name)
  }
}

function initStartAppQueue(name: string | undefined, queue: Promise<void>) {
  if (!name) return queue

  const currentQueue = startAppQueues.get(name)
  if (currentQueue) return currentQueue

  startAppQueues.set(name, queue)
  return queue
}

export const WujieReact = memo(function WujieReact(props: WujieReactProps) {
  const { width, height, style } = props
  const { styles } = useStyles()
  const myRef = useRef<HTMLDivElement>(null)
  const startAppQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    const currentName = props.name
    startAppQueueRef.current = initStartAppQueue(
      currentName,
      startAppQueueRef.current,
    )

    const queue = startAppQueueRef.current.then(async () => {
      try {
        await startApp({
          ...props,
          el: myRef.current,
        } as startOptions)
      } catch (error) {
        console.log(error)
      }
    })

    startAppQueueRef.current = queue
    if (currentName) {
      startAppQueues.set(currentName, queue)
    }

    return () => {
      clearStartAppQueue(currentName, queue)
    }
  }, [props])

  return (
    <div
      className={styles.root}
      style={{ width, height, ...style }}
      ref={myRef}
    />
  )
})

export default WujieReact
