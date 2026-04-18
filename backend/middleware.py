"""Middleware для FastAPI приложения."""
import logging
import math
import os
import time
from typing import Callable

import redis
from fastapi import Request, Response
from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware

from auth import SECRET_KEY, ALGORITHM
from cache import get_redis_client

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware с Redis."""

    def __init__(self, app, limit_anonymous=100, limit_authenticated=200, window=60):
        super().__init__(app)
        self.limit_anonymous = limit_anonymous
        self.limit_authenticated = limit_authenticated
        self.window = window
        self.redis = get_redis_client()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        is_authenticated = self._is_authenticated(request)
        limit = self.limit_authenticated if is_authenticated else self.limit_anonymous
        window_start = int(time.time() // self.window) * self.window
        key_suffix = f"user_{request.state.user_id}" if hasattr(request.state, 'user_id') and is_authenticated else f"ip_{client_ip}"
        key = f"rate:{key_suffix}:{window_start}"

        if self.redis:
            try:
                count = self.redis.incr(key)
                if count == 1:
                    self.redis.expire(key, self.window)
                if count > limit:
                    return Response(
                        content='{"detail": "Too many requests"}',
                        status_code=429,
                        headers={"Retry-After": str(self.window)}
                    )
            except redis.RedisError:
                pass  # Allow request if Redis fails

        return await call_next(request)

    def _is_authenticated(self, request: Request) -> bool:
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return False
        try:
            from jose import jwt
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload.get("type") == "access"
        except:
            return False


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware для логирования запросов."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        client_ip = request.client.host if request.client else "unknown"
        logger.info(
            f"{request.method} {request.url.path} {response.status_code} {duration:.3f}s from {client_ip}"
        )
        return response


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Prometheus middleware для метрик."""

    def __init__(self, app):
        super().__init__(app)
        self.http_requests_total = Counter(
            "http_requests_total",
            "Total HTTP requests",
            ["method", "endpoint", "status_code"]
        )
        self.http_request_duration_seconds = Histogram(
            "http_request_duration_seconds",
            "HTTP request duration",
            ["method", "endpoint"],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        endpoint = self._normalize_endpoint(request.url.path)
        self.http_requests_total.labels(
            method=request.method,
            endpoint=endpoint,
            status_code=str(response.status_code)
        ).inc()
        self.http_request_duration_seconds.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)

        return response

    def _normalize_endpoint(self, path: str) -> str:
        if path.startswith("/conferences/") and len(path.split("/")) > 2:
            return "/conferences/{id}"
        return path


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware для заголовков безопасности."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Basic security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # CSP
        if request.url.path.startswith("/docs") or request.url.path.startswith("/redoc"):
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https: blob:; "
                "font-src 'self' data: https://cdn.jsdelivr.net; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'"
            )
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        response.headers["Content-Security-Policy"] = csp

        return response
