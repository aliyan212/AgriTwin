FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY data-engine/ /app/data-engine/

ENV PYTHONPATH=/app:/app/data-engine:/app/backend
ENV DATABASE_URL=sqlite:///./agritwin.db

# Support default port 7860 (Hugging Face Spaces) or any custom $PORT (Render / Koyeb / Docker)
EXPOSE 7860 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
