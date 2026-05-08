import { Menu, type MenuProps } from 'antd'
import { createStyles } from 'antd-style'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import type { NavGroup } from './layoutNav'

const useStyles = createStyles(({ iconPrefixCls, prefixCls }) => {
  const antCls = `.${prefixCls}`
  const iconCls = `.${iconPrefixCls}`
  const menuCls = `${antCls}-menu`

  return {
    root: {
      paddingBlock: 14,
      paddingInline: '20px 8px',
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

      [`${menuCls}-item-selected ${iconCls}`]: {
        color: 'var(--admin-primary)',
      },

      [`${menuCls}-item-selected::before`]: {
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
    },
  }
})

interface SidebarProps {
  activeKey: string
  navGroups: NavGroup[]
  collapsed?: boolean
  onNavigate?: () => void
}

type MenuItem = Required<MenuProps>['items'][number]

export function Sidebar({
  activeKey,
  collapsed = false,
  navGroups,
  onNavigate,
}: SidebarProps) {
  const { styles } = useStyles()
  const navigate = useNavigate()

  const items = useMemo<MenuItem[]>(
    () =>
      navGroups.map((group) => ({
        key: `group-${group.label}`,
        label: group.label,
        type: 'group',
        children: group.items.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
        })),
      })),
    [navGroups],
  )

  const pathByKey = useMemo(() => {
    return new Map(
      navGroups.flatMap((group) =>
        group.items.map((item) => [item.key, item.path] as const),
      ),
    )
  }, [navGroups])

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
        onClick={({ key }) => {
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
