import { Alert, Button, Card, Empty, Spin } from 'antd'
import { useState } from 'react'

import { ActionModals } from './components/ActionModals'
import { ActionPanel } from './components/ActionPanel'
import { ErrorPanel } from './components/ErrorPanel'
import { PayloadPanel } from './components/PayloadPanel'
import { SnapshotPanel } from './components/SnapshotPanel'
import { SourcePanel } from './components/SourcePanel'
import { WorkbenchHeader } from './components/WorkbenchHeader'
import { useInterventionWorkbenchStyles } from './styles'
import { useInterventionWorkbenchData } from './useInterventionWorkbenchData'
import { getErrorMessage } from './utils'

export function InterventionWorkbench() {
  const { styles } = useInterventionWorkbenchStyles()
  const [repromptOpen, setRepromptOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const {
    canOperate,
    cloneCommand,
    contextText,
    displayTitle,
    errorItems,
    goBack,
    isFetching,
    isLoading,
    payloadText,
    refetch,
    rejectPending,
    repromptPending,
    snapshot,
    snapshotError,
    snapshotIsError,
    snapshotItems,
    submitReject,
    submitReprompt,
    taskId,
  } = useInterventionWorkbenchData()

  if (!taskId) {
    return (
      <Alert
        className="rounded-lg!"
        showIcon
        type="error"
        title="缺少工单 ID"
        action={<Button onClick={goBack}>返回工单</Button>}
      />
    )
  }

  return (
    <div className={`${styles.page} flex h-full w-full flex-1 flex-col gap-3`}>
      <WorkbenchHeader
        actions={
          <ActionPanel
            canOperate={canOperate}
            mode="inline"
            onOpenReject={() => setRejectOpen(true)}
            onOpenReprompt={() => setRepromptOpen(true)}
          />
        }
        className={styles.header}
        displayTitle={displayTitle}
        isFetching={isFetching}
        onBack={goBack}
        onRefresh={() => void refetch()}
        status={snapshot?.status}
      />

      {snapshotIsError ? (
        <Alert
          className="relative rounded-lg!"
          showIcon
          type="error"
          message="挂起快照加载失败"
          description={getErrorMessage(snapshotError)}
          action={
            <Button size="small" onClick={() => void refetch()}>
              重试
            </Button>
          }
        />
      ) : null}

      <Spin
        spinning={isLoading}
        classNames={{
          root: 'flex min-h-0 flex-1 flex-col',
        }}
      >
        {snapshot ? (
          <div className="relative grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3">
            <div className="min-h-0">
              <SnapshotPanel
                cardClassName={styles.card}
                items={snapshotItems}
              />
            </div>

            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.62fr)_minmax(560px,1fr)] gap-3 max-[1440px]:grid-cols-[minmax(0,1.45fr)_minmax(520px,1fr)] max-[1280px]:grid-cols-[minmax(0,1fr)_500px] max-[1180px]:grid-cols-1">
              <ErrorPanel
                cardClassName={`${styles.card} ${styles.fillCard}`}
                contextText={contextText}
                error={snapshot.error}
                items={errorItems}
              />

              <div className="flex min-h-0 min-w-0 flex-col gap-3">
                <SourcePanel
                  cardClassName={`${styles.card} ${styles.sideCard}`}
                  fieldClassName={styles.fieldSurface}
                  cloneCommand={cloneCommand}
                  sourceCode={snapshot.source_code}
                />
                <PayloadPanel
                  cardClassName={`${styles.card} ${styles.fillCard}`}
                  payloadText={payloadText}
                />
              </div>
            </div>
          </div>
        ) : isLoading ? null : (
          <Card className={`relative rounded-lg! ${styles.emptyCard}`}>
            <Empty description="暂无快照数据" />
          </Card>
        )}
      </Spin>

      <ActionModals
        rejectOpen={rejectOpen}
        rejectPending={rejectPending}
        repromptOpen={repromptOpen}
        repromptPending={repromptPending}
        onCloseReject={() => setRejectOpen(false)}
        onCloseReprompt={() => setRepromptOpen(false)}
        onSubmitReject={submitReject}
        onSubmitReprompt={submitReprompt}
      />
    </div>
  )
}

export default InterventionWorkbench
