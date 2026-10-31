import sys
import os
import types
from pathlib import Path

CURR_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURR_DIR.parent

for p in [CURR_DIR, PARENT_DIR]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(CURR_DIR)]
    backend_pkg.__file__ = str(CURR_DIR / "__init__.py")
    sys.modules["backend"] = backend_pkg

try:
    from backend.app.main import app
except Exception as e:
    import traceback
    print(f"[FATAL BACKEND INIT ERROR] {e}\n{traceback.format_exc()}", file=sys.stderr)
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
