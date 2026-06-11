import { createStyles } from 'antd-style'

export const useOpsMetricsStyles = createStyles(({ css }) => ({
  page: css`
    --ops-surface: var(--panel);
    --ops-surface-strong: color-mix(in srgb, var(--panel) 98%, white 2%);
    --ops-soft: color-mix(in srgb, var(--admin-primary) 4%, var(--panel));
    --ops-border: color-mix(in srgb, var(--border) 78%, transparent);
    --ops-shadow: 0 1px 2px rgb(15 23 42 / 0.05),
      0 14px 36px rgb(15 23 42 / 0.06);

    position: relative;
    isolation: isolate;

    .ant-card {
      contain: paint;
      overflow: hidden;
      border-color: var(--ops-border);
      background: var(--ops-surface);
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
    }

    .ant-card-head {
      min-height: 46px;
      border-color: var(--ops-border);
      padding: 0 14px;
    }

    .ant-card-head-title {
      padding: 11px 0;
      color: var(--text-strong);
      font-size: 14px;
      font-weight: 650;
    }

    .ant-card-extra {
      padding: 10px 0;
    }

    .ant-card-body {
      padding: 14px;
    }

    .ant-segmented {
      border: 1px solid var(--ops-border);
      background: var(--control-bg);
    }

    .ant-statistic-title {
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 12px;
    }

    .ant-statistic-content {
      color: var(--text-strong);
      font-weight: 680;
      letter-spacing: 0;
    }
  `,
  chartCard: css`
    .ant-card-body {
      min-height: 328px;
      contain: paint;
    }
  `,
  metricCard: css`
    .ant-card-body {
      height: 100%;
      padding: 14px;
    }
  `,
}))
