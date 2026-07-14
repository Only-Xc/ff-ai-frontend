export interface RuleTemplate {
  key: string
  labelKey: string
  descriptionKey: string
  icon: string
  evaluator_type: 'builtin' | 'json_logic' | 'manual'
  evaluator: string | null
  severity: string
  risk_score: number
  block_on_fail: boolean
  applicable_scope: Record<string, unknown>
  evidence_requirements: Record<string, unknown>
  evaluator_config?: Record<string, unknown>
  review_template?: string
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    key: 'secrets',
    labelKey: 'pages.grc.templates.secrets',
    descriptionKey: 'pages.grc.templates.secretsDesc',
    icon: 'LockOutlined',
    evaluator_type: 'builtin',
    evaluator: 'plaintext_secrets_detected',
    severity: 'CRITICAL',
    risk_score: 80,
    block_on_fail: true,
    applicable_scope: {},
    evidence_requirements: {},
    evaluator_config: { evaluator: 'plaintext_secrets_detected' },
  },
  {
    key: 'externalAllowlist',
    labelKey: 'pages.grc.templates.externalAllowlist',
    descriptionKey: 'pages.grc.templates.externalAllowlistDesc',
    icon: 'GlobalOutlined',
    evaluator_type: 'builtin',
    evaluator: 'external_network_allowed',
    severity: 'HIGH',
    risk_score: 65,
    block_on_fail: true,
    applicable_scope: { allowed_domains: ['api.company.com'] },
    evidence_requirements: {},
    evaluator_config: { evaluator: 'external_network_allowed' },
  },
  {
    key: 'restrictedData',
    labelKey: 'pages.grc.templates.restrictedData',
    descriptionKey: 'pages.grc.templates.restrictedDataDesc',
    icon: 'DatabaseOutlined',
    evaluator_type: 'builtin',
    evaluator: 'restricted_data_no_external_send',
    severity: 'HIGH',
    risk_score: 70,
    block_on_fail: true,
    applicable_scope: { approved_models: ['claude-opus-4-8'] },
    evidence_requirements: {},
    evaluator_config: { evaluator: 'restricted_data_no_external_send' },
  },
  {
    key: 'minPermissions',
    labelKey: 'pages.grc.templates.minPermissions',
    descriptionKey: 'pages.grc.templates.minPermissionsDesc',
    icon: 'SafetyCertificateOutlined',
    evaluator_type: 'builtin',
    evaluator: 'min_permissions',
    severity: 'MEDIUM',
    risk_score: 40,
    block_on_fail: false,
    applicable_scope: { required_permissions: ['read:knowledge'], denied_permissions: ['admin:system'] },
    evidence_requirements: {},
    evaluator_config: { evaluator: 'min_permissions' },
  },
  {
    key: 'auditLogging',
    labelKey: 'pages.grc.templates.auditLogging',
    descriptionKey: 'pages.grc.templates.auditLoggingDesc',
    icon: 'FileSearchOutlined',
    evaluator_type: 'builtin',
    evaluator: 'audit_logging_enabled',
    severity: 'MEDIUM',
    risk_score: 35,
    block_on_fail: false,
    applicable_scope: {},
    evidence_requirements: {},
    evaluator_config: { evaluator: 'audit_logging_enabled' },
  },
  {
    key: 'humanOversight',
    labelKey: 'pages.grc.templates.humanOversight',
    descriptionKey: 'pages.grc.templates.humanOversightDesc',
    icon: 'EyeOutlined',
    evaluator_type: 'manual',
    evaluator: null,
    severity: 'HIGH',
    risk_score: 60,
    block_on_fail: false,
    applicable_scope: {},
    evidence_requirements: {},
    evaluator_config: { review_required: true, review_template: '请检查业务目标、用户影响、风险缓解措施。' },
    review_template: '请检查业务目标、用户影响、风险缓解措施。',
  },
  {
    key: 'dataClassificationRouting',
    labelKey: 'pages.grc.templates.dataClassificationRouting',
    descriptionKey: 'pages.grc.templates.dataClassificationRoutingDesc',
    icon: 'ClusterOutlined',
    evaluator_type: 'json_logic',
    evaluator: null,
    severity: 'HIGH',
    risk_score: 65,
    block_on_fail: true,
    applicable_scope: {},
    evidence_requirements: {},
    evaluator_config: {
      expression: {
        "and": [
          { "==": [{ "var": "data_classification" }, "restricted"] },
          { "!": { "in": [{ "var": "target_model" }, { "var": "approved_models" }] } }
        ]
      },
      fail_message: '受限数据（restricted）不能路由到未批准模型',
      pass_message: '数据路由合规',
    },
  },
]
