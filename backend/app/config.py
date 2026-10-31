import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

if os.getenv("VERCEL"):
    # In Vercel serverless environments, the root directory is read-only.
    # Copy pre-seeded database to /tmp/data where SQLite has full read/write access.
    TMP_DATA_DIR = Path("/tmp") / "data"
    TMP_DATA_DIR.mkdir(parents=True, exist_ok=True)
    source_db = DATA_DIR / "cybertrace.db"
    target_db = TMP_DATA_DIR / "cybertrace.db"
    if source_db.exists() and not target_db.exists():
        shutil.copy2(source_db, target_db)
    DATABASE_URL = f"sqlite:///{target_db}"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'cybertrace.db'}")

PROJECT_NAME = "CyberTrace AI"
FULL_NAME = "Cross-Complaint Cyber-Fraud Intelligence and Financial Crime Network Detection Platform"
CHALLENGE = "Seva Innovation Challenge"
SECTOR = "Sector 2 – Law and Order"
SUB_THEME = "Sub-theme 2 – Cyber-Fraud, Digital Extortion and Financial-Crime Intelligence"
API_V1_STR = "/api"
