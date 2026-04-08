import type { SystemSetting } from '@/types'

export const SETTINGS: SystemSetting[] = [
  {
    key: 'payroll_cutoff_day',
    label: 'Dia de Fechamento da Folha',
    value: '5',
    description: 'Dia do mês em que a folha de pagamento é fechada para novas consignações.',
  },
  {
    key: 'max_interest_rate',
    label: 'Taxa Máxima de Juros',
    value: '2.50',
    description: 'Taxa máxima de juros mensal permitida para consignações (% a.m.).',
  },
  {
    key: 'max_margin_percentage',
    label: 'Margem Máxima de Consignação',
    value: '35',
    description: 'Percentual máximo da remuneração bruta que pode ser comprometido com consignações.',
  },
  {
    key: 'session_timeout_minutes',
    label: 'Tempo de Sessão',
    value: '60',
    description: 'Tempo máximo de inatividade antes da sessão expirar (em minutos).',
  },
]
