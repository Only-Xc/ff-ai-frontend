import { createStyles } from 'antd-style'

export const useExamStyles = createStyles(({ css }) => ({
  pageShell: css`
    display: flex;
    width: 100%;
    min-height: 0;
    height: calc(100vh - var(--ant-layout-header-height) - 10px);
    flex-direction: column;
    background: transparent;
  `,
  examFocusShell: css`
    display: flex;
    width: 100%;
    height: 100dvh;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
  `,
  workSurface: css`
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    background: var(--ant-color-bg-container);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
    contain: paint;
  `,
  mergedTabs: css`
    flex-shrink: 0;
    padding: 14px 20px 0;

    .ant-tabs-nav {
      margin: 0;

      &::before {
        border-bottom-color: var(--ant-color-border-secondary);
      }
    }

    .ant-tabs-tab {
      padding: 0 0 12px;
      font-weight: 600;
    }
  `,
  questionGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
  `,
}))
