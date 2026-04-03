# syntax=docker/dockerfile:1
FROM python:3.11-slim AS builder
WORKDIR /w
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim
RUN useradd -m -u 1000 appuser && mkdir -p /app/logs && chown appuser:appuser /app/logs
WORKDIR /app
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

COPY --chown=appuser:appuser . .
USER root
RUN chmod +x /app/entrypoint.sh
USER appuser

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
