# ── Shadow-Sound Backend ─────────────────────────────────────────────────
# Multi-stage build for a lean, secure production image.
# ─────────────────────────────────────────────────────────────────────────

# ---------- Stage 1: Install Python dependencies ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# System libs needed to compile some Python packages (librosa/scipy/numpy)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libsndfile1-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ---------- Stage 2: Production image ----------
FROM python:3.12-slim

LABEL maintainer="ShadowSound Team"
LABEL description="Shadow-Sound audio classification backend"

# Runtime system dependency for soundfile / librosa
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libsndfile1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
WORKDIR /app
COPY --chown=root:root . .

# Make sure the appuser can read everything but write nowhere in /app
RUN chmod -R a+rX /app

# Switch to non-root user
USER appuser

# Expose the API port
EXPOSE 8000

# Health check — hit the /health REST endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start uvicorn
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
