
import React, { useState, useEffect, useRef } from 'react';
import { 
  DepartmentId, 
  DepartmentData, 
  KPI, 
  Goal, 
  Checkpoint,
  WeightConfig,
  AppConfig,
  WeeklySnapshot,
  User
} from './types';
import { INITIAL_DATA, DEFAULT_WEIGHTS, INITIAL_CONFIG } from './constants';
import { dbService } from './services/db';
import { IconResolver } from './utils/iconMap';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Home,
  LogOut,
  Save
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import OverviewDashboard from './components/OverviewDashboard';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [selectedView, setSelectedView] = useState<DepartmentId | 'HOME'>('HOME');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false); // Nova flag de segurança
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data States
  const [data, setData] = useState<Record<DepartmentId, DepartmentData>>(INITIAL_DATA);
  const [weights, setWeights] = useState<Record<DepartmentId, WeightConfig>>(DEFAULT_WEIGHTS);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);

  // Inicialização do Banco de Dados com Proteção de Dados (Seeding)
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await dbService.init();
        
        // --- SEEDING STEP ---
        // Verifica se o DB está vazio e insere os dados iniciais.
        // Se já tiver dados, preserva o que está no banco.
        await dbService.seedData(INITIAL_DATA, DEFAULT_WEIGHTS, INITIAL_CONFIG);

        // --- LOADING STEP ---
        // Carrega sempre do banco, garantindo que usamos a fonte da verdade.
        const savedData = await dbService.getAllData();
        const savedWeights = await dbService.getAllWeights();
        const savedConfig = await dbService.getAppConfig();
        const savedSnapshots = await dbService.getSnapshots();

        if (savedData && Object.keys(savedData).length > 0) {
          setData(savedData);
        } else {
          console.warn("Banco de dados retornou vazio após seed. Usando dados iniciais.");
        }

        if (savedWeights && Object.keys(savedWeights).length > 0) {
          setWeights(savedWeights);
        }
        
        if (savedConfig) setConfig(savedConfig);
        if (savedSnapshots) setSnapshots(savedSnapshots);
        
        setIsDbReady(true);
        setHasLoaded(true); // Marca como carregado para liberar o auto-save
      } catch (error) {
        console.error("Falha ao inicializar banco de dados:", error);
        alert("Erro crítico ao carregar banco de dados. Recarregue a página.");
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Persistência Automática
  // Só salva se isDbReady for true, hasLoaded for true E se houver usuário logado.
  // Isso previne que dados vazios sobrescrevam o banco na inicialização.
  useEffect(() => {
    if (isDbReady && hasLoaded && currentUser) {
      const saveDataAsync = async () => {
        setIsSaving(true);
        try {
          // Pequeno debounce ou verificação para evitar salvar estado vazio durante load
          if (Object.keys(data).length > 0) {
            await dbService.saveData(data);
          }
          await dbService.saveWeights(weights);
          await dbService.saveAppConfig(config);
        } catch (err) {
          console.error("Erro ao salvar dados automaticamente:", err);
        } finally {
          setTimeout(() => setIsSaving(false), 500);
        }
      };
      
      const timeoutId = setTimeout(saveDataAsync, 1000); // Debounce de 1s
      return () => clearTimeout(timeoutId);
    }
  }, [data, weights, config, isDbReady, hasLoaded, currentUser]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    if (currentUser) {
        dbService.logAction(currentUser, 'Logout', 'Saiu do sistema', 'info');
    }
    setCurrentUser(null);
    setSelectedView('HOME');
  };

  // --- PERMISSION LOGIC ---
  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    
    // Check role based permissions from config
    const role = currentUser.role;
    const rolePermissions = config.rolePermissions?.[role] || [];
    
    if (rolePermissions.includes('ALL')) return true;
    return rolePermissions.includes(permissionId);
  };

  const handleUpdateGlobalConfig = (newConfig: AppConfig) => {
    const updatedData = { ...data };
    const updatedWeights = { ...weights };

    newConfig.departments.forEach(dept => {
      if (!updatedData[dept.id]) {
        updatedData[dept.id] = {
          id: dept.id,
          name: dept.name,
          label: dept.name,
          kpis: [],
          goals: [],
          checkpoints: []
        };
        updatedWeights[dept.id] = {
          kpiWeight: 50,
          goalWeight: 50,
          kpis: {},
          goals: {}
        };
      } else {
        if (updatedData[dept.id].name !== dept.name) {
          updatedData[dept.id] = { ...updatedData[dept.id], name: dept.name, label: dept.name };
        }
      }
    });

    setConfig(newConfig);
    setData(updatedData);
    setWeights(updatedWeights);
    setShowGlobalSettings(false);
    
    if (currentUser) {
        dbService.logAction(currentUser, 'Configurações Globais', 'Atualizou estrutura organizacional', 'warning');
    }
  };

  const handleRestoreData = async (restorePayload: any) => {
    try {
      if (!restorePayload || typeof restorePayload !== 'object') {
        throw new Error("Arquivo inválido");
      }

      // 1. Atualiza estado local imediatamente
      if (restorePayload.data) setData(restorePayload.data);
      if (restorePayload.weights) setWeights(restorePayload.weights);
      if (restorePayload.config) setConfig(restorePayload.config);
      if (restorePayload.snapshots) setSnapshots(restorePayload.snapshots);
      
      // 2. Força persistência no DB
      if (restorePayload.data) await dbService.saveData(restorePayload.data);
      if (restorePayload.weights) await dbService.saveWeights(restorePayload.weights);
      if (restorePayload.config) await dbService.saveAppConfig(restorePayload.config);
      if (restorePayload.snapshots && Array.isArray(restorePayload.snapshots)) {
        for (const snap of restorePayload.snapshots) {
          await dbService.saveSnapshot(snap);
        }
      }

      if (currentUser) {
        dbService.logAction(currentUser, 'Restauração de Backup', 'Restaurou dados do sistema via arquivo', 'warning');
      }
      
      alert('Dados restaurados com sucesso!');
      setShowGlobalSettings(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao restaurar dados. Verifique se o arquivo está correto.');
    }
  };

  const handleSaveSnapshot = async (snapshot: WeeklySnapshot) => {
    const existingIndex = snapshots.findIndex(s => s.id === snapshot.id);
    let newSnapshots = [...snapshots];
    
    if (existingIndex >= 0) {
      newSnapshots[existingIndex] = snapshot;
    } else {
      newSnapshots.push(snapshot);
    }
    
    newSnapshots.sort((a, b) => a.timestamp - b.timestamp);
    setSnapshots(newSnapshots);
    await dbService.saveSnapshot(snapshot);
    
    if (currentUser) {
        dbService.logAction(currentUser, 'Check-in Salvo', `Registrou snapshot para ${snapshot.weekLabel}`, 'success');
    }
  };

  // Data Update Handlers
  const updateKPI = (deptId: DepartmentId, updatedKPI: KPI) => {
    if (!hasPermission('kpi_edit')) return;
    setData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        kpis: prev[deptId].kpis.map(k => k.id === updatedKPI.id ? updatedKPI : k)
      }
    }));
    if (currentUser) dbService.logAction(currentUser, 'Atualizou KPI', `Editou "${updatedKPI.name}" em ${deptId}`, 'info');
  };

  const addKPI = (deptId: DepartmentId, newKPI: KPI) => {
    if (!hasPermission('kpi_create')) return;
    setData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        kpis: [...prev[deptId].kpis, newKPI]
      }
    }));
    if (currentUser) dbService.logAction(currentUser, 'Criou KPI', `Adicionou "${newKPI.name}" em ${deptId}`, 'success');
  };

  const deleteKPI = (deptId: DepartmentId, kpiId: string) => {
    if (!hasPermission('kpi_delete')) {
      alert("Acesso Negado: Você não tem permissão para excluir KPIs.");
      return;
    }
    
    const kpiName = data[deptId]?.kpis.find(k => k.id === kpiId)?.name || 'KPI';

    setData(prev => {
        const dept = prev[deptId];
        if (!dept) return prev;
        
        return {
          ...prev,
          [deptId]: {
            ...dept,
            kpis: dept.kpis.filter(k => k.id !== kpiId)
          }
        };
    });
    if (currentUser) dbService.logAction(currentUser, 'Excluiu KPI', `Removeu "${kpiName}" de ${deptId}`, 'warning');
  };

  const updateGoal = (deptId: DepartmentId, updatedGoal: Goal) => {
    if (!hasPermission('goal_edit')) return;
    setData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        goals: prev[deptId].goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
      }
    }));
    if (currentUser) dbService.logAction(currentUser, 'Atualizou Meta', `Editou "${updatedGoal.title}" em ${deptId}`, 'info');
  };

  const deleteGoal = (deptId: DepartmentId, goalId: string) => {
    if (!hasPermission('goal_delete')) {
      alert("Acesso Negado: Você não tem permissão para excluir Metas.");
      return;
    }

    const goalTitle = data[deptId]?.goals.find(g => g.id === goalId)?.title || 'Meta';

    setData(prev => {
        const dept = prev[deptId];
        if (!dept) return prev;

        return {
          ...prev,
          [deptId]: {
            ...dept,
            goals: dept.goals.filter(g => g.id !== goalId)
          }
        };
    });
    if (currentUser) dbService.logAction(currentUser, 'Excluiu Meta', `Removeu "${goalTitle}" de ${deptId}`, 'warning');
  };

  const updateCheckpoint = (deptId: DepartmentId, updatedCP: Checkpoint) => {
    if (!hasPermission('checkpoint_edit')) return;
    setData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        checkpoints: prev[deptId].checkpoints.map(c => c.id === updatedCP.id ? updatedCP : c)
      }
    }));
    if (currentUser) dbService.logAction(currentUser, 'Timeline', `Atualizou checkpoint em ${deptId}`, 'info');
  };

  const addNewGoal = (deptId: DepartmentId, newGoal: Goal) => {
    if (!hasPermission('goal_create')) return;
    setData(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        goals: [...prev[deptId].goals, newGoal]
      }
    }));
    if (currentUser) dbService.logAction(currentUser, 'Criou Meta', `Adicionou "${newGoal.title}" em ${deptId}`, 'success');
  };

  const updateWeights = (deptId: DepartmentId, newWeights: WeightConfig) => {
    if (!hasPermission('weights_manage')) return;
    setWeights(prev => ({
      ...prev,
      [deptId]: newWeights
    }));
    if (currentUser) dbService.logAction(currentUser, 'Pesos', `Reconfigurou pesos em ${deptId}`, 'warning');
  };

  // --- RENDER ---

  if (isLoading) {
    return <div className="min-h-screen bg-[#000C33] flex items-center justify-center text-white font-bold">Carregando HubLocal...</div>;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Filter departments based on user permissions
  const allowedDepts = currentUser.assignedDepartments.includes('ALL') 
    ? config.departments 
    : config.departments.filter(d => currentUser.assignedDepartments.includes(d.id));

  // Determine current context based on selection
  const isHome = selectedView === 'HOME';
  const currentDeptId = isHome ? '' : selectedView as DepartmentId;
  const currentData = data[currentDeptId];
  const currentWeights = weights[currentDeptId] || { kpiWeight: 50, goalWeight: 50, kpis: {}, goals: {} };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-[#0f172a]">
      {/* Sidebar */}
      <aside 
        className={`hidden lg:flex bg-[#020617] text-white flex-col shadow-2xl z-30 sticky top-0 h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-600 opacity-10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-5 justify-between'} relative z-10 border-b border-white/5 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-2 rounded-xl shadow-lg shadow-blue-600/30 border border-white/10 shrink-0">
               <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-black text-lg tracking-tight text-white leading-none">HubLocal</h1>
                <p className="text-[9px] text-blue-200 font-bold tracking-widest uppercase opacity-80 mt-0.5">Estratégia</p>
              </div>
            )}
          </div>
          
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
              title="Recolher Menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-white/5 shrink-0">
             <button 
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
              title="Expandir Menu"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto relative z-10 scrollbar-hide">
          <button
            onClick={() => setSelectedView('HOME')}
            title={isSidebarCollapsed ? "Visão Geral" : ''}
            className={`w-full flex items-center py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden mb-4 border border-transparent
              ${isHome 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                : 'text-white hover:bg-white/10 border-white/5 bg-white/5'
              }
              ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}
            `}
          >
             <div className="relative z-10 flex items-center">
                <Home className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isHome ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isSidebarCollapsed && (
                  <>
                    <span className="ml-3 text-sm font-bold tracking-wide">Visão Geral</span>
                    {isHome && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-80" />}
                  </>
                )}
             </div>
             {isHome && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
          </button>
          
          {!isSidebarCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-3 mt-2">
              Áreas Permitidas
            </div>
          )}

          {allowedDepts.map((dept) => {
            const isActive = selectedView === dept.id;
            
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedView(dept.id)}
                title={isSidebarCollapsed ? dept.name : ''}
                className={`w-full flex items-center py-2 rounded-xl transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                    : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
                  }
                  ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'}
                `}
              >
                <div className="relative z-10 flex items-center min-w-0">
                  <IconResolver iconName={dept.icon} className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  
                  {!isSidebarCollapsed && (
                    <>
                      <span className={`ml-3 text-sm font-semibold tracking-wide truncate ${isActive ? 'text-white' : ''}`}>
                        {dept.name}
                      </span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-80" />}
                    </>
                  )}
                </div>
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 relative z-10 border-t border-white/5 bg-[#020617] shrink-0 space-y-1">
          {(hasPermission('settings_manage') || hasPermission('users_manage')) && (
            <button 
              onClick={() => setShowGlobalSettings(true)}
              className={`w-full flex items-center p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 transition-all duration-300 border border-transparent hover:border-blue-500/30 group ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}
              title="Configurações Globais"
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
              {!isSidebarCollapsed && <span className="ml-2 text-xs font-bold uppercase tracking-wider">Config</span>}
            </button>
          )}

          <button 
            onClick={handleLogout}
            className={`w-full flex items-center p-2.5 rounded-xl bg-white/5 hover:bg-slate-700 text-slate-400 transition-all duration-300 border border-transparent group ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="ml-2 text-xs font-bold uppercase tracking-wider">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#020617] p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            <span className="font-bold">HubLocal</span>
          </div>
          <button className="p-2" onClick={handleLogout}><LogOut className="w-6 h-6" /></button>
        </div>

        {/* COMPACT HEADER */}
        <header className="relative bg-slate-900 text-white py-5 px-6 z-10 overflow-hidden shadow-xl shrink-0 border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
          <div className="max-w-[1600px] mx-auto w-full relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-4">
               <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white flex items-center gap-3">
                    Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Q1 2026</span>
                  </h1>
                  <h2 className="text-sm font-medium text-slate-400 flex items-center gap-2 mt-1">
                    {isHome ? (
                      'Visão Geral da Diretoria'
                    ) : (
                      <>
                        <span>Metas e KPIs</span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        <strong className="text-white font-bold">{currentData?.name || 'Carregando...'}</strong>
                      </>
                    )}
                  </h2>
               </div>
               
               {/* Ciclo Vigente Inline */}
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 ml-4">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-300">20 Jan - 20 Abr 2026</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               {isSaving && (
                 <span className="text-xs font-bold text-blue-400 animate-pulse flex items-center gap-1">
                   <Save className="w-3 h-3" /> Salvando...
                 </span>
               )}
               <div className="flex items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-${currentUser.avatarColor}-500 text-xs shadow-md border-2 border-slate-900`}>
                   {currentUser.name.substring(0,2).toUpperCase()}
                 </div>
                 <div className="hidden md:block">
                   <p className="text-xs font-bold text-white">{currentUser.name}</p>
                   <p className="text-[10px] text-slate-400">{currentUser.role}</p>
                 </div>
               </div>

               <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm transition-all duration-300 ${isDbReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
                  <Database className="w-3 h-3" />
                  {isDbReady ? 'Online' : 'Conectando'}
               </span>
            </div>

          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC] relative">
           <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-60"></div>
           </div>
           
           <div className="max-w-[1600px] mx-auto relative z-10">
            {isHome ? (
              <OverviewDashboard 
                allData={data} 
                allWeights={weights} 
                config={config}
                snapshots={snapshots}
                onSaveSnapshot={handleSaveSnapshot}
                onNavigate={(deptId) => {
                  if (allowedDepts.find(d => d.id === deptId) || hasPermission('view_all_departments')) {
                    setSelectedView(deptId);
                  } else {
                    alert("Você não tem permissão para acessar esta área.");
                  }
                }}
                hasSnapshotPermission={hasPermission('snapshot_create')} 
              />
            ) : (
              currentData ? (
                <Dashboard 
                  data={currentData} 
                  weights={currentWeights}
                  categories={config.categories}
                  statuses={config.statuses}
                  permissions={{
                    canCreateKPI: hasPermission('kpi_create'),
                    canEditKPI: hasPermission('kpi_edit'),
                    canDeleteKPI: hasPermission('kpi_delete'),
                    canCreateGoal: hasPermission('goal_create'),
                    canEditGoal: hasPermission('goal_edit'),
                    canDeleteGoal: hasPermission('goal_delete'),
                    canEditCheckpoint: hasPermission('checkpoint_edit'),
                    canManageWeights: hasPermission('weights_manage')
                  }}
                  onUpdateKPI={(kpi) => updateKPI(currentDeptId, kpi)}
                  onAddKPI={(kpi) => addKPI(currentDeptId, kpi)}
                  onDeleteKPI={(id) => deleteKPI(currentDeptId, id)}
                  onUpdateGoal={(goal) => updateGoal(currentDeptId, goal)}
                  onDeleteGoal={(id) => deleteGoal(currentDeptId, id)}
                  onUpdateCheckpoint={(cp) => updateCheckpoint(currentDeptId, cp)}
                  onAddGoal={(goal) => addNewGoal(currentDeptId, goal)}
                  onUpdateWeights={(w) => updateWeights(currentDeptId, w)}
                />
              ) : (
                <div className="text-center p-10 text-slate-500">Selecione uma área ou carregue dados.</div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Global Settings Modal */}
      {showGlobalSettings && (
        <GlobalSettingsModal 
          config={config}
          currentUser={currentUser}
          data={data}
          weights={weights}
          snapshots={snapshots}
          onSave={handleUpdateGlobalConfig}
          onRestore={handleRestoreData}
          onClose={() => setShowGlobalSettings(false)}
        />
      )}
    </div>
  );
}
