import { Drawer, type DrawerProps } from 'antd'

import {
  IframeStandalonePage,
  type IframeStandalonePageProps,
} from './IframeStandalonePage.js'

type DrawerStyles = NonNullable<DrawerProps['styles']>
type DrawerStylesResolver = Extract<
  DrawerStyles,
  (info: { props: DrawerProps }) => unknown
>
type DrawerStylesObject = Exclude<DrawerStyles, DrawerStylesResolver>

export interface TaskPreviewDrawerProps
  extends Omit<DrawerProps, 'children' | 'open'> {
  frameProps?: Omit<IframeStandalonePageProps, 'taskId'>
  open?: boolean
  taskId?: string | null
}

function mergeDrawerStyles(styles?: DrawerStylesObject): DrawerStylesObject {
  return {
    ...styles,
    body: {
      padding: 0,
      ...styles?.body,
    },
  }
}

function resolveDrawerStyles(styles?: DrawerProps['styles']): DrawerProps['styles'] {
  if (typeof styles === 'function') {
    return (info) => mergeDrawerStyles(styles(info))
  }

  return mergeDrawerStyles(styles)
}

export function TaskPreviewDrawer({
  destroyOnHidden = true,
  frameProps,
  open,
  placement = 'right',
  styles,
  taskId,
  title,
  width = 'min(1180px, calc(100vw - 48px))',
  ...drawerProps
}: TaskPreviewDrawerProps) {
  return (
    <Drawer
      {...drawerProps}
      destroyOnHidden={destroyOnHidden}
      open={open ?? Boolean(taskId)}
      placement={placement}
      styles={resolveDrawerStyles(styles)}
      title={title ?? taskId ?? undefined}
      width={width}
    >
      <IframeStandalonePage
        {...frameProps}
        taskId={taskId ?? undefined}
      />
    </Drawer>
  )
}
