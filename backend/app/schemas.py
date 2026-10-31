from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ExtractedEntityBase(BaseModel):
    entity_type: str
    raw_value: str
    normalized_value: str
    confidence: float
    flagged_reason: Optional[str] = None
    context_snippet: Optional[str] = None

class ExtractedEntityOut(ExtractedEntityBase):
    id: int
    complaint_id: str

    class Config:
        from_attributes = True

class FinancialTransactionOut(BaseModel):
    id: int
    complaint_id: str
    transaction_ref: str
    amount: float
    channel: str
    beneficiary_identifier: str
    beneficiary_bank: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class OfficerNoteCreate(BaseModel):
    officer_name: str
    badge_number: str
    note: str
    verification_status: Optional[str] = "HUMAN_VERIFIED"

class OfficerNoteOut(OfficerNoteCreate):
    id: int
    complaint_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    victim_name: str
    victim_state: str
    victim_city: str
    category: str
    loss_amount: float = Field(ge=0)
    description: str = Field(min_length=10)
    incident_date: Optional[datetime] = None
    assigned_officer: Optional[str] = "Insp. Rajesh Kumar (Cyber Cell BKC)"

class ComplaintOut(BaseModel):
    id: str
    acknowledgement_no: str
    victim_name: str
    victim_state: str
    victim_city: str
    incident_date: datetime
    reported_date: datetime
    category: str
    loss_amount: float
    description: str
    status: str
    assigned_officer: str
    cluster_id: Optional[str] = None
    created_at: datetime
    entities: List[ExtractedEntityOut] = []
    transactions: List[FinancialTransactionOut] = []
    officer_notes: List[OfficerNoteOut] = []

    class Config:
        from_attributes = True

class SharedEntityItem(BaseModel):
    entity_type: str
    raw_value: str
    normalized_value: str

class CrossComplaintLinkItem(BaseModel):
    source_complaint_id: str
    target_complaint_id: str
    target_complaint_acknowledgement: str
    target_victim_name: str
    target_victim_city: str
    target_victim_state: str
    target_category: str
    target_loss_amount: float
    target_status: str
    target_incident_date: str
    bridge_complaint_id: Optional[str] = None
    bridge_victim_name: Optional[str] = None
    link_type: str
    hop_count: int
    shared_entities: List[SharedEntityItem]
    relationship_strength: float
    strength_percentage: int
    strength_tier: str
    strength_breakdown: List[str]
    explanation: str
    intermediate_path: Optional[List[str]] = None

class DiscoveryMetrics(BaseModel):
    direct_matches_count: int
    inferred_matches_count: int
    total_victims_linked: int
    total_syndicate_loss: float
    unique_indicators_count: int

class CrossComplaintDiscoveryResponse(BaseModel):
    primary_complaint: Dict[str, Any]
    extracted_entities: List[Dict[str, Any]]
    direct_links: List[CrossComplaintLinkItem]
    inferred_links: List[CrossComplaintLinkItem]
    metrics: DiscoveryMetrics
    risk_assessment: Dict[str, Any]
    investigation_summary: str

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    color: str
    shape: str
    radius: float
    frequency: Optional[int] = 1
    category: Optional[str] = None
    victim_name: Optional[str] = None
    loss_amount: Optional[float] = None
    status: Optional[str] = None
    is_focus: Optional[bool] = False
    flagged_reason: Optional[str] = None
    connected_complaints: Optional[List[str]] = []
    connection_count: Optional[int] = 0
    related_transactions: Optional[List[Dict[str, Any]]] = []
    details: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    edge_type: str
    label: str
    weight: float
    color: str
    style: str
    explanation: Optional[str] = None

class GraphCluster(BaseModel):
    cluster_id: str
    name: str
    complaints: List[str]
    complaint_count: int
    total_loss: float
    categories: List[str]
    key_indicators: List[str]
    threat_level: str

class GraphDataResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    clusters: List[GraphCluster]
    stats: Dict[str, Any]

class DemoScenarioSummary(BaseModel):
    id: str
    title: str
    subtitle: str
    theme: str
    initial_complaint_id: str
    description: str

class BenchmarkMetric(BaseModel):
    metric_name: str
    precision: float
    recall: float
    f1_score: float
    support: int

class BenchmarkEvaluationResponse(BaseModel):
    benchmark_version: str
    evaluation_timestamp: str
    test_cases_count: int
    metrics_by_entity_type: Dict[str, BenchmarkMetric]
    overall_extraction_f1: float
    complaint_classification_accuracy: float
    entity_linking_f1: float
    cluster_identification_ari: float
    average_processing_time_ms: float
    disclaimer: str
