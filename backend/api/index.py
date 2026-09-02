import sys
from pathlib import Path

# Add backend root and app to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "app"))

from app.main import app

@app.get("/api/index.py")
def vercel_entry():
    return {
        "app": "AgriTwin AI",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
