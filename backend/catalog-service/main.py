"""
Catalog Service - Microservicio de Catálogo de Servicios
Gestiona los servicios ofrecidos por los proveedores
Proyecto: FixItNow
"""

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import String, DateTime, Float, Text, Integer, Boolean, select
import os
import aio_pika
import json
import redis.asyncio as redis
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://fixitnow:fixitnow123@localhost:5432/fixitnow_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://admin:admin123@localhost:5672/")

Base = declarative_base()

class Service(Base):
    __tablename__ = "services"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)
    base_price: Mapped[float] = mapped_column(Float)
    price_unit: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer)
    booking_id: Mapped[int] = mapped_column(Integer, unique=True)
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    category: str
    base_price: float = Field(..., gt=0)
    price_unit: str = "por hora"

class ServiceResponse(BaseModel):
    id: int
    provider_id: int
    name: str
    description: str
    category: str
    base_price: float
    price_unit: str
    is_active: bool
    rating: float
    total_reviews: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    service_id: int
    user_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

redis_client: Optional[redis.Redis] = None
rabbitmq_connection: Optional[aio_pika.Connection] = None
rabbitmq_channel: Optional[aio_pika.Channel] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, rabbitmq_connection, rabbitmq_channel
    
    logger.info("🚀 Starting Catalog Service...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created")
    
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    logger.info("✅ Connected to Redis")
    
    rabbitmq_connection = await aio_pika.connect_robust(RABBITMQ_URL)
    rabbitmq_channel = await rabbitmq_connection.channel()
    await rabbitmq_channel.declare_exchange("fixitnow_events", aio_pika.ExchangeType.TOPIC, durable=True)
    logger.info("✅ Connected to RabbitMQ")
    logger.info("✨ Catalog Service ready!")
    
    yield
    
    logger.info("🛑 Shutting down Catalog Service...")
    await redis_client.close()
    await rabbitmq_connection.close()
    await engine.dispose()

app = FastAPI(
    title="Catalog Service - FixItNow",
    description="Microservicio de Catálogo y Gestión de Servicios",
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
        "service": "catalog-service",
        "project": "FixItNow",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    provider_id: int,
    db: AsyncSession = Depends(get_db)
):
    new_service = Service(
        provider_id=provider_id,
        name=service_data.name,
        description=service_data.description,
        category=service_data.category,
        base_price=service_data.base_price,
        price_unit=service_data.price_unit
    )
    
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    
    await redis_client.delete("services:all")
    
    await publish_event("catalog.service_created", {
        "service_id": new_service.id,
        "provider_id": new_service.provider_id,
        "name": new_service.name,
        "category": new_service.category,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    logger.info(f"✅ Service created: {new_service.id}")
    return new_service

@app.get("/services", response_model=List[ServiceResponse])
async def get_services(
    category: Optional[str] = None,
    provider_id: Optional[int] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(Service).where(Service.is_active == is_active)
    
    if category:
        query = query.where(Service.category == category)
    if provider_id:
        query = query.where(Service.provider_id == provider_id)
    if min_rating:
        query = query.where(Service.rating >= min_rating)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Service.name.ilike(search_pattern)) | 
            (Service.description.ilike(search_pattern))
        )
    
    query = query.order_by(Service.rating.desc(), Service.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    services = result.scalars().all()
    
    return services

@app.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service

@app.post("/services/{service_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    service_id: int,
    review_data: ReviewCreate,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    existing = await db.execute(
        select(Review).where(Review.booking_id == review_data.booking_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    new_review = Review(
        service_id=service_id,
        user_id=user_id,
        booking_id=review_data.booking_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    reviews_result = await db.execute(select(Review).where(Review.service_id == service_id))
    reviews = reviews_result.scalars().all()
    
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        service.rating = round(avg_rating, 2)
        service.total_reviews = len(reviews)
        await db.commit()
    
    await publish_event("catalog.review_created", {
        "review_id": new_review.id,
        "service_id": service_id,
        "user_id": user_id,
        "rating": review_data.rating,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    logger.info(f"✅ Review created: {new_review.id}")
    return new_review

@app.get("/services/{service_id}/reviews", response_model=List[ReviewResponse])
async def get_service_reviews(
    service_id: int,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    query = select(Review).where(Review.service_id == service_id)
    query = query.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    return reviews

@app.get("/categories")
async def get_categories():
    return {
        "categories": [
            "Plomería",
            "Electricidad",
            "Carpintería",
            "Limpieza",
            "Jardinería",
            "Pintura",
            "Reparaciones",
            "Mantenimiento",
            "Mudanzas",
            "Tecnología"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
