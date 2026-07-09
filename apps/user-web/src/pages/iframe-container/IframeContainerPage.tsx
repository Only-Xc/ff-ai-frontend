import { useParams } from 'react-router'

import { IframeContainerPage as ComponentsIframeContainerPage } from '@ff-ai-frontend/components'

export function IframeContainerPage() {
  const { taskId } = useParams<string>()

  return <ComponentsIframeContainerPage taskId={taskId} />
}

export default IframeContainerPage
