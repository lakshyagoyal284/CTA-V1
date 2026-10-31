from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.app.database import get_db
from backend.app.models import DemoScenario

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.get("")
def list_demo_scenarios(db: Session = Depends(get_db)):
    """List all 3 evaluator demonstration scenarios."""
    scenarios = db.query(DemoScenario).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "subtitle": s.subtitle,
            "theme": s.theme,
            "initial_complaint_id": s.initial_complaint_id,
            "description": s.description
        }
        for s in scenarios
    ]

@router.get("/{scenario_id}")
def get_scenario_details(scenario_id: str, db: Session = Depends(get_db)):
    """Get full narrative, key entities, and expected connections for a scenario."""
    scenario = db.query(DemoScenario).filter(DemoScenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    return {
        "id": scenario.id,
        "title": scenario.title,
        "subtitle": scenario.subtitle,
        "theme": scenario.theme,
        "initial_complaint_id": scenario.initial_complaint_id,
        "description": scenario.description,
        "key_entities": json.loads(scenario.key_entities),
        "expected_connections": json.loads(scenario.expected_connections),
        "investigation_takeaway": scenario.investigation_takeaway,
        "suggested_actions": json.loads(scenario.suggested_actions)
    }
