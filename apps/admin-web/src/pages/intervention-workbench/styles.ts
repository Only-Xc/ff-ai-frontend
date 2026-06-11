import { createStyles } from 'antd-style'

export const useInterventionWorkbenchStyles = createStyles(({ css }) => ({
  page: css`
    --workbench-border: color-mix(
      in srgb,
      var(--border) 84%,
      transparent
    );
    --workbench-card-shadow: 0 1px 2px rgb(15 23 42 / 0.04),
      0 12px 30px rgb(15 23 42 / 0.045);

    position: relative;
    isolation: isolate;

    .ant-spin-nested-loading,
    .ant-spin-container {
      min-height: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `,
  header: css`
    position: relative;
    overflow: hidden;
    border: 1px solid var(--workbench-border);
    background: var(--panel);
  `,
  card: css`
    contain: paint;
    overflow: hidden;
    border-color: var(--workbench-border);
    background: var(--panel);
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
    transition:
      border-color 180ms ease,
      background-color 180ms ease;

    .ant-card-head {
      min-height: 44px;
      border-bottom-color: var(--divider-subtle);
      background: var(--panel);
      padding-inline: 14px;
    }

    .ant-card-head-title {
      color: var(--text-strong);
      font-size: 13px;
      font-weight: 650;
    }

    .ant-card-body {
      padding: 14px;
    }

    &:hover {
      border-color: color-mix(in srgb, var(--admin-primary) 18%, var(--border));
    }
  `,
  fillCard: css`
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .ant-card-body {
      min-height: 0;
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
      contain: paint;
      scrollbar-gutter: stable;
      scrollbar-color: var(--scrollbar-thumb) transparent;
      scrollbar-width: thin;
    }

    .ant-empty {
      margin: auto;
    }

    .ant-space,
    .ant-space-item {
      min-width: 0;
    }

    @media (width <= 1180px) {
      min-height: 420px;
    }
  `,
  sideCard: css`
    flex: 0 0 auto;

    .ant-card-body {
      max-height: min(34vh, 360px);
      overflow: auto;
      contain: paint;
      padding: 12px;
      scrollbar-gutter: stable;
      scrollbar-color: var(--scrollbar-thumb) transparent;
      scrollbar-width: thin;
    }
  `,
  fieldSurface: css`
    contain: paint;
    border: 1px solid var(--workbench-border);
    border-radius: 8px;
    background: var(--control-bg);
    padding: 10px 12px;
  `,
  emptyCard: css`
    border-color: var(--workbench-border);
    box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  `,
}))
