# 🎓 Event Discovery Service

> Сервис поиска и управления научными конференциями мирового уровня

[![CI/CD](https://github.com/zhanel7/event-discovery/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/zhanel7/event-discovery/actions)
[![Tests](https://img.shields.io/badge/tests-35%2F35%20passed-brightgreen)](https://github.com/zhanel7/event-discovery)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://hub.docker.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)

## 🌐 Живой деплой

| Сервис | URL |
|--------|-----|
| 🔵 Backend API | https://event-discovery-pim5.onrender.com |
| 📖 Swagger Docs | https://event-discovery-pim5.onrender.com/docs |
| 🟢 Frontend | https://event-discovery-frontend.onrender.com |
| 💻 GitHub | https://github.com/zhanel7/event-discovery |

## 📋 О проекте

**Event Discovery Service** — полнофункциональный веб-сервис для поиска научных конференций (аналог WikiCFP). Позволяет исследователям находить конференции, отслеживать дедлайны CFP и управлять своими заявками.

### Стек технологий

| Слой | Технологии |
|------|-----------|
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL, Redis, JWT |
| **Frontend** | React 18, Vite, Tailwind CSS, Axios |
| **DevOps** | Docker, Docker Compose, GitHub Actions |
| **Мониторинг** | Prometheus, Grafana |
| **Тесты** | Pytest (35 тестов: 15 unit + 20 integration) |

## 🚀 Быстрый старт

### Требования
- [Docker Desktop](https://docs.docker.com/desktop/) (запущен)
- Git

### Запуск за 1 команду

```bash
git clone https://github.com/zhanel7/event-discovery.git
cd event-discovery
docker compose up --build
```

Подождите 30-60 секунд, затем откройте:

| Сервис | URL |
|--------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 📖 Swagger UI | http://localhost:8000/docs |
| 📊 Prometheus | http://localhost:9090 |
| 📈 Grafana | http://localhost:3001 |

### Учётные данные по умолчанию

| Сервис | Email / Login | Пароль |
|--------|--------------|--------|
| Admin аккаунт | admin@example.com | Admin12345 |
| Grafana | admin | admin |

## ✅ Соответствие критериям курса

| # | Критерий | Реализация | Статус |
|---|----------|------------|--------|
| 1 | Аутентификация | JWT access (30 мин) + refresh (7 дней), bcrypt | ✅ |
| 2 | Роли пользователей | `user` / `admin`, защищённые маршруты | ✅ |
| 3 | CRUD операции | Полный цикл конференций | ✅ |
| 4 | Поиск и фильтрация | `search`, `category`, `sort`, пагинация | ✅ |
| 5 | Frontend | React + Tailwind, тёмная тема, анимации | ✅ |
| 6 | Безопасность | bcrypt, JWT, CORS, rate limit, CSP headers | ✅ |
| 7 | Кэширование | Redis кэш конференций + rate limiting | ✅ |
| 8 | Мониторинг | Prometheus метрики + Grafana дашборд | ✅ |
| 9 | Docker | Multi-stage build, non-root user, compose | ✅ |
| 10 | CI/CD | GitHub Actions: lint + test + build | ✅ |
| 11 | Тесты | **35/35 passed** (15 unit + 20 integration) | ✅ |
| 12 | Деплой | Render.com (backend + frontend) | ✅ |
| 13 | Документация | README + Swagger + docs/ | ✅ |

## 🧪 Тесты

```bash
# Запуск внутри Docker
docker compose exec backend pytest test_unit.py test_integration.py -v

# Результат: 35 passed ✅
```

### Покрытие тестами

| Категория | Тестов | Что тестируется |
|-----------|--------|-----------------|
| Unit тесты | 15 | JWT, bcrypt, Pydantic валидация |
| Integration тесты | 20 | API эндпоинты, авторизация, CRUD |
| **Итого** | **35** | **Все passed ✅** |

## 📡 API Reference

Base URL: `https://event-discovery-pim5.onrender.com`

### Аутентификация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/auth/register` | Регистрация нового пользователя |
| POST | `/auth/login` | Вход → access + refresh токены |
| POST | `/auth/refresh` | Обновление токенов |
| GET | `/auth/me` | Данные текущего пользователя |

### Конференции

| Метод | Эндпоинт | Описание | Auth |
|-------|----------|----------|------|
| GET | `/conferences` | Список с поиском и фильтрами | ✅ |
| POST | `/conferences` | Создать конференцию | ✅ |
| GET | `/conferences/{id}` | Детали конференции | ✅ |
| PUT | `/conferences/{id}` | Обновить (автор/admin) | ✅ |
| DELETE | `/conferences/{id}` | Удалить (автор/admin) | ✅ |
| GET | `/users/me/conferences` | Мои конференции | ✅ |

### Администрирование

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/admin/users` | Все пользователи |
| PUT | `/admin/users/{id}/role` | Изменить роль |
| GET | `/admin/conferences` | Все конференции |
| DELETE | `/admin/conferences/{id}` | Удалить любую |

### Мониторинг

| Эндпоинт | Описание |
|----------|----------|
| GET `/health` | Health check (db + redis статус) |
| GET `/metrics` | Prometheus метрики |

### Пример использования

```bash
# Логин
curl -X POST https://event-discovery-pim5.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin12345"}'

# Создать конференцию
curl -X POST https://event-discovery-pim5.onrender.com/conferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ICML 2028",
    "description": "International Conference on Machine Learning",
    "start_date": "2028-07-15T09:00:00Z",
    "end_date": "2028-07-20T17:00:00Z",
    "location": "Vienna, Austria",
    "cfp_deadline": "2027-03-01T23:59:59Z",
    "category": "AI"
  }'
```

## 🔧 Переменные окружения

```env
# База данных
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-key-minimum-32-chars

# Администратор
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin12345

# CORS
FRONTEND_ORIGINS=https://event-discovery-frontend.onrender.com

# Frontend
VITE_API_URL=https://event-discovery-pim5.onrender.com
```

## 📊 Мониторинг

### Prometheus метрики
- `http_requests_total` — количество запросов
- `http_request_duration_seconds` — время ответа
- `http_errors_total` — количество ошибок

### Grafana дашборд "Event Discovery API"
- RPS (requests per second) — ~0.16 req/s
- Latency p95 — 10ms
- Latency p50 — 5ms
- HTTP errors — 0

## 👥 Команда разработчиков

| Участник | Роль | Вклад |
|----------|------|-------|
| Жанель  |  Backend Developer | FastAPI, PostgreSQL, JWT Auth, REST API, Docker, CI/CD, Tests |
| Диана | Frontend Developer | React, Tailwind CSS, UI/UX Design, Conference Cards, Animations |
| Алтынай | DevOps / QA Engineer | Docker Compose, Prometheus, Grafana, k6 Load Testing, Deployment |