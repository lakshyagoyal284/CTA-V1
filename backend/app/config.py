import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'cybertrace.db'}")

PROJECT_NAME = "CyberTrace AI"
FULL_NAME = "Cross-Complaint Cyber-Fraud Intelligence and Financial Crime Network Detection Platform"
CHALLENGE = "Seva Innovation Challenge"
SECTOR = "Sector 2 – Law and Order"
SUB_THEME = "Sub-theme 2 – Cyber-Fraud, Digital Extortion and Financial-Crime Intelligence"
API_V1_STR = "/api"
