import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { IntelligenceDiscoveryView } from './views/IntelligenceDiscoveryView';
import { GraphExplorerView } from './views/GraphExplorerView';
import { ComplaintIntakeView } from './views/ComplaintIntakeView';
import { DemoScenariosView } from './views/DemoScenariosView';
import { TechnicalEvaluationView } from './views/TechnicalEvaluationView';
import { SystemAuditView } from './views/SystemAuditView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [activeComplaintForDiscovery, setActiveComplaintForDiscovery] = useState<string>('C-101');
  const [resetNonce, setResetNonce] = useState<number>(0);

  const handleSelectComplaintForDiscovery = (complaintId: string) => {
    setActiveComplaintForDiscovery(complaintId);
    setActiveTab('discovery');
  };

  const handleComplaintCreated = (complaintId: string) => {
    setActiveComplaintForDiscovery(complaintId);
    setActiveTab('discovery');
  };

  const handleResetComplete = () => {
    setResetNonce(prev => prev + 1);
    setActiveComplaintForDiscovery('C-101');
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container" key={resetNonce}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
        <Header onResetComplete={handleResetComplete} />
        
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <main className="main-content">
            {activeTab === 'dashboard' && (
              <DashboardView 
                onSelectComplaintForDiscovery={handleSelectComplaintForDiscovery}
                onNavigateToGraph={() => setActiveTab('graph')}
              />
            )}

            {activeTab === 'discovery' && (
              <IntelligenceDiscoveryView 
                initialComplaintId={activeComplaintForDiscovery}
                onNavigateToGraph={() => setActiveTab('graph')}
              />
            )}

            {activeTab === 'graph' && (
              <GraphExplorerView 
                onSelectComplaintForDiscovery={handleSelectComplaintForDiscovery}
              />
            )}

            {activeTab === 'intake' && (
              <ComplaintIntakeView 
                onComplaintCreated={handleComplaintCreated}
              />
            )}

            {activeTab === 'demo' && (
              <DemoScenariosView 
                onSelectComplaintForDiscovery={handleSelectComplaintForDiscovery}
              />
            )}

            {activeTab === 'benchmark' && (
              <TechnicalEvaluationView />
            )}

            {activeTab === 'audit' && (
              <SystemAuditView />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
