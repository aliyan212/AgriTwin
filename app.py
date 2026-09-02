"""Hugging Face Spaces entrypoint — mounts AgriTwin FastAPI on free Gradio SDK."""

import os
import sys
from pathlib import Path

# Add directories to Python path
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))
sys.path.insert(0, str(root_dir / "data-engine"))

import uvicorn
import gradio as gr
from app.main import app as fastapi_app

# Branded landing page for the Hugging Face Space UI
with gr.Blocks(title="AgriTwin AI — Node Status") as demo:
    gr.Markdown("# 🌾 AgriTwin AI — Agricultural Digital Twin API Node")
    gr.Markdown(
        "This Hugging Face Space provides live agrometeorological calculations, "
        "Saxton-Rawls soil physics, Warabandi canal scheduling, and NASA MODIS NDVI analytics for AgriTwin."
    )
    with gr.Row():
        gr.Markdown("- **Interactive Swagger API Documentation**: [/docs](/docs)")
        gr.Markdown("- **Node Health Check Endpoint**: [/api/v1/health](/api/v1/health)")
        gr.Markdown("- **Punjab District Farms API**: [/api/v1/farms/](/api/v1/farms/)")

# Mount Gradio UI at /gradio or root, keeping all /api/v1 and /docs routes active
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
