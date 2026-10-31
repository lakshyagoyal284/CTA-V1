import React from 'react';
import { 
  LayoutDashboard, 
  SearchCode, 
  Share2, 
  FilePlus, 
  PlaySquare, 
  BarChart3, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ size: number; color?: string }>; highlight?: boolean; badge?: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'discovery', label: 'Intelligence Discovery', icon: SearchCode, highlight: true, badge: 'KEY INNOVATION' },
    { id: 'graph', label: 'Network Graph Explorer', icon: Share2 },
    { id: 'intake', label: 'Complaint Intake & NLP', icon: FilePlus },
    { id: 'demo', label: 'Evaluator Demo Mode', icon: PlaySquare, badge: '3 SCENARIOS' },
    { id: 'benchmark', label: 'Technical Evaluation', icon: BarChart3, badge: 'METRICS' },
    { id: 'audit', label: 'Architecture & Audit', icon: ShieldCheck },
  ];

  return (
    <aside style={{
      width: 270,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      height: 'calc(100vh - 73px)',
      position: 'sticky',
      top: 73,
      flexShrink: 0
    }}>
      <div>
        <div style={{ padding: '0 12px 16px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Investigation Navigation
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive 
                    ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)' 
                    : item.highlight && !isActive
                    ? 'rgba(56, 189, 248, 0.05)'
                    : 'transparent',
                  border: isActive 
                    ? '1px solid rgba(56, 189, 248, 0.35)' 
                    : item.highlight && !isActive
                    ? '1px dashed rgba(56, 189, 248, 0.2)'
                    : '1px solid transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon 
                    size={19} 
                    color={isActive ? 'var(--accent-cyan)' : item.highlight ? 'var(--accent-cyan)' : 'var(--text-dim)'} 
                  />
                  <span style={{ 
                    fontSize: '0.86rem', 
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#f8fafc' : 'var(--text-muted)'
                  }}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span 
                    style={{
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 700,
                      background: item.highlight ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                      color: item.highlight ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mission Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        fontSize: '0.74rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>Central Innovation</span>
        </div>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.45 }}>
          Cross-complaint multi-hop discovery connecting disparate victims through shared digital indicators & behavioral signatures.
        </p>
      </div>
    </aside>
  );
};
