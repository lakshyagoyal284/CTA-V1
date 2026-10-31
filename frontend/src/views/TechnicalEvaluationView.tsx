import React, { useState, useEffect } from 'react';
import { BenchmarkEvaluationResponse } from '../types';
import { api } from '../services/api';
import { 
  BarChart3, 
  Play, 
  CheckCircle, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  FileCode,
  Terminal,
  Activity
} from 'lucide-react';

export const TechnicalEvaluationView: React.FC = () => {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkEvaluationResponse | null>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastExecuted, setLastExecuted] = useState<string>('');

  useEffect(() => {
    executeBenchmark();
    api.getBenchmarkTestCases().then(data => {
      setTestCases(data.test_cases || []);
      if (data.test_cases?.length) setSelectedTestCase(data.test_cases[0]);
    });
  }, []);

  const executeBenchmark = async () => {
    setLoading(true);
    try {
      const results = await api.runBenchmark();
      setBenchmarkResults(results);
      setLastExecuted(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
      alert("Benchmark execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Disclaimer Banner Required by Prompt */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
            PROTOTYPE EVALUATION & STANDARDIZED BENCHMARK
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          {benchmarkResults?.disclaimer || "Calculated dynamically against standardized ground-truth test corpus."}
        </span>
      </div>

      {/* Header and Live Benchmark Trigger */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-purple">Scientific Performance Measurement</span>
            <span className="badge badge-cyan">Reproducible Python Script</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            Technical Evaluation & Measurable Performance Indicators
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: 820, marginTop: 4 }}>
            Direct quantitative evaluation of the extraction, classification, linking, and clustering algorithms against labeled test ground truth.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastExecuted && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Last executed: <strong>{lastExecuted}</strong>
            </span>
          )}
          <button
            onClick={executeBenchmark}
            disabled={loading}
            className="btn-action-glow"
          >
            <Play size={16} className={loading ? 'animate-spin' : ''} />
            <span>Run Live Benchmark</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {benchmarkResults && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Entity Extraction F1
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
              {(benchmarkResults.overall_extraction_f1 * 100).toFixed(1)}%
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
              <span>Prec: {(benchmarkResults.overall_extraction_precision * 100).toFixed(1)}%</span>
              <span>Rec: {(benchmarkResults.overall_extraction_recall * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              M.O. Classification Accuracy
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: 4 }}>
              {(benchmarkResults.complaint_classification_accuracy * 100).toFixed(1)}%
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
              5 scam categories evaluated
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Entity-Linking F1 Score
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: 4 }}>
              {(benchmarkResults.entity_linking_f1 * 100).toFixed(1)}%
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
              Multi-complaint pairwise agreement
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Fraud Cluster ARI Score
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: 4 }}>
              {(benchmarkResults.cluster_identification_ari * 100).toFixed(1)}%
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
              Adjusted Rand Index community fit
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg. Engine Processing Time
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: 4 }}>
              {benchmarkResults.average_processing_time_ms.toFixed(2)} ms
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 8 }}>
              Ultra-low latency extraction
            </p>
          </div>
        </div>
      )}

      {/* Measurable Performance Table by Entity Indicator */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Digital Indicator Extraction Metrics (By Entity Type)
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Deterministic evaluation against {benchmarkResults?.test_cases_count || 25} labeled test complaints.
            </p>
          </div>
          <span className="badge badge-cyan">Reproducible Ground Truth</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Digital Indicator Type</th>
                <th style={{ padding: '12px 16px' }}>Precision</th>
                <th style={{ padding: '12px 16px' }}>Recall</th>
                <th style={{ padding: '12px 16px' }}>F1-Score</th>
                <th style={{ padding: '12px 16px' }}>Support (Ground Truth)</th>
                <th style={{ padding: '12px 16px' }}>Algorithm Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkResults && Object.entries(benchmarkResults.metrics_by_entity_type).map(([et, m]) => (
                <tr 
                  key={et}
                  style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}
                  className="hover:bg-slate-800/40"
                >
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                      {et}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: m.precision >= 0.9 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                    {(m.precision * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: m.recall >= 0.9 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                    {(m.recall * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: m.f1_score >= 0.9 ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
                    {(m.f1_score * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                    {m.support} annotations
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                    {et === 'PHONE' && 'E.164 boundary-isolated regex + normalisation to +91-XXXXX-XXXXX'}
                    {et === 'UPI' && 'VPA syntax parsing with web domain TLD exclusion filter'}
                    {et === 'URL' && 'Phishing URL regex + spoofed keyword domain harvester'}
                    {et === 'EMAIL' && 'RFC 5322 regex disambiguated from UPI handles'}
                    {et === 'BANK_ACCOUNT' && 'Keyword-guided contextual 9-18 digit account extractor'}
                    {et === 'IFSC' && '4-letter bank code + 0 + 6 alphanumeric branch router'}
                    {et === 'TELEGRAM' && 'Negative lookbehind handle parser excluding email domains'}
                    {et === 'CRYPTO_WALLET' && 'Base58 / Hexadecimal 0x Ethereum, Bitcoin, Tron pattern'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ground Truth Test Case Inspector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
          Reproducible Benchmark Corpus Inspector
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Inspect ground-truth test cases loaded from <code className="font-mono" style={{ color: 'var(--accent-cyan)' }}>data/evaluation_benchmark.json</code>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          {/* List of sample cases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {testCases.map(tc => (
              <div
                key={tc.id}
                onClick={() => setSelectedTestCase(tc)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTestCase?.id === tc.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${selectedTestCase?.id === tc.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>{tc.id}</span>
                <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{tc.expected_mo}</span>
              </div>
            ))}
          </div>

          {/* Test Case Detail View */}
          {selectedTestCase && (
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {selectedTestCase.id} Ground-Truth Annotation
                </span>
                <span className="badge badge-rose">Cluster: {selectedTestCase.cluster_id}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                  Raw Input Text Narrative:
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'rgba(7, 11, 20, 0.6)', padding: 10, borderRadius: 6, lineHeight: 1.4 }}>
                  {selectedTestCase.text}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                  Expected Ground-Truth Labeled Entities:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedTestCase.expected_entities?.map((ee: any, i: number) => (
                    <span key={i} className="badge badge-cyan" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      {ee.type}: {ee.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
