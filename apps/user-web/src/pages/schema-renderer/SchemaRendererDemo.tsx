import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { SchemaRenderer } from '@/components/SchemaRenderer'
import type { PageSchema } from '@/components/SchemaRenderer'

export function SchemaRendererDemoPage() {
  const { t } = useTranslation()
  const demoSchema = useMemo<PageSchema>(
    () => ({
      schemaVersion: '1.0',
      page: {
        children: [
          {
            id: 'page-heading',
            component: 'Header',
            props: {
              title: t('pages.schema.demo.title'),
              description: t('pages.schema.demo.description'),
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
                  title: t('pages.schema.demo.apiLatency'),
                  bordered: true,
                },
                children: [
                  {
                    id: 'api-latency',
                    component: 'MetricStatistic',
                    props: {
                      title: t('pages.schema.demo.averageLatency'),
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
                  title: t('pages.schema.demo.successRate'),
                  bordered: true,
                },
                children: [
                  {
                    id: 'success-rate',
                    component: 'MetricStatistic',
                    props: {
                      title: t('pages.schema.demo.requestSuccessRate'),
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
                  title: t('pages.schema.demo.errorCount'),
                  bordered: true,
                },
                children: [
                  {
                    id: 'error-count',
                    component: 'MetricStatistic',
                    props: {
                      title: t('pages.schema.demo.todayErrors'),
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
              title: t('pages.schema.demo.aiReport'),
              bordered: true,
            },
            children: [
              {
                id: 'report-markdown',
                component: 'MarkdownBlock',
                props: {
                  content: t('pages.schema.demo.reportContent'),
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
                  title: t('pages.schema.demo.sevenDayTrend'),
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
                        {
                          date: t('pages.schema.demo.week.mon'),
                          calls: 12800,
                          errors: 21,
                        },
                        {
                          date: t('pages.schema.demo.week.tue'),
                          calls: 15200,
                          errors: 18,
                        },
                        {
                          date: t('pages.schema.demo.week.wed'),
                          calls: 14600,
                          errors: 24,
                        },
                        {
                          date: t('pages.schema.demo.week.thu'),
                          calls: 18100,
                          errors: 19,
                        },
                        {
                          date: t('pages.schema.demo.week.fri'),
                          calls: 20500,
                          errors: 27,
                        },
                        {
                          date: t('pages.schema.demo.week.sat'),
                          calls: 16800,
                          errors: 16,
                        },
                        {
                          date: t('pages.schema.demo.week.sun'),
                          calls: 19200,
                          errors: 12,
                        },
                      ],
                      series: [
                        {
                          dataKey: 'calls',
                          name: t('pages.schema.demo.calls'),
                        },
                        {
                          dataKey: 'errors',
                          name: t('pages.schema.demo.errorCount'),
                        },
                      ],
                    },
                  },
                ],
              },
              {
                id: 'pie-chart-card',
                component: 'PanelCard',
                props: {
                  title: t('pages.schema.demo.modelShare'),
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
              title: t('pages.schema.demo.serviceDetails'),
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
                    { title: t('pages.schema.demo.service'), dataIndex: 'service' },
                    { title: t('pages.schema.demo.calls'), dataIndex: 'calls' },
                    { title: t('pages.schema.demo.latency'), dataIndex: 'latency' },
                    { title: t('pages.schema.demo.status'), dataIndex: 'status' },
                  ],
                  data: [
                    {
                      id: 'agent-runtime',
                      service: 'Agent Runtime',
                      calls: 84210,
                      latency: '128ms',
                      status: t('pages.schema.demo.status.normal'),
                    },
                    {
                      id: 'chat-model',
                      service: 'Chat Model',
                      calls: 62180,
                      latency: '640ms',
                      status: t('pages.schema.demo.status.normal'),
                    },
                    {
                      id: 'embedding',
                      service: 'Embedding',
                      calls: 38120,
                      latency: '220ms',
                      status: t('pages.schema.demo.status.normal'),
                    },
                    {
                      id: 'tool-call',
                      service: 'Tool Call',
                      calls: 19240,
                      latency: '310ms',
                      status: t('pages.schema.demo.status.observing'),
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    }),
    [t],
  )

  return <SchemaRenderer schema={demoSchema} />
}

export default SchemaRendererDemoPage
