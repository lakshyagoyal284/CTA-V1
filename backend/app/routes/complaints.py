from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import random

from backend.app.database import get_db
from backend.app.models import Complaint, ExtractedEntity, FinancialTransaction, OfficerNote
from backend.app.schemas import ComplaintCreate, ComplaintOut, OfficerNoteCreate, OfficerNoteOut
from backend.app.intelligence.extractor import extract_entities_from_text
from backend.app.intelligence.linker import discover_cross_complaint_connections
from backend.app.services.seed_data import seed_database

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.get("", response_model=List[ComplaintOut])
def list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.victim_name.ilike(s)) |
            (Complaint.id.ilike(s)) |
            (Complaint.acknowledgement_no.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.victim_city.ilike(s))
        )
    return query.order_by(Complaint.created_at.desc()).limit(limit).all()

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")
    return comp

@router.post("", response_model=ComplaintOut)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    # Auto-generate ID and Acknowledgement
    last_comp = db.query(Complaint).order_by(Complaint.created_at.desc()).first()
    next_num = 116
    if last_comp and last_comp.id.startswith("C-"):
        try:
            next_num = max(next_num, int(last_comp.id.split("-")[1]) + 1)
        except ValueError:
            next_num = random.randint(200, 999)

    complaint_id = f"C-{next_num}"
    ack_no = f"NCRP-{datetime.now(timezone.utc).year}-{random.randint(100000, 999999)}"

    new_comp = Complaint(
        id=complaint_id,
        acknowledgement_no=ack_no,
        victim_name=payload.victim_name,
        victim_state=payload.victim_state,
        victim_city=payload.victim_city,
        incident_date=payload.incident_date or datetime.now(timezone.utc),
        reported_date=datetime.now(timezone.utc),
        category=payload.category,
        loss_amount=payload.loss_amount,
        description=payload.description,
        status="Under Investigation",
        assigned_officer=payload.assigned_officer or "Insp. Rajesh Kumar (Cyber Cell)"
    )
    db.add(new_comp)
    db.flush()

    # Automatically extract entities from description
    extracted = extract_entities_from_text(payload.description)
    for ent in extracted:
        ee = ExtractedEntity(
            complaint_id=new_comp.id,
            entity_type=ent["entity_type"],
            raw_value=ent["raw_value"],
            normalized_value=ent["normalized_value"],
            confidence=ent["confidence"],
            flagged_reason=ent["flagged_reason"],
            context_snippet=ent["context_snippet"],
            first_observed=new_comp.incident_date,
            last_observed=new_comp.incident_date
        )
        db.add(ee)

    db.commit()
    db.refresh(new_comp)
    return new_comp

@router.post("/{complaint_id}/notes", response_model=OfficerNoteOut)
def add_officer_note(complaint_id: str, note_data: OfficerNoteCreate, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    new_note = OfficerNote(
        complaint_id=complaint_id,
        officer_name=note_data.officer_name,
        badge_number=note_data.badge_number,
        note=note_data.note,
        verification_status=note_data.verification_status or "HUMAN_VERIFIED"
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.post("/reset-demo-database")
def reset_database():
    """Reset the demo database to default seeded state."""
    seed_database()
    return {"status": "success", "message": "Demo database successfully reset to clean evaluation baseline"}
