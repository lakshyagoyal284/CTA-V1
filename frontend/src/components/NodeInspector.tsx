import React from 'react';
import { GraphNode } from '../types';
import { 
  X, 
  ExternalLink, 
  ShieldAlert, 
  CreditCard, 
  PhoneCall, 
  Landmark, 
  Globe, 
  Mail, 
  Send, 
  Coins, 
  HelpCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Download
} from 'lucide-react';
import { api } from '../services/api';

interface NodeInspectorProps {
  node: GraphNode | null;
  onClose: () => void;
  onSelectComplaint?: (complaintId: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  onClose,
  onSelectComplaint
}) => {
  if (!node) return null;

  const isComplaint = node.type === 'COMPLAINT';

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'UPI': return <CreditCard size={18} color="#a855f7" />;
      case 'PHONE': return <PhoneCall size={18} color="#f59e0b" />;
      case 'BANK_ACCOUNT': return <Landmark size={18} color="#10b981" />;
      case 'IFSC': return <Landmark size={18} color="#06b6d4" />;
      case 'URL': return <Globe size={18} color="#f43f5e" />;
      case 'EMAIL': return <Mail size={18} color="#6366f1" />;
      case 'TELEGRAM': return <Send size={18} color="#0ea5e9" />;
      case 'CRYPTO_WALLET': return <Coins size={18} color="#eab308" />;
      default: return <HelpCircle size={18} color="#94a3b8" />;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 14,
      right: 14,
      width: 380,
      maxHeight: 'calc(100% - 28px)',
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30,
      overflow: 'hidden'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isComplaint ? <ShieldAlert size={20} color="#38bdf8" /> : getEntityIcon(node.type)}
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isComplaint ? 'Case File Details' : `Digital Indicator [${node.type}]`}
            </span>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.full_value || node.label}
            </h3>
          </div>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
          <X size={14} />
        </button>
      </div>

      {/* Content Body */}
      <div style={{ padding: '16px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isComplaint ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="glass-panel" style={{ padding: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Victim Name</span>
                <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>{node.victim_name}</p>
              </div>
              <div className="glass-panel" style={{ padding: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Location</span>
                <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>{node.victim_city}, {node.victim_state}</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Financial Loss</span>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f43f5e' }}>
                  ₹{(node.loss_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <span className="badge badge-rose">{node.status}</span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Modus Operandi Category
              </span>
              <span className="badge badge-cyan">{node.category}</span>
            </div>

            {node.details?.description && (
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  Complaint Narrative Summary
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 6, lineHeight: 1.4 }}>
                  {node.details.description}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {onSelectComplaint && (
                <button
                  onClick={() => onSelectComplaint(node.id)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Discover Connections</span>
                </button>
              )}
              <a
                href={api.getDossierPdfUrl(node.id)}
                download={`CyberTrace_Dossier_${node.id}.pdf`}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                title="Download Law Enforcement Dossier PDF"
              >
                <Download size={14} />
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Indicator Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="glass-panel" style={{ padding: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Database Frequency</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: (node.frequency || 1) > 1 ? '#ef4444' : 'var(--accent-cyan)' }}>
                  {node.frequency || 1} Occurrence(s)
                </p>
              </div>
              <div className="glass-panel" style={{ padding: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Connected Complaints</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {node.connection_count || node.connected_complaints?.length || 0} Cases
                </p>
              </div>
            </div>

            {/* Flagged Reason */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AlertTriangle size={14} color="#f43f5e" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>
                  Why This Indicator Was Flagged
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {node.flagged_reason}
              </p>
            </div>

            {/* Connected Cases */}
            {node.connected_complaints && node.connected_complaints.length > 0 && (
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                  Interconnected Complaint Files ({node.connected_complaints.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {node.connected_complaints.map(cid => (
                    <div 
                      key={cid}
                      onClick={() => onSelectComplaint && onSelectComplaint(cid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="hover:border-cyan-400"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="var(--accent-cyan)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{cid}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-cyan)', fontSize: '0.74rem' }}>
                        <span>Inspect</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Financial Transactions */}
            {node.related_transactions && node.related_transactions.length > 0 && (
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                  Direct Financial Transfers ({node.related_transactions.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {node.related_transactions.map((tx: any, idx: number) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#10b981' }}>
                        <span>₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{tx.channel} • {tx.bank || 'Bank'}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2 }}>
                        Ref: {tx.ref}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
