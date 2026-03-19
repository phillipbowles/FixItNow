# FixItNow API Documentation

Documentación completa de la API REST del backend de FixItNow.

**Base URL:** `http://localhost:3000`

**Formato de respuesta:** JSON

**Autenticación:** JWT Bearer Token (excepto endpoints públicos)

---

## Índice

1. [Autenticación](#autenticación)
2. [Servicios](#servicios)
3. [Disponibilidades](#disponibilidades)
4. [Reservas (Bookings)](#reservas-bookings)
5. [Códigos de Estado HTTP](#códigos-de-estado-http)
6. [Modelos de Datos](#modelos-de-datos)

---

## Autenticación

### 1. Registrar Usuario

Registra un nuevo usuario en el sistema como Proveedor o Consumidor.

**Endpoint:** `POST /auth/register`

**Autenticación:** No requiere

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | Sí | Email único del usuario |
| password | string | Sí | Contraseña (mínimo 6 caracteres) |
| firstName | string | Sí | Nombre del usuario |
| lastName | string | Sí | Apellido del usuario |
| phone | string | Sí | Número de teléfono |
| address | string | No | Dirección del usuario |
| role | string | Sí | Rol: `"PROVIDER"` o `"CONSUMER"` |

**Ejemplo Request:**
```json
{
  "email": "juan@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+1234567890",
  "address": "Calle Principal 123",
  "role": "PROVIDER"
}
```

**Ejemplo Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "juan@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567890",
    "address": "Calle Principal 123",
    "role": "PROVIDER",
    "createdAt": "2025-11-16T20:34:15.690Z",
    "updatedAt": "2025-11-16T20:34:15.690Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `409 Conflict` - Email ya registrado
- `400 Bad Request` - Datos de validación inválidos

---

### 2. Iniciar Sesión

Autentica un usuario y retorna un token JWT.

**Endpoint:** `POST /auth/login`

**Autenticación:** No requiere

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | Sí | Email del usuario |
| password | string | Sí | Contraseña del usuario |

**Ejemplo Request:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Ejemplo Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "juan@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567890",
    "address": "Calle Principal 123",
    "role": "PROVIDER",
    "createdAt": "2025-11-16T20:34:15.690Z",
    "updatedAt": "2025-11-16T20:34:15.690Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `401 Unauthorized` - Credenciales inválidas

---

### 3. Obtener Perfil

Obtiene la información del usuario autenticado.

**Endpoint:** `GET /auth/me`

**Autenticación:** Requerida (JWT)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo Response (200 OK):**
```json
{
  "id": "uuid-here",
  "email": "juan@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+1234567890",
  "address": "Calle Principal 123",
  "role": "PROVIDER",
  "createdAt": "2025-11-16T20:34:15.690Z",
  "updatedAt": "2025-11-16T20:34:15.690Z"
}
```

**Errores:**
- `401 Unauthorized` - Token inválido o no proporcionado

---

## Servicios

### 1. Crear Servicio

Crea un nuevo servicio. Solo disponible para usuarios con rol `PROVIDER`.

**Endpoint:** `POST /services`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| title | string | Sí | Título del servicio |
| description | string | Sí | Descripción del servicio |
| price | number | Sí | Precio del servicio (debe ser >= 0) |
| isActive | boolean | No | Si el servicio está activo (default: true) |

**Ejemplo Request:**
```json
{
  "title": "Plomería Residencial",
  "description": "Reparación e instalación de sistemas de plomería en hogares",
  "price": 75.50,
  "isActive": true
}
```

**Ejemplo Response (201 Created):**
```json
{
  "id": "service-uuid",
  "title": "Plomería Residencial",
  "description": "Reparación e instalación de sistemas de plomería en hogares",
  "price": "75.5",
  "isActive": true,
  "providerId": "provider-uuid",
  "createdAt": "2025-11-16T21:08:21.594Z",
  "updatedAt": "2025-11-16T21:08:21.594Z",
  "provider": {
    "id": "provider-uuid",
    "email": "juan@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567890"
  }
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Usuario no es PROVIDER
- `400 Bad Request` - Datos de validación inválidos

---

### 2. Listar Servicios

Lista servicios según el rol del usuario:
- **PROVIDER:** Ve solo sus propios servicios
- **CONSUMER:** Ve solo servicios activos

**Endpoint:** `GET /services`

**Autenticación:** Requerida (JWT)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo Response (200 OK):**
```json
[
  {
    "id": "service-uuid",
    "title": "Plomería Residencial",
    "description": "Reparación e instalación de sistemas de plomería",
    "price": "75.5",
    "isActive": true,
    "providerId": "provider-uuid",
    "createdAt": "2025-11-16T21:08:21.594Z",
    "updatedAt": "2025-11-16T21:08:21.594Z",
    "provider": {
      "id": "provider-uuid",
      "email": "juan@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "+1234567890"
    },
    "availabilities": [
      {
        "id": "avail-uuid",
        "serviceId": "service-uuid",
        "dayOfWeek": "MONDAY",
        "startTime": "09:00",
        "endTime": "17:00",
        "createdAt": "2025-11-16T21:08:47.612Z",
        "updatedAt": "2025-11-16T21:08:47.612Z"
      }
    ]
  }
]
```

---

### 3. Obtener Servicio por ID

Obtiene los detalles de un servicio específico.

**Endpoint:** `GET /services/:id`

**Autenticación:** No requiere

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID del servicio |

**Ejemplo Response (200 OK):**
```json
{
  "id": "service-uuid",
  "title": "Plomería Residencial",
  "description": "Reparación e instalación de sistemas de plomería",
  "price": "75.5",
  "isActive": true,
  "providerId": "provider-uuid",
  "createdAt": "2025-11-16T21:08:21.594Z",
  "updatedAt": "2025-11-16T21:08:21.594Z",
  "provider": {
    "id": "provider-uuid",
    "email": "juan@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567890",
    "address": "Calle Principal 123"
  },
  "availabilities": [...]
}
```

**Errores:**
- `404 Not Found` - Servicio no encontrado

---

### 4. Actualizar Servicio

Actualiza un servicio existente. Solo el proveedor dueño puede actualizar.

**Endpoint:** `PATCH /services/:id`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER` y dueño del servicio

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID del servicio |

**Body Parameters:** (Todos opcionales)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| title | string | Título del servicio |
| description | string | Descripción del servicio |
| price | number | Precio del servicio |
| isActive | boolean | Estado activo/inactivo |

**Ejemplo Request:**
```json
{
  "price": 85.00,
  "isActive": false
}
```

**Ejemplo Response (200 OK):**
```json
{
  "id": "service-uuid",
  "title": "Plomería Residencial",
  "description": "Reparación e instalación de sistemas de plomería",
  "price": "85",
  "isActive": false,
  "providerId": "provider-uuid",
  "createdAt": "2025-11-16T21:08:21.594Z",
  "updatedAt": "2025-11-16T21:15:30.123Z",
  "provider": {...},
  "availabilities": [...]
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No es el dueño del servicio
- `404 Not Found` - Servicio no encontrado

---

### 5. Eliminar Servicio

Elimina un servicio. Solo el proveedor dueño puede eliminar.

**Endpoint:** `DELETE /services/:id`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER` y dueño del servicio

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID del servicio |

**Ejemplo Response (200 OK):**
```json
{
  "id": "service-uuid",
  "title": "Plomería Residencial",
  ...
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No es el dueño del servicio
- `404 Not Found` - Servicio no encontrado

---

## Disponibilidades

### 1. Crear Disponibilidad

Crea una disponibilidad para un servicio. Define en qué días y horarios está disponible el servicio.

**Endpoint:** `POST /availabilities`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER` y dueño del servicio

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| serviceId | string (UUID) | Sí | ID del servicio |
| dayOfWeek | string | Sí | Día: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |
| startTime | string | Sí | Hora inicio (formato HH:mm, ej: "09:00") |
| endTime | string | Sí | Hora fin (formato HH:mm, ej: "17:00") |

**Ejemplo Request:**
```json
{
  "serviceId": "service-uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Ejemplo Response (201 Created):**
```json
{
  "id": "availability-uuid",
  "serviceId": "service-uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "17:00",
  "createdAt": "2025-11-16T21:08:47.612Z",
  "updatedAt": "2025-11-16T21:08:47.612Z"
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No es el dueño del servicio
- `404 Not Found` - Servicio no encontrado
- `400 Bad Request` - Validación inválida (ej: startTime >= endTime)

---

### 2. Listar Disponibilidades por Servicio

Lista todas las disponibilidades de un servicio específico.

**Endpoint:** `GET /availabilities?serviceId=:serviceId`

**Autenticación:** No requiere

**Query Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| serviceId | string (UUID) | Sí | ID del servicio |

**Ejemplo Request:**
```
GET /availabilities?serviceId=service-uuid
```

**Ejemplo Response (200 OK):**
```json
[
  {
    "id": "availability-uuid-1",
    "serviceId": "service-uuid",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "17:00",
    "createdAt": "2025-11-16T21:08:47.612Z",
    "updatedAt": "2025-11-16T21:08:47.612Z"
  },
  {
    "id": "availability-uuid-2",
    "serviceId": "service-uuid",
    "dayOfWeek": "TUESDAY",
    "startTime": "10:00",
    "endTime": "18:00",
    "createdAt": "2025-11-16T21:08:47.680Z",
    "updatedAt": "2025-11-16T21:08:47.680Z"
  }
]
```

---

### 3. Obtener Disponibilidad por ID

Obtiene los detalles de una disponibilidad específica.

**Endpoint:** `GET /availabilities/:id`

**Autenticación:** No requiere

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID de la disponibilidad |

**Ejemplo Response (200 OK):**
```json
{
  "id": "availability-uuid",
  "serviceId": "service-uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "17:00",
  "createdAt": "2025-11-16T21:08:47.612Z",
  "updatedAt": "2025-11-16T21:08:47.612Z",
  "service": {
    "id": "service-uuid",
    "title": "Plomería Residencial",
    "provider": {...}
  }
}
```

**Errores:**
- `404 Not Found` - Disponibilidad no encontrada

---

### 4. Actualizar Disponibilidad

Actualiza una disponibilidad existente. Solo el proveedor dueño puede actualizar.

**Endpoint:** `PATCH /availabilities/:id`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER` y dueño del servicio

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID de la disponibilidad |

**Body Parameters:** (Todos opcionales)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| dayOfWeek | string | Día de la semana |
| startTime | string | Hora inicio (HH:mm) |
| endTime | string | Hora fin (HH:mm) |

**Ejemplo Request:**
```json
{
  "startTime": "08:00",
  "endTime": "16:00"
}
```

**Ejemplo Response (200 OK):**
```json
{
  "id": "availability-uuid",
  "serviceId": "service-uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "08:00",
  "endTime": "16:00",
  "createdAt": "2025-11-16T21:08:47.612Z",
  "updatedAt": "2025-11-16T21:20:15.123Z"
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No es el dueño del servicio
- `404 Not Found` - Disponibilidad no encontrada
- `400 Bad Request` - Validación inválida

---

### 5. Eliminar Disponibilidad

Elimina una disponibilidad. Solo el proveedor dueño puede eliminar.

**Endpoint:** `DELETE /availabilities/:id`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `PROVIDER` y dueño del servicio

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID de la disponibilidad |

**Ejemplo Response (200 OK):**
```json
{
  "id": "availability-uuid",
  "serviceId": "service-uuid",
  "dayOfWeek": "MONDAY",
  ...
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No es el dueño del servicio
- `404 Not Found` - Disponibilidad no encontrada

---

## Reservas (Bookings)

### 1. Crear Reserva

Crea una nueva reserva para un servicio. Solo disponible para usuarios `CONSUMER`.

**Endpoint:** `POST /bookings`

**Autenticación:** Requerida (JWT)

**Permisos:** Solo `CONSUMER`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| serviceId | string (UUID) | Sí | ID del servicio a reservar |
| date | string | Sí | Fecha de la reserva (formato YYYY-MM-DD) |
| startTime | string | Sí | Hora inicio (formato HH:mm) |
| endTime | string | Sí | Hora fin (formato HH:mm) |
| notes | string | No | Notas adicionales |

**Validaciones automáticas:**
- La fecha no puede estar en el pasado
- El servicio debe estar activo
- El horario debe estar dentro de la disponibilidad del servicio
- No puede haber otra reserva en el mismo horario (PENDING o CONFIRMED)
- El día de la semana debe coincidir con la disponibilidad
- El consumidor no puede reservar su propio servicio

**Ejemplo Request:**
```json
{
  "serviceId": "service-uuid",
  "date": "2025-11-24",
  "startTime": "10:00",
  "endTime": "11:00",
  "notes": "Por favor traer las herramientas necesarias"
}
```

**Ejemplo Response (201 Created):**
```json
{
  "id": "booking-uuid",
  "serviceId": "service-uuid",
  "consumerId": "consumer-uuid",
  "date": "2025-11-24T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "PENDING",
  "notes": "Por favor traer las herramientas necesarias",
  "createdAt": "2025-11-16T21:12:52.901Z",
  "updatedAt": "2025-11-16T21:12:52.901Z",
  "service": {
    "id": "service-uuid",
    "title": "Plomería Residencial",
    "description": "Reparación e instalación de sistemas de plomería",
    "price": "75.5",
    "provider": {
      "id": "provider-uuid",
      "email": "juan@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "+1234567890"
    }
  },
  "consumer": {
    "id": "consumer-uuid",
    "email": "maria@example.com",
    "firstName": "María",
    "lastName": "García",
    "phone": "+9876543210",
    "address": "Avenida Central 456"
  }
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Usuario no es CONSUMER
- `404 Not Found` - Servicio no encontrado
- `400 Bad Request` - Validaciones:
  - Servicio no activo
  - Fecha en el pasado
  - Horario no disponible
  - Conflicto de horarios
  - Intentando reservar propio servicio

---

### 2. Listar Reservas

Lista las reservas según el rol del usuario:
- **CONSUMER:** Ve sus propias reservas
- **PROVIDER:** Ve las reservas de sus servicios

**Endpoint:** `GET /bookings`

**Autenticación:** Requerida (JWT)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo Response (200 OK) - Consumer:**
```json
[
  {
    "id": "booking-uuid",
    "serviceId": "service-uuid",
    "consumerId": "consumer-uuid",
    "date": "2025-11-24T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "PENDING",
    "notes": "Por favor traer las herramientas necesarias",
    "createdAt": "2025-11-16T21:12:52.901Z",
    "updatedAt": "2025-11-16T21:12:52.901Z",
    "service": {
      "id": "service-uuid",
      "title": "Plomería Residencial",
      "provider": {...}
    }
  }
]
```

**Ejemplo Response (200 OK) - Provider:**
```json
[
  {
    "id": "booking-uuid",
    "serviceId": "service-uuid",
    "consumerId": "consumer-uuid",
    "date": "2025-11-24T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "CONFIRMED",
    "notes": "Por favor traer las herramientas necesarias",
    "createdAt": "2025-11-16T21:12:52.901Z",
    "updatedAt": "2025-11-16T21:15:30.456Z",
    "service": {...},
    "consumer": {
      "id": "consumer-uuid",
      "email": "maria@example.com",
      "firstName": "María",
      "lastName": "García",
      "phone": "+9876543210",
      "address": "Avenida Central 456"
    }
  }
]
```

---

### 3. Obtener Reserva por ID

Obtiene los detalles de una reserva específica. Solo el consumidor dueño o el proveedor del servicio pueden verla.

**Endpoint:** `GET /bookings/:id`

**Autenticación:** Requerida (JWT)

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID de la reserva |

**Ejemplo Response (200 OK):**
```json
{
  "id": "booking-uuid",
  "serviceId": "service-uuid",
  "consumerId": "consumer-uuid",
  "date": "2025-11-24T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "CONFIRMED",
  "notes": "Por favor traer las herramientas necesarias",
  "createdAt": "2025-11-16T21:12:52.901Z",
  "updatedAt": "2025-11-16T21:15:30.456Z",
  "service": {
    "id": "service-uuid",
    "title": "Plomería Residencial",
    "provider": {...}
  },
  "consumer": {
    "id": "consumer-uuid",
    "email": "maria@example.com",
    "firstName": "María",
    "lastName": "García",
    "phone": "+9876543210",
    "address": "Avenida Central 456"
  }
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No tiene acceso a esta reserva
- `404 Not Found` - Reserva no encontrada

---

### 4. Actualizar Estado de Reserva

Actualiza el estado de una reserva.

**Permisos:**
- **CONSUMER:** Solo puede cambiar a `CANCELLED`
- **PROVIDER:** Puede cambiar a `CONFIRMED`, `COMPLETED`, o `CANCELLED`

**Flujo de estados:**
- `PENDING` → `CONFIRMED` (solo provider)
- `CONFIRMED` → `COMPLETED` (solo provider)
- Cualquier estado → `CANCELLED` (consumer o provider)

**Endpoint:** `PATCH /bookings/:id/status`

**Autenticación:** Requerida (JWT)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | ID de la reserva |

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| status | string | Sí | Nuevo estado: `CONFIRMED`, `COMPLETED`, `CANCELLED` |

**Ejemplo Request (Provider confirma):**
```json
{
  "status": "CONFIRMED"
}
```

**Ejemplo Response (200 OK):**
```json
{
  "id": "booking-uuid",
  "serviceId": "service-uuid",
  "consumerId": "consumer-uuid",
  "date": "2025-11-24T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "CONFIRMED",
  "notes": "Por favor traer las herramientas necesarias",
  "createdAt": "2025-11-16T21:12:52.901Z",
  "updatedAt": "2025-11-16T21:15:30.456Z",
  "service": {...},
  "consumer": {...}
}
```

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No tiene permiso para cambiar el estado
- `404 Not Found` - Reserva no encontrada
- `400 Bad Request` - Transición de estado inválida

---

## Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Petición exitosa (GET, PATCH, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 400 | Bad Request | Datos de validación inválidos |
| 401 | Unauthorized | No autenticado o token inválido |
| 403 | Forbidden | Autenticado pero sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado) |
| 500 | Internal Server Error | Error del servidor |

---

## Modelos de Datos

### User

```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hasheada, no se retorna en responses)
  firstName: string
  lastName: string
  phone: string
  address?: string
  role: "PROVIDER" | "CONSUMER"
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Service

```typescript
{
  id: string (UUID)
  title: string
  description: string
  price: Decimal
  isActive: boolean
  providerId: string (UUID, FK a User)
  createdAt: DateTime
  updatedAt: DateTime

  // Relaciones
  provider: User
  availabilities: Availability[]
  bookings: Booking[]
}
```

### Availability

```typescript
{
  id: string (UUID)
  serviceId: string (UUID, FK a Service)
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
  startTime: string (formato "HH:mm")
  endTime: string (formato "HH:mm")
  createdAt: DateTime
  updatedAt: DateTime

  // Relaciones
  service: Service
}
```

### Booking

```typescript
{
  id: string (UUID)
  serviceId: string (UUID, FK a Service)
  consumerId: string (UUID, FK a User)
  date: DateTime
  startTime: string (formato "HH:mm")
  endTime: string (formato "HH:mm")
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime

  // Relaciones
  service: Service
  consumer: User
}
```

---

## Ejemplos de Flujos Completos

### Flujo 1: Proveedor Crea un Servicio con Disponibilidad

```bash
# 1. Registrar proveedor
POST /auth/register
{
  "email": "juan@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+1234567890",
  "role": "PROVIDER"
}
# Guardar el access_token

# 2. Crear servicio
POST /services
Authorization: Bearer <token>
{
  "title": "Plomería Residencial",
  "description": "Reparación e instalación de sistemas de plomería",
  "price": 75.50
}
# Guardar el serviceId

# 3. Crear disponibilidad para Lunes
POST /availabilities
Authorization: Bearer <token>
{
  "serviceId": "<serviceId>",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "17:00"
}

# 4. Crear disponibilidad para Martes
POST /availabilities
Authorization: Bearer <token>
{
  "serviceId": "<serviceId>",
  "dayOfWeek": "TUESDAY",
  "startTime": "10:00",
  "endTime": "18:00"
}
```

### Flujo 2: Consumidor Reserva un Servicio

```bash
# 1. Registrar consumidor
POST /auth/register
{
  "email": "maria@example.com",
  "password": "password123",
  "firstName": "María",
  "lastName": "García",
  "phone": "+9876543210",
  "role": "CONSUMER"
}
# Guardar el access_token

# 2. Ver servicios disponibles
GET /services
Authorization: Bearer <token>

# 3. Ver disponibilidades de un servicio
GET /availabilities?serviceId=<serviceId>

# 4. Crear reserva para un Lunes
POST /bookings
Authorization: Bearer <token>
{
  "serviceId": "<serviceId>",
  "date": "2025-11-24",
  "startTime": "10:00",
  "endTime": "11:00",
  "notes": "Primera reserva"
}
# Guardar el bookingId
```

### Flujo 3: Gestión de Reserva

```bash
# Consumidor ve sus reservas
GET /bookings
Authorization: Bearer <consumer-token>

# Proveedor ve reservas de sus servicios
GET /bookings
Authorization: Bearer <provider-token>

# Proveedor confirma la reserva
PATCH /bookings/<bookingId>/status
Authorization: Bearer <provider-token>
{
  "status": "CONFIRMED"
}

# Después del servicio, proveedor la marca como completada
PATCH /bookings/<bookingId>/status
Authorization: Bearer <provider-token>
{
  "status": "COMPLETED"
}

# O consumidor puede cancelar
PATCH /bookings/<bookingId>/status
Authorization: Bearer <consumer-token>
{
  "status": "CANCELLED"
}
```

---

## Notas Importantes

1. **Autenticación:** Todos los endpoints marcados como "Requerida" necesitan el header `Authorization: Bearer <token>`

2. **Formato de Fechas:**
   - Fechas: `YYYY-MM-DD` (ej: "2025-11-24")
   - Horas: `HH:mm` (ej: "10:00", "17:30")

3. **Validaciones de Horarios:**
   - `startTime` debe ser menor que `endTime`
   - Los horarios de reserva deben estar dentro de la disponibilidad del servicio
   - No puede haber reservas superpuestas

4. **Zona Horaria:**
   - Las fechas se manejan en UTC
   - Los horarios son independientes de la zona horaria

5. **Permisos:**
   - Los PROVIDERS solo pueden crear servicios y disponibilidades
   - Los CONSUMERS solo pueden crear reservas
   - Cada usuario solo puede modificar sus propios recursos

6. **Estados de Reserva:**
   - `PENDING`: Reserva creada, esperando confirmación
   - `CONFIRMED`: Proveedor confirmó la reserva
   - `COMPLETED`: Servicio completado
   - `CANCELLED`: Reserva cancelada

---

## Contacto y Soporte

Para más información o reportar issues, consulta el README.md del proyecto.
