import { ClockCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CountdownTimerProps {
  startedAt: string
  timeLimitMinutes: number | null
  onExpire: () => void
}

export function CountdownTimer({
  onExpire,
  startedAt,
  timeLimitMinutes,
}: CountdownTimerProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const expiredRef = useRef(false)

  const endAt = useMemo(() => {
    if (!timeLimitMinutes) return null
    return new Date(startedAt).getTime() + timeLimitMinutes * 60 * 1000
  }, [startedAt, timeLimitMinutes])

  const remainingSeconds = endAt
    ? Math.max(0, Math.ceil((endAt - now) / 1000))
    : null

  useEffect(() => {
    expiredRef.current = false
    setNow(Date.now())
  }, [endAt])

  useEffect(() => {
    if (!endAt) return undefined

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [endAt])

  useEffect(() => {
    if (remainingSeconds !== 0 || expiredRef.current) return

    expiredRef.current = true
    onExpire()
  }, [onExpire, remainingSeconds])

  if (!endAt || remainingSeconds === null) {
    return <Tag icon={<ClockCircleOutlined />}>{t('pages.exam.time.unlimited')}</Tag>
  }

  return (
    <Tag color={remainingSeconds <= 60 ? 'red' : 'blue'} icon={<ClockCircleOutlined />}>
      {t('pages.exam.room.remainingTime', {
        time: formatDuration(remainingSeconds),
      })}
    </Tag>
  )
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}
