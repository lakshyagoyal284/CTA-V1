import React, { useState, useEffect } from 'react';
import { DemoScenario, CrossComplaintDiscoveryResponse } from '../types';
import { api } from '../services/api';
import { NetworkGraph } from '../components/NetworkGraph';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';
import { 
  PlaySquare, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Download,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';

interface DemoScenariosViewProps {
  onSelectComplaintForDiscovery: (complaintId: string) => void;
}

export const DemoScenariosView: React.FC<DemoScenariosViewProps> = ({
  onSelectComplaintForDiscovery
}) => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario_1');
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);
  const [discovery, setDiscovery] = useState<CrossComplaintDiscoveryResponse | null>(null);
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [tourStep, setTourStep] = useState<number>(0);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);

  useEffect(() => {
    api.getDemoScenarios().then(data => {
      setScenarios(data);
    });
  }, []);

  useEffect(() => {
    if (activeScenarioId) {
      loadScenario(activeScenarioId);
    }
  }, [activeScenarioId]);

  const loadScenario = async (id: string) => {
    try {
      const sc = await api.getDemoScenarioDetails(id);
      setActiveScenario(sc);
      const [disc, gData] = await Promise.all([
        api.discoverIntelligence(sc.initial_complaint_id),
        api.getGraph({ focus_complaint_id: sc.initial_complaint_id })
      ]);
      setDiscovery(disc);
      setGraphData(gData);
      setTourStep(0);
      setIsTourActive(false);
    } catch (e) {
      console.error(e);
    }
  };

  const tourSteps = [
    {
      title: "1. Incident Intake & Victim Narrative",
      description: `Complainant ${discovery?.primary_complaint?.victim_name} (${discovery?.primary_complaint?.victim_city}) registers initial complaint ${activeScenario?.initial_complaint_id} with reported loss of ₹${(discovery?.primary_complaint?.loss_amount || 0).toLocaleString('en-IN')}.`,
      highlight: "complaint"
    },
    {
      title: "2. Automated Machine Extraction & Normalisation",
      description: `The CyberTrace AI engine extracts ${discovery?.extracted_entities?.length || 0} digital indicators, canonicalising phone numbers, UPI VPAs, and URLs into standardized forensic formats.`,
      highlight: "entities"
    },
    {
      title: "3. Cross-Complaint Multi-Hop Linkage",
      description: `The system matches ${discovery?.direct_links?.length || 0} Direct (1-hop) cases and ${discovery?.inferred_links?.length || 0} Inferred (2-hop) cases, exposing interstate coordination across victims who never spoke to each other.`,
      highlight: "links"
    },
    {
      title: "4. Syndicate Sub-Graph Generation",
      description: `Generates a heterogeneous force-directed network topology unmasking the criminal money-mule infrastructure and caller nodes.`,
      highlight: "graph"
    },
    {
      title: "5. Statutory Risk & Next Steps",
      description: `4-Tier evidence dossier ready for court submission, including emergency Section 91 CrPC bank debit freeze notices.`,
      highlight: "actions"
    }
  ];

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Synthetic Data Disclaimer Banner Required by Prompt */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
            SYNTHETIC DEMONSTRATION DATA FOR EVALUATION PURPOSES
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          All citizen names, phone numbers, and UPI handles are synthetic test cases simulating genuine cyber-fraud patterns.
        </span>
      </div>

      {/* Demonstration Mode Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(2, 132, 199, 0.15) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
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
            <span className="badge badge-purple">Evaluator Interactive Sandbox</span>
            <span className="badge badge-cyan">3 Realistic National Scenarios</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Evaluator Demonstration Mode
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: 820, marginTop: 4 }}>
            Experience how CyberTrace AI transforms fragmented, seemingly minor individual cyber complaints into comprehensive interstate syndicate dossiers.
          </p>
        </div>

        <button
          onClick={() => setIsTourActive(true)}
          className="btn-action-glow"
        >
          <PlaySquare size={18} />
          <span>Run Full Guided Demonstration</span>
        </button>
      </div>

      {/* Scenario Selection Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        {[
          { id: 'scenario_1', tag: 'SCENARIO 1', title: 'UPI Fraud Network', sub: 'Part-Time Telegram Task Scam Ring', color: '#38bdf8' },
          { id: 'scenario_2', tag: 'SCENARIO 2', title: 'Coordinated Phishing Campaign', sub: 'Fake Electricity Disconnection & Bank KYC', color: '#a855f7' },
          { id: 'scenario_3', tag: 'SCENARIO 3', title: 'Digital Extortion Network', sub: 'Instant Loan App Blackmail & Digital Arrest', color: '#f43f5e' }
        ].map(s => {
          const isActive = activeScenarioId === s.id;
          return (
            <div
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              style={{
                background: isActive ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                border: `1.5px solid ${isActive ? s.color : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 20px ${s.color}30` : 'none'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: s.color, letterSpacing: '0.06em' }}>
                {s.tag}
              </span>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                {s.title}
              </h4>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: 2 }}>
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Guided Walkthrough Runner Modal / Callout if active */}
      {isTourActive && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid var(--accent-cyan)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-glow-cyan)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-cyan">GUIDED EVALUATOR TOUR</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Step {tourStep + 1} of {tourSteps.length}
              </span>
            </div>
            <button onClick={() => setIsTourActive(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Exit Tour
            </button>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            {tourSteps[tourStep].title}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginTop: 6, lineHeight: 1.45 }}>
            {tourSteps[tourStep].description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button
              onClick={() => setTourStep(s => Math.max(0, s - 1))}
              disabled={tourStep === 0}
              className="btn-secondary"
              style={{ fontSize: '0.78rem' }}
            >
              <ChevronLeft size={14} />
              <span>Previous Step</span>
            </button>

            {tourStep < tourSteps.length - 1 ? (
              <button
                onClick={() => setTourStep(s => s + 1)}
                className="btn-primary"
                style={{ fontSize: '0.78rem' }}
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (activeScenario) onSelectComplaintForDiscovery(activeScenario.initial_complaint_id);
                }}
                className="btn-action-glow"
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                <span>Open in Intelligence Discovery</span>
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scenario Deep Dive Details Grid */}
      {activeScenario && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'start' }}>
          {/* Left Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Scenario Narrative Box */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {activeScenario.title}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>
                    Initial Anchor Case: <strong>{activeScenario.initial_complaint_id}</strong>
                  </span>
                </div>
                <button
                  onClick={() => onSelectComplaintForDiscovery(activeScenario.initial_complaint_id)}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Sparkles size={14} />
                  <span>Inspect Case {activeScenario.initial_complaint_id}</span>
                </button>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.6)', padding: 14, borderRadius: 8 }}>
                {activeScenario.description}
              </p>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Strategic Law Enforcement Takeaway:
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {activeScenario.investigation_takeaway}
                </p>
              </div>
            </div>

            {/* Key Entities & Expected Connections */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
                Syndicate Digital Indicators Under Surveillance
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {activeScenario.key_entities?.map((ke, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.64rem' }}>{ke.type}</span>
                        <strong style={{ fontSize: '0.84rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{ke.value}</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2, display: 'block' }}>
                        Operational Role: {ke.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>
                Suggested Investigative Actions (Statutory SLA)
              </h4>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeScenario.suggested_actions?.map((act, i) => (
                  <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Embedded Interactive Graph Preview for Scenario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                  Scenario Network Topology Visualizer
                </h4>
                <span className="badge badge-rose">Multi-Hop Active</span>
              </div>

              <div style={{ height: 420, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <NetworkGraph
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  selectedNodeId={activeScenario.initial_complaint_id}
                  height={420}
                />
              </div>
            </div>

            {discovery?.risk_assessment && (
              <RiskAssessmentCard risk={discovery.risk_assessment} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
