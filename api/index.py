import sys
import os
import types
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [ROOT_DIR, BACKEND_DIR]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(BACKEND_DIR)]
    backend_pkg.__file__ = str(BACKEND_DIR / "__init__.py")
    sys.modules["backend"] = backend_pkg

from backend.main import app, handler

__all__ = ["app", "handler"]
