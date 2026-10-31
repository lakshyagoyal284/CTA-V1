import React, { useState, useEffect } from 'react';
import { GraphDataResponse, GraphNode } from '../types';
import { api } from '../services/api';
import { NetworkGraph } from '../components/NetworkGraph';
import { NodeInspector } from '../components/NodeInspector';
import { 
  Share2, 
  Filter, 
  Search, 
  Layers, 
  Activity, 
  Users, 
  ShieldAlert, 
  CreditCard, 
  PhoneCall, 
  Landmark, 
  Globe, 
  Mail, 
  Send,
  RefreshCw
} from 'lucide-react';

interface GraphExplorerViewProps {
  onSelectComplaintForDiscovery: (complaintId: string) => void;
}

export const GraphExplorerView: React.FC<GraphExplorerViewProps> = ({
  onSelectComplaintForDiscovery
}) => {
  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([
    'COMPLAINT', 'UPI', 'PHONE', 'BANK_ACCOUNT', 'URL', 'EMAIL', 'TELEGRAM', 'CRYPTO_WALLET'
  ]);
  const [minStrength, setMinStrength] = useState<number>(0);

  useEffect(() => {
    loadGraph();
  }, [selectedCluster]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getGraph({
        cluster_id: selectedCluster || undefined
      });
      setGraphData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntityType = (type: string) => {
    setSelectedEntityTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Filter nodes and edges based on selected types and minimum strength
  const filteredNodes = (graphData?.nodes || []).filter(n => {
    if (n.type === 'COMPLAINT') return selectedEntityTypes.includes('COMPLAINT');
    return selectedEntityTypes.includes(n.type);
  });

  const nodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredEdges = (graphData?.edges || []).filter(e => {
    const bothNodesExist = nodeIds.has(e.source) && nodeIds.has(e.target);
    const meetsStrength = (e.weight || 0) >= minStrength;
    return bothNodesExist && meetsStrength;
  });

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Graph KPIs */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-purple">High-Dimensional Graph Topology</span>
            <span className="badge badge-emerald">Interactive Force Physics</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Cross-Complaint Cybercrime Intelligence Graph
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 750 }}>
            Visualizes multi-jurisdictional syndicate infrastructure. Click any complaint or digital indicator node to open the real-time forensic inspector.
          </p>
        </div>

        {/* Live Graph Metrics Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(15, 23, 42, 0.7)', padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Active Nodes</span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{filteredNodes.length}</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 14 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Link Edges</span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f43f5e' }}>{filteredEdges.length}</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 14 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recurrent VPAs/Nos</span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{graphData?.stats.recurrent_indicators || 8}</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 14 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Syndicates</span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{graphData?.clusters.length || 3}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        {/* Entity Type Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', marginRight: 4 }}>
            Node Filters:
          </span>
          {[
            { id: 'COMPLAINT', label: 'Complaints', color: '#38bdf8' },
            { id: 'UPI', label: 'UPI VPAs', color: '#a855f7' },
            { id: 'PHONE', label: 'Phones', color: '#f59e0b' },
            { id: 'BANK_ACCOUNT', label: 'Bank A/C', color: '#10b981' },
            { id: 'URL', label: 'URLs', color: '#f43f5e' },
            { id: 'EMAIL', label: 'Emails', color: '#6366f1' },
            { id: 'TELEGRAM', label: 'Telegram', color: '#0ea5e9' },
            { id: 'CRYPTO_WALLET', label: 'Crypto', color: '#eab308' }
          ].map(f => {
            const active = selectedEntityTypes.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleEntityType(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  background: active ? `${f.color}20` : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${active ? f.color : 'rgba(148, 163, 184, 0.15)'}`,
                  color: active ? f.color : 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? f.color : 'var(--text-dim)' }} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cluster Selector & Strength Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Syndicate Cluster:</span>
            <select
              value={selectedCluster}
              onChange={e => setSelectedCluster(e.target.value)}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <option value="">All Syndicates (Full Network)</option>
              {graphData?.clusters.map(c => (
                <option key={c.cluster_id} value={c.cluster_id}>
                  {c.name} ({c.complaint_count} Cases)
                </option>
              ))}
            </select>
          </div>

          <button onClick={loadGraph} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Re-layout</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Graph Viewer with Floating Inspector */}
      <div style={{ position: 'relative', height: 600, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <NetworkGraph
          nodes={filteredNodes}
          edges={filteredEdges}
          selectedNodeId={selectedNode?.id}
          onNodeSelect={node => setSelectedNode(node)}
          height={600}
        />

        <NodeInspector
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSelectComplaint={cid => {
            onSelectComplaintForDiscovery(cid);
          }}
        />
      </div>
    </div>
  );
};
