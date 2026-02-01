
import { DepartmentData, DepartmentId, WeightConfig, AppConfig } from './types';

export const INITIAL_CONFIG: AppConfig = {
  departments: [
    { id: 'VD', name: 'Venda Direta', icon: 'Phone' },
    { id: 'VI', name: 'Vendas Indiretas', icon: 'Users' },
    { id: 'ENT', name: 'Enterprise', icon: 'Briefcase' },
    { id: 'FIN', name: 'Financeiro', icon: 'DollarSign' },
    { id: 'MKT', name: 'Marketing', icon: 'TrendingUp' },
    { id: 'OPS', name: 'Operações e CS', icon: 'Shield' },
    { id: 'TEC', name: 'Tecnologia', icon: 'Server' },
    { id: 'RH', name: 'Pessoas & Cultura', icon: 'Heart' },
  ],
  categories: {
    'Growth & Scale': {
      id: 'Growth & Scale',
      label: 'Crescimento',
      colorTheme: 'orange',
      icon: 'Rocket',
    },
    'Sales Engine': {
      id: 'Sales Engine',
      label: 'Vendas',
      colorTheme: 'blue',
      icon: 'TrendingUp',
    },
    'Customer Obsession': {
      id: 'Customer Obsession',
      label: 'Clientes',
      colorTheme: 'rose',
      icon: 'HeartHandshake',
    },
    'Data Intelligence': {
      id: 'Data Intelligence',
      label: 'Dados',
      colorTheme: 'cyan',
      icon: 'BarChart2',
    },
    'Automation & Ops': {
      id: 'Automation & Ops',
      label: 'Automação',
      colorTheme: 'violet',
      icon: 'Zap',
    },
    'Tech & Cloud': {
      id: 'Tech & Cloud',
      label: 'Tecnologia',
      colorTheme: 'slate',
      icon: 'Server',
    },
    'Finance & Gov': {
      id: 'Finance & Gov',
      label: 'Finanças',
      colorTheme: 'emerald',
      icon: 'Coins',
    },
    'Innovation & AI': {
      id: 'Innovation & AI',
      label: 'Inovação',
      colorTheme: 'fuchsia',
      icon: 'Brain',
    },
    'People & Culture': {
      id: 'People & Culture',
      label: 'Pessoas',
      colorTheme: 'lime',
      icon: 'Users',
    }
  },
  statuses: {
    'Planejado': { id: 'Planejado', label: 'Planejado', colorTheme: 'slate', icon: 'Circle' },
    'Em Desenvolvimento': { id: 'Em Desenvolvimento', label: 'Em Desenv.', colorTheme: 'amber', icon: 'Clock' },
    'Em Progresso': { id: 'Em Progresso', label: 'Em Progresso', colorTheme: 'blue', icon: 'TrendingUp' },
    'Concluído': { id: 'Concluído', label: 'Concluído', colorTheme: 'emerald', icon: 'CheckCircle2' },
    'Bloqueado': { id: 'Bloqueado', label: 'Bloqueado', colorTheme: 'red', icon: 'AlertCircle' },
  },
  rolePermissions: {
    // Acesso TOTAL (Visualizar/Editar/Excluir + Configurações Globais)
    'Administrador': ['ALL'],
    
    // Acesso TÁTICO (Editar Realizado, Criar Metas, Pesos da Área)
    // Sem acesso a Configurações Globais
    'Gestor': [
      'view_global_dashboard', 
      'view_all_departments',
      'kpi_create', 
      'kpi_edit', // Permite editar o "Realizado"
      'kpi_delete',
      'goal_create', 
      'goal_edit', 
      'goal_delete', 
      'checkpoint_edit',
      'weights_manage', // Atribuição de pesos
      'snapshot_create',
      'logs_view'
    ],
    
    // Acesso LEITURA (Apenas visualizar metas e indicadores)
    'Operacional': [
      'view_global_dashboard', 
      'view_all_departments'
    ]
  }
};

// DADOS LIMPOS PARA PRODUÇÃO
// Mantém a estrutura das áreas para evitar erros, mas sem KPIs ou Metas iniciais.
export const INITIAL_DATA: Record<DepartmentId, DepartmentData> = {
  VD: { id: 'VD', name: 'Venda Direta', label: 'Vendas Diretas', kpis: [], goals: [], checkpoints: [] },
  VI: { id: 'VI', name: 'Vendas Indiretas', label: 'Canais & Parceiros', kpis: [], goals: [], checkpoints: [] },
  ENT: { id: 'ENT', name: 'Enterprise', label: 'Grandes Contas', kpis: [], goals: [], checkpoints: [] },
  FIN: { id: 'FIN', name: 'Financeiro', label: 'Financeiro & Admin', kpis: [], goals: [], checkpoints: [] },
  MKT: { id: 'MKT', name: 'Marketing', label: 'Growth & Branding', kpis: [], goals: [], checkpoints: [] },
  OPS: { 
    id: 'OPS', 
    name: 'Operações e CS', 
    label: 'Ops & Sucesso', 
    kpis: [
      {
        id: 'kpi-ops-churn',
        name: 'Churn',
        value: 0,
        target: 60000,
        unit: 'currency',
        trend: 'down',
        icon: 'AlertTriangle'
      },
      {
        id: 'kpi-ops-revenue',
        name: 'Novas Receitas',
        value: 0,
        target: 18000,
        unit: 'currency',
        trend: 'up',
        icon: 'DollarSign'
      },
      {
        id: 'kpi-ops-nps',
        name: 'NPS',
        value: 0,
        target: 85,
        unit: 'number',
        trend: 'up',
        icon: 'Heart'
      },
      {
        id: 'kpi-ops-csat',
        name: 'CSAT',
        value: 0,
        target: 4.6,
        unit: 'rating',
        trend: 'up',
        icon: 'Star'
      },
      {
        id: 'kpi-ops-retention',
        name: 'Taxa de Retenção',
        value: 0,
        target: 15,
        unit: 'percent',
        trend: 'up',
        icon: 'Shield'
      }
    ], 
    goals: [
      {
        id: 'goal-ops-1',
        title: 'Relatórios Insights (IA)',
        category: 'Innovation & AI',
        status: 'Planejado',
        progress: 0,
        description: 'Produzir relatórios gerenciais e estratégicos de forma automatizada, com apoio de IA, transformando dados operacionais em insights acionáveis.',
        calculationType: 'manual'
      },
      {
        id: 'goal-ops-2',
        title: 'Gamificação - 6 Indicações',
        category: 'Growth & Scale',
        status: 'Planejado',
        progress: 0,
        description: 'Estimular 6 indicações no trimestre de novas empresas por meio de mecânica de benefícios e descontos em mensalidade.',
        calculationType: 'quantitative',
        currentValue: 0,
        targetValue: 6,
        metricUnit: 'Indicações'
      },
      {
        id: 'goal-ops-3',
        title: 'Upsell - 24 Contas',
        category: 'Customer Obsession',
        status: 'Planejado',
        progress: 0,
        description: 'Atuação proativa do CSM em pelo menos 24 contas no trimestre, com foco em identificar oportunidades de expansão.',
        calculationType: 'quantitative',
        currentValue: 0,
        targetValue: 24,
        metricUnit: 'Contas'
      },
      {
        id: 'goal-ops-4',
        title: 'Win Back',
        category: 'Sales Engine',
        status: 'Planejado',
        progress: 0,
        description: 'Reconquistar clientes que estão fora da base há 180 dias, restabelecendo a relação e retomando a parceria.',
        calculationType: 'manual'
      },
      {
        id: 'goal-ops-5',
        title: 'Crossell - 2 Projetos',
        category: 'Sales Engine',
        status: 'Planejado',
        progress: 0,
        description: 'Fechar no mínimo 2 projetos de consumo de dados com clientes Key Accounts ao longo do Q1.',
        calculationType: 'quantitative',
        currentValue: 0,
        targetValue: 2,
        metricUnit: 'Projetos'
      },
      {
        id: 'goal-ops-6',
        title: 'Processo de Retenção com IA',
        category: 'Innovation & AI',
        status: 'Planejado',
        progress: 0,
        description: 'Desenhar o processo usando a IA.',
        calculationType: 'milestone',
        milestones: [
          { id: 'm1', label: 'Mapeamento do processo atual', weight: 30, completed: false },
          { id: 'm2', label: 'Desenho do fluxo com IA', weight: 40, completed: false },
          { id: 'm3', label: 'Implementação e Teste', weight: 30, completed: false }
        ]
      },
      {
        id: 'goal-ops-7',
        title: 'Postagens Automáticas',
        category: 'Automation & Ops',
        status: 'Planejado',
        progress: 0,
        description: 'Automatizar a criação e publicação de conteúdos, garantindo consistência dos locais, frequência e ganho de escala operacional.',
        calculationType: 'manual'
      },
      {
        id: 'goal-ops-8',
        title: 'Health Score',
        category: 'Data Intelligence',
        status: 'Planejado',
        progress: 0,
        description: 'Será criado dentro do monday.com para monitoramento de saúde da carteira.',
        calculationType: 'manual'
      }
    ], 
    checkpoints: [] 
  },
  TEC: { id: 'TEC', name: 'Tecnologia', label: 'Engenharia & Produto', kpis: [], goals: [], checkpoints: [] },
  RH: { id: 'RH', name: 'Pessoas & Cultura', label: 'RH & Cultura', kpis: [], goals: [], checkpoints: [] },
};

export const DEFAULT_WEIGHTS: Record<DepartmentId, WeightConfig> = {
  OPS: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  VD: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  VI: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  ENT: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  FIN: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  MKT: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  TEC: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
  RH: { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} },
};
