export type PlanKey = 'free' | 'pro' | 'ultra';

export interface PlanDefinition {
  id: PlanKey;
  name: string;
  price: string;
  monthlyAmount: number;
  period: string;
  desc: string;
  items: string[];
  cta: string;
  highlight: boolean;
  href: string;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Grátis',
    price: 'Grátis',
    monthlyAmount: 0,
    period: '',
    desc: 'Para condomínios pequenos começarem.',
    items: ['Até 20 unidades', 'Dashboard completo', 'Cobranças e comunicados', 'Suporte por e-mail'],
    cta: 'Começar grátis',
    highlight: false,
    href: '/cadastro',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$97',
    monthlyAmount: 97,
    period: '/mês',
    desc: 'Para condomínios em operação.',
    items: ['Até 100 unidades', 'Tudo do Grátis', 'Relatórios PDF', 'WhatsApp integrado', 'Suporte prioritário'],
    cta: 'Plano Pro',
    highlight: true,
    href: '/cadastro',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 'R$197',
    monthlyAmount: 197,
    period: '/mês',
    desc: 'Para quem gerencia mais de um condomínio.',
    items: ['Unidades ilimitadas', 'Tudo do Pro', 'Multi-condomínio', 'Pix automático', 'SLA garantido'],
    cta: 'Plano Ultra',
    highlight: false,
    href: '/cadastro',
  },
];

export const PRICES = {
  pro:   { monthly: 97.00,  yearly: 931.20 },
  ultra: { monthly: 197.00, yearly: 1891.20 },
} as const;
