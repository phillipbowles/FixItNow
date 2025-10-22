# 🚀 FixItNow - Plataforma de Servicios Profesionales

**Proyecto académico de Sistemas Distribuidos** - Arquitectura de Microservicios con Event-Driven Architecture

## 🏗️ Arquitectura

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI (6 microservicios)
- **Message Broker**: RabbitMQ (Event-Driven Architecture)
- **Base de Datos**: PostgreSQL 15
- **Cache**: Redis 7
- **Orquestación**: Docker Compose / Kubernetes

## 📋 Microservicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **API Gateway** | 8000 | Punto de entrada único, rate limiting, routing |
| **Auth Service** | 8001 | Autenticación JWT, gestión de usuarios |
| **Catalog Service** | 8002 | Catálogo de servicios, reviews, búsqueda |
| **Booking Service** | 8003 | Reservas, WebSockets para chat en tiempo real |
| **Notification Service** | 8004 | Notificaciones por eventos (EDA) |
| **Admin Service** | 8005 | Panel administrativo, métricas |

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker Desktop (>= 20.10)
- Docker Compose (>= 2.0)
- 8GB RAM mínimo
- 10GB espacio en disco

### Instalación

```bash
# 1. Clonar o navegar al proyecto
cd /Users/manuelperez/Facultad/SistemasDigitales/FixItNow

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker-compose up -d

# 4. Ver logs
docker-compose logs -f

# 5. Verificar estado
docker-compose ps
```

### Acceso a la Aplicación

Una vez que todos los servicios estén corriendo:

- 🌐 **Frontend**: http://localhost:3000
- 📚 **API Gateway**: http://localhost:8000
- 📖 **API Docs (Swagger)**: http://localhost:8000/docs
- 🐰 **RabbitMQ Admin**: http://localhost:15672 (admin/admin123)
- 📊 **Grafana**: http://localhost:3001 (admin/admin123)
- 🔍 **Prometheus**: http://localhost:9090

## 👥 Usuarios de Prueba

La base de datos incluye usuarios de ejemplo (contraseña: `password123`):

- **Admin**: `admin@fixitnow.com`
- **Proveedor**: `juan.perez@email.com`
- **Usuario**: `carlos.rodriguez@email.com`

## 📊 Base de Datos

Ver el **diagrama interactivo** completo en los artifacts de la conversación.

### Tablas Principales

- `users` - Usuarios, proveedores y administradores
- `services` - Catálogo de servicios ofrecidos
- `bookings` - Solicitudes y reservas de servicios
- `reviews` - Reseñas y calificaciones

## 🎓 Conceptos de Sistemas Distribuidos Aplicados

### ✅ Arquitectura de Microservicios
- **Separación de responsabilidades**: 6 servicios independientes
- **Escalabilidad horizontal**: Cada servicio puede escalarse independientemente
- **Resiliencia**: Fallo de un servicio no afecta al sistema completo
- **Despliegue independiente**: Deploy sin downtime

### ✅ Event-Driven Architecture (EDA)
- **Message Broker**: RabbitMQ con Topic Exchange
- **Publicación/Suscripción**: Servicios desacoplados mediante eventos
- **Eventos**:
  - `user.registered` → Notification Service
  - `booking.service_requested` → Notification + Admin Services
  - `booking.status_changed` → Notification Service
  - `catalog.review_created` → Notification Service

### ✅ Comunicación Distribuida

| Tipo | Tecnología | Uso |
|------|------------|-----|
| **Síncrona** | REST API | Frontend ↔ API Gateway |
| **Síncrona** | gRPC (opcional) | Microservicio ↔ Microservicio |
| **Asíncrona** | RabbitMQ | Event-Driven Architecture |
| **Tiempo Real** | WebSockets | Chat en vivo bidireccional |

### ✅ 12Factor App

| Factor | Implementación |
|--------|----------------|
| I. Codebase | Git repository único |
| III. Config | Variables de entorno (.env) |
| VI. Procesos | Servicios stateless |
| VII. Port binding | Cada servicio en su puerto |
| VIII. Concurrencia | Async/await, múltiples workers |
| XI. Logs | Logs como event streams (stdout) |
| XII. Admin | Scripts de inicialización |

### ✅ Contenedorización y Orquestación
- **Docker**: Cada servicio en su contenedor
- **Docker Compose**: Orquestación local
- **Kubernetes**: Manifiestos para producción (ver `/infrastructure/kubernetes`)

### ✅ Observabilidad
- **Logs**: Centralizados con timestamps
- **Métricas**: Prometheus para recolección
- **Visualización**: Grafana dashboards
- **Health Checks**: Endpoints `/` en cada servicio

## 📁 Estructura del Proyecto

```
FixItNow/
├── docker-compose.yml          # Orquestación de servicios
├── .env.example                # Variables de entorno
├── README.md
│
├── backend/
│   ├── api-gateway/           # Puerto 8000 - Gateway unificado
│   ├── auth-service/          # Puerto 8001 - Autenticación
│   ├── catalog-service/       # Puerto 8002 - Catálogo
│   ├── booking-service/       # Puerto 8003 - Reservas + WebSockets
│   ├── notification-service/  # Puerto 8004 - Notificaciones (EDA)
│   └── admin-service/         # Puerto 8005 - Panel admin
│
├── frontend/                  # Next.js
│   ├── app/                  # Pages
│   ├── components/           # Componentes React
│   └── stores/               # State management (Zustand)
│
└── infrastructure/
    ├── db/
    │   └── init.sql          # Schema + datos de ejemplo
    ├── kubernetes/           # Manifiestos K8s
    └── monitoring/           # Prometheus + Grafana
```

## 🔧 Comandos Útiles

### Docker Compose

```bash
# Levantar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Reiniciar un servicio
docker-compose restart booking-service

# Reconstruir imágenes
docker-compose build --no-cache

# Eliminar todo (incluye volúmenes)
docker-compose down -v
```

### Testing

```bash
# Probar API Gateway
curl http://localhost:8000/

# Probar Auth Service
curl http://localhost:8001/

# Probar login
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@fixitnow.com&password=password123"
```

## 🧪 Testing del Chat en Tiempo Real

El Booking Service incluye WebSockets para chat bidireccional:

```javascript
// JavaScript client example
const ws = new WebSocket('ws://localhost:8003/ws/bookings/1/chat?user_id=1');

ws.onopen = () => {
  ws.send(JSON.stringify({ message: 'Hola!' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## 📈 Escalado

### Horizontal

```bash
# Escalar un servicio a 3 réplicas
docker-compose up -d --scale auth-service=3
```

### Kubernetes

```bash
# Aplicar manifiestos
kubectl apply -f infrastructure/kubernetes/

# Ver pods
kubectl get pods

# Escalar deployment
kubectl scale deployment auth-service --replicas=5
```

## 🛡️ Seguridad

- ✅ Autenticación JWT
- ✅ Passwords hasheados con bcrypt
- ✅ CORS configurado
- ✅ Rate limiting en API Gateway
- ✅ Validación de datos con Pydantic
- ✅ SQL Injection protection (ORM)

## 🔄 Flujo de Usuario Típico

1. **Registro/Login** → Auth Service genera JWT
2. **Buscar Servicios** → Catalog Service con cache Redis
3. **Crear Solicitud** → Booking Service + evento a RabbitMQ
4. **Notificación** → Notification Service recibe evento y envía email
5. **Chat en Vivo** → WebSocket bidireccional en Booking Service
6. **Completar Servicio** → Estado actualizado + evento
7. **Dejar Review** → Catalog Service actualiza rating

## 🐛 Troubleshooting

### Servicios no inician

```bash
# Ver logs detallados
docker-compose logs -f

# Verificar salud de infraestructura
docker-compose ps postgres redis rabbitmq
```

### Base de datos no se inicializa

```bash
# Recrear volúmenes
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

### Puerto en uso

```bash
# Ver qué usa el puerto
lsof -i :3000

# Cambiar puerto en docker-compose.yml
```

## 📚 Recursos

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js Docs](https://nextjs.org/docs)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [12Factor App](https://12factor.net/)

## 👨‍💻 Desarrollo

### Agregar un nuevo microservicio

1. Crear carpeta en `backend/nuevo-servicio/`
2. Agregar `Dockerfile`, `requirements.txt`, `main.py`
3. Agregar al `docker-compose.yml`
4. Conectar a RabbitMQ para eventos
5. Actualizar API Gateway routing

### Agregar una nueva página frontend

1. Crear en `frontend/app/nueva-pagina/page.tsx`
2. Usar componentes compartidos de `frontend/components/`
3. Gestionar estado con Zustand si es necesario


## 🎓 Autores

**Joaquin Porteiro, Phillip Bowles y Manuel Pérez** - Sistemas Distribuidos 2025  
Universidad: Facultad de Ingeniería


---

**FixItNow** - Conectando usuarios con profesionales de calidad 🛠️

*Proyecto académico demostrando conceptos de Sistemas Distribuidos, Microservicios y Event-Driven Architecture*
