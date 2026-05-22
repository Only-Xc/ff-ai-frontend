import { createStyles } from 'antd-style'

export const useLifecycleOpsStyles = createStyles(({ css }) => ({
  filterBar: css`
    .ant-form-item {
      margin-bottom: 0;
    }
  `,
  tabs: css`
    padding-top: 10px;

    .ant-tabs-nav {
      margin: 0;
      padding: 0 20px;

      &::before {
        display: none;
      }
    }

    .ant-tabs-tab {
      padding: 0 0 12px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 600;
    }

    .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--text-strong) !important;
    }

    .ant-tabs-ink-bar {
      background: var(--admin-primary);
    }
  `,
}))
