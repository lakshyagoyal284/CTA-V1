import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FilePlus, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Copy
} from 'lucide-react';

interface ComplaintIntakeViewProps {
  onComplaintCreated: (complaintId: string) => void;
}

export const ComplaintIntakeView: React.FC<ComplaintIntakeViewProps> = ({
  onComplaintCreated
}) => {
  const [formData, setFormData] = useState({
    victim_name: '',
    victim_state: 'Maharashtra',
    victim_city: '',
    category: 'Task / Job Scam',
    loss_amount: '',
    description: '',
    assigned_officer: 'Insp. Rajesh Kumar (Cyber Cell BKC)'
  });

  const [previewEntities, setPreviewEntities] = useState<any[]>([]);
  const [predictedMo, setPredictedMo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<{ id: string; ack: string } | null>(null);

  // Live real-time NLP extraction as user types
  useEffect(() => {
    if (formData.description.trim().length < 15) {
      setPreviewEntities([]);
      setPredictedMo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const preview = await api.extractPreview(formData.description);
        setPreviewEntities(preview.extracted_entities || []);
        setPredictedMo(preview.classification || null);
      } catch (e) {
        // Silent preview error
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.victim_name || !formData.victim_city || !formData.description) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createComplaint({
        victim_name: formData.victim_name,
        victim_state: formData.victim_state,
        victim_city: formData.victim_city,
        category: formData.category,
        loss_amount: parseFloat(formData.loss_amount) || 0,
        description: formData.description,
        assigned_officer: formData.assigned_officer
      });

      setSuccessMsg({ id: created.id, ack: created.acknowledgement_no });
    } catch (e) {
      alert("Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const loadSampleNarrative = (type: string) => {
    if (type === 'task') {
      setFormData(prev => ({
        ...prev,
        category: 'Task / Job Scam',
        loss_amount: '95000',
        victim_name: 'Pooja Hegde',
        victim_city: 'Mangaluru',
        victim_state: 'Karnataka',
        description: 'Approached on Telegram by @fast_payouts_in offering hotel review tasks. Coerced into transferring Rs 95,000 to UPI ID taskpay.merchant88@okhdfcbank. Contact phone was +91-98112-99381.'
      }));
    } else if (type === 'phish') {
      setFormData(prev => ({
        ...prev,
        category: 'Phishing / Identity Theft',
        loss_amount: '110000',
        victim_name: 'Satish Deshpande',
        victim_state: 'Maharashtra',
        victim_city: 'Nashik',
        description: 'Received SMS threatening power disconnection from caller on +91-94150-88219. Directed to website https://secure-billpay-update.in and transferred Rs 1,10,000 to beneficiary account 5010049281729 IFSC HDFC0001829.'
      }));
    } else if (type === 'extort') {
      setFormData(prev => ({
        ...prev,
        category: 'Digital Extortion / Blackmail',
        loss_amount: '220000',
        victim_name: 'Rajeev Singhania',
        victim_state: 'Gujarat',
        victim_city: 'Surat',
        description: 'Placed under digital arrest by caller +91-97270-33418 claiming customs seized narcotic drugs in courier. Forced to deposit Rs 2,20,000 to clearance UPI extort.release99@paytm.'
      }));
    }
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
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
            <span className="badge badge-cyan">Automated Entity Ingestion</span>
            <span className="badge badge-purple">Real-Time NLP Extractor</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
            Complaint Intake & Live Digital Indicator Extraction
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 780 }}>
            Submit an incoming citizen complaint. The AI engine extracts phone numbers, UPI VPAs, URLs, and bank accounts in real-time, instantly discovering multi-hop linkages.
          </p>
        </div>

        {/* Quick Load Test Cases */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Insert Test Case:</span>
          <button onClick={() => loadSampleNarrative('task')} className="badge badge-purple" style={{ cursor: 'pointer' }}>
            + Task Scam
          </button>
          <button onClick={() => loadSampleNarrative('phish')} className="badge badge-rose" style={{ cursor: 'pointer' }}>
            + Phishing SMS
          </button>
          <button onClick={() => loadSampleNarrative('extort')} className="badge badge-amber" style={{ cursor: 'pointer' }}>
            + Digital Arrest
          </button>
        </div>
      </div>

      {successMsg ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              Complaint Registered & Digital Indicators Indexed!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
              Case ID: <strong style={{ color: 'var(--accent-cyan)' }}>{successMsg.id}</strong> • Acknowledgement: <strong>{successMsg.ack}</strong>
            </p>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', maxWidth: 540 }}>
            The extracted indicators have been cross-referenced across the national complaint index. You can immediately initiate cross-complaint discovery.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => onComplaintCreated(successMsg.id)}
              className="btn-action-glow"
            >
              <Sparkles size={16} />
              <span>Launch Discovery for {successMsg.id}</span>
            </button>
            <button
              onClick={() => {
                setSuccessMsg(null);
                setFormData({
                  victim_name: '',
                  victim_state: 'Maharashtra',
                  victim_city: '',
                  category: 'Task / Job Scam',
                  loss_amount: '',
                  description: '',
                  assigned_officer: 'Insp. Rajesh Kumar (Cyber Cell BKC)'
                });
              }}
              className="btn-secondary"
            >
              Register Another Complaint
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>
          {/* Intake Form (Left) */}
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Citizen Complaint Intake Form
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Complainant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={formData.victim_name}
                  onChange={e => setFormData({ ...formData, victim_name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Financial Loss (INR) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={formData.loss_amount}
                  onChange={e => setFormData({ ...formData, loss_amount: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Victim City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={formData.victim_city}
                  onChange={e => setFormData({ ...formData, victim_city: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Victim State *
                </label>
                <select
                  value={formData.victim_state}
                  onChange={e => setFormData({ ...formData, victim_state: e.target.value })}
                  className="form-select"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Telangana">Telangana</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Crime Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  <option value="Task / Job Scam">Task / Job Scam</option>
                  <option value="Phishing / Identity Theft">Phishing / Identity Theft</option>
                  <option value="Digital Extortion / Blackmail">Digital Extortion / Blackmail</option>
                  <option value="Investment Scam">Investment Scam</option>
                  <option value="UPI Fraud">UPI Fraud</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Assigned Cyber Cell Officer
                </label>
                <input
                  type="text"
                  value={formData.assigned_officer}
                  onChange={e => setFormData({ ...formData, assigned_officer: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Incident Description & Narrative *
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                  Live NLP Extraction Active
                </span>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Paste victim statement or email. Include phone numbers, UPI IDs, bank account numbers, URLs, or Telegram handles..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
            >
              <Send size={16} />
              <span>Register Complaint & Index Digital Indicators</span>
            </button>
          </form>

          {/* Live Extraction Preview Panel (Right) */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc' }}>
                  Live NLP Indicator Preview
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Deterministic extraction running in background.
                </p>
              </div>
              <span className="badge badge-cyan">{previewEntities.length} Detected</span>
            </div>

            {/* MO Classification Preview */}
            {predictedMo && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  AI Predicted Modus Operandi
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--accent-purple)' }}>
                    {predictedMo.primary_mo}
                  </strong>
                  <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
                    {Math.round(predictedMo.confidence * 100)}% Conf
                  </span>
                </div>
              </div>
            )}

            {/* Extracted Entities List */}
            {previewEntities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewEntities.map((ent, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.64rem' }}>
                        {ent.entity_type}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                        {ent.normalized_value}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {Math.round(ent.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                <p>Type complaint narrative or click "+ Task Scam" above to preview live indicator extraction.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
