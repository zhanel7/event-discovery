# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies + dos2unix для исправления ошибок Windows
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    netcat-traditional \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Исправляем формат строк (CRLF -> LF) и даем права на выполнение
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run entrypoint script
ENTRYPOINT ["./entrypoint.sh"]