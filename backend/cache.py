"""Кэш Redis для списка конференций."""
import hashlib
import json
import logging
import os
from typing import Any, Optional

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CACHE_TTL_SECONDS = int(os.getenv("CONFERENCE_CACHE_TTL", "60"))

logger = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Ленивая инициализация Redis клиента."""
    global _client
    if _client is not None:
        return _client
    try:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
        _client.ping()
        return _client
    except redis.RedisError as e:
        logger.warning(f"Redis unavailable: {e}")
        _client = None
        return None


def make_cache_key(prefix: str, **kwargs) -> str:
    """Создаёт ключ кэша из префикса и параметров."""
    sorted_params = sorted(kwargs.items())
    params_str = json.dumps(sorted_params, sort_keys=True, default=str)
    hash_digest = hashlib.sha256(params_str.encode()).hexdigest()[:16]
    return f"{prefix}:{hash_digest}"


def get_cached(key: str) -> Optional[Any]:
    """Получает данные из кэша."""
    r = get_redis_client()
    if not r:
        return None
    try:
        value = r.get(key)
        if value is None:
            return None
        return json.loads(value)
    except (redis.RedisError, json.JSONDecodeError) as e:
        logger.warning(f"Cache get error: {e}")
        return None


def set_cached(key: str, data: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    """Сохраняет данные в кэш."""
    r = get_redis_client()
    if not r:
        return
    try:
        r.setex(key, ttl, json.dumps(data, default=str))
    except redis.RedisError as e:
        logger.warning(f"Cache set error: {e}")


def invalidate_pattern(pattern: str) -> None:
    """Удаляет все ключи по паттерну."""
    r = get_redis_client()
    if not r:
        return
    try:
        for key in r.scan_iter(pattern):
            r.delete(key)
    except redis.RedisError as e:
        logger.warning(f"Cache invalidate error: {e}")


def invalidate_conferences() -> None:
    """Инвалидирует кэш конференций."""
    invalidate_pattern("conferences:*")
