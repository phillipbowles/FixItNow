#!/bin/bash

# Script para detener FixItNow
# Ejecutar: ./stop.sh

echo "🛑 Deteniendo FixItNow..."
docker-compose down
echo "✅ FixItNow detenido!"
