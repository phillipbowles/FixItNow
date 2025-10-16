"""
Booking Service - Microservicio de Solicitudes y Reservas
Maneja el ciclo de vida completo de las solicitudes de servicio
Incluye WebSockets para comunicación en tiempo real
Proyecto: FixItNow
"""

from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String, DateTime, Enum as SQLEnum, Float, Text, Integer, select
import enum
import os
import aio_pika
import json
import redis.asyncio as redis
from contextlib import asynccontextmanager
import logging
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://fixitnow:fixitnow123@localhost:5432/fixitnow_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@localhost:5672/")

Base = declarative_base()

class BookingStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Booking(Base):
    __tablename__ = "bookings"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer)
    provider_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    service_id: Mapped[int] = mapped_column(Integer)
    
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[BookingStatus] = mapped_column(SQLEnum(BookingStatus), default=BookingStatus.PENDING)
    
    scheduled_date: Mapped[datetime] = mapped_column(DateTime)
    address: Mapped[str] = mapped_column(String(500))
    
    estimated_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    final_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

class BookingCreate(BaseModel):
    service_id: int
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)
    scheduled_date: datetime
    address: str = Field(..., min_length=5)
    estimated_price: Optional[float] = None

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    provider_id: Optional[int] = None
    final_price: Optional[float] = None

class BookingResponse(BaseModel):
    id: int
    user_id: int
    provider_id: Optional[int]
    service_id: int
    title: str
    description: str
    status: str
    scheduled_date: datetime
    address: str
    estimated_price: Optional[float]
    final_price: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConnectionManager:
    """Gestor de conexiones WebSocket para chat en tiempo real"""
    
    def __init__(self):
        self.active_connections: Dict[int, Dict[int, WebSocket]] = defaultdict(dict)
    
    async def connect(self, websocket: WebSocket, booking_id: int, user_id: int):
        await websocket.accept()
        self.active_connections[booking_id][user_id] = websocket
        logger.info(f"✅ WebSocket connected: booking_id={booking_id}, user_id={user_id}")
    
    def disconnect(self, booking_id: int, user_id: int):
        if booking_id in self.active_connections:
            if user_id in self.active_connections[booking_id]:
                del self.active_connections[booking_id][user_id]
                logger.info(f"❌ WebSocket disconnected: booking_id={booking_id}, user_id={user_id}")
                
                if not self.active_connections[booking_id]:
                    del self.active_connections[booking_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast_to_booking(self, booking_id: int, message: dict):
        if booking_id in self.active_connections:
            disconnected = []
            for user_id, websocket in self.active_connections[booking_id].items():
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected.append(user_id)
            
            for user_id in disconnected:
                self.disconnect(booking_id, user_id)

manager = ConnectionManager()

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

redis_client: Optional[redis.Redis] = None
rabbitmq_connection: Optional[aio_pika.Connection] = None
rabbitmq_channel: Optional[aio_pika.Channel] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, rabbitmq_connection, rabbitmq_channel
    
    logger.info("🚀 Starting Booking Service...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created")
    
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    logger.info("✅ Connected to Redis")
    
    rabbitmq_connection = await aio_pika.connect_robust(RABBITMQ_URL)
    rabbitmq_channel = await rabbitmq_connection.channel()
    await rabbitmq_channel.declare_exchange("fixitnow_events", aio_pika.ExchangeType.TOPIC, durable=True)
    logger.info("✅ Connected to RabbitMQ")
    
    logger.info("✨ Booking Service ready!")
    
    yield
    
    logger.info("🛑 Shutting down Booking Service...")
    await redis_client.close()
    await rabbitmq_connection.close()
    await engine.dispose()

app = FastAPI(
    title="Booking Service - FixItNow",
    description="Microservicio de Solicitudes, Reservas y Chat en Tiempo Real",
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

async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session

async def publish_event(event_type: str, data: dict):
    try:
        message = aio_pika.Message(
            body=json.dumps(data).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        exchange = await rabbitmq_channel.get_exchange("fixitnow_events")
        await exchange.publish(message, routing_key=event_type)
        logger.info(f"📤 Event published: {event_type}")
    except Exception as e:
        logger.error(f"❌ Error publishing event: {e}")

@app.get("/")
async def root():
    return {
        "service": "booking-service",
        "project": "FixItNow",
        "status": "healthy",
        "websocket_connections": len(manager.active_connections),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    new_booking = Booking(
        user_id=user_id,
        service_id=booking_data.service_id,
        title=booking_data.title,
        description=booking_data.description,
        scheduled_date=booking_data.scheduled_date,
        address=booking_data.address,
        estimated_price=booking_data.estimated_price,
        status=BookingStatus.PENDING
    )
    
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    await publish_event("booking.service_requested", {
        "booking_id": new_booking.id,
        "user_id": new_booking.user_id,
        "service_id": new_booking.service_id,
        "title": new_booking.title,
        "scheduled_date": new_booking.scheduled_date.isoformat(),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    logger.info(f"✅ Booking created: {new_booking.id}")
    return new_booking

@app.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(
    user_id: Optional[int] = None,
    provider_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Booking)
    
    if user_id:
        query = query.where(Booking.user_id == user_id)
    if provider_id:
        query = query.where(Booking.provider_id == provider_id)
    if status:
        query = query.where(Booking.status == BookingStatus(status))
    
    result = await db.execute(query.order_by(Booking.created_at.desc()))
    bookings = result.scalars().all()
    
    return bookings

@app.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking

@app.patch("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking_update.status:
        old_status = booking.status
        booking.status = BookingStatus(booking_update.status)
        
        if booking.status == BookingStatus.ACCEPTED:
            booking.accepted_at = datetime.utcnow()
        elif booking.status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.utcnow()
        
        await publish_event("booking.status_changed", {
            "booking_id": booking.id,
            "old_status": old_status.value,
            "new_status": booking.status.value,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    if booking_update.provider_id:
        booking.provider_id = booking_update.provider_id
    
    if booking_update.final_price:
        booking.final_price = booking_update.final_price
    
    booking.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(booking)
    
    await manager.broadcast_to_booking(booking_id, {
        "type": "booking_updated",
        "booking_id": booking_id,
        "status": booking.status.value,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    logger.info(f"✅ Booking updated: {booking_id}")
    return booking

@app.websocket("/ws/bookings/{booking_id}/chat")
async def websocket_chat(websocket: WebSocket, booking_id: int, user_id: int):
    """WebSocket endpoint para chat en tiempo real entre usuario y proveedor"""
    
    await manager.connect(websocket, booking_id, user_id)
    
    try:
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"Connected to booking {booking_id} chat",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            chat_message = {
                "type": "chat_message",
                "booking_id": booking_id,
                "sender_id": user_id,
                "message": message_data.get("message", ""),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            redis_key = f"chat:booking:{booking_id}"
            await redis_client.lpush(redis_key, json.dumps(chat_message))
            await redis_client.ltrim(redis_key, 0, 99)
            await redis_client.expire(redis_key, 86400)
            
            await manager.broadcast_to_booking(booking_id, chat_message)
            
            logger.info(f"💬 Chat message in booking {booking_id} from user {user_id}")
    
    except WebSocketDisconnect:
        manager.disconnect(booking_id, user_id)
        logger.info(f"Client {user_id} disconnected from booking {booking_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(booking_id, user_id)

@app.get("/bookings/{booking_id}/chat/history")
async def get_chat_history(booking_id: int):
    redis_key = f"chat:booking:{booking_id}"
    messages = await redis_client.lrange(redis_key, 0, -1)
    
    chat_history = [json.loads(msg) for msg in messages]
    chat_history.reverse()
    
    return {
        "booking_id": booking_id,
        "messages": chat_history,
        "count": len(chat_history)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
