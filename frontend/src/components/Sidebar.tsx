import React from 'react';
import { 
  LayoutDashboard, 
  Pickaxe, 
  Activity, 
  Video, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  Layers3, 
  Bell,
  Users,
  Building2,
  Leaf,
  MessageSquare,
  FileSpreadsheet,
  ShieldCheck,
  BrainCircuit,
  Bot,
  ClipboardCheck,
  Network,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import clsx from 'clsx';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  roles: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { isSystemAdmin, hasRole } = useAuth();
  const { t } = useLanguage();

  const navGroups: NavGroup[] = [
    {
      title: 'COMMAND',
      items: [
        {
          id: 'dashboard',
          label: t('liveDashboard'),
          icon: LayoutDashboard,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR']
        },
        {
          id: 'digital-twin',
          label: t('spatialTwin'),
          icon: Layers3,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR']
        }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'sensors',
          label: t('sensorsTelemetry'),
          icon: Activity,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'alerts',
          label: t('operationalAlerts'),
          icon: Bell,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'incidents',
          label: t('safetyIncidents'),
          icon: AlertTriangle,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'field-operations',
          label: t('fieldOperations'),
          icon: ClipboardCheck,
          roles: ['SYSTEM_ADMIN', 'FIELD_INSPECTOR', 'MINE_SAFETY_OFFICER', 'MINE_MANAGER', 'REGULATOR']
        },
        {
          id: 'cameras',
          label: t('cctvMachinery'),
          icon: Video,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR']
        },
        {
          id: 'mines',
          label: t('minesLevels'),
          icon: Layers3,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'REGULATOR']
        }
      ]
    },
    {
      title: 'GOVERNANCE',
      items: [
        {
          id: 'violations',
          label: t('dgmsViolations'),
          icon: FileText,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'production',
          label: t('productionLogs'),
          icon: Pickaxe,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'workforce',
          label: t('workforceMuster'),
          icon: Users,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'CONTRACTOR_MANAGER', 'REGULATOR']
        },
        {
          id: 'contractors',
          label: t('contractorsSla'),
          icon: Building2,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'CONTRACTOR_MANAGER', 'REGULATOR']
        },
        {
          id: 'environment',
          label: t('atmosphereEnv'),
          icon: Leaf,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR']
        },
        {
          id: 'grievances',
          label: t('grievanceRedressal'),
          icon: MessageSquare,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'CONTRACTOR_MANAGER', 'REGULATOR']
        },
        {
          id: 'reports',
          label: t('statutoryReports'),
          icon: FileSpreadsheet,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR']
        },
        {
          id: 'approvals',
          label: t('digitalSignoffs'),
          icon: ShieldCheck,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR']
        }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          id: 'predictive-risk',
          label: t('aiRiskIntelligence'),
          icon: BrainCircuit,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR']
        },
        {
          id: 'copilot',
          label: t('aiCopilot'),
          icon: Bot,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR']
        }
      ]
    },
    {
      title: 'INTEGRATIONS',
      items: [
        {
          id: 'integrations-health',
          label: t('integrationsHealth'),
          icon: Network,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR']
        }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'risk-audit',
          label: t('riskAuditTrail'),
          icon: ShieldAlert,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'REGULATOR']
        },
        {
          id: 'demo-control',
          label: t('demoControlCenter'),
          icon: Radio,
          roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR']
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#080A09] border-r border-[#1B211E] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-[#1B211E] flex items-center gap-3 bg-[#0D100F]">
          <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10 border border-amber-400/30">
            <span className="font-mono font-black text-[#080A09] text-base leading-none">त्रिन</span>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wider text-slate-100 uppercase leading-none">TRINETRA</h1>
            <p className="text-[9.5px] text-amber-400 font-mono tracking-widest uppercase mt-1">Mine Governance AI</p>
          </div>
        </div>

        {/* Navigation List by Group */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-130px)] scrollbar-thin">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => isSystemAdmin || hasRole(item.roles as any));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer text-left',
                          isActive
                            ? 'bg-[#171B18] text-amber-400 border border-amber-500/30 font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D100F] border border-transparent'
                        )}
                      >
                        <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-[#1B211E] bg-[#0D100F] text-[10.5px] text-slate-500 font-mono flex items-center justify-between">
        <div>
          <p className="text-slate-300 font-semibold">TRINETRA v2.0</p>
          <p className="text-[9.5px]">Gov Command & SCADA</p>
        </div>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" title="Core Engine Active" />
      </div>
    </aside>
  );
};
