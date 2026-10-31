import React, { useState, useEffect } from 'react';
import { Complaint, CrossComplaintDiscoveryResponse, GraphNode, GraphEdge } from '../types';
import { api } from '../services/api';
import { NetworkGraph } from '../components/NetworkGraph';
import { NodeInspector } from '../components/NodeInspector';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';
import { 
  SearchCode, 
  Share2, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  CheckCircle, 
  Sparkles,
  Layers,
  FileText,
  Clock,
  MapPin,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface IntelligenceDiscoveryViewProps {
  initialComplaintId?: string;
  onNavigateToGraph: () => void;
}

export const IntelligenceDiscoveryView: React.FC<IntelligenceDiscoveryViewProps> = ({
  initialComplaintId = 'C-101',
  onNavigateToGraph
}) => {
  const [complaintList, setComplaintList] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialComplaintId);
  const [loading, setLoading] = useState<boolean>(false);
  const [discovery, setDiscovery] = useState<CrossComplaintDiscoveryResponse | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    api.getComplaints().then(comps => {
      setComplaintList(comps);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      runDiscovery(selectedId);
    }
  }, [selectedId]);

  const runDiscovery = async (cid: string) => {
    setLoading(true);
    try {
      const [disc, gData] = await Promise.all([
        api.discoverIntelligence(cid),
        api.getGraph({ focus_complaint_id: cid })
      ]);
      setDiscovery(disc);
      setGraphData({ nodes: gData.nodes, edges: gData.edges });
      setSelectedGraphNode(null);
    } catch (e) {
      console.error(e);
      alert(`Could not run discovery for ${cid}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const primary = discovery?.primary_complaint;

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Feature Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-glow-cyan)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} /> PRIMARY CORE INNOVATION
              </span>
              <span className="badge badge-purple">Multi-Hop Graph Discovery</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Intelligence Discovery — Cross-Complaint Analysis
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: 840, marginTop: 4 }}>
              Deconstruct an isolated cybercrime complaint, extract its digital indicators, and uncover hidden connections to other victim complaints across jurisdictions.
            </p>
          </div>

          <a
            href={api.getDossierPdfUrl(selectedId)}
            download={`CyberTrace_Dossier_${selectedId}.pdf`}
            className="btn-secondary"
            style={{ fontSize: '0.84rem' }}
          >
            <Download size={15} />
            <span>Export Official Case Dossier (PDF)</span>
          </a>
        </div>

        {/* Complaint Selector Bar & Action Button */}
        <div style={{
          marginTop: 20,
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Select Active Complaint:
            </span>

            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="form-select"
              style={{ minWidth: 340, maxWidth: 440, fontSize: '0.86rem', fontWeight: 600, color: 'var(--accent-cyan)' }}
            >
              {complaintList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.victim_name} ({c.victim_city}) | {c.category} (₹{c.loss_amount.toLocaleString('en-IN')})
                </option>
              ))}
            </select>

            {/* Quick Scenario Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Quick Demo:</span>
              <button 
                onClick={() => setSelectedId('C-101')}
                className={`badge ${selectedId === 'C-101' ? 'badge-rose' : 'badge-cyan'}`}
                style={{ cursor: 'pointer' }}
              >
                C-101 (UPI Ring)
              </button>
              <button 
                onClick={() => setSelectedId('C-102')}
                className={`badge ${selectedId === 'C-102' ? 'badge-rose' : 'badge-cyan'}`}
                style={{ cursor: 'pointer' }}
              >
                C-102 (Phishing)
              </button>
              <button 
                onClick={() => setSelectedId('C-103')}
                className={`badge ${selectedId === 'C-103' ? 'badge-rose' : 'badge-cyan'}`}
                style={{ cursor: 'pointer' }}
              >
                C-103 (Extortion)
              </button>
            </div>
          </div>

          {/* Prominent Action Button Required by Prompt */}
          <button
            onClick={() => runDiscovery(selectedId)}
            disabled={loading}
            className="btn-action-glow"
          >
            <SearchCode size={18} className={loading ? 'animate-spin' : ''} />
            <span>Discover Related Fraud Cases</span>
          </button>
        </div>
      </div>

      {/* Selected Complaint Overview Strip */}
      {primary && (
        <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={24} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {primary.id} — {primary.victim_name}
                </h3>
                <span className="badge badge-purple">{primary.category}</span>
                <span className="badge badge-rose">{primary.status}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Acknowledgement: <strong style={{ color: 'var(--text-muted)' }}>{primary.acknowledgement_no}</strong> • Incident Date: <strong>{primary.incident_date.slice(0, 10)}</strong> • Location: <strong>{primary.victim_city}, {primary.victim_state}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reported Victim Loss</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f43f5e' }}>
                ₹{primary.loss_amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 20 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Syndicate Impact</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                ₹{(discovery?.metrics.total_syndicate_loss || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 20 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Victims Correlated</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {discovery?.metrics.total_victims_linked || 1} Linked
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Split: Evidence & Relationships (Left) vs Interactive Graph & Inspector (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Identifiers & Connected Complaints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Extracted Identifiers Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                  Extracted Digital Indicators ({discovery?.extracted_entities.length || 0})
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Deterministic identifiers extracted and normalized from narrative for cross-complaint correlation.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {discovery?.extracted_entities.map((ent, i) => (
                <div 
                  key={i}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.66rem', minWidth: 70, justifyContent: 'center' }}>
                      {ent.entity_type}
                    </span>
                    <div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                        {ent.normalized_value}
                      </span>
                      {ent.flagged_reason && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
                          {ent.flagged_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {Math.round((ent.confidence || 0.95) * 100)}% Conf
                    </span>
                    <button
                      onClick={() => copyToClipboard(ent.normalized_value, `ent-${i}`)}
                      className="btn-secondary"
                      style={{ padding: '4px 8px' }}
                      title="Copy identifier"
                    >
                      {copiedKey === `ent-${i}` ? <CheckCircle size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discovered Direct & Inferred Cross-Complaint Connections */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                  Discovered Cross-Complaint Connections
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Interconnected victim complaints matched by identical digital identifiers or intermediate bridge hops.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-rose">{discovery?.direct_links.length || 0} Direct</span>
                <span className="badge badge-amber">{discovery?.inferred_links.length || 0} Inferred</span>
              </div>
            </div>

            {/* Direct 1-Hop Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {discovery?.direct_links.map((link, idx) => (
                <div 
                  key={`dl-${idx}`}
                  style={{
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-rose" style={{ fontSize: '0.66rem' }}>
                        DIRECT LINK (1-HOP)
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        Complaint {link.target_complaint_id} ({link.target_victim_name})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f43f5e' }}>
                        {link.strength_percentage}% Strength
                      </span>
                      <button
                        onClick={() => setSelectedId(link.target_complaint_id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Pivot to this complaint"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: '#f8fafc', lineHeight: 1.4 }}>
                    {link.explanation}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    borderTop: '1px solid rgba(244, 63, 94, 0.15)',
                    paddingTop: 6
                  }}>
                    <span>Location: {link.target_victim_city}, {link.target_victim_state}</span>
                    <span>Loss: ₹{link.target_loss_amount.toLocaleString('en-IN')}</span>
                    <span>Crime Category: {link.target_category}</span>
                  </div>
                </div>
              ))}

              {/* Inferred 2-Hop Links */}
              {discovery?.inferred_links.map((link, idx) => (
                <div 
                  key={`il-${idx}`}
                  style={{
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>
                        INFERRED 2-HOP LINK
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        Complaint {link.target_complaint_id} ({link.target_victim_name})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b' }}>
                        {link.strength_percentage}% Strength
                      </span>
                      <button
                        onClick={() => setSelectedId(link.target_complaint_id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Pivot to this complaint"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: '#f8fafc', lineHeight: 1.4 }}>
                    {link.explanation}
                  </p>

                  {/* Multi-Hop Path Ribbon */}
                  {link.intermediate_path && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <span style={{ color: 'var(--text-dim)' }}>Graph Path:</span>
                      {link.intermediate_path.map((step, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span style={{ color: step.startsWith('C-') ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>
                            {step}
                          </span>
                          {sIdx < (link.intermediate_path?.length || 0) - 1 && (
                            <ArrowRight size={10} color="var(--text-dim)" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                    paddingTop: 6
                  }}>
                    <span>Bridge Node: <strong>{link.bridge_complaint_id} ({link.bridge_victim_name})</strong></span>
                    <span>Loss: ₹{link.target_loss_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}

              {!discovery?.direct_links.length && !discovery?.inferred_links.length && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No cross-complaint connections found for this complaint at current repository threshold.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Local Network Graph & Interactive Node Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
          <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                  Localized Syndicate Sub-Graph Explorer
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Interactive force simulation showing 1-hop and 2-hop connected nodes for {selectedId}.
                </p>
              </div>
              <button onClick={onNavigateToGraph} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                <Layers size={13} />
                <span>Full System Graph</span>
              </button>
            </div>

            <div style={{ height: 420, borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
              <NetworkGraph
                nodes={graphData.nodes}
                edges={graphData.edges}
                selectedNodeId={selectedGraphNode?.id || selectedId}
                onNodeSelect={node => setSelectedGraphNode(node)}
                height={420}
              />

              <NodeInspector
                node={selectedGraphNode}
                onClose={() => setSelectedGraphNode(null)}
                onSelectComplaint={cid => {
                  setSelectedId(cid);
                  setSelectedGraphNode(null);
                }}
              />
            </div>
          </div>

          {/* Investigation Summary Narrative */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                Actionable Investigation Summary
              </h4>
              <span className="badge badge-emerald">Ready for Judicial Submission</span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}>
              {discovery?.investigation_summary}
            </div>
          </div>
        </div>
      </div>

      {/* Full Explainable Risk Assessment Breakdown (Prompt 5) */}
      {discovery?.risk_assessment && (
        <RiskAssessmentCard risk={discovery.risk_assessment} />
      )}
    </div>
  );
};
