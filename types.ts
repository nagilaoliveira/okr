
export type DepartmentId = string;
export type GoalCategory = string;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for frontend display, required for DB
  role: string; // Changed from fixed union type to string to support dynamic roles
  status: 'active' | 'blocked';
  avatarColor: string;
  lastActive: string;
  assignedDepartments: string[]; // 'ALL' or specific IDs
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number; // Armazena timestamp para ordenação fácil
  date: string;      // ISO Date
  time: string;      // HH:MM:SS
  ip?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: 'currency' | 'percent' | 'number' | 'rating';
  trend: 'up' | 'down';
  icon: string;
  chartVisible?: boolean;
}

export type CalculationType = 'manual' | 'quantitative' | 'milestone';

export interface Milestone {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  status: string;
  progress: number;
  description: string;
  notes?: string;
  
  // New Fields for Smart Calculation
  calculationType?: CalculationType;
  
  // For Quantitative (Linear)
  currentValue?: number;
  targetValue?: number;
  metricUnit?: string;

  // For Milestones (Weighted)
  milestones?: Milestone[];
}

export interface Checkpoint {
  id: string;
  date: string;
  completed: boolean;
  notes: string;
}

export interface DepartmentData {
  id: DepartmentId;
  name: string;
  label: string;
  kpis: KPI[];
  goals: Goal[];
  checkpoints: Checkpoint[];
}

export interface WeightConfig {
  kpiWeight: number;
  goalWeight: number;
  kpis: Record<string, number>;
  goals: Record<string, number>;
}

export interface CategoryConfig {
  id: string;
  label: string;
  colorTheme: string;
  icon: string;
}

export interface StatusConfig {
  id: string;
  label: string;
  colorTheme: string;
  icon: string;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  icon: string;
}

export interface AppConfig {
  departments: DepartmentConfig[];
  categories: Record<string, CategoryConfig>;
  statuses: Record<string, StatusConfig>;
  rolePermissions?: Record<string, string[]>;
}

export interface WeeklySnapshot {
  id: string;
  date: string;
  timestamp: number;
  weekLabel: string;
  overallScore: number;
  departmentScores: Record<DepartmentId, number>;
  categoryScores: Record<string, number>;
}

export interface AppState {
  selectedDept: DepartmentId;
  data: Record<DepartmentId, DepartmentData>;
}
