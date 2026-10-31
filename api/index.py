import sys
import os
import types
from pathlib import Path

# Ensure project root is available for imports
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

try:
    from backend.app.main import app
except Exception as e:
    import traceback
    print(f"[FATAL ROOT API INIT ERROR] {e}\n{traceback.format_exc()}", file=sys.stderr)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="CyberTrace AI - Initialization Error")
    err_msg = str(e)
    err_trace = traceback.format_exc()
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all_error(path: str):
        return JSONResponse(
            status_code=500,
            content={"error": "Backend initialization failed", "details": err_msg, "traceback": err_trace}
        )

__all__ = ["app"]
