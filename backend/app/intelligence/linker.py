from datetime import datetime
from typing import List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from backend.app.models import Complaint, ExtractedEntity, ComplaintLink
from backend.app.intelligence.extractor import classify_modus_operandi

# Weights for different entity types when computing link strength
ENTITY_WEIGHTS = {
    "BANK_ACCOUNT": 0.45,
    "UPI": 0.40,
    "PHONE": 0.35,
    "CRYPTO_WALLET": 0.40,
    "URL": 0.25,
    "EMAIL": 0.20,
    "TELEGRAM": 0.25,
    "IFSC": 0.10  # IFSC alone is low weight because branches are shared
}

def calculate_relationship_strength(
    shared_entities: List[Dict[str, str]],
    mo_match: bool,
    days_apart: int,
    is_direct: bool = True,
    hop_count: int = 1
) -> Dict[str, Any]:
    """
    Calculate an explainable relationship strength score (0.0 to 1.0)
    between two complaints based on shared digital identifiers, M.O., and temporal proximity.
    """
    score = 0.0
    breakdown = []

    # 1. Identifier contribution
    entity_contrib = 0.0
    for entity in shared_entities:
        etype = entity.get("entity_type", "")
        base_w = ENTITY_WEIGHTS.get(etype, 0.20)
        entity_contrib += base_w
        breakdown.append(f"Shared {etype} indicator ({entity.get('normalized_value', '')}) adds +{int(base_w*100)}% base link strength")

    # Diminishing returns on multiple shared identifiers
    entity_contrib = min(0.65, entity_contrib)
    score += entity_contrib

    # 2. Modus Operandi alignment
    if mo_match:
        score += 0.20
        breakdown.append("Identical Modus Operandi pattern detected adds +20% behavioral correlation")
    else:
        breakdown.append("Different reported crime category (-0% behavioral correlation)")

    # 3. Temporal proximity
    if days_apart <= 7:
        score += 0.15
        breakdown.append(f"Temporal cluster: incidents occurred within {days_apart} days (+15% temporal proximity)")
    elif days_apart <= 30:
        score += 0.10
        breakdown.append(f"Temporal cluster: incidents occurred within {days_apart} days (+10% temporal proximity)")
    elif days_apart <= 90:
        score += 0.05
        breakdown.append(f"Incident occurred within {days_apart} days (+5% temporal proximity)")
    else:
        breakdown.append(f"Incidents separated by {days_apart} days (historical indicator persistence)")

    # 4. Multi-hop decay
    if not is_direct or hop_count > 1:
        hop_penalty = 0.70 ** (hop_count - 1)
        prev_score = score
        score = score * hop_penalty
        breakdown.append(f"Multi-hop indirect linkage penalty applied: {hop_count} hops (decay factor {round(hop_penalty, 2)})")

    final_score = max(0.15, min(0.99, score))
    
    if final_score >= 0.75:
        strength_tier = "CRITICAL_CORRELATION"
    elif final_score >= 0.50:
        strength_tier = "HIGH_CORRELATION"
    elif final_score >= 0.30:
        strength_tier = "MODERATE_CORRELATION"
    else:
        strength_tier = "LOW_PROBABILITY_CORRELATION"

    return {
        "score": round(final_score, 3),
        "percentage": int(final_score * 100),
        "tier": strength_tier,
        "is_direct": is_direct,
        "hop_count": hop_count,
        "breakdown": breakdown
    }

def discover_cross_complaint_connections(
    complaint_id: str,
    db: Session,
    max_hops: int = 2
) -> Dict[str, Any]:
    """
    Perform deep cross-complaint discovery for a designated complaint:
    1. Retrieve primary complaint and its extracted entities.
    2. Search entire database for matching digital indicators.
    3. Discover 1-hop direct connections.
    4. Discover 2-hop inferred connections through bridge complaints.
    5. Compute explainable relationship strength and generate human narratives.
    """
    primary = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not primary:
        return {"error": f"Complaint {complaint_id} not found", "direct_links": [], "inferred_links": []}

    primary_entities = db.query(ExtractedEntity).filter(ExtractedEntity.complaint_id == complaint_id).all()
    primary_entity_map = {e.normalized_value: e for e in primary_entities}

    # Step A: 1-Hop Direct Links via shared entities
    direct_links = []
    direct_connected_complaint_ids = set()

    for p_ent in primary_entities:
        # Ignore IFSC codes as sole direct link criteria (too many false positives)
        if p_ent.entity_type == "IFSC":
            continue

        matches = db.query(ExtractedEntity).filter(
            ExtractedEntity.normalized_value == p_ent.normalized_value,
            ExtractedEntity.complaint_id != complaint_id
        ).all()

        for match in matches:
            target_complaint = db.query(Complaint).filter(Complaint.id == match.complaint_id).first()
            if not target_complaint:
                continue

            direct_connected_complaint_ids.add(target_complaint.id)

            # Check if link already recorded in this batch
            existing = next((l for l in direct_links if l["target_complaint_id"] == target_complaint.id), None)
            
            shared_info = {
                "entity_type": p_ent.entity_type,
                "raw_value": p_ent.raw_value,
                "normalized_value": p_ent.normalized_value
            }

            days_apart = abs((primary.incident_date - target_complaint.incident_date).days)
            mo_match = primary.category == target_complaint.category

            if existing:
                existing["shared_entities"].append(shared_info)
                # Recalculate strength with additional shared entity
                strength = calculate_relationship_strength(
                    existing["shared_entities"],
                    mo_match,
                    days_apart,
                    is_direct=True,
                    hop_count=1
                )
                existing["relationship_strength"] = strength["score"]
                existing["strength_percentage"] = strength["percentage"]
                existing["strength_tier"] = strength["tier"]
                existing["strength_breakdown"] = strength["breakdown"]
                existing["explanation"] = (
                    f"Direct link confirmed: Complaints {primary.id} and {target_complaint.id} share "
                    f"{len(existing['shared_entities'])} common suspicious digital indicators "
                    f"({', '.join([f'{s['entity_type']}: {s['normalized_value']}' for s in existing['shared_entities']])})."
                )
            else:
                strength = calculate_relationship_strength(
                    [shared_info],
                    mo_match,
                    days_apart,
                    is_direct=True,
                    hop_count=1
                )

                explanation = (
                    f"Direct link confirmed: Complaint {primary.id} (victim: {primary.victim_name}) and "
                    f"Complaint {target_complaint.id} (victim: {target_complaint.victim_name}) share identical "
                    f"suspicious indicator {p_ent.entity_type} ({p_ent.normalized_value})."
                )

                direct_links.append({
                    "source_complaint_id": primary.id,
                    "target_complaint_id": target_complaint.id,
                    "target_complaint_acknowledgement": target_complaint.acknowledgement_no,
                    "target_victim_name": target_complaint.victim_name,
                    "target_victim_city": target_complaint.victim_city,
                    "target_victim_state": target_complaint.victim_state,
                    "target_category": target_complaint.category,
                    "target_loss_amount": target_complaint.loss_amount,
                    "target_status": target_complaint.status,
                    "target_incident_date": target_complaint.incident_date.isoformat(),
                    "link_type": "DIRECT_MATCH",
                    "hop_count": 1,
                    "shared_entities": [shared_info],
                    "relationship_strength": strength["score"],
                    "strength_percentage": strength["percentage"],
                    "strength_tier": strength["tier"],
                    "strength_breakdown": strength["breakdown"],
                    "explanation": explanation,
                    "intermediate_path": [primary.id, f"{p_ent.entity_type}:{p_ent.normalized_value}", target_complaint.id]
                })

    # Step B: 2-Hop Inferred Links (Intermediate bridge complaint)
    # primary -> (shared_entity_1) -> bridge_complaint -> (shared_entity_2) -> tertiary_complaint
    inferred_links = []
    seen_inferred_targets = set(direct_connected_complaint_ids)
    seen_inferred_targets.add(primary.id)

    if max_hops >= 2:
        for direct in direct_links:
            bridge_id = direct["target_complaint_id"]
            bridge_complaint = db.query(Complaint).filter(Complaint.id == bridge_id).first()
            if not bridge_complaint:
                continue

            bridge_entities = db.query(ExtractedEntity).filter(
                ExtractedEntity.complaint_id == bridge_id
            ).all()

            for b_ent in bridge_entities:
                if b_ent.entity_type == "IFSC":
                    continue
                # Skip entities already shared directly with primary
                if b_ent.normalized_value in primary_entity_map:
                    continue

                # Find complaints connected to bridge through b_ent
                second_hop_matches = db.query(ExtractedEntity).filter(
                    ExtractedEntity.normalized_value == b_ent.normalized_value,
                    ExtractedEntity.complaint_id != bridge_id,
                    ExtractedEntity.complaint_id != primary.id
                ).all()

                for m in second_hop_matches:
                    tertiary_id = m.complaint_id
                    if tertiary_id in seen_inferred_targets:
                        continue
                    seen_inferred_targets.add(tertiary_id)

                    tertiary_complaint = db.query(Complaint).filter(Complaint.id == tertiary_id).first()
                    if not tertiary_complaint:
                        continue

                    # Shared entity 1 (primary to bridge)
                    e1 = direct["shared_entities"][0]
                    # Shared entity 2 (bridge to tertiary)
                    e2 = {
                        "entity_type": b_ent.entity_type,
                        "raw_value": b_ent.raw_value,
                        "normalized_value": b_ent.normalized_value
                    }

                    days_apart = abs((primary.incident_date - tertiary_complaint.incident_date).days)
                    mo_match = primary.category == tertiary_complaint.category

                    strength = calculate_relationship_strength(
                        [e1, e2],
                        mo_match,
                        days_apart,
                        is_direct=False,
                        hop_count=2
                    )

                    explanation = (
                        f"Inferred 2-hop syndicate link: Complaint {primary.id} connects to intermediate Complaint "
                        f"{bridge_id} via {e1['entity_type']} ({e1['normalized_value']}), which in turn links to "
                        f"Complaint {tertiary_id} via {e2['entity_type']} ({e2['normalized_value']}). "
                        f"Indicates probable coordinated infrastructure operation across victims."
                    )

                    inferred_links.append({
                        "source_complaint_id": primary.id,
                        "target_complaint_id": tertiary_id,
                        "target_complaint_acknowledgement": tertiary_complaint.acknowledgement_no,
                        "target_victim_name": tertiary_complaint.victim_name,
                        "target_victim_city": tertiary_complaint.victim_city,
                        "target_victim_state": tertiary_complaint.victim_state,
                        "target_category": tertiary_complaint.category,
                        "target_loss_amount": tertiary_complaint.loss_amount,
                        "target_status": tertiary_complaint.status,
                        "target_incident_date": tertiary_complaint.incident_date.isoformat(),
                        "bridge_complaint_id": bridge_id,
                        "bridge_victim_name": bridge_complaint.victim_name,
                        "link_type": "MULTI_HOP_MATCH",
                        "hop_count": 2,
                        "shared_entities": [e1, e2],
                        "relationship_strength": strength["score"],
                        "strength_percentage": strength["percentage"],
                        "strength_tier": strength["tier"],
                        "strength_breakdown": strength["breakdown"],
                        "explanation": explanation,
                        "intermediate_path": [
                            primary.id,
                            f"{e1['entity_type']}:{e1['normalized_value']}",
                            bridge_id,
                            f"{e2['entity_type']}:{e2['normalized_value']}",
                            tertiary_id
                        ]
                    })

    # Summary analytics
    all_connected_complaint_ids = list(direct_connected_complaint_ids | (seen_inferred_targets - {primary.id}))
    all_losses = [primary.loss_amount]
    if all_connected_complaint_ids:
        connected_complaints = db.query(Complaint).filter(Complaint.id.in_(all_connected_complaint_ids)).all()
        all_losses.extend([c.loss_amount for c in connected_complaints])

    total_syndicate_loss = sum(all_losses)
    total_victims_linked = len(all_connected_complaint_ids) + 1

    return {
        "primary_complaint": {
            "id": primary.id,
            "acknowledgement_no": primary.acknowledgement_no,
            "victim_name": primary.victim_name,
            "victim_city": primary.victim_city,
            "victim_state": primary.victim_state,
            "category": primary.category,
            "loss_amount": primary.loss_amount,
            "incident_date": primary.incident_date.isoformat(),
            "status": primary.status,
            "description": primary.description
        },
        "extracted_entities": [
            {
                "id": e.id,
                "entity_type": e.entity_type,
                "raw_value": e.raw_value,
                "normalized_value": e.normalized_value,
                "confidence": e.confidence,
                "flagged_reason": e.flagged_reason,
                "context_snippet": e.context_snippet
            }
            for e in primary_entities
        ],
        "direct_links": direct_links,
        "inferred_links": inferred_links,
        "metrics": {
            "direct_matches_count": len(direct_links),
            "inferred_matches_count": len(inferred_links),
            "total_victims_linked": total_victims_linked,
            "total_syndicate_loss": total_syndicate_loss,
            "unique_indicators_count": len(primary_entities)
        }
    }
