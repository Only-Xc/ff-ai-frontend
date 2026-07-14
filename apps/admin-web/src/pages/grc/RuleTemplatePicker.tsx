import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  Button,
  Drawer,
  Grid,
  Space,
  Tag,
  Typography,
} from 'antd'

import type { RuleTemplate } from './ruleTemplates'
import { RULE_TEMPLATES } from './ruleTemplates'

const { useBreakpoint } = Grid

interface RuleTemplatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (template: RuleTemplate) => void
}

export function RuleTemplatePicker({ open, onClose, onSelect }: RuleTemplatePickerProps) {
  const { t } = useTranslation()
  const screens = useBreakpoint()

  return (
    <Drawer
      title={t('pages.grc.rules.templateSelector')}
      open={open}
      onClose={onClose}
      width={screens.md ? 600 : '100%'}
    >
      <Typography.Paragraph type="secondary">
        {t('pages.grc.rules.selectTemplate')}
      </Typography.Paragraph>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {RULE_TEMPLATES.map(tmpl => (
          <div
            key={tmpl.key}
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Tag color={tmpl.severity === 'CRITICAL' ? 'red' : tmpl.severity === 'HIGH' ? 'orange' : 'blue'}>
                  {tmpl.severity}
                </Tag>
                <Typography.Text strong>{t(tmpl.labelKey)}</Typography.Text>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {t(tmpl.descriptionKey)}
              </Typography.Text>
              <Space>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    onSelect(tmpl)
                    onClose()
                  }}
                >
                  {t('pages.grc.rules.templateApplied')}
                </Button>
              </Space>
            </Space>
          </div>
        ))}
      </Space>
    </Drawer>
  )
}
