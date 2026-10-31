from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.database import get_db
from backend.app.intelligence.linker import discover_cross_complaint_connections
from backend.app.intelligence.risk_scorer import calculate_explainable_risk_assessment
from backend.app.intelligence.extractor import extract_entities_from_text, classify_modus_operandi
from backend.app.schemas import CrossComplaintDiscoveryResponse

router = APIRouter(prefix="/intelligence", tags=["intelligence"])

@router.get("/discover/{complaint_id}", response_model=CrossComplaintDiscoveryResponse)
def discover_intelligence(complaint_id: str, db: Session = Depends(get_db)):
    """
    Dedicated INTELLIGENCE DISCOVERY workflow endpoint:
    1. Select an existing complaint.
    2. Extract associated digital identifiers.
    3. Search database for matching entities across all complaints.
    4. Discover direct (1-hop) and multi-hop (2-hop) related complaints.
    5. Calculate explainable relationship strengths.
    6. Generate 4-tier explainable risk assessment.
    7. Generate actionable Investigation Summary.
    """
    discovery = discover_cross_complaint_connections(complaint_id, db, max_hops=2)
    if "error" in discovery:
        raise HTTPException(status_code=404, detail=discovery["error"])

    risk_assessment = calculate_explainable_risk_assessment(complaint_id, db, discovery)

    # Synthesize Law Enforcement Investigation Summary
    comp = discovery["primary_complaint"]
    direct_count = len(discovery["direct_links"])
    inferred_count = len(discovery["inferred_links"])
    total_victims = discovery["metrics"]["total_victims_linked"]
    total_loss = discovery["metrics"]["total_syndicate_loss"]

    if direct_count > 0 or inferred_count > 0:
        summary_lines = [
            f"INTELLIGENCE DISCOVERY CONFIRMED: Complaint {comp['id']} ({comp['victim_name']}, {comp['victim_city']}) "
            f"is NOT an isolated event. CyberTrace AI has correlated this incident with {total_victims - 1} other complaint(s) "
            f"in the national repository.",
            f"Direct Matches: {direct_count} case(s) sharing identical digital identifiers.",
            f"Inferred 2-Hop Matches: {inferred_count} case(s) connected through intermediary infrastructure nodes.",
            f"Total Collective Financial Impact: ₹{total_loss:,.2f} across {total_victims} victim complaints.",
            f"Syndicate Assessment: Risk tier evaluated at {risk_assessment.get('risk_category', 'ELEVATED')}. "
            f"Recommended for urgent Section 91 CrPC account freeze and inter-agency coordination."
        ]
    else:
        summary_lines = [
            f"INTELLIGENCE DISCOVERY COMPLETED: Complaint {comp['id']} ({comp['victim_name']}) currently has "
            f"no direct or multi-hop indicator overlap with other complaints in the active repository.",
            f"Extracted {len(discovery['extracted_entities'])} digital identifier(s) have been indexed into the central "
            f"knowledge base for prospective matching against incoming complaints."
        ]

    investigation_summary = "\n\n".join(summary_lines)

    return {
        "primary_complaint": discovery["primary_complaint"],
        "extracted_entities": discovery["extracted_entities"],
        "direct_links": discovery["direct_links"],
        "inferred_links": discovery["inferred_links"],
        "metrics": discovery["metrics"],
        "risk_assessment": risk_assessment,
        "investigation_summary": investigation_summary
    }

@router.post("/extract-preview")
def extract_preview(payload: Dict[str, str] = Body(...)):
    """
    Live real-time preview of entity extraction and MO classification
    from text as an investigator or complainant types.
    """
    text = payload.get("text", "")
    entities = extract_entities_from_text(text)
    mo = classify_modus_operandi(text)
    return {
        "extracted_entities": entities,
        "classification": mo,
        "total_extracted": len(entities)
    }
