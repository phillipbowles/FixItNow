#!/bin/bash

# FixItNow - Script de inicio completo (backend + frontend)
# Inicia ambos servicios en modo desarrollo LOCAL (sin Docker)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACK_DIR="$ROOT_DIR/backend"
FRONT_DIR="$ROOT_DIR/frontend"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  FixItNow - Inicio completo${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# ── Verificar Node.js ─────────────────────────────────────

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}ERROR: Se requiere Node.js >= 20 (actual: $(node -v))${NC}"
    exit 1
fi

# ── Backend ──────────────────────────────────────────────

echo -e "${BLUE}[BACKEND]${NC} Verificando PostgreSQL..."
if ! docker ps | grep -q "fixitnow-postgres"; then
    echo -e "${YELLOW}[BACKEND]${NC} Iniciando contenedor PostgreSQL..."
    docker compose -f "$BACK_DIR/docker-compose.yml" up -d postgres
    echo -e "${GREEN}[BACKEND]${NC} PostgreSQL iniciado, esperando 5s..."
    sleep 5
else
    echo -e "${GREEN}[BACKEND]${NC} PostgreSQL ya está corriendo"
fi

if [ ! -d "$BACK_DIR/node_modules" ]; then
    echo -e "${YELLOW}[BACKEND]${NC} Instalando dependencias..."
    npm install --prefix "$BACK_DIR"
fi

echo -e "${YELLOW}[BACKEND]${NC} Aplicando migraciones de Prisma..."
cd "$BACK_DIR" && npx prisma migrate deploy 2>/dev/null || true
npx prisma generate
cd "$ROOT_DIR"

# ── Frontend ─────────────────────────────────────────────

if [ ! -f "$FRONT_DIR/node_modules/.bin/next" ]; then
    echo -e "${YELLOW}[FRONTEND]${NC} Instalando dependencias..."
    npm install --prefix "$FRONT_DIR"
fi

# ── Arrancar ambos en paralelo ────────────────────────────

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Iniciando servidores${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC}  http://localhost:8000"
echo -e "${YELLOW}Frontend:${NC} http://localhost:3000"
echo -e "${YELLOW}DB:${NC}       PostgreSQL en localhost:5432"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener ambos${NC}"
echo ""

# Trap para matar ambos procesos al hacer Ctrl+C
trap 'kill %1 %2 2>/dev/null; exit 0' SIGINT SIGTERM

cd "$BACK_DIR" && npm run start:dev &
cd "$FRONT_DIR" && npm run dev &

wait
