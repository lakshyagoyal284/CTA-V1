from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models import Complaint, ExtractedEntity, OfficerNote

def calculate_explainable_risk_assessment(
    complaint_id: str,
    db: Session,
    discovery_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compute an explainable, multi-factor risk score for an investigation case.
    Explicitly separates:
      A. Reported Information
      B. Automated Observations
      C. Inferred Relationships
      D. Human-Verified Information
    Never uses prejudicial terms like 'criminal person'; adheres to 'suspicious indicator'.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return {}

    entities = db.query(ExtractedEntity).filter(ExtractedEntity.complaint_id == complaint_id).all()
    officer_notes = db.query(OfficerNote).filter(OfficerNote.complaint_id == complaint_id).all()

    direct_links = discovery_data.get("direct_links", [])
    inferred_links = discovery_data.get("inferred_links", [])
    metrics = discovery_data.get("metrics", {})

    total_victims = metrics.get("total_victims_linked", 1)
    total_syndicate_loss = metrics.get("total_syndicate_loss", complaint.loss_amount)

    # Factor 1: Multi-Victim Linkage (Weight: 30%)
    # 1 victim = 20, 2 victims = 60, 3+ victims = 95
    if total_victims >= 4:
        f1_score = 100
        f1_desc = f"Extensive syndicate operation confirmed: {total_victims} victim complaints interconnected across jurisdictions."
    elif total_victims == 3:
        f1_score = 85
        f1_desc = f"Multi-jurisdiction cluster: 3 distinct complaints linked by shared suspicious indicators."
    elif total_victims == 2:
        f1_score = 65
        f1_desc = f"Cross-complaint match identified: 2 victim complaints share digital identifiers."
    else:
        f1_score = 25
        f1_desc = "Single reported incident; no immediate cross-complaint match found in active repository."

    # Factor 2: Financial Velocity & Cumulative Loss (Weight: 25%)
    if total_syndicate_loss >= 500000:
        f2_score = 100
        f2_desc = f"High financial impact: Cumulative cross-complaint loss of ₹{total_syndicate_loss:,.2f} exceeding high-priority threshold."
    elif total_syndicate_loss >= 100000:
        f2_score = 80
        f2_desc = f"Substantial financial loss: ₹{total_syndicate_loss:,.2f} reported across linked incidents."
    elif total_syndicate_loss >= 25000:
        f2_score = 55
        f2_desc = f"Moderate financial loss: ₹{total_syndicate_loss:,.2f} reported by affected victim(s)."
    else:
        f2_score = 30
        f2_desc = f"Minor initial financial loss: ₹{total_syndicate_loss:,.2f}."

    # Factor 3: Infrastructure Recurrence & Entity Frequency (Weight: 25%)
    # Check if any extracted entity occurs multiple times across DB
    recurrent_count = 0
    recurrent_details = []
    for ent in entities:
        if ent.entity_type == "IFSC":
            continue
        c = db.query(ExtractedEntity).filter(
            ExtractedEntity.normalized_value == ent.normalized_value
        ).count()
        if c > 1:
            recurrent_count += 1
            recurrent_details.append(f"{ent.entity_type} ({ent.normalized_value}) observed in {c} distinct complaints")

    if recurrent_count >= 3:
        f3_score = 95
        f3_desc = f"Persistent infrastructure: {recurrent_count} digital indicators repeatedly used across multiple scam operations."
    elif recurrent_count >= 1:
        f3_score = 75
        f3_desc = f"Recurring identifier: {len(recurrent_details)} indicator(s) previously flagged in national repository."
    else:
        f3_score = 25
        f3_desc = "Fresh/unobserved indicators; first recorded appearance in repository."

    # Factor 4: Modus Operandi Severity & Coercion (Weight: 20%)
    category_severity = {
        "Digital Extortion / Blackmail": 95,
        "Digital Arrest / Extortion": 95,
        "Loan App Harassment": 90,
        "Phishing / Identity Theft": 80,
        "UPI Fraud": 75,
        "Task / Job Scam": 75,
        "Investment Scam": 70
    }
    f4_score = category_severity.get(complaint.category, 60)
    if "extortion" in complaint.category.lower() or "arrest" in complaint.category.lower() or "harass" in complaint.category.lower():
        f4_desc = "High-severity psychological coercion, extortion threats, or digital arrest intimidation detected."
    elif "phishing" in complaint.category.lower() or "kyc" in complaint.category.lower():
        f4_desc = "Deceptive spoofing / phishing infrastructure targeting critical banking credentials."
    else:
        f4_desc = f"Standard financial fraud scheme ({complaint.category}) utilizing social engineering."

    # Composite Risk Calculation (Weighted)
    composite_score = int(
        (f1_score * 0.30) +
        (f2_score * 0.25) +
        (f3_score * 0.25) +
        (f4_score * 0.20)
    )

    if composite_score >= 80:
        risk_category = "CRITICAL RISK"
        risk_color = "#ef4444"
    elif composite_score >= 60:
        risk_category = "HIGH RISK"
        risk_color = "#f97316"
    elif composite_score >= 40:
        risk_category = "MODERATE RISK"
        risk_color = "#eab308"
    else:
        risk_category = "LOW RISK"
        risk_color = "#10b981"

    # Actionable LEA recommendations based on indicators
    recommended_steps = []
    has_upi = any(e.entity_type == "UPI" for e in entities)
    has_phone = any(e.entity_type == "PHONE" for e in entities)
    has_url = any(e.entity_type == "URL" for e in entities)
    has_bank = any(e.entity_type == "BANK_ACCOUNT" for e in entities)
    has_crypto = any(e.entity_type == "CRYPTO_WALLET" for e in entities)

    if has_upi or has_bank:
        recommended_steps.append({
            "action": "Section 91 CrPC Bank Account Lien / Freeze Notice",
            "priority": "IMMEDIATE (0-2 hours)",
            "authority": "Designated Nodal Officer / I4C 1930 Portal",
            "details": "Dispatch formal emergency lien request to nodal bank officers for immediate debit freeze of beneficiary UPI/bank accounts."
        })
    if has_phone:
        recommended_steps.append({
            "action": "Telecom Carrier CDR & CAF Requisition",
            "priority": "HIGH (Within 12 hours)",
            "authority": "Superintendent of Police / Cyber Cell In-Charge",
            "details": "Requisition Call Detail Records (CDR), tower locations, and Customer Acquisition Forms (CAF) for extracted mobile numbers to locate physical point-of-origin."
        })
    if has_url:
        recommended_steps.append({
            "action": "CERT-In Phishing Domain Emergency Takedown",
            "priority": "IMMEDIATE (0-4 hours)",
            "authority": "CERT-In Incident Response Desk / Registrar Nodal",
            "details": "Submit verified phishing URL and DNS hosting artifacts to CERT-In and domain registrars for recursive DNS sinkholing."
        })
    if has_crypto:
        recommended_steps.append({
            "action": "VASP Exchange Blacklist & Travel Rule Flagging",
            "priority": "HIGH (Within 24 hours)",
            "authority": "FIU-IND / FIU Registered Crypto Exchanges",
            "details": "Alert domestic Virtual Asset Service Providers (VASPs) to flag and freeze on-chain liquidity exits to suspicious wallet addresses."
        })

    # Confidence and Limitations
    confidence_rating = 92 if len(entities) >= 3 and len(direct_links) >= 1 else 84
    limitations = [
        "Digital indicators are extracted from complainant self-reporting; primary telecom CAF verification remains pending.",
        "Beneficiary accounts may constitute multi-layered mule accounts where account holders are unwittingly compromised.",
        "Cross-complaint correlation establishes infrastructure sharing; judicial determination of culpability requires forensic CDR and KYC validation."
    ]

    # Structured 4-Tier Breakdown
    four_tier_evidence = {
        "tier_a_reported": {
            "title": "A. Reported Information (Complainant Testimony)",
            "description": "Factual statements directly provided by the victim under official acknowledgement.",
            "items": [
                f"Complainant Identity: {complaint.victim_name} ({complaint.victim_city}, {complaint.victim_state})",
                f"Reported Incident Date: {complaint.incident_date.strftime('%d-%b-%Y')}",
                f"Claimed Financial Loss: ₹{complaint.loss_amount:,.2f}",
                f"Reported Modus Operandi: {complaint.category}",
                f"Narrative Summary: \"{complaint.description[:140]}...\""
            ]
        },
        "tier_b_automated": {
            "title": "B. Automated Observations (Machine-Extracted Indicators)",
            "description": "Deterministic digital indicators extracted and canonicalised by the CyberTrace AI engine.",
            "items": [
                f"{e.entity_type} ({e.normalized_value}) - Confidence: {int(e.confidence*100)}%"
                for e in entities
            ]
        },
        "tier_c_inferred": {
            "title": "C. Inferred Relationships (Cross-Complaint & Multi-Hop Network)",
            "description": "Probabilistic associations derived from shared digital indicators and graph discovery algorithms.",
            "items": [
                l["explanation"] for l in direct_links + inferred_links
            ] if (direct_links or inferred_links) else [
                "No cross-complaint connections inferred at current repository threshold."
            ]
        },
        "tier_d_human_verified": {
            "title": "D. Human-Verified Information (Law Enforcement Validation)",
            "description": "Investigating officer endorsements, bank responses, and official verification records.",
            "items": [
                f"Officer {n.officer_name} ({n.badge_number}): {n.note} [{n.verification_status}]"
                for n in officer_notes
            ] if officer_notes else [
                "No officer field-verification notes logged yet for this dossier."
            ]
        }
    }

    return {
        "overall_score": composite_score,
        "risk_category": risk_category,
        "risk_color": risk_color,
        "confidence_rating": confidence_rating,
        "contributing_factors": [
            {
                "name": "Multi-Victim Cross-Complaint Linkage",
                "weight": 30,
                "score": f1_score,
                "weighted_score": round(f1_score * 0.30, 1),
                "rationale": f1_desc
            },
            {
                "name": "Financial Velocity & Cumulative Loss",
                "weight": 25,
                "score": f2_score,
                "weighted_score": round(f2_score * 0.25, 1),
                "rationale": f2_desc
            },
            {
                "name": "Infrastructure Recurrence & Indicator Frequency",
                "weight": 25,
                "score": f3_score,
                "weighted_score": round(f3_score * 0.25, 1),
                "rationale": f3_desc
            },
            {
                "name": "Modus Operandi Severity & Coercion Level",
                "weight": 20,
                "score": f4_score,
                "weighted_score": round(f4_score * 0.20, 1),
                "rationale": f4_desc
            }
        ],
        "four_tier_evidence": four_tier_evidence,
        "data_quality_limitations": limitations,
        "recommended_investigative_actions": recommended_steps
    }
