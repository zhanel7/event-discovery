# Development Guide - Event Discovery Service

## Prerequisites

- **Docker Desktop** (latest version) for containerized development
- **Python 3.11+** for local backend development
- **Node.js 20+** for local frontend development
- **PostgreSQL 16** (optional, if running without Docker)
- **Redis 7** (optional, if running without Docker)
- **k6** (optional, for load testing)

## Quick Start with Docker

### First Run

```bash
git clone <your-repo-url>
cd event-discovery
docker compose up --build
```

Wait 30-60 seconds for services to initialize. Then open:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

Default credentials:
- Email: `admin@example.com`
- Password: `Admin12345`

### Rebuild After Code Changes

```bash
docker compose down
docker compose up --build
```

Or rebuild specific service:

```bash
docker compose build --no-cache backend
docker compose up
```

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/event_discovery
export REDIS_URL=redis://localhost:6380/0
export JWT_SECRET_KEY=your-dev-secret-key-must-be-32-chars-!!!
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=Admin12345

# Create database tables
python scripts/init_admin.py

# Run development server
uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### Database & Cache (via Docker only)

If running backend locally but need Docker for database:

```bash
# Start only database and redis from docker-compose
docker compose up db redis
```

## Testing

### Unit Tests

```bash
cd backend
pytest test_unit.py -v
```

### Integration Tests

```bash
cd backend
pytest test_integration.py -v
```

### All Tests

```bash
cd backend
pytest -v
```

### Linting

```bash
cd backend
flake8 . --max-line-length=120 --extend-ignore=E203,W503
```

### Load Testing

```bash
cd k6
k6 run load-test.js
# With HTML report:
k6 run --out json=report.json load-test.js
```

## Code Style

### Backend (Python)

- Max line length: **120 characters**
- Follow PEP-8
- Use type hints where possible
- Run flake8 before committing

### Frontend (React/JavaScript)

- Use ES6+ syntax
- Format: 2-space indentation
- Use meaningful component names
- PropTypes or TypeScript recommended

## Database Development

### Currently Using

- **SQLAlchemy ORM** - automatic table creation on startup
- Tables created in `backend/main.py` lifespan hook

### Add New Model

1. Create model in `backend/models.py`
2. Add schemas in `backend/schemas.py`
3. Add CRUD operations in `backend/crud.py`
4. Add API endpoints in `backend/main.py` or new router

### Manual Migration (if needed)

```bash
cd backend
alembic revision --autogenerate -m "describe your changes"
alembic upgrade head
```

## Adding New API Endpoint

1. **Define schemas** in `backend/schemas.py`
2. **Add CRUD function** in `backend/crud.py`
3. **Add route** in `backend/main.py`:

```python
@app.post("/api/resource", response_model=ResourceOut, status_code=201)
async def create_resource(
    body: ResourceCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = crud.create_resource(db, body, current.id)
    return resource
```

4. **Add test** in `backend/test_integration.py` or `backend/test_unit.py`

## Adding Frontend Component

1. **Create component** in `src/components/` or `src/pages/`
2. **Use Tailwind CSS** for styling
3. **Handle responsive design** with `sm:`, `lg:` classes
4. **Add route** in `src/App.jsx` if it's a page

Example component structure:

```jsx
import React, { useState } from "react";
import { apiFetch } from "../api.js";

export default function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-4">
      {/* Your JSX */}
    </div>
  );
}
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `JWT_SECRET_KEY` | - | JWT signing secret (min 32 chars) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `FRONTEND_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `LOG_FILE` | `logs/app.log` | Log file path |
| `ADMIN_EMAIL` | `admin@example.com` | Default admin email |
| `ADMIN_PASSWORD` | `Admin12345` | Default admin password |
| `CONFERENCE_CACHE_TTL` | `60` | Cache TTL in seconds |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

## Debugging

### Backend Logs

```bash
# With Docker
docker compose logs -f backend

# Local development  
# Logs appear in terminal where you ran uvicorn
```

### Frontend Logs

Browser DevTools (F12):
- Console tab for JavaScript errors
- Network tab for API requests
- React DevTools extension recommended

### Database Issues

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5433/event_discovery

# Useful commands
\dt              # List tables
\d users         # Describe table
SELECT * FROM users;  # Query
\q               # Quit
```

## Deployment Checklist

- [ ] Environment variables set to production values
- [ ] `JWT_SECRET_KEY` is long random string (40+ chars)
- [ ] Database URL points to production database
- [ ] Redis URL valid and accessible
- [ ] `FRONTEND_ORIGINS` includes production domain
- [ ] All tests passing: `pytest -v`
- [ ] No flake8 warnings: `flake8 .`
- [ ] Frontend builds without errors: `npm run build`
- [ ] Docker images build successfully
- [ ] `.env` file is NOT committed to git

## Common Issues

### Port Already in Use

```bash
# Find and kill process on port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `docker compose ps db`
- See database logs: `docker compose logs db`

### Redis Connection Error

- Check Redis is running: `docker compose ps redis`
- Try with mock Redis (some operations will not cache)

### Frontend Can't Connect to Backend

- Check `VITE_API_URL` environment variable
- Check CORS headers in backend response
- Browser DevTools Network tab for actual requests
- Verify backend is running: `curl http://localhost:8000/health`

### Tests Fail

- Ensure test database is fresh: `pytest --tb=short -v`
- Check `JWT_SECRET_KEY` is set in test environment
- Database should be SQLite in-memory for tests

## Performance Optimization

### Caching

- `GET /conferences` results cached in Redis (60s TTL)
- Manual invalidation on create/update/delete
- Adjust `CONFERENCE_CACHE_TTL` as needed

### Database Queries

- Conference queries use indexes on `title`, `category`, `user_id`
- User queries use index on `email`
- Consider `EXPLAIN` for slow queries

### Frontend

- React Router for lazy code splitting
- Tailwind CSS purges unused styles in production build
- Images should be optimized before upload

## Monitoring

### Prometheus Metrics

- Ready at: http://localhost:9090
- Query examples:
  - `http_requests_total` - total requests
  - `http_requests_total{status="500"}` - 5xx errors
  - `http_request_duration_seconds` - latency histogram

### Grafana

- Already has dashboard configured
- Add more panels as needed
- Metrics update every 10 seconds

## Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **SQLAlchemy**: https://www.sqlalchemy.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **Docker**: https://docs.docker.com/
- **Prometheus**: https://prometheus.io/
- **Grafana**: https://grafana.com/

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test: `pytest -v && flake8 .`
3. Commit with clear message
4. Push and create Pull Request

## Support

For issues:
1. Check this guide's "Common Issues" section
2. Review logs: `docker compose logs`
3. Run tests to identify failures
4. Check API docs at `/docs` for endpoint details
