# FixItNow Backend

Backend API para la plataforma FixItNow, una aplicación que conecta proveedores de servicios con consumidores.

## Tecnologías

- **NestJS** - Framework de Node.js
- **PostgreSQL** - Base de datos relacional
- **Prisma** - ORM para TypeScript
- **Docker** - Containerización
- **JWT** - Autenticación basada en tokens
- **TypeScript** - Lenguaje de programación

## Características

- Autenticación con JWT (registro e inicio de sesión)
- Dos tipos de usuarios: Proveedores y Consumidores
- CRUD completo de servicios (solo proveedores)
- Gestión de disponibilidad por servicio
- Sistema de reservas con validaciones
- Estados de reserva: PENDING, CONFIRMED, COMPLETED, CANCELLED
- Validación de disponibilidad y prevención de conflictos de horarios

## Requisitos Previos

- Node.js 18+ y npm
- Docker y Docker Compose (para desarrollo con containers)
- PostgreSQL 15+ (si no usas Docker)

## Instalación

### Opción 1: Con Docker (Recomendado)

1. Clona el repositorio y navega al directorio backend:
```bash
cd backend
```

2. Crea el archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Inicia los servicios con Docker Compose:
```bash
docker-compose up -d
```

La aplicación estará disponible en `http://localhost:3000`

4. Para ver los logs:
```bash
docker-compose logs -f app
```

5. Para detener los servicios:
```bash
docker-compose down
```

### Opción 2: Desarrollo Local

1. Instala las dependencias:
```bash
npm install
```

2. Crea el archivo `.env`:
```bash
cp .env.example .env
```

3. Asegúrate de tener PostgreSQL corriendo y actualiza la `DATABASE_URL` en `.env`

4. Genera el cliente de Prisma:
```bash
npm run prisma:generate
```

5. Ejecuta las migraciones:
```bash
npm run prisma:migrate
```

6. Inicia el servidor en modo desarrollo:
```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

## Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Database
DATABASE_URL="postgresql://fixitnow:fixitnow123@localhost:5432/fixitnow?schema=public"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV="development"
```

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Inicia en modo desarrollo con hot-reload

# Producción
npm run build              # Compila la aplicación
npm run start:prod         # Inicia en modo producción

# Prisma
npm run prisma:generate    # Genera el cliente de Prisma
npm run prisma:migrate     # Ejecuta migraciones
npm run prisma:studio      # Abre Prisma Studio (GUI para la DB)

# Utilidades
npm run lint               # Ejecuta el linter
npm run format             # Formatea el código
```

## Estructura del Proyecto

```
src/
├── auth/                  # Módulo de autenticación
│   ├── decorators/        # Decoradores personalizados
│   ├── dto/               # DTOs para registro y login
│   ├── guards/            # Guards JWT y roles
│   ├── strategies/        # Estrategia JWT
│   └── auth.module.ts
├── availabilities/        # Módulo de disponibilidad
│   ├── dto/
│   └── availabilities.module.ts
├── bookings/              # Módulo de reservas
│   ├── dto/
│   └── bookings.module.ts
├── services/              # Módulo de servicios
│   ├── dto/
│   └── services.module.ts
├── prisma/                # Servicio de Prisma
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── main.ts                # Punto de entrada
```

## API Endpoints

### Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener perfil del usuario autenticado

### Servicios

- `POST /services` - Crear servicio (solo proveedores)
- `GET /services` - Listar servicios
- `GET /services/:id` - Obtener detalle de servicio
- `PATCH /services/:id` - Actualizar servicio (solo dueño)
- `DELETE /services/:id` - Eliminar servicio (solo dueño)

### Disponibilidad

- `POST /availabilities` - Crear disponibilidad (solo proveedores)
- `GET /availabilities?serviceId=:id` - Listar disponibilidades de un servicio
- `GET /availabilities/:id` - Obtener detalle de disponibilidad
- `PATCH /availabilities/:id` - Actualizar disponibilidad (solo dueño)
- `DELETE /availabilities/:id` - Eliminar disponibilidad (solo dueño)

### Reservas

- `POST /bookings` - Crear reserva (solo consumidores)
- `GET /bookings` - Listar reservas del usuario
- `GET /bookings/:id` - Obtener detalle de reserva
- `PATCH /bookings/:id/status` - Actualizar estado de reserva

## Ejemplos de Uso

### 1. Registrar un Proveedor

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "role": "PROVIDER"
  }'
```

### 2. Crear un Servicio

```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Plomería Residencial",
    "description": "Servicios de plomería para el hogar",
    "price": 50.00,
    "isActive": true
  }'
```

### 3. Agregar Disponibilidad

```bash
curl -X POST http://localhost:3000/availabilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceId": "SERVICE_ID",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "17:00"
  }'
```

### 4. Crear una Reserva (como Consumidor)

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceId": "SERVICE_ID",
    "date": "2025-12-01",
    "startTime": "10:00",
    "endTime": "11:00",
    "notes": "Por favor traer las herramientas necesarias"
  }'
```

### 5. Actualizar Estado de Reserva (como Proveedor)

```bash
curl -X PATCH http://localhost:3000/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "CONFIRMED"
  }'
```

## Modelos de Datos

### User
- id (UUID)
- email (único)
- password (hasheada)
- firstName, lastName
- phone, address
- role (PROVIDER | CONSUMER)

### Service
- id (UUID)
- title, description
- price (Decimal)
- isActive (Boolean)
- providerId (FK a User)

### Availability
- id (UUID)
- serviceId (FK a Service)
- dayOfWeek (MONDAY - SUNDAY)
- startTime, endTime (formato HH:mm)

### Booking
- id (UUID)
- serviceId (FK a Service)
- consumerId (FK a User)
- date (DateTime)
- startTime, endTime (formato HH:mm)
- status (PENDING | CONFIRMED | COMPLETED | CANCELLED)
- notes (opcional)

## Validaciones de Negocio

- Los proveedores no pueden reservar sus propios servicios
- Las reservas solo se pueden hacer en fechas futuras
- Se valida que el horario solicitado esté dentro de la disponibilidad del servicio
- Se previenen reservas con horarios superpuestos
- Los consumidores solo pueden cancelar sus reservas
- Los proveedores pueden confirmar, completar o cancelar reservas

## Prisma Studio

Para explorar la base de datos con una GUI:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## Troubleshooting

### Error de conexión a la base de datos

Si usas Docker, asegúrate de que los contenedores estén corriendo:
```bash
docker-compose ps
```

### Regenerar el cliente de Prisma

Si hay errores con Prisma:
```bash
npm run prisma:generate
```

### Resetear la base de datos

⚠️ Esto eliminará todos los datos:
```bash
npx prisma migrate reset
```

## Contribuir

1. Crea un branch para tu feature
2. Haz tus cambios
3. Asegúrate de que el código pase el linter: `npm run lint`
4. Crea un Pull Request

## Licencia

MIT
