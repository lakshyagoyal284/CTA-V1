from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)  # e.g., "C-101"
    acknowledgement_no = Column(String, unique=True, index=True)  # e.g., "NCRP-2024-88391"
    victim_name = Column(String, nullable=False)
    victim_state = Column(String, nullable=False)
    victim_city = Column(String, nullable=False)
    incident_date = Column(DateTime, default=datetime.utcnow)
    reported_date = Column(DateTime, default=datetime.utcnow)
    category = Column(String, nullable=False)  # "UPI Fraud", "Phishing / Identity Theft", etc.
    loss_amount = Column(Float, default=0.0)
    description = Column(Text, nullable=False)
    status = Column(String, default="Under Investigation")
    assigned_officer = Column(String, default="Insp. Rajesh Kumar (Cyber Cell)")
    cluster_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    entities = relationship("ExtractedEntity", back_populates="complaint", cascade="all, delete-orphan")
    transactions = relationship("FinancialTransaction", back_populates="complaint", cascade="all, delete-orphan")
    officer_notes = relationship("OfficerNote", back_populates="complaint", cascade="all, delete-orphan")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), index=True, nullable=False)
    entity_type = Column(String, index=True, nullable=False)  # "PHONE", "UPI", "BANK_ACCOUNT", "IFSC", "URL", "EMAIL", "TELEGRAM", "CRYPTO_WALLET"
    raw_value = Column(String, nullable=False)
    normalized_value = Column(String, index=True, nullable=False)
    context_snippet = Column(Text, nullable=True)
    confidence = Column(Float, default=0.95)
    flagged_reason = Column(Text, nullable=True)
    first_observed = Column(DateTime, default=datetime.utcnow)
    last_observed = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="entities")

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), index=True, nullable=False)
    transaction_ref = Column(String, unique=True, index=True)  # UTR or Ref number
    amount = Column(Float, nullable=False)
    channel = Column(String, default="UPI")  # UPI, IMPS, NEFT, Crypto
    sender_account = Column(String, nullable=True)
    beneficiary_identifier = Column(String, index=True, nullable=False)  # e.g., UPI ID or A/C
    beneficiary_bank = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="transactions")

class ComplaintLink(Base):
    __tablename__ = "complaint_links"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_complaint_id = Column(String, ForeignKey("complaints.id"), index=True, nullable=False)
    target_complaint_id = Column(String, ForeignKey("complaints.id"), index=True, nullable=False)
    link_type = Column(String, nullable=False)  # "DIRECT_MATCH", "MULTI_HOP_MATCH", "MODUS_OPERANDI_SIMILAR"
    shared_entity_type = Column(String, nullable=True)
    shared_entity_value = Column(String, nullable=True)
    hop_count = Column(Integer, default=1)
    relationship_strength = Column(Float, default=0.0)  # 0.0 to 1.0
    explanation = Column(Text, nullable=False)
    intermediate_path = Column(Text, nullable=True)  # JSON string of route: ["C-101", "UPI:x@y", "C-104", ...]
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudCluster(Base):
    __tablename__ = "fraud_clusters"

    id = Column(String, primary_key=True, index=True)  # e.g. "CLUSTER-ALPHA"
    name = Column(String, nullable=False)
    modus_operandi = Column(String, nullable=False)
    threat_level = Column(String, default="HIGH")  # CRITICAL, HIGH, MEDIUM
    total_loss = Column(Float, default=0.0)
    complaint_count = Column(Integer, default=0)
    entity_count = Column(Integer, default=0)
    primary_identifiers = Column(Text, nullable=True)  # JSON string
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OfficerNote(Base):
    __tablename__ = "officer_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), index=True, nullable=False)
    officer_name = Column(String, nullable=False)
    badge_number = Column(String, default="CY-9021")
    note = Column(Text, nullable=False)
    verification_status = Column(String, default="HUMAN_VERIFIED")  # HUMAN_VERIFIED, REQUIRES_FURTHER_ACTION
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="officer_notes")

class DemoScenario(Base):
    __tablename__ = "demo_scenarios"

    id = Column(String, primary_key=True)  # "scenario_1", "scenario_2", "scenario_3"
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=False)
    theme = Column(String, nullable=False)
    initial_complaint_id = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    key_entities = Column(Text, nullable=False)  # JSON
    expected_connections = Column(Text, nullable=False)  # JSON
    investigation_takeaway = Column(Text, nullable=False)
    suggested_actions = Column(Text, nullable=False)  # JSON
