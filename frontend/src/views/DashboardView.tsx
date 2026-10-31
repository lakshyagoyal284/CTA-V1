import React, { useState, useEffect } from 'react';
import { Complaint, GraphCluster } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  Share2, 
  ExternalLink, 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';

interface DashboardViewProps {
  onSelectComplaintForDiscovery: (complaintId: string) => void;
  onNavigateToGraph: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectComplaintForDiscovery,
  onNavigateToGraph
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<GraphCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, graphData] = await Promise.all([
        api.getComplaints(),
        api.getGraph()
      ]);
      setComplaints(comps);
      setClusters(graphData.clusters || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalLoss = complaints.reduce((sum, c) => sum + (c.loss_amount || 0), 0);
  const linkedComplaintsCount = complaints.filter(c => c.cluster_id).length;
  const linkageRate = complaints.length ? Math.round((linkedComplaintsCount / complaints.length) * 100) : 0;

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = !searchTerm || (
      c.victim_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.victim_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCat = !selectedCategory || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Welcome & Mission Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-cyan">National Cybercrime Command Center</span>
            <span className="badge badge-purple">Seva Innovation Challenge</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Cross-Complaint Cyber-Fraud Intelligence Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 840, marginTop: 4 }}>
            Proactively correlating digital extortion, mule bank VPAs, and phishing campaigns across isolated state jurisdictions into actionable syndicate clusters.
          </p>
        </div>

        <button 
          onClick={() => onSelectComplaintForDiscovery('C-101')}
          className="btn-action-glow"
        >
          <Share2 size={18} />
          <span>Launch Cross-Complaint Discovery</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Indexed Complaints
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                {complaints.length}
              </h3>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
              <ShieldAlert size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
            <TrendingUp size={14} />
            <span>Active repository synchronization</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Cumulative Financial Loss
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: 4 }}>
                ₹{totalLoss.toLocaleString('en-IN')}
              </h3>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)' }}>
              <CreditCard size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Across 10 Indian States / UTs</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Unmasked Syndicates
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: 4 }}>
                {clusters.length} Rings
              </h3>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(168, 85, 247, 0.12)', color: 'var(--accent-purple)' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: 'var(--accent-purple)' }}>
            <span>100% Multi-hop connected</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Cross-Complaint Correlation
              </span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: 4 }}>
                {linkageRate}%
              </h3>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
              <Share2 size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
            <span>Automated graph linking</span>
          </div>
        </div>
      </div>

      {/* Identified Fraud Syndicates Carousel / Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Detected Organized Cybercrime Syndicates
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Multi-complaint coordinated fraud operations identified through automated connected-component clustering.
            </p>
          </div>
          <button onClick={onNavigateToGraph} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
            <span>Explore Full Graph</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {clusters.map((cl, i) => (
            <div 
              key={cl.cluster_id || i}
              className="glass-panel"
              style={{
                padding: '20px',
                borderLeft: '4px solid',
                borderLeftColor: cl.threat_level === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge badge-purple">{cl.cluster_id}</span>
                <span className={`badge ${cl.threat_level === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}`}>
                  {cl.threat_level} THREAT
                </span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                {cl.name}
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: 12 }}>
                Modus Operandi: <strong style={{ color: 'var(--accent-cyan)' }}>{cl.categories?.join(', ') || cl.modus_operandi}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Interconnected Cases</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>{cl.complaint_count} Victims</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Cumulative Siphoned</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f43f5e' }}>₹{Number(cl.total_loss).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {cl.key_indicators && cl.key_indicators.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                    Shared Syndicate Identifiers
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cl.key_indicators.map((ind, idx) => (
                      <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onSelectComplaintForDiscovery(cl.complaints[0])}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '8px' }}
                >
                  <Share2 size={13} />
                  <span>Inspect Primary Case ({cl.complaints[0]})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complaints Repository Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Indexed Cybercrime Complaints
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Self-contained repository of registered cyber complaints with automatic entity extraction.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px'
            }}>
              <Search size={14} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Search case, victim, city..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  width: 180
                }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '8px 12px' }}
            >
              <option value="">All Fraud Categories</option>
              <option value="Task / Job Scam">Task / Job Scam</option>
              <option value="Phishing / Identity Theft">Phishing / Identity Theft</option>
              <option value="Digital Extortion / Blackmail">Digital Extortion / Blackmail</option>
              <option value="Investment Scam">Investment Scam</option>
              <option value="UPI Fraud">UPI Fraud</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Case ID</th>
                <th style={{ padding: '12px 14px' }}>Victim & Location</th>
                <th style={{ padding: '12px 14px' }}>Crime Category</th>
                <th style={{ padding: '12px 14px' }}>Loss Amount</th>
                <th style={{ padding: '12px 14px' }}>Extracted Entities</th>
                <th style={{ padding: '12px 14px' }}>Syndicate Cluster</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(comp => (
                <tr 
                  key={comp.id}
                  style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    transition: 'background 0.15s ease'
                  }}
                  className="hover:bg-slate-800/40"
                >
                  <td style={{ padding: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {comp.id}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                      {comp.acknowledgement_no}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{comp.victim_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />
                      <span>{comp.victim_city}, {comp.victim_state}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                      {comp.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#f43f5e' }}>
                    ₹{comp.loss_amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                      {comp.entities?.length || 0} Indicators
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {comp.cluster_id ? (
                      <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                        {comp.cluster_id}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Standalone</span>
                    )}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => onSelectComplaintForDiscovery(comp.id)}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                        title="Run Cross-Complaint Intelligence Discovery"
                      >
                        <Share2 size={13} />
                        <span>Discover Links</span>
                      </button>
                      <a
                        href={api.getDossierPdfUrl(comp.id)}
                        download={`CyberTrace_Dossier_${comp.id}.pdf`}
                        className="btn-secondary"
                        style={{ padding: '6px 10px' }}
                        title="Download Dossier PDF"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
