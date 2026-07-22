import { PlusOutlined } from '@ant-design/icons'
import { Button, Menu, Tooltip, type MenuProps } from 'antd'
import { createStyles } from 'antd-style'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import {
  getActionByNavKey,
  getOpenNavKeys,
  getPathByNavKey,
  type NavTreeItem,
} from './layoutNav'

const useStyles = createStyles(({ iconPrefixCls, prefixCls }) => {
  const antCls = `.${prefixCls}`
  const iconCls = `.${iconPrefixCls}`
  const menuCls = `${antCls}-menu`

  return {
    root: {
      paddingBlock: '0 14px',
      paddingInline: '20px 8px',
    },
    groupAction: {
      '&.ant-btn.ant-btn-icon-only': {
        width: 22,
        minWidth: 22,
        height: 22,
      },
    },
    menu: {
      width: '100%',
      borderInlineEnd: '0 !important',
      background: 'transparent',

      [`${menuCls}-item-group:not(:first-of-type)`]: {
        marginBlockStart: 16,
      },

      [`${menuCls}-item-group-title`]: {
        height: 28,
        padding: '7px 2px 6px',
        color: 'var(--dark-text)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: '15px',
      },

      [`${menuCls}-item`]: {
        position: 'relative',
        width: '100%',
        height: '40px !important',
        lineHeight: '40px !important',
        marginBlock: '2px !important',
        marginInline: '0 !important',
        paddingInline: '12px 10px !important',
        borderRadius: '8px !important',
        color: 'var(--muted)',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        transition:
          'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
      },

      [`${menuCls}-submenu-title`]: {
        position: 'relative',
        height: '40px !important',
        lineHeight: '40px !important',
        marginBlock: '2px !important',
        marginInline: '0 !important',
        paddingInline: '12px 10px !important',
        borderRadius: '8px !important',
        color: 'var(--muted)',
        fontSize: 14,
        fontWeight: 500,
        transition:
          'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
      },

      [`${menuCls}-submenu-title:hover`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 6%, transparent) !important',
        color: 'var(--text-strong) !important',
      },

      [`${menuCls}-item::after`]: {
        display: 'none',
      },

      [`${menuCls}-item:hover`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 6%, transparent) !important',
        color: 'var(--text-strong) !important',
      },

      [`${menuCls}-item-selected`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 10%, transparent) !important',
        color: 'var(--text-strong) !important',
        fontWeight: 600,
      },

      [`${menuCls}-submenu-selected > ${menuCls}-submenu-title`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 10%, transparent) !important',
        color: 'var(--text-strong) !important',
        fontWeight: 600,
      },

      [`${menuCls}-item-selected ${iconCls}`]: {
        color: 'var(--admin-primary)',
      },

      [`${menuCls}-submenu-selected > ${menuCls}-submenu-title ${iconCls}`]: {
        color: 'var(--admin-primary)',
      },

      [`${menuCls}-item-selected::before, ${menuCls}-submenu-selected > ${menuCls}-submenu-title::before`]:
        {
          position: 'absolute',
          top: '50%',
          insetInlineStart: 0,
          width: 2,
          height: 18,
          borderRadius: 999,
          background: 'var(--admin-primary)',
          content: '""',
          transform: 'translateY(-50%)',
        },

      [`${menuCls}-item ${iconCls}`]: {
        width: 18,
        color: 'inherit',
        fontSize: 17,
      },

      [`${menuCls}-submenu-title ${iconCls}`]: {
        width: 18,
        color: 'inherit',
        fontSize: 17,
      },

      [`${menuCls}-title-content`]: {
        color: 'inherit',
        marginInlineStart: 10,
      },

      [`&${menuCls}-inline-collapsed`]: {
        width: '100% !important',
      },

      [`&${menuCls}-inline-collapsed ${menuCls}-item-group-title`]: {
        display: 'none',
      },

      [`&${menuCls}-inline-collapsed ${menuCls}-item-group:not(:first-of-type)`]:
        {
          marginBlockStart: 4,
        },

      [`&${menuCls}-inline-collapsed ${menuCls}-item, &${menuCls}-inline-collapsed ${menuCls}-submenu-title`]:
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px !important',
          minWidth: '40px !important',
          height: '40px !important',
          lineHeight: '40px !important',
          marginBlock: '2px !important',
          marginInline: '0 !important',
          paddingInline: '0 !important',
        },

      [`&${menuCls}-inline-collapsed ${menuCls}-item ${iconCls}, &${menuCls}-inline-collapsed ${menuCls}-submenu-title ${iconCls}`]:
        {
          width: '18px !important',
          minWidth: '18px !important',
          margin: '0 !important',
          color: 'inherit',
          fontSize: '17px !important',
          lineHeight: '1 !important',
        },

      [`&${menuCls}-inline-collapsed ${menuCls}-title-content`]: {
        width: 0,
        marginInlineStart: '0 !important',
        opacity: 0,
        overflow: 'hidden',
      },
    },
    submenuPopup: {
      width: 180,
      minWidth: '180px !important',

      [`${menuCls}`]: {
        width: '180px !important',
        minWidth: '180px !important',
        padding: '6px !important',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--panel) !important',
        boxShadow: '0 12px 32px rgb(15 23 42 / 0.14)',
      },

      [`${menuCls}-item`]: {
        width: '100% !important',
        height: '36px !important',
        lineHeight: '36px !important',
        marginBlock: '2px !important',
        marginInline: '0 !important',
        paddingInline: '12px !important',
        borderRadius: '6px !important',
        color: 'var(--muted)',
        fontSize: 14,
        fontWeight: 500,
      },

      [`${menuCls}-item:hover`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 6%, transparent) !important',
        color: 'var(--text-strong) !important',
      },

      [`${menuCls}-item-selected`]: {
        background:
          'color-mix(in srgb, var(--admin-primary) 10%, transparent) !important',
        color: 'var(--text-strong) !important',
        fontWeight: 600,
      },

      [`${menuCls}-item::after`]: {
        display: 'none',
      },
    },
  }
})

interface SidebarProps {
  activeKey: string
  navItems: NavTreeItem[]
  collapsed?: boolean
  onNavigate?: () => void
}

type MenuItem = Required<MenuProps>['items'][number]

function toMenuItems(
  navItems: NavTreeItem[],
  submenuPopupClassName: string,
  groupActionClassName: string,
): MenuItem[] {
  return navItems.map((item) => {
    const children = item.children
      ? toMenuItems(item.children, submenuPopupClassName, groupActionClassName)
      : undefined

    if (item.kind === 'group') {
      return {
        key: item.key,
        label: item.groupAction ? (
          <span className="flex w-full items-center justify-between gap-2">
            <span className="min-w-0 truncate">{item.label}</span>
            <Tooltip title={item.groupAction.label}>
              <Button
                aria-label={item.groupAction.label}
                className={groupActionClassName}
                icon={<PlusOutlined />}
                size="small"
                type="text"
                onClick={(event) => {
                  event.stopPropagation()
                  item.groupAction?.onClick()
                }}
              />
            </Tooltip>
          </span>
        ) : (
          item.label
        ),
        type: 'group',
        children,
      }
    }

    return {
      key: item.key,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      children,
      popupClassName: children ? submenuPopupClassName : undefined,
    }
  })
}

export function Sidebar({
  activeKey,
  collapsed = false,
  navItems,
  onNavigate,
}: SidebarProps) {
  const { styles } = useStyles()
  const navigate = useNavigate()
  const defaultOpenKeys = useMemo(
    () => getOpenNavKeys(activeKey, navItems),
    [activeKey, navItems],
  )
  const [manualOpenKeys, setManualOpenKeys] = useState<string[]>([])
  const openKeys = useMemo(
    () => Array.from(new Set([...defaultOpenKeys, ...manualOpenKeys])),
    [defaultOpenKeys, manualOpenKeys],
  )

  const items = useMemo<MenuItem[]>(
    () => toMenuItems(navItems, styles.submenuPopup, styles.groupAction),
    [navItems, styles.groupAction, styles.submenuPopup],
  )

  const pathByKey = useMemo(() => {
    return getPathByNavKey(navItems)
  }, [navItems])

  const actionByKey = useMemo(() => {
    return getActionByNavKey(navItems)
  }, [navItems])

  return (
    <div
      className={`flex h-full flex-col ${styles.root}`}
      style={{
        paddingInline: collapsed ? '12px 0' : undefined,
      }}
    >
      <Menu
        classNames={{ root: styles.menu }}
        inlineCollapsed={collapsed}
        items={items}
        mode="inline"
        openKeys={collapsed ? undefined : openKeys}
        selectedKeys={activeKey ? [activeKey] : []}
        style={{
          width: '100%',
        }}
        styles={{
          item: {
            color: 'var(--muted)',
          },
          itemIcon: {
            color: 'inherit',
          },
          itemContent: {
            color: 'inherit',
          },
          root: {
            background: 'transparent',
          },
        }}
        theme="light"
        onOpenChange={setManualOpenKeys}
        onClick={({ key }) => {
          const action = actionByKey.get(key)

          if (action) {
            action()
            onNavigate?.()
            return
          }

          const path = pathByKey.get(key)

          if (path) {
            void navigate(path)
            onNavigate?.()
          }
        }}
      />
    </div>
  )
}
