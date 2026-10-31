import sys
import os
from pathlib import Path

# Add backend directory and root directory to sys.path
CURR_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURR_DIR.parent
for p in [CURR_DIR, PARENT_DIR]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from backend.app.main import app

# Export app for Vercel
__all__ = ["app"]
