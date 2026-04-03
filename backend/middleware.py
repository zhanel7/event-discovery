"""Логирование запросов, rate limiting (Redis), заголовки безопасности."""
import logging
import os
import time
from typing import Callable

from fastapi import Request, Response
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from auth import SECRET_KEY, ALGORITHM

logger = logging.getLogger("event_discovery.http")

# Prometheus counters (дополнительно к instrumentator)
try:
    from prometheus_client import Counter

    HTTP_ERRORS = Counter(
        "http_errors_total",
        "HTTP responses with 4xx or 5xx status",
        ["status_class"],
    )
except ImportError:
    HTTP_ERRORS = None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _is_authenticated_request(request: Request) -> bool:
    auth = request.headers.get("authorization") or ""
    if not auth.lower().startswith("bearer "):
        return False
    token = auth.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("type") == "access"
    except JWTError:
        return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """CSP и прочие заголовки (снижение XSS)."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        path = request.url.path
        # Swagger UI (/docs) грузит скрипты с cdn.jsdelivr.net — строгий CSP ломает страницу.
        if path.startswith("/docs") or path.startswith("/redoc"):
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
        response.headers.setdefault("Content-Security-Policy", csp)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=()")
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Логирование метода, пути, статуса, длительности в stdout и файл."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        status_code = response.status_code
        msg = (
            f"{request.method} {request.url.path} "
            f"status={status_code} duration_ms={duration_ms:.2f}"
        )
        logger.info(msg)
        if HTTP_ERRORS and status_code >= 400:
            cls = "4xx" if status_code < 500 else "5xx"
            HTTP_ERRORS.labels(status_class=cls).inc()
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Лимит запросов в минуту на IP: 100 без токена, 200 с валидным access JWT.
    Использует Redis INCR + EXPIRE; при недоступности Redis — пропускает.
    """

    def __init__(self, app, redis_url: str | None = None):
        super().__init__(app)
        self._redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = None

    def _get_redis(self):
        if self._redis is not None:
            return self._redis
        try:
            import redis

            self._redis = redis.from_url(self._redis_url, decode_responses=True)
            self._redis.ping()
        except Exception:
            self._redis = False
        return self._redis

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if (
            path in ("/metrics", "/health", "/openapi.json")
            or path.startswith("/docs")
            or path.startswith("/redoc")
        ):
            return await call_next(request)

        r = self._get_redis()
        if not r:
            return await call_next(request)

        ip = _client_ip(request)
        authed = _is_authenticated_request(request)
        limit = 200 if authed else 100
        prefix = "rl:auth" if authed else "rl:anon"
        key = f"{prefix}:{ip}"

        try:
            n = r.incr(key)
            if n == 1:
                r.expire(key, 60)
            if n > limit:
                return Response(
                    content='{"detail":"Too many requests. Try again later."}',
                    status_code=429,
                    media_type="application/json",
                )
        except Exception:
            pass

        return await call_next(request)


def setup_logging(log_file: str | None = None) -> None:
    """Настройка root logger: stdout + опционально файл."""
    log_file = log_file or os.getenv("LOG_FILE", "logs/app.log")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")

    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        sh = logging.StreamHandler()
        sh.setFormatter(fmt)
        root.addHandler(sh)

    os.makedirs(os.path.dirname(log_file) or ".", exist_ok=True)
    try:
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(fmt)
        if not any(
            isinstance(h, logging.FileHandler) and getattr(h, "baseFilename", None) == fh.baseFilename
            for h in root.handlers
        ):
            root.addHandler(fh)
    except OSError:
        pass
