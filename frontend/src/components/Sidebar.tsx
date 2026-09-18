import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers3,
  Bell,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  Pickaxe,
  Users,
  Building2,
  Leaf,
  MessageSquare,
  Activity,
  Video,
  BrainCircuit,
  Bot,
  ShieldAlert,
  Network,
  Radio,
  ChevronDown,
  ChevronRight,
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
  icon: React.ElementType;
  roles: string[];
}

interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    title: 'Overview',
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        label: 'Operations Dashboard',
        icon: LayoutDashboard,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
      {
        id: 'digital-twin',
        label: '3D Mine View',
        icon: Layers3,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'safety',
    title: 'Safety',
    defaultOpen: true,
    items: [
      {
        id: 'alerts',
        label: 'Alerts',
        icon: Bell,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'incidents',
        label: 'Incidents',
        icon: AlertTriangle,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'field-operations',
        label: 'Inspections',
        icon: ClipboardCheck,
        roles: ['SYSTEM_ADMIN', 'FIELD_INSPECTOR', 'MINE_SAFETY_OFFICER', 'MINE_MANAGER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'compliance',
    title: 'Compliance',
    defaultOpen: false,
    items: [
      {
        id: 'violations',
        label: 'Compliance Issues',
        icon: FileText,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'approvals',
        label: 'Approvals',
        icon: ShieldCheck,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR'],
      },
      {
        id: 'reports',
        label: 'Statutory Reports',
        icon: FileSpreadsheet,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'operations',
    title: 'Operations',
    defaultOpen: false,
    items: [
      {
        id: 'sensors',
        label: 'Live Monitoring',
        icon: Activity,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'production',
        label: 'Production',
        icon: Pickaxe,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'environment',
        label: 'Environment',
        icon: Leaf,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'REGULATOR'],
      },
      {
        id: 'cameras',
        label: 'CCTV & Equipment',
        icon: Video,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR'],
      },
      {
        id: 'mines',
        label: 'Mines & Zones',
        icon: Layers3,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'workforce',
    title: 'Workforce',
    defaultOpen: false,
    items: [
      {
        id: 'workforce',
        label: 'Personnel',
        icon: Users,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
      {
        id: 'contractors',
        label: 'Contractors',
        icon: Building2,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
      {
        id: 'grievances',
        label: 'Grievances',
        icon: MessageSquare,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'intelligence',
    title: 'Intelligence',
    defaultOpen: false,
    items: [
      {
        id: 'predictive-risk',
        label: 'Risk Intelligence',
        icon: BrainCircuit,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
      {
        id: 'copilot',
        label: 'AI Assistant',
        icon: Bot,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
    ],
  },
  {
    key: 'administration',
    title: 'Administration',
    defaultOpen: false,
    items: [
      {
        id: 'risk-audit',
        label: 'Audit Trail',
        icon: ShieldAlert,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'REGULATOR'],
      },
      {
        id: 'integrations-health',
        label: 'System Health',
        icon: Network,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'REGULATOR'],
      },
      {
        id: 'demo-control',
        label: 'Demo & Simulation',
        icon: Radio,
        roles: ['SYSTEM_ADMIN', 'MINE_MANAGER', 'MINE_SAFETY_OFFICER', 'FIELD_INSPECTOR', 'CONTRACTOR_MANAGER', 'REGULATOR'],
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { isSystemAdmin, hasRole } = useAuth();

  // Determine which groups should be open by default or because they contain the active tab
  const getInitialOpenGroups = () => {
    const open: Record<string, boolean> = {};
    NAV_GROUPS.forEach(group => {
      const hasActive = group.items.some(item => item.id === currentTab);
      open[group.key] = hasActive || (group.defaultOpen ?? false);
    });
    return open;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // When tab changes, ensure that group is open
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    // Find which group contains this tab and open it
    const group = NAV_GROUPS.find(g => g.items.some(i => i.id === tab));
    if (group) {
      setOpenGroups(prev => ({ ...prev, [group.key]: true }));
    }
  };

  return (
    <aside
      className="flex flex-col shrink-0 h-screen sticky top-0"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--sidebar-border)',
        }}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}
          aria-hidden="true"
        >
          <span className="font-bold text-[#0A0F0D] text-sm leading-none">त्रि</span>
        </div>
        <div>
          <h1 className="font-semibold text-sm text-[var(--text-primary)] leading-tight tracking-wide">
            TRINETRA
          </h1>
          <p className="text-[0.625rem] text-[var(--text-muted)] leading-tight mt-0.5">
            Mine Governance Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2"
        style={{ scrollbarWidth: 'thin' }}
        aria-label="Primary navigation"
      >
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            item => isSystemAdmin || hasRole(item.roles as any)
          );
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.key] ?? false;

          return (
            <div key={group.key} className="mb-1">
              {/* Group toggle */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="sidebar-nav-group-label w-full flex items-center justify-between cursor-pointer hover:text-[var(--text-secondary)] transition-colors group"
                aria-expanded={isOpen}
              >
                <span>{group.title}</span>
                {isOpen
                  ? <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-80" />
                  : <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-80" />
                }
              </button>

              {isOpen && (
                <div className="space-y-0.5 mt-1 mb-2">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={clsx('sidebar-nav-item', isActive && 'active')}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: isActive
                              ? 'var(--brand-primary)'
                              : 'var(--text-muted)',
                          }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">TRINETRA</p>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">v2.0 · Coal Mines Act</p>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-[var(--color-success)] opacity-80"
            title="Platform operational"
            aria-label="Platform is operational"
          />
        </div>
      </div>
    </aside>
  );
};
