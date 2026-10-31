import React, { useState } from 'react';
import { RiskAssessment } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileCheck, 
  ExternalLink,
  Lock
} from 'lucide-react';

interface RiskAssessmentCardProps {
  risk: RiskAssessment;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ risk }) => {
  const [activeTier, setActiveTier] = useState<string>('all');
  const [showLimitations, setShowLimitations] = useState(false);

  if (!risk || !risk.contributing_factors) return null;

  const fourTier = risk.four_tier_evidence;

  const tierColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    tier_a_reported: { bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.25)', text: '#cbd5e1', icon: '#94a3b8' },
    tier_b_automated: { bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.25)', text: '#38bdf8', icon: '#38bdf8' },
    tier_c_inferred: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b', icon: '#f59e0b' },
    tier_d_human_verified: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981', icon: '#10b981' }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Risk Header Gauge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 18,
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Circular Score Badge */}
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(15, 23, 42, 0.9) 60%, ${risk.risk_color} 100%)`,
            border: `3px solid ${risk.risk_color}`,
            boxShadow: `0 0 20px ${risk.risk_color}40`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {risk.overall_score}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              OUT OF 100
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge" style={{ backgroundColor: `${risk.risk_color}25`, color: risk.risk_color, borderColor: `${risk.risk_color}50`, fontSize: '0.8rem' }}>
                {risk.risk_category}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Confidence: <strong style={{ color: '#f8fafc' }}>{risk.confidence_rating}%</strong>
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
              Explainable Syndicate Risk Assessment
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Deterministic scoring based on multi-victim linkage, loss velocity, infrastructure recurrence, and M.O. coercion.
            </p>
          </div>
        </div>

        {/* Ethical / Legal Compliance Notice */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          maxWidth: 320,
          fontSize: '0.72rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-amber)', fontWeight: 600, marginBottom: 2 }}>
            <Lock size={12} />
            <span>Ethical Legal Guardrail</span>
          </div>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.35 }}>
            Indicators are classified as "suspicious digital indicators". Does not constitute judicial determination of guilt without formal verification.
          </p>
        </div>
      </div>

      {/* Contributing Factors Breakdown with Progress Bars */}
      <div>
        <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Contributing Factor Weights & Rationale
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {risk.contributing_factors.map((f, idx) => (
            <div 
              key={idx}
              className="glass-panel"
              style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                  {f.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Weight {f.weight}%</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    +{f.weighted_score} pts
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div style={{
                height: 6,
                background: 'rgba(148, 163, 184, 0.15)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 8
              }}>
                <div style={{
                  height: '100%',
                  width: `${f.score}%`,
                  background: f.score >= 80 ? 'var(--accent-rose)' : f.score >= 60 ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                  borderRadius: 4
                }} />
              </div>

              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {f.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Structured 4-Tier Law Enforcement Evidence Separation */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4-Tier Law Enforcement Evidence Separation
            </h4>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Mandatory legal standard separating complainant testimony, automated regex, graph inferences, and officer verification.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fourTier && Object.entries(fourTier).map(([key, tier]) => {
            const styling = tierColors[key] || tierColors.tier_a_reported;
            return (
              <div 
                key={key}
                style={{
                  background: styling.bg,
                  border: `1px solid ${styling.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: styling.text }}>
                    {tier.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {tier.description}
                  </span>
                </div>
                <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                  {tier.items.map((item: string, i: number) => (
                    <li key={i} style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: styling.text, lineHeight: 1 }}>•</span>
                      <span style={{ lineHeight: 1.4 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Statutory Actions for Law Enforcement */}
      {risk.recommended_investigative_actions && risk.recommended_investigative_actions.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recommended Statutory Actions (Actionable Law Enforcement Guidance)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {risk.recommended_investigative_actions.map((act, i) => (
              <div 
                key={i}
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  borderLeft: '4px solid var(--accent-rose)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                      {act.action}
                    </span>
                    <span className="badge badge-rose" style={{ fontSize: '0.66rem' }}>
                      {act.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {act.details}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Authority
                  </span>
                  <p style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {act.authority}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Limitations Section */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
        <button
          onClick={() => setShowLimitations(!showLimitations)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Info size={13} />
          <span>Technical Confidence & Data-Quality Limitations</span>
          {showLimitations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showLimitations && (
          <ul style={{ listStyleType: 'disc', paddingLeft: 20, marginTop: 8, fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {risk.data_quality_limitations?.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
