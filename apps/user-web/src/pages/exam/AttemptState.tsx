import { Alert, Spin } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { tenantAttempts_create } from '@/api/exam'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import { useExamStyles } from './styles'

export function AttemptState() {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { styles } = useExamStyles()
  const requestedPaperIdRef = useRef<string | null>(null)

  const createMutation = useMutation({
    mutationFn: tenantAttempts_create,
    onSuccess: (attempt) => {
      void navigate(`/attempts/${attempt.id}`, { replace: true })
    },
  })
  const createAttempt = createMutation.mutate

  useEffect(() => {
    if (!paperId || requestedPaperIdRef.current === paperId) return

    requestedPaperIdRef.current = paperId
    createAttempt(paperId)
  }, [createAttempt, paperId])

  return (
    <div className={styles.pageShell}>
      <PageHeader
        title={t('pages.exam.attemptState.title')}
        subtitle={t('pages.exam.attemptState.subtitle')}
      />
      <PageContainer className="flex min-h-80 items-center justify-center">
        {!paperId ? (
          <Alert showIcon message={t('pages.exam.errors.missingPaperId')} type="error" />
        ) : null}
        {createMutation.isError ? (
          <Alert showIcon message={t('pages.exam.errors.createAttemptFailed')} type="error" />
        ) : null}
        {createMutation.isPending ? <Spin /> : null}
      </PageContainer>
    </div>
  )
}

export default AttemptState
