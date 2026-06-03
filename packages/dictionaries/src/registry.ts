import type { DictRegistry } from './types.js'

export const dictRegistry = {
  admin_skill_environment: [
    { label: 'UAT', value: 'UAT', color: 'cyan' },
    { label: 'PROD', value: 'PROD', color: 'blue' },
  ],
  admin_skill_status: [
    {
      label: '热存储',
      labels: { 'en-US': 'Hot storage', ar: 'تخزين ساخن' },
      value: 'hot',
      color: 'success',
    },
    {
      label: '冷存储',
      labels: { 'en-US': 'Cold storage', ar: 'تخزين بارد' },
      value: 'cold',
      color: 'warning',
    },
    {
      label: '已废弃',
      labels: { 'en-US': 'Deprecated', ar: 'مهمل' },
      value: 'deprecated',
      color: 'default',
    },
  ],
  agent_status: [
    {
      label: '运行中',
      labels: { 'en-US': 'Running', ar: 'قيد التشغيل' },
      value: 'running',
      color: 'success',
    },
    {
      label: '已停止',
      labels: { 'en-US': 'Stopped', ar: 'متوقف' },
      value: 'stopped',
      color: 'default',
    },
    {
      label: '沙盒唤醒',
      labels: { 'en-US': 'Sandbox awake', ar: 'وضع الحماية نشط' },
      value: 'sandbox',
      color: 'processing',
    },
  ],
  billing_resource_type: [
    {
      label: '大模型推理 Token',
      labels: { 'en-US': 'LLM inference tokens', ar: 'رموز استدلال النموذج' },
      value: 'compute_token',
      color: 'blue',
    },
    {
      label: '存储空间',
      labels: { 'en-US': 'Storage space', ar: 'مساحة التخزين' },
      value: 'storage_gb',
      color: 'green',
    },
    {
      label: '网络出口流量',
      labels: { 'en-US': 'Network egress', ar: 'حركة الشبكة الصادرة' },
      value: 'network_egress_gb',
      color: 'purple',
    },
    {
      label: '计算核时',
      labels: { 'en-US': 'Compute hours', ar: 'ساعات الحوسبة' },
      value: 'compute_hour',
      color: 'orange',
    },
  ],
  ops_metrics_period: [
    {
      label: '今日',
      labels: { 'en-US': 'Today', ar: 'اليوم' },
      value: 'today',
    },
    {
      label: '近 7 天',
      labels: { 'en-US': 'Last 7 days', ar: 'آخر 7 أيام' },
      value: 'week',
    },
    {
      label: '本月',
      labels: { 'en-US': 'This month', ar: 'هذا الشهر' },
      value: 'month',
    },
  ],
  pending_task_type: [
    {
      label: '流程工单',
      labels: { 'en-US': 'Process ticket', ar: 'تذكرة عملية' },
      value: 'process',
      color: 'processing',
    },
    {
      label: '容器工单',
      labels: { 'en-US': 'Container ticket', ar: 'تذكرة حاوية' },
      value: 'container',
      color: 'processing',
    },
    {
      label: '直接结果',
      labels: { 'en-US': 'Direct result', ar: 'نتيجة مباشرة' },
      value: 'direct_result',
      color: 'processing',
    },
  ],
  task_status: [
    {
      label: '已创建',
      labels: { 'en-US': 'Created', ar: 'تم الإنشاء' },
      value: 'CREATED',
      color: 'geekblue',
    },
    {
      label: '需求分析',
      labels: { 'en-US': 'Analyzing', ar: 'قيد التحليل' },
      value: 'ANALYZING',
      color: 'blue',
    },
    {
      label: '路由中',
      labels: { 'en-US': 'Routing', ar: 'قيد التوجيه' },
      value: 'ROUTING',
      color: 'processing',
    },
    {
      label: '编码中',
      labels: { 'en-US': 'Coding', ar: 'قيد البرمجة' },
      value: 'CODING',
      color: 'purple',
    },
    {
      label: '测试中',
      labels: { 'en-US': 'Testing', ar: 'قيد الاختبار' },
      value: 'TESTING',
      color: 'cyan',
    },
    {
      label: '部署中',
      labels: { 'en-US': 'Deploying', ar: 'قيد النشر' },
      value: 'DEPLOYING',
      color: 'gold',
    },
    {
      label: '已完成',
      labels: { 'en-US': 'Completed', ar: 'مكتمل' },
      value: 'COMPLETED',
      color: 'success',
    },
    {
      label: '待审批',
      labels: { 'en-US': 'Pending approval', ar: 'بانتظار الموافقة' },
      value: 'PENDING_APPROVAL',
      color: 'warning',
    },
    {
      label: '失败',
      labels: { 'en-US': 'Failed', ar: 'فشل' },
      value: 'FAILED',
      color: 'error',
    },
  ],
  task_status_filter: [
    {
      label: '流转中',
      labels: { 'en-US': 'Active', ar: 'نشط' },
      value: 'active',
    },
    {
      label: '待审批',
      labels: { 'en-US': 'Pending approval', ar: 'بانتظار الموافقة' },
      value: 'pending_approval',
    },
    {
      label: '已完成',
      labels: { 'en-US': 'Completed', ar: 'مكتمل' },
      value: 'completed',
    },
    {
      label: '失败',
      labels: { 'en-US': 'Failed', ar: 'فشل' },
      value: 'failed',
    },
    { label: '全部', labels: { 'en-US': 'All', ar: 'الكل' }, value: 'all' },
  ],
  task_type: [
    {
      label: '直接返回结果',
      labels: { 'en-US': 'Direct result', ar: 'نتيجة مباشرة' },
      value: 'direct_result',
    },
    {
      label: '创建进程',
      labels: { 'en-US': 'Create process', ar: 'إنشاء عملية' },
      value: 'process',
    },
    {
      label: '创建容器',
      labels: { 'en-US': 'Create container', ar: 'إنشاء حاوية' },
      value: 'container',
    },
  ],
} as const satisfies DictRegistry
