import { SchemaRenderer } from '@/components/SchemaRenderer'
import type { PageSchema } from '@/components/SchemaRenderer'

const demoSchema: PageSchema = {
  schemaVersion: '1.0',
  page: {
    children: [
      {
        id: 'page-heading',
        component: 'Header',
        props: {
          title: 'SchemaRenderer 示例看板',
          description: '静态 PageSchema 渲染示例，覆盖第一版注册表组件。',
          level: 4,
        },
      },
      {
        id: 'overview-grid',
        component: 'GridLayout',
        props: {
          gutter: [16, 16],
          span: [8, 8, 8],
        },
        children: [
          {
            id: 'api-latency-card',
            component: 'PanelCard',
            props: {
              title: 'API 延迟',
              bordered: true,
            },
            children: [
              {
                id: 'api-latency',
                component: 'MetricStatistic',
                props: {
                  title: '平均延迟',
                  value: 125,
                  suffix: 'ms',
                  status: 'success',
                },
              },
            ],
          },
          {
            id: 'success-rate-card',
            component: 'PanelCard',
            props: {
              title: '成功率',
              bordered: true,
            },
            children: [
              {
                id: 'success-rate',
                component: 'MetricStatistic',
                props: {
                  title: '请求成功率',
                  value: 99.82,
                  suffix: '%',
                  precision: 2,
                  status: 'success',
                },
              },
            ],
          },
          {
            id: 'error-count-card',
            component: 'PanelCard',
            props: {
              title: '异常数',
              bordered: true,
            },
            children: [
              {
                id: 'error-count',
                component: 'MetricStatistic',
                props: {
                  title: '今日异常',
                  value: 12,
                  status: 'warning',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'report-card',
        component: 'PanelCard',
        props: {
          title: 'AI 分析报告',
          bordered: true,
        },
        children: [
          {
            id: 'report-markdown',
            component: 'MarkdownBlock',
            props: {
              content:
                '### 核心结论\n\n- 本日服务整体稳定，平均延迟保持在目标范围内。\n- 异常集中在任务调度链路，建议优先排查高峰期队列堆积。\n- 成功率维持在 99.8% 以上，可以继续观察长期趋势。',
            },
          },
        ],
      },
      {
        id: 'charts-grid',
        component: 'GridLayout',
        props: {
          gutter: [16, 16],
          span: [14, 10],
        },
        children: [
          {
            id: 'line-chart-card',
            component: 'PanelCard',
            props: {
              title: '七日调用趋势',
              bordered: true,
            },
            children: [
              {
                id: 'line-chart',
                component: 'LineChart',
                props: {
                  height: 320,
                  xAxisKey: 'date',
                  data: [
                    { date: '周一', calls: 12800, errors: 21 },
                    { date: '周二', calls: 15200, errors: 18 },
                    { date: '周三', calls: 14600, errors: 24 },
                    { date: '周四', calls: 18100, errors: 19 },
                    { date: '周五', calls: 20500, errors: 27 },
                    { date: '周六', calls: 16800, errors: 16 },
                    { date: '周日', calls: 19200, errors: 12 },
                  ],
                  series: [
                    { dataKey: 'calls', name: '调用量' },
                    { dataKey: 'errors', name: '异常数' },
                  ],
                },
              },
            ],
          },
          {
            id: 'pie-chart-card',
            component: 'PanelCard',
            props: {
              title: '模型调用占比',
              bordered: true,
            },
            children: [
              {
                id: 'pie-chart',
                component: 'PieChart',
                props: {
                  height: 320,
                  data: [
                    { name: 'Agent Runtime', value: 42 },
                    { name: 'Chat Model', value: 31 },
                    { name: 'Embedding', value: 18 },
                    { name: 'Tool Call', value: 9 },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        id: 'table-card',
        component: 'PanelCard',
        props: {
          title: '服务明细',
          bordered: true,
        },
        children: [
          {
            id: 'service-table',
            component: 'DataTable',
            props: {
              pagination: {
                pageSize: 5,
              },
              columns: [
                { title: '服务', dataIndex: 'service' },
                { title: '调用量', dataIndex: 'calls' },
                { title: '平均延迟', dataIndex: 'latency' },
                { title: '状态', dataIndex: 'status' },
              ],
              data: [
                {
                  id: 'agent-runtime',
                  service: 'Agent Runtime',
                  calls: 84210,
                  latency: '128ms',
                  status: '正常',
                },
                {
                  id: 'chat-model',
                  service: 'Chat Model',
                  calls: 62180,
                  latency: '640ms',
                  status: '正常',
                },
                {
                  id: 'embedding',
                  service: 'Embedding',
                  calls: 38120,
                  latency: '220ms',
                  status: '正常',
                },
                {
                  id: 'tool-call',
                  service: 'Tool Call',
                  calls: 19240,
                  latency: '310ms',
                  status: '观察',
                },
              ],
            },
          },
        ],
      },
    ],
  },
}

export function SchemaRendererDemoPage() {
  return <SchemaRenderer schema={demoSchema} />
}

export default SchemaRendererDemoPage
