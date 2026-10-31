from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from backend.app.database import get_db
from backend.app.intelligence.graph_engine import generate_network_graph
from backend.app.models import FraudCluster
from backend.app.schemas import GraphDataResponse

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("", response_model=GraphDataResponse)
def get_graph(
    focus_complaint_id: Optional[str] = None,
    filter_entity_types: Optional[List[str]] = Query(None),
    min_strength: float = Query(0.0, ge=0.0, le=1.0),
    cluster_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get interactive network graph data with dynamic node and edge properties,
    community clusters, and inspector metadata.
    """
    return generate_network_graph(
        db=db,
        focus_complaint_id=focus_complaint_id,
        filter_entity_types=filter_entity_types,
        min_strength=min_strength,
        cluster_id=cluster_id
    )

@router.get("/clusters")
def list_clusters(db: Session = Depends(get_db)):
    """List all detected organized fraud clusters and syndicates."""
    clusters = db.query(FraudCluster).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "modus_operandi": c.modus_operandi,
            "threat_level": c.threat_level,
            "total_loss": c.total_loss,
            "complaint_count": c.complaint_count,
            "entity_count": c.entity_count,
            "recommended_action": c.recommended_action
        }
        for c in clusters
    ]
