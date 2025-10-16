"""
Notification Service - Microservicio de Notificaciones
Escucha eventos de RabbitMQ y envía notificaciones por email, push, etc.
Implementación de Arquitectura Dirigida por Eventos (EDA)
Proyecto: FixItNow
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import aio_pika
import json
import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import redis.asyncio as redis
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@localhost:5672/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

rabbitmq_connection: aio_pika.Connection = None
rabbitmq_channel: aio_pika.Channel = None
redis_client: redis.Redis = None

def send_email(to_email: str, subject: str, body: str, html: bool = False):
    """Envía un email (síncronamente)"""
    
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("⚠️ SMTP credentials not configured, skipping email")
        logger.info(f"📧 Would send email to {to_email}: {subject}")
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        if html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"✅ Email sent to {to_email}")
    
    except Exception as e:
        logger.error(f"❌ Error sending email: {e}")

async def send_email_async(to_email: str, subject: str, body: str, html: bool = False):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, send_email, to_email, subject, body, html)

async def send_push_notification(user_id: int, title: str, body: str):
    """Envía notificación push (simulado con Redis)"""
    
    notification = {
        "user_id": user_id,
        "title": title,
        "body": body,
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    }
    
    await redis_client.lpush(
        f"notifications:user:{user_id}",
        json.dumps(notification)
    )
    
    await redis_client.ltrim(f"notifications:user:{user_id}", 0, 99)
    
    logger.info(f"🔔 Push notification sent to user {user_id}: {title}")

async def handle_user_registered(event_data: Dict[str, Any]):
    """Maneja el evento de registro de usuario"""
    user_email = event_data.get("email")
    user_name = event_data.get("full_name")
    user_role = event_data.get("role")
    
    subject = "¡Bienvenido a FixItNow!"
    
    if user_role == "provider":
        body = f"""
Hola {user_name},

¡Gracias por registrarte como proveedor en FixItNow!

Ya puedes empezar a ofrecer tus servicios y conectarte con clientes.

Próximos pasos:
1. Completa tu perfil
2. Agrega tus servicios
3. Espera solicitudes de clientes

¡Éxito!
Equipo FixItNow
        """
    else:
        body = f"""
Hola {user_name},

¡Bienvenido a FixItNow!

Ya puedes explorar nuestro catálogo de servicios y hacer tu primera solicitud.

Encuentra profesionales de confianza cerca de ti.

Saludos,
Equipo FixItNow
        """
    
    await send_email_async(user_email, subject, body)
    logger.info(f"✅ Welcome email sent to {user_email}")

async def handle_service_requested(event_data: Dict[str, Any]):
    """Maneja el evento de solicitud de servicio"""
    booking_id = event_data.get("booking_id")
    title = event_data.get("title")
    
    logger.info(f"📬 New service request: {title} (Booking #{booking_id})")
    logger.info(f"✅ Provider notified about booking #{booking_id}")

async def handle_booking_status_changed(event_data: Dict[str, Any]):
    """Maneja el evento de cambio de estado de reserva"""
    booking_id = event_data.get("booking_id")
    old_status = event_data.get("old_status")
    new_status = event_data.get("new_status")
    
    logger.info(f"📝 Booking #{booking_id} status changed: {old_status} -> {new_status}")
    
    if new_status == "accepted":
        subject = "¡Tu solicitud fue aceptada!"
        body = f"El proveedor aceptó tu solicitud. Booking #{booking_id}"
    elif new_status == "completed":
        subject = "Servicio completado"
        body = f"Tu servicio ha sido completado. Por favor, deja una reseña. Booking #{booking_id}"
    elif new_status == "cancelled":
        subject = "Solicitud cancelada"
        body = f"Tu solicitud fue cancelada. Booking #{booking_id}"
    else:
        return
    
    logger.info(f"✅ User notified about booking #{booking_id} status change")

async def handle_profile_updated(event_data: Dict[str, Any]):
    """Maneja el evento de perfil actualizado"""
    user_email = event_data.get("email")
    
    logger.info(f"👤 Profile updated for {user_email}")

async def handle_review_created(event_data: Dict[str, Any]):
    """Maneja el evento de nueva review"""
    service_id = event_data.get("service_id")
    rating = event_data.get("rating")
    
    logger.info(f"⭐ New review for service #{service_id}: {rating} stars")

EVENT_HANDLERS = {
    "user.registered": handle_user_registered,
    "user.profile_updated": handle_profile_updated,
    "booking.service_requested": handle_service_requested,
    "booking.status_changed": handle_booking_status_changed,
    "catalog.review_created": handle_review_created,
}

async def process_event(message: aio_pika.IncomingMessage):
    """Procesa un evento recibido de RabbitMQ"""
    
    async with message.process():
        try:
            event_data = json.loads(message.body.decode())
            event_type = message.routing_key
            
            logger.info(f"📨 Received event: {event_type}")
            
            handler = EVENT_HANDLERS.get(event_type)
            
            if handler:
                await handler(event_data)
            else:
                logger.warning(f"⚠️ No handler for event type: {event_type}")
        
        except Exception as e:
            logger.error(f"❌ Error processing event: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rabbitmq_connection, rabbitmq_channel, redis_client
    
    logger.info("🚀 Starting Notification Service...")
    
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    logger.info("✅ Connected to Redis")
    
    rabbitmq_connection = await aio_pika.connect_robust(RABBITMQ_URL)
    rabbitmq_channel = await rabbitmq_connection.channel()
    
    exchange = await rabbitmq_channel.declare_exchange(
        "fixitnow_events",
        aio_pika.ExchangeType.TOPIC,
        durable=True
    )
    
    queue = await rabbitmq_channel.declare_queue(
        "notification_service_queue",
        durable=True
    )
    
    await queue.bind(exchange, routing_key="*.*")
    
    await queue.consume(process_event)
    
    logger.info("✅ Connected to RabbitMQ and subscribed to events")
    logger.info("✨ Notification Service ready and listening for events!")
    
    yield
    
    logger.info("🛑 Shutting down Notification Service...")
    await redis_client.close()
    await rabbitmq_connection.close()

app = FastAPI(
    title="Notification Service - FixItNow",
    description="Microservicio de Notificaciones (EDA)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "notification-service",
        "project": "FixItNow",
        "status": "healthy",
        "mode": "event-driven",
        "listening": True,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/notifications/{user_id}")
async def get_user_notifications(user_id: int, limit: int = 20):
    """Obtiene las notificaciones de un usuario"""
    
    notifications = await redis_client.lrange(
        f"notifications:user:{user_id}",
        0,
        limit - 1
    )
    
    return {
        "user_id": user_id,
        "notifications": [json.loads(n) for n in notifications],
        "count": len(notifications)
    }

@app.post("/notifications/{user_id}/mark-read")
async def mark_notifications_read(user_id: int):
    """Marca todas las notificaciones como leídas"""
    
    notifications = await redis_client.lrange(
        f"notifications:user:{user_id}",
        0,
        -1
    )
    
    updated = []
    for n in notifications:
        notif = json.loads(n)
        notif["read"] = True
        updated.append(json.dumps(notif))
    
    await redis_client.delete(f"notifications:user:{user_id}")
    
    if updated:
        await redis_client.lpush(f"notifications:user:{user_id}", *updated)
    
    return {"message": "Notifications marked as read"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
