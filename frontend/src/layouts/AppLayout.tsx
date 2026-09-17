import React, { Suspense, lazy } from 'react';
import { useMineContext } from '../context/MineContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Activity } from 'lucide-react';

// Code-split pages for performance & judge responsiveness
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AlertsPage = lazy(() => import('../pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const MinesPage = lazy(() => import('../pages/MinesPage').then(m => ({ default: m.MinesPage })));
const SensorsPage = lazy(() => import('../pages/SensorsPage').then(m => ({ default: m.SensorsPage })));
const CamerasPage = lazy(() => import('../pages/CamerasPage').then(m => ({ default: m.CamerasPage })));
const IncidentsPage = lazy(() => import('../pages/IncidentsPage').then(m => ({ default: m.IncidentsPage })));
const ViolationsPage = lazy(() => import('../pages/ViolationsPage').then(m => ({ default: m.ViolationsPage })));
const DigitalTwinPage = lazy(() => import('../pages/DigitalTwinPage').then(m => ({ default: m.DigitalTwinPage })));
const RiskAuditPage = lazy(() => import('../pages/RiskAuditPage').then(m => ({ default: m.RiskAuditPage })));
const ProductionPage = lazy(() => import('../pages/ProductionPage').then(m => ({ default: m.ProductionPage })));
const WorkforcePage = lazy(() => import('../pages/WorkforcePage').then(m => ({ default: m.WorkforcePage })));
const ContractorsPage = lazy(() => import('../pages/ContractorsPage').then(m => ({ default: m.ContractorsPage })));
const EnvironmentPage = lazy(() => import('../pages/EnvironmentPage').then(m => ({ default: m.EnvironmentPage })));
const GrievancesPage = lazy(() => import('../pages/GrievancesPage').then(m => ({ default: m.GrievancesPage })));
const ReportsPage = lazy(() => import('../pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ApprovalsPage = lazy(() => import('../pages/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const PredictiveRiskPage = lazy(() => import('../pages/PredictiveRiskPage').then(m => ({ default: m.PredictiveRiskPage })));
const CopilotPage = lazy(() => import('../pages/CopilotPage').then(m => ({ default: m.CopilotPage })));
const FieldOperationsPage = lazy(() => import('../pages/FieldOperationsPage').then(m => ({ default: m.FieldOperationsPage })));
const IntegrationsHealthPage = lazy(() => import('../pages/IntegrationsHealthPage').then(m => ({ default: m.IntegrationsHealthPage })));
const DemoControlCenterPage = lazy(() => import('../pages/DemoControlCenterPage').then(m => ({ default: m.DemoControlCenterPage })));

const PageLoadingSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-mono text-slate-500">
    <Activity className="w-6 h-6 text-amber-500/80 animate-spin" />
    <span className="text-xs uppercase tracking-wider">Loading Operational Workspace...</span>
  </div>
);

export const AppLayout: React.FC = () => {
  const { currentTab, setCurrentTab } = useMineContext();

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'demo-control':
        return <DemoControlCenterPage />;
      case 'field-operations':
        return <FieldOperationsPage />;
      case 'integrations-health':
        return <IntegrationsHealthPage />;
      case 'copilot':
        return <CopilotPage />;
      case 'predictive-risk':
        return <PredictiveRiskPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'production':
        return <ProductionPage />;
      case 'workforce':
        return <WorkforcePage />;
      case 'contractors':
        return <ContractorsPage />;
      case 'environment':
        return <EnvironmentPage />;
      case 'sensors':
        return <SensorsPage />;
      case 'mines':
        return <MinesPage />;
      case 'cameras':
        return <CamerasPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'violations':
        return <ViolationsPage />;
      case 'grievances':
        return <GrievancesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'digital-twin':
        return <DigitalTwinPage />;
      case 'risk-audit':
        return <RiskAuditPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080A09] text-slate-100 font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-5 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          <Suspense fallback={<PageLoadingSkeleton />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
};
