#!/bin/bash
# Verification script for Event Discovery Service
# Run with: bash verify-setup.sh

set -e

echo "🔍 Event Discovery Service - Setup Verification"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 is installed"
    return 0
  else
    echo -e "${RED}✗${NC} $1 is not installed"
    return 1
  fi
}

check_port() {
  if nc -z localhost $1 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Port $1 is open"
    return 0
  else
    echo -e "${RED}✗${NC} Port $1 is closed"
    return 1
  fi
}

echo "1. Checking prerequisites..."
echo ""

required_ok=true
check_command docker || required_ok=false
check_command docker-compose || required_ok=false

echo ""
echo "2. Docker Compose configuration..."
echo ""

if [ -f "docker-compose.yml" ]; then
  echo -e "${GREEN}✓${NC} docker-compose.yml found"
else
  echo -e "${RED}✗${NC} docker-compose.yml not found"
fi

echo ""
echo "3. Environment configuration..."
echo ""

if [ -f ".env.example" ]; then
  echo -e "${GREEN}✓${NC} .env.example found"
else
  echo -e "${RED}✗${NC} .env.example not found"
fi

echo ""
echo "4. Backend configuration..."
echo ""

[ -f "backend/requirements.txt" ] && echo -e "${GREEN}✓${NC} requirements.txt found" || echo -e "${RED}✗${NC} requirements.txt not found"
[ -f "backend/Dockerfile" ] && echo -e "${GREEN}✓${NC} Dockerfile found" || echo -e "${RED}✗${NC} Dockerfile not found"
[ -f "backend/main.py" ] && echo -e "${GREEN}✓${NC} main.py found" || echo -e "${RED}✗${NC} main.py not found"

echo ""
echo "5. Frontend configuration..."
echo ""

[ -f "frontend/package.json" ] && echo -e "${GREEN}✓${NC} package.json found" || echo -e "${RED}✗${NC} package.json not found"
[ -f "frontend/Dockerfile" ] && echo -e "${GREEN}✓${NC} Dockerfile found" || echo -e "${RED}✗${NC} Dockerfile not found"
[ -f "frontend/index.html" ] && echo -e "${GREEN}✓${NC} index.html found" || echo -e "${RED}✗${NC} index.html not found"

echo ""
echo "6. Test files..."
echo ""

[ -f "backend/test_unit.py" ] && echo -e "${GREEN}✓${NC} test_unit.py found" || echo -e "${RED}✗${NC} test_unit.py not found"
[ -f "backend/test_integration.py" ] && echo -e "${GREEN}✓${NC} test_integration.py found" || echo -e "${RED}✗${NC} test_integration.py not found"
[ -f "k6/load-test.js" ] && echo -e "${GREEN}✓${NC} load-test.js found" || echo -e "${RED}✗${NC} load-test.js not found"

echo ""
echo "7. Documentation..."
echo ""

[ -f "README.md" ] && echo -e "${GREEN}✓${NC} README.md found" || echo -e "${RED}✗${NC} README.md not found"
[ -f "docs/DEVELOPMENT.md" ] && echo -e "${GREEN}✓${NC} DEVELOPMENT.md found" || echo -e "${RED}✗${NC} DEVELOPMENT.md not found"
[ -f "docs/PROJECT_STRUCTURE.md" ] && echo -e "${GREEN}✓${NC} PROJECT_STRUCTURE.md found" || echo -e "${RED}✗${NC} PROJECT_STRUCTURE.md not found"

echo ""
echo "8. CI/CD..."
echo ""

[ -f ".github/workflows/ci-cd.yml" ] && echo -e "${GREEN}✓${NC} CI/CD workflow found" || echo -e "${RED}✗${NC} CI/CD workflow not found"

echo ""
echo "9. Runtime checks (if docker is running)..."
echo ""

if command -v docker &> /dev/null && docker info > /dev/null 2>&1; then
  echo "Checking Docker services..."
  check_port 8000 || echo -e "${YELLOW}⚠${NC}  Backend port 8000 not accessible yet (expected if not running)"
  check_port 3000 || echo -e "${YELLOW}⚠${NC}  Frontend port 3000 not accessible yet (expected if not running)"
  check_port 5433 || echo -e "${YELLOW}⚠${NC}  PostgreSQL port 5433 not accessible yet (expected if not running)"
  check_port 6380 || echo -e "${YELLOW}⚠${NC}  Redis port 6380 not accessible yet (expected if not running)"
else
  echo -e "${YELLOW}⚠${NC}  Docker daemon not running - skipping runtime checks"
fi

echo ""
echo "==============================================="
echo "Verification complete!"
echo ""
echo "To start the project:"
echo "  docker compose up --build"
echo ""
echo "Then open:"
echo "  - Frontend: http://localhost:3000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
