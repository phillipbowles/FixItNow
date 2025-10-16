#!/bin/bash

# Script de inicio rápido para FixItNow
# Ejecutar: ./start.sh

echo "🚀 Iniciando FixItNow..."
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Levantar servicios
echo "📦 Levantando servicios..."
docker-compose up -d

echo ""
echo "✅ FixItNow está corriendo!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend:       http://localhost:3000"
echo "   API Gateway:    http://localhost:8000"
echo "   API Docs:       http://localhost:8000/docs"
echo "   RabbitMQ:       http://localhost:15672 (admin/admin123)"
echo "   Grafana:        http://localhost:3001 (admin/admin123)"
echo "   Prometheus:     http://localhost:9090"
echo ""
echo "📊 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Detener:"
echo "   ./stop.sh"
echo ""
