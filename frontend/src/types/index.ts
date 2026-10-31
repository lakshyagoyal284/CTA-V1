export type NavigationTab = 
  | 'dashboard' 
  | 'discovery' 
  | 'graph' 
  | 'intake' 
  | 'demo' 
  | 'benchmark' 
  | 'audit';

export interface ExtractedEntity {
  id?: number;
  complaint_id?: string;
  entity_type: 'PHONE' | 'UPI' | 'BANK_ACCOUNT' | 'IFSC' | 'URL' | 'EMAIL' | 'TELEGRAM' | 'CRYPTO_WALLET' | string;
  raw_value: string;
  normalized_value: string;
  confidence: number;
  flagged_reason?: string;
  context_snippet?: string;
}

export interface FinancialTransaction {
  id: number;
  complaint_id: string;
  transaction_ref: string;
  amount: number;
  channel: string;
  beneficiary_identifier: string;
  beneficiary_bank?: string;
  timestamp: string;
}

export interface OfficerNote {
  id: number;
  complaint_id: string;
  officer_name: string;
  badge_number: string;
  note: string;
  verification_status: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  acknowledgement_no: string;
  victim_name: string;
  victim_state: string;
  victim_city: string;
  incident_date: string;
  reported_date: string;
  category: string;
  loss_amount: number;
  description: string;
  status: string;
  assigned_officer: string;
  cluster_id?: string | null;
  created_at: string;
  entities: ExtractedEntity[];
  transactions: FinancialTransaction[];
  officer_notes: OfficerNote[];
}

export interface SharedEntityItem {
  entity_type: string;
  raw_value: string;
  normalized_value: string;
}

export interface CrossComplaintLinkItem {
  source_complaint_id: string;
  target_complaint_id: string;
  target_complaint_acknowledgement: string;
  target_victim_name: string;
  target_victim_city: string;
  target_victim_state: string;
  target_category: string;
  target_loss_amount: number;
  target_status: string;
  target_incident_date: string;
  bridge_complaint_id?: string;
  bridge_victim_name?: string;
  link_type: 'DIRECT_MATCH' | 'MULTI_HOP_MATCH' | string;
  hop_count: number;
  shared_entities: SharedEntityItem[];
  relationship_strength: number;
  strength_percentage: number;
  strength_tier: string;
  strength_breakdown: string[];
  explanation: string;
  intermediate_path?: string[];
}

export interface ContributingFactor {
  name: string;
  weight: number;
  score: number;
  weighted_score: number;
  rationale: string;
}

export interface EvidenceTier {
  title: string;
  description: string;
  items: string[];
}

export interface FourTierEvidence {
  tier_a_reported: EvidenceTier;
  tier_b_automated: EvidenceTier;
  tier_c_inferred: EvidenceTier;
  tier_d_human_verified: EvidenceTier;
}

export interface RecommendedAction {
  action: string;
  priority: string;
  authority: string;
  details: string;
}

export interface RiskAssessment {
  overall_score: number;
  risk_category: string;
  risk_color: string;
  confidence_rating: number;
  contributing_factors: ContributingFactor[];
  four_tier_evidence: FourTierEvidence;
  data_quality_limitations: string[];
  recommended_investigative_actions: RecommendedAction[];
}

export interface DiscoveryMetrics {
  direct_matches_count: number;
  inferred_matches_count: number;
  total_victims_linked: number;
  total_syndicate_loss: number;
  unique_indicators_count: number;
}

export interface CrossComplaintDiscoveryResponse {
  primary_complaint: {
    id: string;
    acknowledgement_no: string;
    victim_name: string;
    victim_city: string;
    victim_state: string;
    category: string;
    loss_amount: number;
    incident_date: string;
    status: string;
    description: string;
  };
  extracted_entities: ExtractedEntity[];
  direct_links: CrossComplaintLinkItem[];
  inferred_links: CrossComplaintLinkItem[];
  metrics: DiscoveryMetrics;
  risk_assessment: RiskAssessment;
  investigation_summary: string;
}

export interface GraphNode {
  id: string;
  label: string;
  full_value?: string;
  type: string;
  color: string;
  shape: string;
  radius: number;
  frequency?: number;
  is_recurrent?: boolean;
  category?: string;
  victim_name?: string;
  victim_city?: string;
  victim_state?: string;
  loss_amount?: number;
  status?: string;
  cluster_id?: string;
  incident_date?: string;
  is_focus?: boolean;
  flagged_reason?: string;
  first_observed?: string;
  last_observed?: string;
  connected_complaints?: string[];
  connection_count?: number;
  related_transactions?: any[];
  details?: {
    acknowledgement_no: string;
    assigned_officer: string;
    description: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edge_type: string;
  label: string;
  weight: number;
  color: string;
  style: string;
  explanation?: string;
  shared_count?: number;
  shared_summary?: string;
}

export interface GraphCluster {
  cluster_id: string;
  name: string;
  modus_operandi?: string;
  complaints: string[];
  complaint_count: number;
  total_loss: number;
  categories: string[];
  key_indicators: string[];
  threat_level: string;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  stats: {
    total_nodes: number;
    total_edges: number;
    total_complaints?: number;
    total_indicators?: number;
    recurrent_indicators?: number;
    detected_clusters: number;
    complaints_shown?: number;
    indicators_shown?: number;
  };
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  initial_complaint_id: string;
  description: string;
  key_entities?: { type: string; value: string; role: string }[];
  expected_connections?: { target: string; type: string; via: string; hop: number }[];
  investigation_takeaway?: string;
  suggested_actions?: string[];
}

export interface BenchmarkMetric {
  metric_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface BenchmarkEvaluationResponse {
  benchmark_version: string;
  evaluation_timestamp: string;
  test_cases_count: number;
  metrics_by_entity_type: Record<string, BenchmarkMetric>;
  overall_extraction_f1: number;
  overall_extraction_precision: number;
  overall_extraction_recall: number;
  complaint_classification_accuracy: number;
  entity_linking_f1: number;
  cluster_identification_ari: number;
  average_processing_time_ms: number;
  disclaimer: string;
}
