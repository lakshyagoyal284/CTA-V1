import pytest
from backend.app.intelligence.extractor import extract_entities_from_text, classify_modus_operandi, normalize_phone, normalize_upi
from backend.app.intelligence.linker import calculate_relationship_strength
from backend.app.database import SessionLocal, Base, engine
from backend.app.intelligence.linker import discover_cross_complaint_connections
from backend.app.intelligence.risk_scorer import calculate_explainable_risk_assessment
from backend.app.intelligence.graph_engine import generate_network_graph
from backend.app.services.pdf_generator import generate_investigation_dossier_pdf
from backend.evaluate_engine import run_evaluation_benchmark

def test_entity_extraction():
    text = (
        "Victim approached on Telegram by @fast_earn_bot. Coerced into paying Rs 50,000 "
        "to UPI mule.pay88@okhdfcbank. Suspect handler called from +91-98201-44719. "
        "Phishing site was https://secure-billpay-update.in."
    )
    entities = extract_entities_from_text(text)
    norm_vals = {e["normalized_value"] for e in entities}
    
    assert "@fast_earn_bot" in norm_vals
    assert "mule.pay88@okhdfcbank" in norm_vals
    assert "+91-98201-44719" in norm_vals
    assert "secure-billpay-update.in" in norm_vals

def test_modus_operandi_classification():
    text = "Victim put under digital arrest by caller claiming to be CBI narcotics officer on Skype."
    res = classify_modus_operandi(text)
    assert res["primary_mo"] == "DIGITAL_EXTORTION_ARREST"
    assert res["confidence"] >= 0.75

def test_cross_complaint_discovery():
    db = SessionLocal()
    try:
        # C-101 should connect to C-104 (direct UPI match) and C-110 (direct phone match)
        disc = discover_cross_complaint_connections("C-101", db, max_hops=2)
        assert len(disc["direct_links"]) >= 2
        assert len(disc["inferred_links"]) >= 1
        
        target_ids = {l["target_complaint_id"] for l in disc["direct_links"]}
        assert "C-104" in target_ids
        assert "C-110" in target_ids
        
        inferred_targets = {l["target_complaint_id"] for l in disc["inferred_links"]}
        assert "C-107" in inferred_targets
    finally:
        db.close()

def test_explainable_risk_assessment():
    db = SessionLocal()
    try:
        disc = discover_cross_complaint_connections("C-101", db, max_hops=2)
        risk = calculate_explainable_risk_assessment("C-101", db, disc)
        assert risk["overall_score"] >= 70
        assert risk["risk_category"] in ["CRITICAL RISK", "HIGH RISK"]
        assert len(risk["contributing_factors"]) == 4
        assert "tier_a_reported" in risk["four_tier_evidence"]
        assert "tier_b_automated" in risk["four_tier_evidence"]
        assert "tier_c_inferred" in risk["four_tier_evidence"]
        assert "tier_d_human_verified" in risk["four_tier_evidence"]
    finally:
        db.close()

def test_network_graph_generation():
    db = SessionLocal()
    try:
        graph = generate_network_graph(db)
        assert len(graph["nodes"]) > 15
        assert len(graph["edges"]) > 10
        assert len(graph["clusters"]) >= 3
    finally:
        db.close()

def test_pdf_dossier_generation():
    db = SessionLocal()
    try:
        disc = discover_cross_complaint_connections("C-101", db, max_hops=2)
        risk = calculate_explainable_risk_assessment("C-101", db, disc)
        pdf_bytes = generate_investigation_dossier_pdf(disc["primary_complaint"], disc, risk)
        assert len(pdf_bytes) > 2000
        assert pdf_bytes.startswith(b"%PDF")
    finally:
        db.close()

def test_benchmark_runner():
    res = run_evaluation_benchmark()
    assert res["test_cases_count"] >= 20
    assert res["overall_extraction_f1"] >= 0.85
    assert res["complaint_classification_accuracy"] >= 0.80
    assert res["average_processing_time_ms"] < 50.0
