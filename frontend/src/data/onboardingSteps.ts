import {
  LayoutDashboard, Building2, Home, Users, Receipt, TrendingDown,
  Wallet, FileText, Megaphone, Package, AlertTriangle, CalendarDays,
  CreditCard, Settings, LucideIcon,
} from 'lucide-react';

export interface OnboardingStep {
  /** Rota para a qual o tutorial navega ao chegar nesta etapa */
  route: string;
  /** Título exibido no card */
  title: string;
  /** Descrição da etapa */
  text: string;
  /** Ícone ilustrativo */
  icon: LucideIcon;
}

/**
 * Etapas do tutorial guiado para síndico/gestão.
 * A ordem aqui define a sequência do tour e o indicador "X de N".
 * As rotas correspondem às rotas reais registradas em App.tsx.
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    route: '/dashboard',
    title: 'Visão geral do condomínio',
    text: 'Aqui você acompanha os principais indicadores da gestão: recebimentos, atrasos, despesas, saldo, unidades, reservas e ocorrências.',
    icon: LayoutDashboard,
  },
  {
    route: '/condominio',
    title: 'Dados do condomínio',
    text: 'Configure nome, CNPJ, endereço, taxa padrão, vencimento e chave Pix.',
    icon: Building2,
  },
  {
    route: '/unidades',
    title: 'Cadastre suas unidades',
    text: 'Organize apartamentos, casas, blocos e status de ocupação. Você também pode importar dados por Excel ou PDF.',
    icon: Home,
  },
  {
    route: '/moradores',
    title: 'Gerencie os moradores',
    text: 'Cadastre proprietários, inquilinos e responsáveis financeiros vinculados a cada unidade.',
    icon: Users,
  },
  {
    route: '/cobrancas',
    title: 'Controle as cobranças',
    text: 'Crie cobranças individuais ou em massa, acompanhe pagamentos, atrasos e comprovantes.',
    icon: Receipt,
  },
  {
    route: '/despesas',
    title: 'Lance as despesas',
    text: 'Registre contas de luz, água, segurança, limpeza, manutenção e outras despesas do condomínio.',
    icon: TrendingDown,
  },
  {
    route: '/caixa',
    title: 'Acompanhe o fluxo de caixa',
    text: 'Veja entradas, saídas e saldo do mês para entender a saúde financeira do condomínio.',
    icon: Wallet,
  },
  {
    route: '/relatorios',
    title: 'Prestação de contas',
    text: 'Gere relatórios mensais com receitas, despesas, inadimplência e informações importantes para a gestão.',
    icon: FileText,
  },
  {
    route: '/comunicados',
    title: 'Publique avisos',
    text: 'Envie comunicados importantes para os moradores e mantenha tudo centralizado.',
    icon: Megaphone,
  },
  {
    route: '/encomendas',
    title: 'Controle encomendas',
    text: 'Registre chegadas, acompanhe retiradas e mantenha a portaria organizada.',
    icon: Package,
  },
  {
    route: '/ocorrencias',
    title: 'Acompanhe solicitações',
    text: 'Registre ocorrências, acompanhe status, prioridade e histórico de atendimento.',
    icon: AlertTriangle,
  },
  {
    route: '/reservas',
    title: 'Gerencie reservas',
    text: 'Controle áreas comuns, aprove solicitações e bloqueie horários quando necessário.',
    icon: CalendarDays,
  },
  {
    route: '/billing',
    title: 'Gerencie seu plano',
    text: 'Veja seu plano atual, limites disponíveis e opções de upgrade quando precisar.',
    icon: CreditCard,
  },
  {
    route: '/settings',
    title: 'Configure acessos',
    text: 'Convide colaboradores por cargo, gerencie permissões e ajuste dados da conta.',
    icon: Settings,
  },
];
