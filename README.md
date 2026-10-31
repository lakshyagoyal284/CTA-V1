# CyberTrace AI

**Cross-Complaint Cyber-Fraud Intelligence and Financial Crime Network Detection Platform**

[![Seva Innovation Challenge](https://img.shields.io/badge/Challenge-Seva%20Innovation%20Challenge-blue.svg)](https://example.com)
[![Sector](https://img.shields.io/badge/Sector-Sector%202%3A%20Law%20%26%20Order-emerald.svg)](https://example.com)
[![Sub-theme](https://img.shields.io/badge/Sub--theme-Cyber--Fraud%20Intelligence-purple.svg)](https://example.com)
[![Build Status](https://img.shields.io/badge/Build-Passing%20(7%2F7%20Tests)-brightgreen.svg)](https://example.com)
[![Benchmark F1](https://img.shields.io/badge/Benchmark%20F1-95.7%25-cyan.svg)](https://example.com)

---

## Central Innovation: Cross-Complaint Cybercrime Intelligence

Traditional police portals and cyber cells record complaints in silos: an investigator in Mumbai receives a complaint for ₹85,000 lost in a Telegram task scam, an investigator in Delhi receives a complaint for ₹1,40,000, and an investigator in Bengaluru receives a complaint for ₹2,10,000. Each treats their complaint as an isolated, low-priority petty fraud case.

**CyberTrace AI breaks these jurisdictional silos.**

By automatically extracting, normalizing, and cross-referencing digital identifiers (UPI VPAs, phone numbers, mule bank accounts, phishing domains, and Telegram handles), CyberTrace AI connects seemingly unrelated complaints into unified, interstate cybercrime syndicates with explainable multi-hop linkage and court-admissible dossiers.

---

## Key Features

1. **Deterministic Identifier Extraction & Normalisation**:
   - Indian phone numbers normalized to `+91-XXXXX-XXXXX`
   - UPI Virtual Payment Addresses (VPAs) with web-domain filtering
   - Bare and protocol phishing URLs & domains
   - Contextual bank account numbers & IFSC branch codes
   - Telegram handles and Crypto wallet addresses (ETH, BTC, TRON)
2. **Multi-Hop Graph Discovery**:
   - 1-Hop direct matches (shared identifier)
   - 2-Hop inferred matches (connecting Complaint A to Complaint C via intermediary Complaint B)
   - Unedited, human-readable explanations for every single edge
3. **Dedicated Intelligence Discovery Investigation Workflow**:
   - Step-by-step workflow with prominent **"Discover Related Fraud Cases"** button
4. **Interactive 60 FPS Network Graph Explorer**:
   - HTML5 Canvas force-directed simulation
   - 8 distinct node types with custom geometry and glowing auras
   - Node Inspector drawer displaying occurrence frequency and linked financial transactions
5. **Explainable Risk Assessment & 4-Tier Evidence Separation**:
   - Composite risk score (0-100) based on 4 weighted factors (100% total)
   - Strict legal evidence separation: Tier A (Reported), Tier B (Automated), Tier C (Inferred), Tier D (Human-Verified)
   - Actionable statutory advice (Section 91 CrPC bank freezes, Telecom CDR requisitions, CERT-In takedowns)
   - Ethical terminology compliance: strictly "suspicious indicator", never prejudicial criminal labels
6. **Evaluator Demonstration Mode**:
   - 3 pre-configured national scenarios (UPI Task Scam Ring, Electricity Phishing Gateway, Digital Extortion & Arrest Ring)
   - Interactive Guided Walkthrough with step progression
7. **Measurable Performance Indicators & Live Benchmark**:
   - Python evaluation script (`backend/evaluate_engine.py`) against 25 labeled test cases (`data/evaluation_benchmark.json`)
   - Measured F1: **95.7%**, Classification Accuracy: **100.0%**, Clustering ARI: **85.6%**, Latency: **0.22 ms**
8. **Official PDF Case Dossier Export**:
   - High-fidelity ReportLab PDF generation with supervisory signature endorsement blocks
9. **Complaint Intake with Real-Time NLP Typing Preview**:
   - Live extraction and MO prediction as the officer types

---

## Quickstart Instructions

### 1. Backend Service (FastAPI)
```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
# API active at http://127.0.0.1:8000
# Interactive Swagger docs at http://127.0.0.1:8000/docs
```

### 2. Frontend Application (React + Vite)
```powershell
cd frontend
npm install
npm run dev
# Web application active at http://127.0.0.1:3000
```

### 3. Run Benchmark Evaluation
```powershell
python backend/evaluate_engine.py
```

### 4. Run Pytest Suite
```powershell
python -m pytest backend/tests/test_intelligence.py -v
```

---

## Project Audit & Compliance

Refer to [`PROJECT_AUDIT.md`](file:///c:/Users/laksh/Desktop/CTA/PROJECT_AUDIT.md) for the complete 10-pillar specification verification and methodology documentation.
