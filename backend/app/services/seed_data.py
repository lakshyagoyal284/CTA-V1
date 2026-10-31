from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    Complaint, ExtractedEntity, FinancialTransaction,
    ComplaintLink, FraudCluster, OfficerNote, DemoScenario
)
from backend.app.intelligence.extractor import extract_entities_from_text
from backend.app.intelligence.linker import discover_cross_complaint_connections

RAW_COMPLAINTS = [
    # --- SCENARIO 1: UPI FRAUD NETWORK (Task/Job Scam Ring) ---
    {
        "id": "C-101",
        "acknowledgement_no": "NCRP-2024-771029",
        "victim_name": "Ananya Sharma",
        "victim_state": "Maharashtra",
        "victim_city": "Mumbai",
        "incident_date": datetime.utcnow() - timedelta(days=6),
        "category": "Task / Job Scam",
        "loss_amount": 85000.0,
        "description": (
            "Victim was approached on Telegram by handle @vikram_ratings_bot offering part-time earnings "
            "for liking YouTube videos. After paying initial profit of Rs 500, victim was added to VIP task group. "
            "Victim was coerced into transferring Rs 85,000 to beneficiary UPI ID taskpay.merchant88@okhdfcbank. "
            "Suspect handler contacted victim via mobile number +91-98201-44719 claiming additional payment was needed "
            "to unfreeze merchant dashboard credit."
        ),
        "status": "Action Initiated",
        "assigned_officer": "Insp. Rajesh Kumar (Cyber Cell BKC)",
        "cluster_id": "SYNDICATE-01",
        "transactions": [
            {"ref": "UPI/412984920192", "amount": 25000.0, "channel": "UPI", "beneficiary": "taskpay.merchant88@okhdfcbank", "bank": "HDFC Bank"},
            {"ref": "UPI/412984931048", "amount": 60000.0, "channel": "UPI", "beneficiary": "taskpay.merchant88@okhdfcbank", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "Insp. Rajesh Kumar", "badge_number": "CY-4902", "note": "HDFC Nodal officer contacted under Sec 91 CrPC for statement of taskpay.merchant88@okhdfcbank. Account shows velocity spikes.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-104",
        "acknowledgement_no": "NCRP-2024-783910",
        "victim_name": "Rajesh Verma",
        "victim_state": "Delhi",
        "victim_city": "New Delhi",
        "incident_date": datetime.utcnow() - timedelta(days=8),
        "category": "Task / Job Scam",
        "loss_amount": 140000.0,
        "description": (
            "Complainant received SMS regarding hotel review task. Suspect instructed payment to UPI ID "
            "taskpay.merchant88@okhdfcbank across three installments totaling Rs 1,40,000. "
            "Suspect operated Telegram channel @fast_payouts_in and coordinated calls from contact number "
            "+91-98112-99381. When complainant asked to withdraw funds, suspect demanded tax clearance fee."
        ),
        "status": "Under Investigation",
        "assigned_officer": "SI Aman Singh (Cyber Cell Rohini)",
        "cluster_id": "SYNDICATE-01",
        "transactions": [
            {"ref": "UPI/412890128491", "amount": 40000.0, "channel": "UPI", "beneficiary": "taskpay.merchant88@okhdfcbank", "bank": "HDFC Bank"},
            {"ref": "UPI/412890139582", "amount": 100000.0, "channel": "UPI", "beneficiary": "taskpay.merchant88@okhdfcbank", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "SI Aman Singh", "badge_number": "DL-1182", "note": "Complainant submitted bank transaction screenshots matching UPI VPA taskpay.merchant88@okhdfcbank.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-107",
        "acknowledgement_no": "NCRP-2024-794012",
        "victim_name": "Sunita Nair",
        "victim_state": "Karnataka",
        "victim_city": "Bengaluru",
        "incident_date": datetime.utcnow() - timedelta(days=11),
        "category": "Task / Job Scam",
        "loss_amount": 210000.0,
        "description": (
            "Victim contacted by recruitment agent on mobile +91-98112-99381 offering e-commerce rating tasks. "
            "Instructed to deposit funds into secondary merchant mule account mule.suresh@icici and ICICI bank "
            "account 9182300049182 with IFSC ICIC0000491. Total amount siphoned Rs 2,10,000."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Insp. Vinay Gowda (Cyber Crime Police Station Bengaluru)",
        "cluster_id": "SYNDICATE-01",
        "transactions": [
            {"ref": "UPI/412711094821", "amount": 110000.0, "channel": "UPI", "beneficiary": "mule.suresh@icici", "bank": "ICICI Bank"},
            {"ref": "IMPS/412711099231", "amount": 100000.0, "channel": "IMPS", "beneficiary": "9182300049182", "bank": "ICICI Bank"}
        ],
        "notes": [
            {"officer_name": "Insp. Vinay Gowda", "badge_number": "KA-8021", "note": "Phone +91-98112-99381 traced to roaming cell tower in Alwar/Bharatpur border.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-110",
        "acknowledgement_no": "NCRP-2024-805128",
        "victim_name": "Deepak Patil",
        "victim_state": "Maharashtra",
        "victim_city": "Pune",
        "incident_date": datetime.utcnow() - timedelta(days=4),
        "category": "Task / Job Scam",
        "loss_amount": 65000.0,
        "description": (
            "Complainant was approached by handler using phone number +91-98201-44719 for YouTube subscriber tasks. "
            "Transferred Rs 65,000 to beneficiary UPI taskpay.merchant88@okhdfcbank before realize it was fraudulent."
        ),
        "status": "Action Initiated",
        "assigned_officer": "PSI Sanjay More (Shivajinagar Cyber Cell)",
        "cluster_id": "SYNDICATE-01",
        "transactions": [
            {"ref": "UPI/413009182390", "amount": 65000.0, "channel": "UPI", "beneficiary": "taskpay.merchant88@okhdfcbank", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "PSI Sanjay More", "badge_number": "MH-2910", "note": "Corroborated with Mumbai BKC case C-101. Suspect phone number matches exactly.", "status": "HUMAN_VERIFIED"}
        ]
    },

    # --- SCENARIO 2: COORDINATED PHISHING CAMPAIGN (Spoofed Electricity / Banking KYC) ---
    {
        "id": "C-102",
        "acknowledgement_no": "NCRP-2024-772183",
        "victim_name": "Ramesh Chandra Gupta",
        "victim_state": "Uttar Pradesh",
        "victim_city": "Lucknow",
        "incident_date": datetime.utcnow() - timedelta(days=5),
        "category": "Phishing / Identity Theft",
        "loss_amount": 125000.0,
        "description": (
            "Victim received urgent SMS: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM "
            "due to pending bill update. Contact electricity helpline at +91-94150-88219 or update immediately at "
            "https://secure-billpay-update.in'. Victim opened portal, entered net banking credentials. Unauthorised "
            "transfer of Rs 1,25,000 took place to beneficiary account 5010049281729 with IFSC HDFC0001829. "
            "Victim also received spoofed email from alerts@secure-billpay-update.in confirming payment failure."
        ),
        "status": "Action Initiated",
        "assigned_officer": "Insp. Alok Srivastava (Cyber Crime Police Station Lucknow)",
        "cluster_id": "SYNDICATE-02",
        "transactions": [
            {"ref": "NEFT/N41290129841", "amount": 125000.0, "channel": "NEFT", "beneficiary": "5010049281729", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "Insp. Alok Srivastava", "badge_number": "UP-4412", "note": "Phishing site secure-billpay-update.in submitted to CERT-In for emergency domain block.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-105",
        "acknowledgement_no": "NCRP-2024-785023",
        "victim_name": "Meena Sundaram",
        "victim_state": "Tamil Nadu",
        "victim_city": "Chennai",
        "incident_date": datetime.utcnow() - timedelta(days=7),
        "category": "Phishing / Identity Theft",
        "loss_amount": 75000.0,
        "description": (
            "Complainant received SMS claiming TNEB power disconnection. Clicked link https://secure-billpay-update.in "
            "which spoofed the state electricity board. Instructed to pay Rs 11 surcharge via UPI quickpay.energy@axl. "
            "Within minutes Rs 75,000 debited from complainant's savings account."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Inspector S. Raman (Cyber Crime Cell Chennai)",
        "cluster_id": "SYNDICATE-02",
        "transactions": [
            {"ref": "UPI/412800918291", "amount": 75000.0, "channel": "UPI", "beneficiary": "quickpay.energy@axl", "bank": "Axis Bank"}
        ],
        "notes": [
            {"officer_name": "Inspector S. Raman", "badge_number": "TN-3301", "note": "URL matches active phishing campaign observed in UP and Rajasthan.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-108",
        "acknowledgement_no": "NCRP-2024-796192",
        "victim_name": "Harish Bhatia",
        "victim_state": "Rajasthan",
        "victim_city": "Jaipur",
        "incident_date": datetime.utcnow() - timedelta(days=9),
        "category": "Phishing / Identity Theft",
        "loss_amount": 190000.0,
        "description": (
            "Victim received phone call from +91-94150-88219 claiming to be Jaipur Discom support desk. "
            "Caller asked victim to verify meter KYC at domain secure-billpay-update.in and secondary portal "
            "sbi-kyc-verify-portal.in. Total unauthorized debit Rs 1,90,000 executed via net banking."
        ),
        "status": "Under Investigation",
        "assigned_officer": "DSP Narendra Rathore (Special Operation Group Cyber Cell Jaipur)",
        "cluster_id": "SYNDICATE-02",
        "transactions": [
            {"ref": "IMPS/412700819283", "amount": 190000.0, "channel": "IMPS", "beneficiary": "5010049281729", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "DSP Narendra Rathore", "badge_number": "RJ-9102", "note": "Caller +91-94150-88219 is identical to Lucknow complaint C-102 suspect.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-111",
        "acknowledgement_no": "NCRP-2024-807291",
        "victim_name": "Sumanth Rao",
        "victim_state": "Telangana",
        "victim_city": "Hyderabad",
        "incident_date": datetime.utcnow() - timedelta(days=3),
        "category": "Phishing / Identity Theft",
        "loss_amount": 95000.0,
        "description": (
            "Complainant received email notice from alerts@secure-billpay-update.in with fake utility arrears. "
            "Transferred Rs 95,000 to beneficiary bank account 5010049281729 IFSC HDFC0001829. "
            "Realized scam after calling actual power board office."
        ),
        "status": "Action Initiated",
        "assigned_officer": "Insp. B. Prasad (Cyberabad Cyber Crimes)",
        "cluster_id": "SYNDICATE-02",
        "transactions": [
            {"ref": "NEFT/N41309819284", "amount": 95000.0, "channel": "NEFT", "beneficiary": "5010049281729", "bank": "HDFC Bank"}
        ],
        "notes": [
            {"officer_name": "Insp. B. Prasad", "badge_number": "TG-5509", "note": "HDFC Bank account 5010049281729 flagged for immediate debit freeze.", "status": "HUMAN_VERIFIED"}
        ]
    },

    # --- SCENARIO 3: DIGITAL EXTORTION NETWORK (Loan App & Digital Arrest Blackmail) ---
    {
        "id": "C-103",
        "acknowledgement_no": "NCRP-2024-773491",
        "victim_name": "Priya Kulkarni",
        "victim_state": "Madhya Pradesh",
        "victim_city": "Indore",
        "incident_date": datetime.utcnow() - timedelta(days=7),
        "category": "Digital Extortion / Blackmail",
        "loss_amount": 180000.0,
        "description": (
            "Complainant downloaded instant loan app 'FastRupee Cash'. Though loan repaid, victim began receiving "
            "extortion messages and threatening audio notes on WhatsApp from +91-98930-11204. "
            "Suspect shared morphed obscene pictures created from victim's gallery and threatened contact list circulation. "
            "Victim was coerced into paying Rs 1,80,000 to mule UPI extort.release99@paytm across multiple transactions."
        ),
        "status": "Action Initiated",
        "assigned_officer": "DSP Santosh Yadav (Cyber Cell Indore)",
        "cluster_id": "SYNDICATE-03",
        "transactions": [
            {"ref": "UPI/412891920194", "amount": 80000.0, "channel": "UPI", "beneficiary": "extort.release99@paytm", "bank": "Paytm Payments Bank"},
            {"ref": "UPI/412891931920", "amount": 100000.0, "channel": "UPI", "beneficiary": "extort.release99@paytm", "bank": "Paytm Payments Bank"}
        ],
        "notes": [
            {"officer_name": "DSP Santosh Yadav", "badge_number": "MP-8819", "note": "Victim in severe distress. WhatsApp number +91-98930-11204 registered with suspect SIM.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-106",
        "acknowledgement_no": "NCRP-2024-786194",
        "victim_name": "Vikramaditya Singh",
        "victim_state": "Madhya Pradesh",
        "victim_city": "Bhopal",
        "incident_date": datetime.utcnow() - timedelta(days=10),
        "category": "Digital Extortion / Blackmail",
        "loss_amount": 120000.0,
        "description": (
            "Complainant subjected to aggressive extortion by suspect calling from +91-98930-11204 claiming to be "
            "collection recovery cell. Suspect threatened to circulate fabricated legal notice and defamation notices. "
            "Victim transferred Rs 1,20,000 to secondary mule UPI loan.recovery.safe@ybl."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Insp. Neha Tiwari (Bhopal Cyber Cell)",
        "cluster_id": "SYNDICATE-03",
        "transactions": [
            {"ref": "UPI/412700918231", "amount": 120000.0, "channel": "UPI", "beneficiary": "loan.recovery.safe@ybl", "bank": "Yes Bank"}
        ],
        "notes": [
            {"officer_name": "Insp. Neha Tiwari", "badge_number": "MP-9104", "note": "Phone +91-98930-11204 identical to Indore case C-103. Same extortion syndicate pattern.", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-109",
        "acknowledgement_no": "NCRP-2024-797201",
        "victim_name": "Arvind Menaria",
        "victim_state": "Gujarat",
        "victim_city": "Ahmedabad",
        "incident_date": datetime.utcnow() - timedelta(days=5),
        "category": "Digital Extortion / Blackmail",
        "loss_amount": 250000.0,
        "description": (
            "Victim received call from suspect posing as Mumbai Police Crime Branch officer via phone +91-97270-33418. "
            "Victim placed under 'Digital Arrest' on Skype for 14 hours over fake narcotics parcel intercepted at customs. "
            "To avoid immediate arrest, victim coerced into transferring Rs 2,50,000 to 'escrow verification account' "
            "designated as UPI ID extort.release99@paytm."
        ),
        "status": "Action Initiated",
        "assigned_officer": "ACP Hardik Patel (Ahmedabad Cyber Crime Branch)",
        "cluster_id": "SYNDICATE-03",
        "transactions": [
            {"ref": "UPI/412990182394", "amount": 250000.0, "channel": "UPI", "beneficiary": "extort.release99@paytm", "bank": "Paytm Payments Bank"}
        ],
        "notes": [
            {"officer_name": "ACP Hardik Patel", "badge_number": "GJ-2291", "note": "Crucial finding: UPI extort.release99@paytm connects this Digital Arrest case directly to Loan Extortion in Indore (C-103).", "status": "HUMAN_VERIFIED"}
        ]
    },
    {
        "id": "C-112",
        "acknowledgement_no": "NCRP-2024-808392",
        "victim_name": "Sneha Banerjee",
        "victim_state": "West Bengal",
        "victim_city": "Kolkata",
        "incident_date": datetime.utcnow() - timedelta(days=2),
        "category": "Digital Extortion / Blackmail",
        "loss_amount": 150000.0,
        "description": (
            "Victim targeted by caller using mobile +91-97270-33418 claiming customs parcel seized with illegal passport copies. "
            "Victim coerced into paying Rs 1,50,000 converted to USDT crypto wallet 0x71c8293810293810293810293810293810293849."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Insp. Subir Roy (Kolkata Police Cyber Cell Lalbazar)",
        "cluster_id": "SYNDICATE-03",
        "transactions": [
            {"ref": "CRYPTO/TX-0x991823", "amount": 150000.0, "channel": "Crypto", "beneficiary": "0x71c8293810293810293810293810293810293849", "bank": "Ethereum Virtual Asset"}
        ],
        "notes": [
            {"officer_name": "Insp. Subir Roy", "badge_number": "WB-7712", "note": "Suspect phone +91-97270-33418 matches Ahmedabad digital arrest case C-109.", "status": "HUMAN_VERIFIED"}
        ]
    },

    # --- ADDITIONAL STANDALONE / REGIONAL CASES ---
    {
        "id": "C-113",
        "acknowledgement_no": "NCRP-2024-809401",
        "victim_name": "Kavita Deshmukh",
        "victim_state": "Maharashtra",
        "victim_city": "Nagpur",
        "incident_date": datetime.utcnow() - timedelta(days=12),
        "category": "Investment Scam",
        "loss_amount": 320000.0,
        "description": (
            "Victim lured into fake VIP algorithmic trading group on Telegram by @wealth_maximizer_bot. "
            "Instructed to deposit funds into beneficiary account 409182390192 IFSC SBIN0004019. Suspect contact "
            "number +91-98220-55192. Promised 300% returns on pre-IPO allocations."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Insp. Nitin Gaikwad (Nagpur Cyber Crime)",
        "cluster_id": None,
        "transactions": [
            {"ref": "IMPS/412500918231", "amount": 320000.0, "channel": "IMPS", "beneficiary": "409182390192", "bank": "State Bank of India"}
        ],
        "notes": []
    },
    {
        "id": "C-114",
        "acknowledgement_no": "NCRP-2024-810512",
        "victim_name": "Manish Agarwal",
        "victim_state": "Delhi",
        "victim_city": "Delhi",
        "incident_date": datetime.utcnow() - timedelta(days=14),
        "category": "UPI Fraud",
        "loss_amount": 45000.0,
        "description": (
            "Complainant selling furniture on OLX. Buyer posed as Army Officer Major Vikram Rathore using phone "
            "+91-98101-77291. Sent fake UPI QR code claiming it would credit money, but instead Rs 45,000 debited "
            "to UPI olx.army.verify@paytm."
        ),
        "status": "Under Investigation",
        "assigned_officer": "SI Naveen Tomar (Dwarka Cyber Cell)",
        "cluster_id": None,
        "transactions": [
            {"ref": "UPI/412490182391", "amount": 45000.0, "channel": "UPI", "beneficiary": "olx.army.verify@paytm", "bank": "Paytm Payments Bank"}
        ],
        "notes": []
    },
    {
        "id": "C-115",
        "acknowledgement_no": "NCRP-2024-811623",
        "victim_name": "Geeta Krishnan",
        "victim_state": "Kerala",
        "victim_city": "Kochi",
        "incident_date": datetime.utcnow() - timedelta(days=1),
        "category": "Phishing / Identity Theft",
        "loss_amount": 55000.0,
        "description": (
            "Victim received SMS regarding SIM card deactivation from phone +91-94470-33190. Directed to fake BSNL "
            "portal bsnl-sim-update-portal.in and made to download QuickSupport APK. Rs 55,000 siphoned to UPI bsnl.kyc@axl."
        ),
        "status": "Under Investigation",
        "assigned_officer": "Insp. Manoj Kumar (Ernakulam Cyber Police)",
        "cluster_id": None,
        "transactions": [
            {"ref": "UPI/413100918234", "amount": 55000.0, "channel": "UPI", "beneficiary": "bsnl.kyc@axl", "bank": "Axis Bank"}
        ],
        "notes": []
    }
]

DEMO_SCENARIOS = [
    {
        "id": "scenario_1",
        "title": "Scenario 1 – Multi-Victim UPI Fraud Network",
        "subtitle": "Telegram Task Scam Cross-Complaint Linkage",
        "theme": "Cross-Complaint Cyber-Fraud & Mule Account Discovery",
        "initial_complaint_id": "C-101",
        "description": (
            "Evaluator investigates Complaint C-101 (Ananya Sharma, Mumbai, ₹85,000 loss). "
            "Upon initiating Intelligence Discovery, the system extracts the beneficiary UPI ID "
            "'taskpay.merchant88@okhdfcbank' and suspect mobile '+91-98201-44719'. "
            "The engine automatically matches C-101 to C-104 (New Delhi) and C-110 (Pune) via identical indicators, "
            "and further discovers a 2-hop connection to C-107 (Bengaluru) through intermediate bridge contact '+91-98112-99381'. "
            "This exposes an organized interstate mule syndicate operating across Maharashtra, Delhi, and Karnataka."
        ),
        "key_entities": json.dumps([
            {"type": "UPI", "value": "taskpay.merchant88@okhdfcbank", "role": "Primary Mule Beneficiary VPA"},
            {"type": "PHONE", "value": "+91-98201-44719", "role": "Handler Contact (Mumbai/Pune)"},
            {"type": "PHONE", "value": "+91-98112-99381", "role": "Bridge Coordinator Phone (Delhi/Bengaluru)"},
            {"type": "TELEGRAM", "value": "@vikram_ratings_bot", "role": "Onboarding Bot"}
        ]),
        "expected_connections": json.dumps([
            {"target": "C-104", "type": "DIRECT_MATCH", "via": "taskpay.merchant88@okhdfcbank", "hop": 1},
            {"target": "C-110", "type": "DIRECT_MATCH", "via": "+91-98201-44719", "hop": 1},
            {"target": "C-107", "type": "MULTI_HOP_MATCH", "via": "C-104 -> +91-98112-99381", "hop": 2}
        ]),
        "investigation_takeaway": (
            "Without CyberTrace AI, four different state cyber cells would have treated C-101, C-104, C-107, and C-110 "
            "as isolated low-priority complaints. Cross-complaint intelligence aggregates ₹5,00,000 in collective losses, "
            "justifying high-priority Section 91 CrPC account freeze notices and coordinated interstate arrest requisitions."
        ),
        "suggested_actions": json.dumps([
            "Issue emergency Section 91 CrPC debit freeze notice to HDFC Bank for UPI taskpay.merchant88@okhdfcbank",
            "Requisition CDR and cell tower location from telecom carrier for coordinator phone +91-98112-99381",
            "Issue alert to Bengaluru Cyber Crime Police Station referencing composite Syndicate-01 dossier"
        ])
    },
    {
        "id": "scenario_2",
        "title": "Scenario 2 – Coordinated Phishing Campaign",
        "subtitle": "Electricity Disconnection & Spoofed Banking Gateway",
        "theme": "Infrastructure Clustering & Fake Domain Intelligence",
        "initial_complaint_id": "C-102",
        "description": (
            "Evaluator examines Complaint C-102 (Ramesh Chandra Gupta, Lucknow, ₹1,25,000 loss). "
            "The victim was targeted by an electricity disconnection SMS leading to phishing gateway 'secure-billpay-update.in'. "
            "Cross-complaint analysis connects C-102 to C-105 (Chennai), C-108 (Jaipur), and C-111 (Hyderabad). "
            "The system reveals that despite different states and differing local electricity board names, the exact "
            "same backend phishing infrastructure, caller phone '+91-94150-88219', and mule account '5010049281729' "
            "were weaponized nationwide."
        ),
        "key_entities": json.dumps([
            {"type": "URL", "value": "secure-billpay-update.in", "role": "Core Phishing Gateway"},
            {"type": "PHONE", "value": "+91-94150-88219", "role": "Social Engineering Caller (Lucknow/Jaipur)"},
            {"type": "BANK_ACCOUNT", "value": "5010049281729", "role": "Beneficiary Mule Account"},
            {"type": "EMAIL", "value": "alerts@secure-billpay-update.in", "role": "Spoofed Sender Header"}
        ]),
        "expected_connections": json.dumps([
            {"target": "C-105", "type": "DIRECT_MATCH", "via": "secure-billpay-update.in", "hop": 1},
            {"target": "C-108", "type": "DIRECT_MATCH", "via": "+91-94150-88219", "hop": 1},
            {"target": "C-111", "type": "DIRECT_MATCH", "via": "5010049281729", "hop": 1}
        ]),
        "investigation_takeaway": (
            "Phishing gangs exploit fragmented state jurisdictions. CyberTrace AI instantly clusters these four victims, "
            "totaling ₹4,85,000, and isolates the central domain and mule account for immediate nationwide takedown."
        ),
        "suggested_actions": json.dumps([
            "Submit emergency domain takedown request to CERT-In and NIXI for secure-billpay-update.in",
            "Freeze beneficiary account 5010049281729 at HDFC Bank branch (IFSC HDFC0001829)",
            "Notify Jaipur and Chennai cyber stations of shared suspect phone +91-94150-88219"
        ])
    },
    {
        "id": "scenario_3",
        "title": "Scenario 3 – Digital Extortion & Blackmail Network",
        "subtitle": "Instant Loan Blackmail & Digital Arrest Coercion",
        "theme": "Multi-Hop Extortion Ring & Inter-Syndicate Infrastructure",
        "initial_complaint_id": "C-103",
        "description": (
            "Evaluator investigates Complaint C-103 (Priya Kulkarni, Indore, ₹1,80,000 loss). "
            "The victim suffered severe psychological harassment from WhatsApp number '+91-98930-11204' with morphed photos. "
            "The engine identifies a direct link to C-106 (Bhopal) via the extortion phone, and a critical 2-hop linkage to "
            "Complaint C-109 (Ahmedabad) through shared payment mule UPI 'extort.release99@paytm'. "
            "Strikingly, while C-103 is a loan blackmail scam and C-109 is a fake CBI 'Digital Arrest' scam, the system "
            "unmasks that both disparate cybercrimes share the exact same financial laundering mule network!"
        ),
        "key_entities": json.dumps([
            {"type": "PHONE", "value": "+91-98930-11204", "role": "Extortion Caller WhatsApp (Indore/Bhopal)"},
            {"type": "UPI", "value": "extort.release99@paytm", "role": "Inter-Syndicate Mule Settlement VPA"},
            {"type": "PHONE", "value": "+91-97270-33418", "role": "Fake CBI Officer Skype/Phone (Ahmedabad/Kolkata)"}
        ]),
        "expected_connections": json.dumps([
            {"target": "C-106", "type": "DIRECT_MATCH", "via": "+91-98930-11204", "hop": 1},
            {"target": "C-109", "type": "DIRECT_MATCH", "via": "extort.release99@paytm", "hop": 1},
            {"target": "C-112", "type": "MULTI_HOP_MATCH", "via": "C-109 -> +91-97270-33418", "hop": 2}
        ]),
        "investigation_takeaway": (
            "Reveals the deeper reality of modern organized cybercrime: illegal loan apps and digital arrest cells "
            "outsource their financial settlement to common underground money-mule aggregators. "
            "CyberTrace AI's multi-hop intelligence cuts through the surface narrative to target the money flow."
        ),
        "suggested_actions": json.dumps([
            "Issue priority Section 91 CrPC freeze on Paytm UPI extort.release99@paytm and trace underlying bank A/C",
            "Coordinate joint probe between Indore Cyber Cell, Ahmedabad Crime Branch, and Kolkata Lalbazar",
            "Requisition WhatsApp account metadata and device telemetry for suspect phone +91-98930-11204"
        ])
    }
]

def seed_database():
    """Seed the database with rich, interconnected demonstration data."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_count = db.query(Complaint).count()
        if existing_count > 0:
            print(f"[Seed] Database already contains {existing_count} complaints. Resetting for clean demo state...")
            # Clean tables in proper order
            db.query(ComplaintLink).delete()
            db.query(ExtractedEntity).delete()
            db.query(FinancialTransaction).delete()
            db.query(OfficerNote).delete()
            db.query(DemoScenario).delete()
            db.query(FraudCluster).delete()
            db.query(Complaint).delete()
            db.commit()

        print("[Seed] Populating initial complaints and extracted entities...")
        for comp_data in RAW_COMPLAINTS:
            # 1. Insert Complaint
            complaint = Complaint(
                id=comp_data["id"],
                acknowledgement_no=comp_data["acknowledgement_no"],
                victim_name=comp_data["victim_name"],
                victim_state=comp_data["victim_state"],
                victim_city=comp_data["victim_city"],
                incident_date=comp_data["incident_date"],
                reported_date=comp_data["incident_date"] + timedelta(hours=18),
                category=comp_data["category"],
                loss_amount=comp_data["loss_amount"],
                description=comp_data["description"],
                status=comp_data["status"],
                assigned_officer=comp_data["assigned_officer"],
                cluster_id=comp_data.get("cluster_id")
            )
            db.add(complaint)
            db.flush()

            # 2. Extract Entities from Description
            extracted = extract_entities_from_text(comp_data["description"])
            for ent in extracted:
                ee = ExtractedEntity(
                    complaint_id=complaint.id,
                    entity_type=ent["entity_type"],
                    raw_value=ent["raw_value"],
                    normalized_value=ent["normalized_value"],
                    confidence=ent["confidence"],
                    flagged_reason=ent["flagged_reason"],
                    context_snippet=ent["context_snippet"],
                    first_observed=complaint.incident_date,
                    last_observed=complaint.incident_date
                )
                db.add(ee)

            # 3. Add Financial Transactions
            for tx in comp_data.get("transactions", []):
                ft = FinancialTransaction(
                    complaint_id=complaint.id,
                    transaction_ref=tx["ref"],
                    amount=tx["amount"],
                    channel=tx.get("channel", "UPI"),
                    beneficiary_identifier=tx["beneficiary"],
                    beneficiary_bank=tx.get("bank", "Unknown"),
                    timestamp=complaint.incident_date
                )
                db.add(ft)

            # 4. Add Officer Notes
            for note in comp_data.get("notes", []):
                on = OfficerNote(
                    complaint_id=complaint.id,
                    officer_name=note["officer_name"],
                    badge_number=note["badge_number"],
                    note=note["note"],
                    verification_status=note.get("status", "HUMAN_VERIFIED"),
                    created_at=complaint.incident_date + timedelta(days=1)
                )
                db.add(on)

        db.commit()

        # Seed Demo Scenarios
        print("[Seed] Populating evaluator demo scenarios...")
        for sc in DEMO_SCENARIOS:
            scenario = DemoScenario(
                id=sc["id"],
                title=sc["title"],
                subtitle=sc["subtitle"],
                theme=sc["theme"],
                initial_complaint_id=sc["initial_complaint_id"],
                description=sc["description"],
                key_entities=sc["key_entities"],
                expected_connections=sc["expected_connections"],
                investigation_takeaway=sc["investigation_takeaway"],
                suggested_actions=sc["suggested_actions"]
            )
            db.add(scenario)

        # Seed Fraud Clusters
        cluster_alpha = FraudCluster(
            id="SYNDICATE-01",
            name="Telegram Task Scam Syndicate Alpha",
            modus_operandi="TASK_JOB_SCAM",
            threat_level="CRITICAL",
            total_loss=500000.0,
            complaint_count=4,
            entity_count=6,
            primary_identifiers=json.dumps(["taskpay.merchant88@okhdfcbank", "+91-98201-44719", "+91-98112-99381"]),
            recommended_action="Emergency debit freeze on HDFC UPI VPA and Bharatpur tower CDR requisition."
        )
        cluster_beta = FraudCluster(
            id="SYNDICATE-02",
            name="Electricity Phishing Gateway Syndicate Beta",
            modus_operandi="PHISHING_KYC_SPOOF",
            threat_level="CRITICAL",
            total_loss=485000.0,
            complaint_count=4,
            entity_count=5,
            primary_identifiers=json.dumps(["secure-billpay-update.in", "+91-94150-88219", "5010049281729"]),
            recommended_action="CERT-In national domain takedown and Section 91 CrPC notice to HDFC Bank."
        )
        cluster_gamma = FraudCluster(
            id="SYNDICATE-03",
            name="Interstate Extortion & Digital Arrest Ring Gamma",
            modus_operandi="DIGITAL_EXTORTION_ARREST",
            threat_level="CRITICAL",
            total_loss=700000.0,
            complaint_count=4,
            entity_count=6,
            primary_identifiers=json.dumps(["extort.release99@paytm", "+91-98930-11204", "+91-97270-33418"]),
            recommended_action="Joint inter-agency cyber strike operation across MP, Gujarat, and West Bengal."
        )
        db.add_all([cluster_alpha, cluster_beta, cluster_gamma])
        db.commit()

        # Build Complaint Links in Database
        print("[Seed] Pre-computing cross-complaint connections...")
        all_cids = [c["id"] for c in RAW_COMPLAINTS]
        for cid in all_cids:
            disc = discover_cross_complaint_connections(cid, db, max_hops=2)
            for dl in disc.get("direct_links", []):
                # Avoid duplicate bidirectional recording
                if dl["source_complaint_id"] < dl["target_complaint_id"]:
                    cl = ComplaintLink(
                        source_complaint_id=dl["source_complaint_id"],
                        target_complaint_id=dl["target_complaint_id"],
                        link_type="DIRECT_MATCH",
                        shared_entity_type=dl["shared_entities"][0]["entity_type"] if dl["shared_entities"] else None,
                        shared_entity_value=dl["shared_entities"][0]["normalized_value"] if dl["shared_entities"] else None,
                        hop_count=1,
                        relationship_strength=dl["relationship_strength"],
                        explanation=dl["explanation"],
                        intermediate_path=json.dumps(dl.get("intermediate_path", []))
                    )
                    db.add(cl)

        db.commit()
        print("[Seed] Database seeding completed successfully with 15 complaints and 3 evaluator scenarios!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
