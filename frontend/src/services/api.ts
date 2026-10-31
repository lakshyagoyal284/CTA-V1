import {
  Complaint,
  CrossComplaintDiscoveryResponse,
  GraphDataResponse,
  DemoScenario,
  BenchmarkEvaluationResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  async getComplaints(params?: { category?: string; status?: string; search?: string }): Promise<Complaint[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const res = await fetch(`${API_BASE}/complaints?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaint(id: string): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch complaint ${id}`);
    return res.json();
  },

  async createComplaint(payload: {
    victim_name: string;
    victim_state: string;
    victim_city: string;
    category: string;
    loss_amount: number;
    description: string;
    assigned_officer?: string;
  }): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create complaint');
    return res.json();
  },

  async addOfficerNote(complaintId: string, payload: {
    officer_name: string;
    badge_number: string;
    note: string;
    verification_status?: string;
  }) {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add officer note');
    return res.json();
  },

  async discoverIntelligence(complaintId: string): Promise<CrossComplaintDiscoveryResponse> {
    const res = await fetch(`${API_BASE}/intelligence/discover/${complaintId}`);
    if (!res.ok) throw new Error(`Intelligence discovery failed for ${complaintId}`);
    return res.json();
  },

  async extractPreview(text: string): Promise<{
    extracted_entities: any[];
    classification: any;
    total_extracted: number;
  }> {
    const res = await fetch(`${API_BASE}/intelligence/extract-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Preview extraction failed');
    return res.json();
  },

  async getGraph(params?: {
    focus_complaint_id?: string;
    filter_entity_types?: string[];
    cluster_id?: string;
  }): Promise<GraphDataResponse> {
    const query = new URLSearchParams();
    if (params?.focus_complaint_id) query.append('focus_complaint_id', params.focus_complaint_id);
    if (params?.cluster_id) query.append('cluster_id', params.cluster_id);
    if (params?.filter_entity_types) {
      params.filter_entity_types.forEach(t => query.append('filter_entity_types', t));
    }
    const res = await fetch(`${API_BASE}/graph?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch network graph');
    return res.json();
  },

  async getDemoScenarios(): Promise<DemoScenario[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch demo scenarios');
    return res.json();
  },

  async getDemoScenarioDetails(scenarioId: string): Promise<DemoScenario> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}`);
    if (!res.ok) throw new Error(`Failed to fetch scenario ${scenarioId}`);
    return res.json();
  },

  async runBenchmark(): Promise<BenchmarkEvaluationResponse> {
    const res = await fetch(`${API_BASE}/evaluation/benchmark`);
    if (!res.ok) throw new Error('Live benchmark execution failed');
    return res.json();
  },

  async getBenchmarkTestCases() {
    const res = await fetch(`${API_BASE}/evaluation/test-cases`);
    if (!res.ok) throw new Error('Failed to fetch benchmark test cases');
    return res.json();
  },

  getDossierPdfUrl(complaintId: string): string {
    return `${API_BASE}/reports/${complaintId}/pdf`;
  },

  async resetDemoDatabase() {
    const res = await fetch(`${API_BASE}/complaints/reset-demo-database`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset demo database');
    return res.json();
  }
};
