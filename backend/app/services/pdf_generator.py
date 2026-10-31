import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_investigation_dossier_pdf(complaint: dict, discovery: dict, risk: dict) -> bytes:
    """
    Generate an official, high-fidelity Law Enforcement Investigation Dossier PDF
    with ReportLab, incorporating 4-tier evidence breakdown, cross-complaint connections,
    and recommended statutory actions.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )
    
    sub_title_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0284c7')
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569')
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )
    
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>CYBERTRACE AI</b> | Law Enforcement Intelligence Dossier", title_style),
            Paragraph("CONFIDENTIAL // RESTRICTED<br/>FOR OFFICIAL USE ONLY", ParagraphStyle('Warn', parent=meta_style, textColor=colors.HexColor('#b91c1c'), fontName='Helvetica-Bold', alignment=2))
        ],
        [
            Paragraph("<b>Cross-Complaint Cyber-Fraud & Financial Crime Network Detection Platform</b><br/>Seva Innovation Challenge | Sector 2 – Law and Order (Sub-theme 2)", sub_title_style),
            Paragraph(f"Generated: {datetime.utcnow().strftime('%d-%b-%Y %H:%M UTC')}<br/>Case Ref: <b>{complaint.get('id', 'N/A')}</b>", meta_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[380, 160])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceBefore=8, spaceAfter=12))

    # 2. Executive Case Overview Table
    comp_info = [
        [
            Paragraph("<b>Complaint ID:</b>", body_style), Paragraph(complaint.get('id', ''), body_style),
            Paragraph("<b>Acknowledgement No:</b>", body_style), Paragraph(complaint.get('acknowledgement_no', ''), body_style)
        ],
        [
            Paragraph("<b>Complainant Name:</b>", body_style), Paragraph(complaint.get('victim_name', ''), body_style),
            Paragraph("<b>Jurisdiction:</b>", body_style), Paragraph(f"{complaint.get('victim_city', '')}, {complaint.get('victim_state', '')}", body_style)
        ],
        [
            Paragraph("<b>Reported Loss:</b>", body_style), Paragraph(f"₹{complaint.get('loss_amount', 0):,.2f}", ParagraphStyle('Loss', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#b91c1c'))),
            Paragraph("<b>Crime Category:</b>", body_style), Paragraph(complaint.get('category', ''), body_style)
        ],
        [
            Paragraph("<b>Incident Date:</b>", body_style), Paragraph(complaint.get('incident_date', '')[:10], body_style),
            Paragraph("<b>Assigned Officer:</b>", body_style), Paragraph(complaint.get('assigned_officer', 'Cyber Cell'), body_style)
        ]
    ]
    t_case = Table(comp_info, colWidths=[110, 160, 120, 150])
    t_case.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_case)
    story.append(Spacer(1, 10))

    # 3. Explainable Risk Score Card
    risk_score = risk.get('overall_score', 0)
    risk_tier = risk.get('risk_category', 'UNKNOWN')
    risk_color = colors.HexColor(risk.get('risk_color', '#ef4444'))

    risk_table_data = [
        [
            Paragraph(f"<b>OVERALL SYNDICATE RISK: {risk_score}/100</b>", ParagraphStyle('RTitle', fontName='Helvetica-Bold', fontSize=12, textColor=colors.white)),
            Paragraph(f"<b>TIER: {risk_tier}</b>", ParagraphStyle('RTier', fontName='Helvetica-Bold', fontSize=11, textColor=colors.white, alignment=2))
        ]
    ]
    t_risk = Table(risk_table_data, colWidths=[360, 180])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), risk_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 10))

    # 4. Extracted Digital Indicators Table
    story.append(Paragraph("1. Extracted Digital Indicators (Automated Machine Extraction)", section_heading))
    ent_rows = [
        [
            Paragraph("<b>Type</b>", meta_style),
            Paragraph("<b>Normalized Identifier</b>", meta_style),
            Paragraph("<b>Confidence</b>", meta_style),
            Paragraph("<b>Flagged Context / Reason</b>", meta_style)
        ]
    ]
    for ent in discovery.get('extracted_entities', []):
        ent_rows.append([
            Paragraph(ent.get('entity_type', ''), body_style),
            Paragraph(f"<b>{ent.get('normalized_value', '')}</b>", body_style),
            Paragraph(f"{int(ent.get('confidence', 0)*100)}%", body_style),
            Paragraph(ent.get('flagged_reason', ''), ParagraphStyle('FR', parent=body_style, fontSize=8, leading=10))
        ])
    
    if len(ent_rows) == 1:
        ent_rows.append([Paragraph("No indicators extracted", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)])

    t_ent = Table(ent_rows, colWidths=[70, 150, 60, 260])
    t_ent.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_ent)
    story.append(Spacer(1, 10))

    # 5. Cross-Complaint & Multi-Hop Connections
    story.append(Paragraph("2. Cross-Complaint Intelligence & Network Linkage", section_heading))
    direct_links = discovery.get('direct_links', [])
    inferred_links = discovery.get('inferred_links', [])

    if direct_links or inferred_links:
        link_rows = [
            [
                Paragraph("<b>Link Type</b>", meta_style),
                Paragraph("<b>Connected Case</b>", meta_style),
                Paragraph("<b>Victim & Location</b>", meta_style),
                Paragraph("<b>Shared Identifier / Pathway</b>", meta_style),
                Paragraph("<b>Strength</b>", meta_style)
            ]
        ]
        for dl in direct_links:
            shared_text = ", ".join([f"{s['entity_type']}: {s['normalized_value']}" for s in dl.get('shared_entities', [])])
            link_rows.append([
                Paragraph("<b>DIRECT (1-Hop)</b>", ParagraphStyle('DLink', parent=body_style, textColor=colors.HexColor('#0284c7'))),
                Paragraph(f"<b>{dl.get('target_complaint_id')}</b>", body_style),
                Paragraph(f"{dl.get('target_victim_name')}<br/>{dl.get('target_victim_city')}, {dl.get('target_victim_state')}", ParagraphStyle('Vic', parent=body_style, fontSize=8, leading=10)),
                Paragraph(shared_text, ParagraphStyle('ST', parent=body_style, fontSize=8, leading=10)),
                Paragraph(f"<b>{dl.get('strength_percentage')}%</b>", body_style)
            ])
        for inf in inferred_links:
            bridge = f"Via {inf.get('bridge_complaint_id')} ({inf.get('bridge_victim_name')})"
            link_rows.append([
                Paragraph("<b>INFERRED (2-Hop)</b>", ParagraphStyle('ILink', parent=body_style, textColor=colors.HexColor('#d97706'))),
                Paragraph(f"<b>{inf.get('target_complaint_id')}</b>", body_style),
                Paragraph(f"{inf.get('target_victim_name')}<br/>{inf.get('target_victim_city')}, {inf.get('target_victim_state')}", ParagraphStyle('Vic', parent=body_style, fontSize=8, leading=10)),
                Paragraph(f"{bridge}<br/>{' -> '.join(inf.get('intermediate_path', []))}", ParagraphStyle('ST', parent=body_style, fontSize=7, leading=9)),
                Paragraph(f"<b>{inf.get('strength_percentage')}%</b>", body_style)
            ])

        t_links = Table(link_rows, colWidths=[90, 75, 125, 200, 50])
        t_links.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(t_links)
    else:
        story.append(Paragraph("No cross-complaint connections identified in current database index.", body_style))

    story.append(Spacer(1, 10))

    # 6. Structured 4-Tier Evidence Breakdown
    story.append(Paragraph("3. 4-Tier Law Enforcement Evidence Separation", section_heading))
    four_tier = risk.get('four_tier_evidence', {})
    
    tier_colors = {
        'tier_a_reported': '#f1f5f9',
        'tier_b_automated': '#eff6ff',
        'tier_c_inferred': '#fef3c7',
        'tier_d_human_verified': '#ecfdf5'
    }

    for tier_key in ['tier_a_reported', 'tier_b_automated', 'tier_c_inferred', 'tier_d_human_verified']:
        t_data = four_tier.get(tier_key, {})
        items = t_data.get('items', [])
        content = "<br/>".join([f"• {it}" for it in items[:4]])
        
        tier_box = [
            [Paragraph(f"<b>{t_data.get('title', '')}</b>", ParagraphStyle('TB', parent=body_style, fontName='Helvetica-Bold'))],
            [Paragraph(content, ParagraphStyle('TC', parent=body_style, fontSize=8, leading=11))]
        ]
        t_tier = Table(tier_box, colWidths=[540])
        t_tier.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(tier_colors.get(tier_key, '#f8fafc'))),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_tier)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))

    # 7. Recommended Statutory Next Steps
    story.append(Paragraph("4. Recommended Immediate Law Enforcement Actions", section_heading))
    recs = risk.get('recommended_investigative_actions', [])
    if recs:
        rec_rows = [
            [
                Paragraph("<b>Statutory Action</b>", meta_style),
                Paragraph("<b>Priority SLA</b>", meta_style),
                Paragraph("<b>Authority</b>", meta_style),
                Paragraph("<b>Operative Guidance</b>", meta_style)
            ]
        ]
        for r in recs:
            rec_rows.append([
                Paragraph(f"<b>{r.get('action')}</b>", body_style),
                Paragraph(r.get('priority'), ParagraphStyle('Prio', parent=body_style, textColor=colors.HexColor('#b91c1c'), fontName='Helvetica-Bold')),
                Paragraph(r.get('authority'), body_style),
                Paragraph(r.get('details'), ParagraphStyle('OG', parent=body_style, fontSize=8, leading=10))
            ])
        t_recs = Table(rec_rows, colWidths=[130, 80, 110, 220])
        t_recs.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(t_recs)

    # 8. Signature Block
    story.append(Spacer(1, 14))
    sig_data = [
        [
            Paragraph("<b>Investigating Officer Endorsement:</b><br/>"
                      f"Name: {complaint.get('assigned_officer', 'Cyber Cell Officer')}<br/>"
                      "Unit: Specialized Cyber Crime Police Station<br/>"
                      "Signature: _______________________", body_style),
            Paragraph("<b>Supervisory Nodal Approval:</b><br/>"
                      "Superintendent of Police / Nodal Officer<br/>"
                      "State Cyber Crime Operations Command<br/>"
                      "Date & Seal: _____________________", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
