"""Кэш Redis для списка конференций (ключ по параметрам запроса)."""
import hashlib
import json
import os
from typing import Any, Optional

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_SECONDS = int(os.getenv("CONFERENCE_CACHE_TTL", "60"))

_client: Optional[redis.Redis] = None


def get_redis() -> Optional[redis.Redis]:
    """Ленивая инициализация; при недоступности Redis возвращает None."""
    global _client
    if _client is not None:
        return _client
    try:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
        _client.ping()
    except redis.RedisError:
        _client = None
    return _client


def cache_key(prefix: str, params: dict) -> str:
    raw = json.dumps(params, sort_keys=True, default=str)
    h = hashlib.sha256(raw.encode()).hexdigest()[:32]
    return f"{prefix}:{h}"


def get_json(key: str) -> Optional[Any]:
    r = get_redis()
    if not r:
        return None
    try:
        v = r.get(key)
        if v is None:
            return None
        return json.loads(v)
    except (redis.RedisError, json.JSONDecodeError):
        return None


def set_json(key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except redis.RedisError:
        pass


def invalidate_conference_list() -> None:
    """Сброс кэша списков (простая схема: удаляем по шаблону)."""
    r = get_redis()
    if not r:
        return
    try:
        for k in r.scan_iter("conf_list:*"):
            r.delete(k)
    except redis.RedisError:
        pass
