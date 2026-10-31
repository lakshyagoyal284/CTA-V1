from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Complaint
from backend.app.intelligence.linker import discover_cross_complaint_connections
from backend.app.intelligence.risk_scorer import calculate_explainable_risk_assessment
from backend.app.services.pdf_generator import generate_investigation_dossier_pdf

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/{complaint_id}/pdf")
def download_case_dossier_pdf(complaint_id: str, db: Session = Depends(get_db)):
    """Generate and download official PDF Law Enforcement Investigation Dossier."""
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    discovery = discover_cross_complaint_connections(complaint_id, db, max_hops=2)
    risk = calculate_explainable_risk_assessment(complaint_id, db, discovery)

    comp_dict = {
        "id": comp.id,
        "acknowledgement_no": comp.acknowledgement_no,
        "victim_name": comp.victim_name,
        "victim_city": comp.victim_city,
        "victim_state": comp.victim_state,
        "category": comp.category,
        "loss_amount": comp.loss_amount,
        "incident_date": comp.incident_date.isoformat(),
        "assigned_officer": comp.assigned_officer,
        "description": comp.description
    }

    try:
        pdf_bytes = generate_investigation_dossier_pdf(comp_dict, discovery, risk)
        filename = f"CyberTrace_Dossier_{comp.id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
