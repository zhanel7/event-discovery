# 🚀 Event Discovery Service - Quick Start Guide

## ⚡ 5-Minute Startup (Docker)

```bash
# 1. Navigate to project directory
cd event-discovery

# 2. Start everything with one command
docker compose up --build

# 3. Wait 30-60 seconds, then open:
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

**Default Login:**
- Email: `admin@example.com`
- Password: `Admin12345`

---

## 📋 What You Get

### Services Running
| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend (React) | 3000 | http://localhost:3000 | Web UI |
| Backend (FastAPI) | 8000 | http://localhost:8000 | REST API |
| PostgreSQL | 5433 | (internal) | Database |
| Redis | 6380 | (internal) | Cache/Rate Limit |
| Prometheus | 9090 | http://localhost:9090 | Metrics collection |
| Grafana | 3001 | http://localhost:3001 | Dashboards (admin/admin) |

### Key Features
✅ Authentication (JWT + Refresh tokens)
✅ Conference CRUD (Create, Read, Update, Delete)
✅ Search, Filter, Pagination
✅ Admin panel (User & Conference management)
✅ Rate limiting (100-200 req/min)
✅ Caching (Redis)
✅ Monitoring (Prometheus + Grafana)
✅ Responsive design (Mobile & Desktop)
✅ Full test coverage (20+ tests)
✅ CI/CD ready (GitHub Actions)

---

## 🔄 Common Commands

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild Specific Service
```bash
docker compose build --no-cache backend
docker compose up
```

### Clean Everything
```bash
docker compose down -v
docker compose up --build
```

### Run Tests (in backend)
```bash
docker compose exec backend pytest -v
```

### Generate Load Test Report
```bash
docker compose exec backend k6 run --out json=test-report.json /app/load-test.js
```

---

## 🔐 Security & Authentication

### Register New User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

Response includes:
- `access_token` - Valid for 30 minutes
- `refresh_token` - Valid for 7 days

### Use Token for Requests
```bash
TOKEN="your_access_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/conferences
```

---

## 📊 Monitoring & Metrics

### Prometheus
- URL: http://localhost:9090
- Metrics available at: http://localhost:8000/metrics
- Sample queries:
  - `http_requests_total` - Total requests
  - `http_request_duration_seconds` - Request latency
  - `http_errors_total` - Error count

### Grafana
- URL: http://localhost:3001
- Login: `admin` / `admin`
- Pre-built dashboard shows:
  - Requests per second (RPS)
  - Error rates (4xx/5xx)
  - Response time percentiles (p50, p95)

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm install
npm run dev   # Start dev server
npm run build # Production build
```

### Backend Testing
```bash
cd backend
pip install -r requirements.txt
pytest test_unit.py test_integration.py -v
```

### Load Testing (k6)
```bash
cd k6
k6 run load-test.js
# Simulates 20 virtual users for 1 minute
# Tests: register → login → create → search
```

---

## 📚 Documentation

- **README.md** - Full project overview & troubleshooting
- **docs/DEVELOPMENT.md** - Local development setup
- **docs/PROJECT_STRUCTURE.md** - File/folder organization
- **docs/COMPLETION_CHECKLIST.md** - Criteria verification (100 points)

---

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Get tokens
- `POST /auth/refresh` - Renew access token
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user

### Conferences
- `GET /conferences` - List all (with search, filter, pagination)
- `POST /conferences` - Create (requires auth)
- `GET /conferences/{id}` - Get one
- `PUT /conferences/{id}` - Update (author or admin)
- `DELETE /conferences/{id}` - Delete (author or admin)

### Admin Only
- `GET /admin/users` - List users
- `PUT /admin/users/{id}/role` - Change user role
- `GET /admin/conferences` - List all conferences
- `DELETE /admin/conferences/{id}` - Delete any conference

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process (careful!)
kill -9 <PID>
```

### Database Connection Error
```bash
# Check database is running
docker compose ps db

# View database logs
docker compose logs db

# Rebuild database
docker compose down -v
docker compose up
```

### Frontend Can't Connect to Backend
1. Check backend is running: `curl http://localhost:8000/health`
2. Check CORS: Open DevTools → Network tab
3. Check `VITE_API_URL` environment variable
4. Refresh browser page

### Tests Fail
```bash
# Run with more verbose output
docker compose exec backend pytest -vv --tb=long

# Check if database is ready
docker compose exec db pg_isready
```

---

## 📱 Using the Frontend

### Home Page
- Search conferences by title/description
- Filter by category
- Sort by date (ascending/descending)
- Paginate through results
- View conference details

### Create Conference
- Fill in required fields (title, start_date, end_date)
- Add optional details (description, location, category)
- Submit to create new conference

### My Profile
- View your account info
- Change password (with validation)
- See all your created conferences
- Delete your conferences

### Admin Panel (Admin Only)
- View all registered users
- Toggle user roles (user ↔ admin)
- View all conferences in the system
- Delete any conference if needed
- Prevent demotion of last admin

---

## 🚀 Deployment to Production

### Using Render.com
1. Fork repository to GitHub
2. Create PostgreSQL database on Render
3. Create Backend service:
   - Repository: Your fork
   - Start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
   - Environment variables: DATABASE_URL, REDIS_URL, JWT_SECRET_KEY, etc.
4. Create Frontend service:
   - Repository: Your fork
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Environment: VITE_API_URL = your-backend-url

See README.md for detailed Render deployment steps.

---

## ✨ Pro Tips

1. **Enable Dark Mode** - Tailwind CSS default dark theme
2. **Mobile First** - Test on phone: use `127.0.0.1` instead of `localhost`
3. **Watch Logs** - Keep `docker compose logs -f` running in separate terminal
4. **Dev Server Hot Reload** - Frontend auto-refreshes on code changes
5. **Backend Reload** - Use `--reload` flag: `uvicorn main:app --reload`
6. **Database Inspection** - Use `docker compose exec db psql ...`
7. **Clear Cache** - Restart Redis: `docker compose restart redis`

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review documentation in `docs/` folder
3. Check logs: `docker compose logs`
4. Run verification: `bash verify-setup.sh`
5. Check GitHub Issues if deployed from repo

---

**Happy coding! 🎉**
