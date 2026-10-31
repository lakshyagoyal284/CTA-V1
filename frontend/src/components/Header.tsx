import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle, Award } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  onResetComplete?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetComplete }) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (!window.confirm("Restore demo database to baseline initial state (15 interconnected complaints, 3 scenarios)?")) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoDatabase();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
      if (onResetComplete) onResetComplete();
    } catch (e) {
      alert("Failed to reset database");
    } finally {
      setResetting(false);
    }
  };

  return (
    <header style={{
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #0284c7 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
        }}>
          <ShieldAlert size={26} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              CYBERTRACE AI
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              PROTOTYPE v2.0
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={12} /> Seva Innovation Challenge
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Cross-Complaint Cyber-Fraud Intelligence & Financial Crime Network Detection Platform
          </p>
        </div>
      </div>

      {/* Meta & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <span className="status-dot status-dot-emerald" />
          <span style={{ color: 'var(--text-muted)' }}>Intelligence Engine:</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>ONLINE</span>
        </div>

        <button 
          onClick={handleReset}
          disabled={resetting}
          className="btn-secondary"
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          title="Reset demonstration database to standard evaluation baseline"
        >
          {resetSuccess ? (
            <>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ color: '#10b981' }}>Reset Done</span>
            </>
          ) : (
            <>
              <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
              <span>Reset Demo State</span>
            </>
          )}
        </button>

        <div style={{
          borderLeft: '1px solid var(--border-subtle)',
          paddingLeft: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SECTOR 2 – LAW & ORDER
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Sub-theme 2: Cyber-Fraud Intelligence
          </span>
        </div>
      </div>
    </header>
  );
};
