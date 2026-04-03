# Структура репозитория

```
event-discovery/
├── .env.example              # Шаблон переменных окружения
├── .flake8                   # Настройки flake8
├── .github/workflows/ci-cd.yml
├── .gitignore
├── README.md
├── docker-compose.yml        # Сеть event_net, порты, depends_on
├── backend/
│   ├── Dockerfile            # Multi-stage, non-root (appuser)
│   ├── entrypoint.sh         # init_admin + uvicorn
│   ├── alembic.ini
│   ├── main.py               # FastAPI, роуты, CORS, метрики
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py               # JWT access/refresh, bcrypt
│   ├── crud.py
│   ├── admin.py              # Админ API
│   ├── middleware.py         # Логи, rate limit, CSP
│   ├── cache.py              # Redis-кэш списка конференций
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── test_unit.py
│   ├── test_integration.py
│   ├── scripts/init_admin.py
│   └── migrations/__init__.py
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html            # Точка входа Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── public/               # Статика (не класть сюда index.html SPA)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── index.css
│       ├── context/AuthContext.jsx
│       ├── components/
│       └── pages/
├── prometheus/prometheus.yml
├── grafana/
│   ├── datasources.yml
│   └── dashboards/
└── k6/
    ├── load-test.js
    └── report.html
```

## Порты (docker compose)

| Сервис     | Хост      | Назначение        |
|-----------|-----------|-------------------|
| Frontend  | 3000      | React SPA (nginx) |
| Backend   | 8000      | API, `/docs`      |
| PostgreSQL| 5433 → 5432 | Только с хоста |
| Redis     | 6380 → 6379 | Только с хоста |
| Prometheus| 9090      | Метрики           |
| Grafana   | 3001      | Дашборды          |
