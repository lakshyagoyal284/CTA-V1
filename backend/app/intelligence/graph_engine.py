from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import networkx as nx
from backend.app.models import Complaint, ExtractedEntity, FinancialTransaction, FraudCluster

NODE_TYPE_CONFIG = {
    "COMPLAINT": {
        "color": "#38bdf8",  # Sky blue
        "shape": "hexagon",
        "icon": "shield-alert"
    },
    "UPI": {
        "color": "#a855f7",  # Purple
        "shape": "diamond",
        "icon": "credit-card"
    },
    "PHONE": {
        "color": "#f59e0b",  # Amber
        "shape": "circle",
        "icon": "phone-call"
    },
    "BANK_ACCOUNT": {
        "color": "#10b981",  # Emerald
        "shape": "square",
        "icon": "landmark"
    },
    "IFSC": {
        "color": "#06b6d4",  # Cyan
        "shape": "square",
        "icon": "git-branch"
    },
    "URL": {
        "color": "#f43f5e",  # Rose
        "shape": "triangle",
        "icon": "globe"
    },
    "EMAIL": {
        "color": "#6366f1",  # Indigo
        "shape": "circle",
        "icon": "mail"
    },
    "TELEGRAM": {
        "color": "#0ea5e9",  # Sky
        "shape": "star",
        "icon": "send"
    },
    "CRYPTO_WALLET": {
        "color": "#eab308",  # Yellow
        "shape": "polygon",
        "icon": "coins"
    }
}

def generate_network_graph(
    db: Session,
    focus_complaint_id: Optional[str] = None,
    filter_entity_types: Optional[List[str]] = None,
    min_strength: float = 0.0,
    cluster_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate an interactive, rich heterogeneous network graph containing:
    - Complaint Nodes
    - Entity / Digital Indicator Nodes
    - Direct and Multi-hop Edges with weights, timestamps, and explanations
    - Node inspector properties (connected cases, transactions, flagged reasons)
    - Dynamic cluster community detection via NetworkX
    """
    G = nx.Graph()

    # Query complaints
    complaints_query = db.query(Complaint)
    if cluster_id:
        complaints_query = complaints_query.filter(Complaint.cluster_id == cluster_id)
    complaints = complaints_query.all()
    complaint_dict = {c.id: c for c in complaints}

    # Query all extracted entities
    entities_query = db.query(ExtractedEntity)
    if filter_entity_types:
        entities_query = entities_query.filter(ExtractedEntity.entity_type.in_(filter_entity_types))
    entities = entities_query.all()

    # Query all transactions
    transactions = db.query(FinancialTransaction).all()
    tx_by_entity = {}
    for tx in transactions:
        tx_by_entity.setdefault(tx.beneficiary_identifier.lower(), []).append({
            "ref": tx.transaction_ref,
            "amount": tx.amount,
            "channel": tx.channel,
            "bank": tx.beneficiary_bank,
            "timestamp": tx.timestamp.isoformat()
        })

    # Group entities by normalized value to identify recurrence frequency
    entity_frequency = {}
    entity_complaints = {}
    entity_records = {}

    for ent in entities:
        norm = ent.normalized_value
        entity_frequency[norm] = entity_frequency.get(norm, 0) + 1
        entity_complaints.setdefault(norm, set()).add(ent.complaint_id)
        if norm not in entity_records:
            entity_records[norm] = ent

    # Build Graph Nodes
    nodes = []
    node_ids = set()

    # Add Complaint Nodes
    for c in complaints:
        # If focusing on a specific complaint, we can include it and its immediate neighbors
        node_data = {
            "id": c.id,
            "label": f"{c.id} ({c.victim_name.split()[0]})",
            "type": "COMPLAINT",
            "category": c.category,
            "victim_name": c.victim_name,
            "victim_city": c.victim_city,
            "victim_state": c.victim_state,
            "loss_amount": c.loss_amount,
            "status": c.status,
            "cluster_id": c.cluster_id,
            "incident_date": c.incident_date.isoformat(),
            "is_focus": (c.id == focus_complaint_id),
            "color": "#38bdf8" if c.id != focus_complaint_id else "#ec4899",
            "shape": "hexagon",
            "radius": 24 if c.id == focus_complaint_id else 18,
            "details": {
                "acknowledgement_no": c.acknowledgement_no,
                "assigned_officer": c.assigned_officer,
                "description": c.description
            }
        }
        nodes.append(node_data)
        node_ids.add(c.id)
        G.add_node(c.id, node_type="COMPLAINT")

    # Add Entity Indicator Nodes
    for norm, ent in entity_records.items():
        linked_cids = list(entity_complaints.get(norm, set()))
        # Only add if at least one complaint is present in nodes
        if not any(cid in node_ids for cid in linked_cids):
            continue

        freq = entity_frequency.get(norm, 1)
        cfg = NODE_TYPE_CONFIG.get(ent.entity_type, {
            "color": "#94a3b8", "shape": "circle", "icon": "help-circle"
        })

        is_recurrent = freq > 1
        ent_node_id = f"ENT::{ent.entity_type}::{norm}"
        
        related_txs = tx_by_entity.get(norm.lower(), [])

        node_data = {
            "id": ent_node_id,
            "label": norm if len(norm) <= 24 else f"{norm[:22]}...",
            "full_value": norm,
            "type": ent.entity_type,
            "category": f"Suspicious {ent.entity_type} Indicator",
            "frequency": freq,
            "is_recurrent": is_recurrent,
            "confidence": ent.confidence,
            "flagged_reason": ent.flagged_reason or "Suspicious digital indicator extracted from complaint narrative",
            "first_observed": ent.first_observed.isoformat(),
            "last_observed": ent.last_observed.isoformat(),
            "connected_complaints": linked_cids,
            "connection_count": len(linked_cids),
            "related_transactions": related_txs,
            "color": cfg["color"],
            "shape": cfg["shape"],
            "radius": 14 + min(16, freq * 4)  # Larger nodes for recurrent indicators
        }
        nodes.append(node_data)
        node_ids.add(ent_node_id)
        G.add_node(ent_node_id, node_type=ent.entity_type)

    # Build Graph Edges (Complaint <-> Entity)
    edges = []
    edge_seen = set()

    for ent in entities:
        norm = ent.normalized_value
        ent_node_id = f"ENT::{ent.entity_type}::{norm}"
        
        if ent.complaint_id in node_ids and ent_node_id in node_ids:
            edge_key = tuple(sorted([ent.complaint_id, ent_node_id]))
            if edge_key not in edge_seen:
                edge_seen.add(edge_key)
                
                # Check if financial transaction exists
                has_tx = any(tx["ref"] for tx in tx_by_entity.get(norm.lower(), []))
                edge_type = "FINANCIAL_FLOW" if has_tx and ent.entity_type in ["UPI", "BANK_ACCOUNT"] else "INDICATOR_REFERENCE"
                
                edge_data = {
                    "id": f"e::{ent.complaint_id}::{ent_node_id}",
                    "source": ent.complaint_id,
                    "target": ent_node_id,
                    "edge_type": edge_type,
                    "label": "Beneficiary Payee" if edge_type == "FINANCIAL_FLOW" else "Observed Identifier",
                    "style": "solid",
                    "weight": 0.85 if edge_type == "FINANCIAL_FLOW" else 0.65,
                    "color": "#10b981" if edge_type == "FINANCIAL_FLOW" else "#64748b"
                }
                edges.append(edge_data)
                G.add_edge(ent.complaint_id, ent_node_id, weight=edge_data["weight"])

    # Build Direct Complaint-to-Complaint Syndicate Edges (Cross-Complaint Links)
    complaint_pairs = {}
    for norm, cids in entity_complaints.items():
        if len(cids) > 1:
            ent = entity_records[norm]
            cid_list = sorted(list(cids))
            for i in range(len(cid_list)):
                for j in range(i + 1, len(cid_list)):
                    pair = (cid_list[i], cid_list[j])
                    complaint_pairs.setdefault(pair, []).append({
                        "type": ent.entity_type,
                        "value": norm
                    })

    for (c1, c2), shared in complaint_pairs.items():
        if c1 in node_ids and c2 in node_ids:
            edge_id = f"link::{c1}::{c2}"
            if edge_id not in edge_seen:
                edge_seen.add(edge_id)
                comp1 = complaint_dict.get(c1)
                comp2 = complaint_dict.get(c2)
                
                mo_match = comp1.category == comp2.category if comp1 and comp2 else False
                shared_str = ", ".join([f"{s['type']}: {s['value']}" for s in shared])

                edge_data = {
                    "id": edge_id,
                    "source": c1,
                    "target": c2,
                    "edge_type": "DIRECT_MATCH",
                    "label": f"Shared {shared[0]['type']}",
                    "shared_count": len(shared),
                    "shared_summary": shared_str,
                    "mo_match": mo_match,
                    "style": "solid",
                    "weight": 0.90,
                    "color": "#f43f5e",  # Rose high-alert
                    "explanation": f"Complaints {c1} and {c2} directly linked through common digital indicator(s): {shared_str}."
                }
                edges.append(edge_data)

    # Detect Communities / Clusters using Connected Components
    # We find connected components of complaint nodes
    complaint_subgraph = nx.Graph()
    for (c1, c2) in complaint_pairs.keys():
        complaint_subgraph.add_edge(c1, c2)

    clusters = []
    cluster_idx = 1
    for comp in nx.connected_components(complaint_subgraph):
        comp_list = list(comp)
        if len(comp_list) >= 2:
            cluster_c_objs = [complaint_dict[cid] for cid in comp_list if cid in complaint_dict]
            total_loss = sum(c.loss_amount for c in cluster_c_objs)
            categories = list(set(c.category for c in cluster_c_objs))
            
            # Extract common shared identifiers in this cluster
            cluster_entities = set()
            for cid in comp_list:
                for ent in entities:
                    if ent.complaint_id == cid and ent.entity_type != "IFSC":
                        if entity_frequency.get(ent.normalized_value, 0) > 1:
                            cluster_entities.add(f"{ent.entity_type}: {ent.normalized_value}")

            clusters.append({
                "cluster_id": f"SYNDICATE-{cluster_idx:02d}",
                "name": f"Syndicate Cluster {cluster_idx:02d} ({categories[0] if categories else 'Cross-Complaint Fraud'})",
                "complaints": comp_list,
                "complaint_count": len(comp_list),
                "total_loss": total_loss,
                "categories": categories,
                "key_indicators": list(cluster_entities)[:5],
                "threat_level": "CRITICAL" if total_loss > 100000 or len(comp_list) >= 3 else "HIGH"
            })
            cluster_idx += 1

    # Filter by focus complaint if specified
    if focus_complaint_id:
        # Find 1-hop and 2-hop neighbor nodes from G
        if focus_complaint_id in G:
            one_hop = set(G.neighbors(focus_complaint_id))
            two_hop = set()
            for n in one_hop:
                two_hop.update(G.neighbors(n))
            relevant_nodes = {focus_complaint_id} | one_hop | two_hop
            
            filtered_nodes = [n for n in nodes if n["id"] in relevant_nodes]
            filtered_edges = [
                e for e in edges
                if e["source"] in relevant_nodes and e["target"] in relevant_nodes
            ]
            return {
                "nodes": filtered_nodes,
                "edges": filtered_edges,
                "clusters": clusters,
                "stats": {
                    "total_nodes": len(filtered_nodes),
                    "total_edges": len(filtered_edges),
                    "complaints_shown": sum(1 for n in filtered_nodes if n["type"] == "COMPLAINT"),
                    "indicators_shown": sum(1 for n in filtered_nodes if n["type"] != "COMPLAINT"),
                    "detected_clusters": len(clusters)
                }
            }

    return {
        "nodes": nodes,
        "edges": edges,
        "clusters": clusters,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "total_complaints": len(complaints),
            "total_indicators": len(entity_records),
            "recurrent_indicators": sum(1 for f in entity_frequency.values() if f > 1),
            "detected_clusters": len(clusters)
        }
    }
