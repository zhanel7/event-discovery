# Event Discovery Service

Сервис поиска и управления научными конференциями: **FastAPI**, **React + Tailwind**, **PostgreSQL**, **Redis** (кэш + rate limit), **Prometheus**, **Grafana**, **Docker Compose**, **GitHub Actions**, **k6**.

## Живой деплой

- **Render (пример):** замените на вашу ссылку после деплоя, например `https://event-discovery-api.onrender.com`
- Фронтенд на Render обычно отдаётся как Static Site; укажите `VITE_API_URL` на URL бэкенда.

## Как запустить проект (локально)

1. Установите [Docker Desktop](https://docs.docker.com/desktop/) и **запустите** его (должен быть статус *Running*).
2. Откройте терминал в папке проекта `event-discovery` (где лежит `docker-compose.yml`).

**Первый запуск или после изменений в коде:**

```bash
docker compose up --build
```

**Обычный запуск (образы уже собраны):**

```bash
docker compose up
```

**Остановка:** `Ctrl+C` в том же окне, либо:

```bash
docker compose down
```

Если нужно **полностью пересобрать** бэкенд/фронт:

```bash
docker compose build --no-cache
docker compose up
```

Подождите 30–60 секунд после старта, затем откройте ссылки ниже. Если сразу после запуска API не отвечает — обновите страницу через несколько секунд (контейнеры поднимаются по очереди).

После запуска:

| Сервис    | URL |
|-----------|-----|
| API + Swagger | http://localhost:8000/docs |
| Фронтенд (nginx) | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (логин `admin` / `admin`) |

**Учётная запись администратора по умолчанию** (создаётся скриптом при первом старте, если пользователя ещё нет):

- Email: `admin@example.com`
- Пароль: `Admin12345`

Переопределение через переменные окружения: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Переменные окружения (важные)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis для кэша списка конференций и rate limiting |
| `JWT_SECRET_KEY` | Секрет подписи JWT (в продакшене — длинная случайная строка) |
| `FRONTEND_ORIGIN` | Одно значение CORS (если не задано `FRONTEND_ORIGINS`) |
| `FRONTEND_ORIGINS` | Несколько origin через запятую (приоритетнее `FRONTEND_ORIGIN`) |
| `VITE_API_URL` | При сборке фронтенда — базовый URL API |

Шаблон для копирования: [`.env.example`](.env.example).

## Соответствие критериям курса (чеклист)

| Критерий | Реализация |
|----------|------------|
| Аутентификация | Регистрация, логин, refresh, logout, смена пароля; JWT access + refresh |
| Роли | `user` / `admin`; админка только для `admin` |
| CRUD конференций | Полный цикл + поля по ТЗ |
| Поиск / фильтр / пагинация / сортировка | `search`, `category`, `skip`/`limit`/`total`, `sort=asc\|desc` |
| Фронтенд | React, Tailwind, Router, AuthContext, защищённые маршруты, адаптив |
| Безопасность | bcrypt, JWT, ORM, CSP (+ отдельная политика для `/docs`), CORS, rate limit, JWT в header |
| Redis | Кэш списка конференций, rate limiting |
| Мониторинг | Логи stdout + файл, Prometheus `/metrics`, Grafana дашборд |
| Docker | Multi-stage backend (non-root), nginx frontend, compose-сеть `event_net` |
| CI/CD | GitHub Actions: flake8, pytest, сборка образов |
| Тесты | ≥10 unit, ≥10 integration (pytest) |
| k6 | Сценарий регистрация → логин → конференция → поиск |
| Документация | README, Swagger `/docs`, структура в `docs/` |

## Устранение неполадок

- **Порт 5432 занят** — в compose PostgreSQL проброшен на **5433** с хоста (см. `docker-compose.yml`).
- **Порт 6379 занят** — Redis с хоста на **6380** (внутри сети контейнеров по-прежнему `redis:6379`).
- **Docker Engine не запущен** — запустите Docker Desktop; ошибка `dockerDesktopLinuxEngine` / pipe означает, что демон недоступен.
- **Бэкенд не отвечает первые секунды** — подождите и обновите страницу; смотрите логи: `docker compose logs -f backend`.
- **Swagger пустой / не грузится** — для `/docs` CSP ослаблен (CDN jsdelivr); не отключайте без необходимости.
- **CORS в браузере** — задайте `FRONTEND_ORIGINS` с вашим origin (включая `http://127.0.0.1:3000` при открытии по IP).

## API (кратко)

Базовый URL: `http://localhost:8000`

- `POST /auth/register` — регистрация (`user` только)
- `POST /auth/login` — access + refresh JWT
- `POST /auth/refresh` — обновление пары токенов
- `POST /auth/logout` — подсказка для клиента (токены сбрасываются на клиенте)
- `GET /auth/me` — текущий пользователь
- `POST /auth/change-password` — смена пароля
- `GET /conferences` — список с `skip`, `limit`, `search`, `category`, `sort=asc|desc`, ответ с `total`
- `POST /conferences` — создание (нужен Bearer)
- `GET /conferences/{id}` — детали
- `PUT /conferences/{id}` — правка (автор или admin)
- `DELETE /conferences/{id}` — удаление (автор или admin)
- `GET /users/me/conferences` — конференции текущего пользователя
- `GET /admin/users`, `PUT /admin/users/{id}/role` — только admin
- `GET /admin/conferences`, `DELETE /admin/conferences/{id}` — только admin
- `GET /metrics` — метрики Prometheus

Пример:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin12345"}'
```

## Тесты

```bash
cd backend
pip install -r requirements.txt
pytest test_unit.py test_integration.py -v
```

## Нагрузочное тестирование (k6)

С установленным [k6](https://k6.io/):

```bash
cd k6
k6 run load-test.js
```

Опционально сохранить JSON summary и затем сгенерировать HTML-отчёт любым выбранным инструментом; заготовка отчёта: `k6/report.html`.

## Мониторинг

- Prometheus собирает `/metrics` с бэкенда.
- В Grafana импортирован дашборд **Event Discovery API** (RPS, ошибки, p50/p95 задержки).

### Скриншоты (добавьте в репозиторий при сдаче)

- `docs/screenshots/grafana.png` — дашборд Grafana
- `docs/screenshots/k6-report.png` — отчёт k6

## CI/CD

Файл `.github/workflows/ci-cd.yml`: flake8, pytest, сборка Docker-образов; шаги push в Docker Hub и деплой на Render отключены заглушками (`if: false`) — включите и задайте секреты при необходимости.

## Структура репозитория

Подробное дерево файлов: [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md).

## Примечание по `frontend/public/index.html`

Сборка **Vite** использует `frontend/index.html` в корне фронтенд-проекта. Папка `public/` предназначена для статических файлов (favicon и т.д.).

## Локальное развитие без Docker

Если вы хотите запустить проект локально с pip/npm:

### Бэкенд

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/event_discovery
export REDIS_URL=redis://localhost:6380/0
export JWT_SECRET_KEY=your-secret-key-32-chars-min
uvicorn main:app --reload --port 8000
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev  # dev сервер на http://localhost:3000
# или для production сборки:
npm run build
npm run preview
```

## Продакшн-переменные окружения

Для развертывания на Render.com или любой другой платформе:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db_name
REDIS_URL=redis://user:pass@host:6379/0
JWT_SECRET_KEY=generate-long-random-secure-key-32-chars-minimum
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=GenerateSecurePassword123
FRONTEND_ORIGINS=https://your-domain.com
LOG_FILE=/app/logs/app.log
CONFERENCE_CACHE_TTL=300
```

## Примеры curl-запросов

### Регистрация и логин

```bash
# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123"
  }'

# Логин
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123"
  }'
```

### Работа с конференциями

```bash
# Получить access token из логина и сохранить
TOKEN="your_access_token_here"

# Создать конференцию
curl -X POST http://localhost:8000/conferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ICML 2026",
    "description": "International Conference on Machine Learning",
    "start_date": "2026-07-15T09:00:00Z",
    "end_date": "2026-07-20T17:00:00Z",
    "location": "Vienna, Austria",
    "cfp_deadline": "2026-03-01T23:59:59Z",
    "category": "AI"
  }'

# Список конференций с поиском и фильтром
curl "http://localhost:8000/conferences?search=ICML&category=AI&skip=0&limit=10&sort=asc"

# Получить детали конференции
curl http://localhost:8000/conferences/1

# Отредактировать конференцию
curl -X PUT http://localhost:8000/conferences/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ICML 2026 - Updated"
  }'

# Удалить конференцию
curl -X DELETE http://localhost:8000/conferences/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Админ-операции

```bash
# Список пользователей (только admin)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/admin/users

# Изменить роль пользователя
curl -X PUT http://localhost:8000/admin/users/2/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'

# Список всех конференций в админ-панели
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/admin/conferences

# Удалить конференцию (admin)
curl -X DELETE http://localhost:8000/admin/conferences/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Мониторинг

```bash
# Проверка здоровья API
curl http://localhost:8000/health

# Метрики Prometheus
curl http://localhost:8000/metrics

# OpenAPI/Swagger схема
curl http://localhost:8000/openapi.json
```

## Развертывание на Render.com

1. **Форк репозитория** на GitHub
2. **Создайте PostgreSQL дату базу на Render.com**
3. **Создайте Redis сервис** (опционально, для production)
4. **Создайте Web Service for Backend:**
   - Репозиторий: ваш форк
   - Build command: `cd backend && pip install -r requirements.txt`
   - Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
   - Окружающие переменные (из Render):
     - `DATABASE_URL` = connection string вашей БД
     - `REDIS_URL` = connection string Redis
     - `JWT_SECRET_KEY` = сгенерируйте длинный ключ
     - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
     - `FRONTEND_ORIGINS` = URL фронтенда

5. **Создайте Static Site for Frontend:**
   - Репозиторий: ваш форк
   - Build command: `cd frontend && npm install && npm run build && mkdir -p dist && ls`
   - Publish directory: `frontend/dist`
   - Окружающие переменные:
     - `VITE_API_URL` = URL вашего бэкенда (например, `https://your-backend.onrender.com`)

## Скриншоты и отчеты

При сдаче проекта добавьте в папку `docs/screenshots/`:

- `grafana-dashboard.png` — дашборд Grafana с RPS, ошибками, задержками
- `k6-report.png` — скриншот HTML-отчета k6
- `admin-panel.png` — скриншот админ-панели
- `login-page.png` — скриншот страницы входа
