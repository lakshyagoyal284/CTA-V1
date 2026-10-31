import sys
import os
import types
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

CURR_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURR_DIR.parent

for p in [CURR_DIR, PARENT_DIR]:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

# Ensure 'backend' is recognized as a package pointing to CURR_DIR
if "backend" not in sys.modules:
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(CURR_DIR)]
    backend_pkg.__file__ = str(CURR_DIR / "__init__.py")
    sys.modules["backend"] = backend_pkg

from backend.app.config import PROJECT_NAME, FULL_NAME, CHALLENGE, SECTOR, SUB_THEME, API_V1_STR
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Complaint
from backend.app.services.seed_data import seed_database
from backend.app.routes import (
    complaints, intelligence, graph, scenarios, evaluation, reports
)

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    # Ensure database schema exists and initial seed is present
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Complaint).count()
        if count == 0:
            print("[Startup] Empty database detected. Seeding initial demonstration data...")
            seed_database()
        else:
            print(f"[Startup] CyberTrace AI database ready with {count} active complaints.")
    finally:
        db.close()
    yield

# Top-level handler definition for Vercel Python runtime
app = FastAPI(
    title=f"{PROJECT_NAME} — {FULL_NAME}",
    description=(
        f"Official Backend Intelligence API for {PROJECT_NAME}.\n\n"
        f"**Challenge:** {CHALLENGE}\n"
        f"**Sector:** {SECTOR}\n"
        f"**Sub-theme:** {SUB_THEME}\n\n"
        "Features: Cross-complaint multi-hop discovery, automated digital identifier extraction, "
        "relationship strength calculation, syndicate community clustering, explainable 4-tier risk assessment, "
        "reproducible benchmark evaluation, and official PDF dossier export."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# Alias handler for Vercel
handler = app

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under both /api and "" so that Vercel routes match whether or not /api is stripped
for pfx in ["/api", ""]:
    app.include_router(complaints.router, prefix=pfx)
    app.include_router(intelligence.router, prefix=pfx)
    app.include_router(graph.router, prefix=pfx)
    app.include_router(scenarios.router, prefix=pfx)
    app.include_router(evaluation.router, prefix=pfx)
    app.include_router(reports.router, prefix=pfx)

@app.get("/")
@app.get("/api")
def root_endpoint():
    return {
        "project": PROJECT_NAME,
        "full_name": FULL_NAME,
        "challenge": CHALLENGE,
        "sector": SECTOR,
        "sub_theme": SUB_THEME,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1_prefix": API_V1_STR
    }

@app.get("/health")
@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": PROJECT_NAME,
        "version": "2.0.0",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
