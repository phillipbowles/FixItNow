"""
Admin Service - Microservicio de Administración
Panel administrativo con métricas, estadísticas y moderación
Proyecto: FixItNow
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import os
import redis.asyncio as redis
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://fixitnow:fixitnow123@localhost:5432/fixitnow_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

redis_client: redis.Redis = None

class DashboardStats(BaseModel):
    total_users: int
    total_providers: int
    active_services: int
    total_bookings: int
    completed_bookings: int
    avg_service_rating: float
    total_reviews: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    
    logger.info("🚀 Starting Admin Service...")
    
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    logger.info("✅ Connected to Redis")
    logger.info("✨ Admin Service ready!")
    
    yield
    
    logger.info("🛑 Shutting down Admin Service...")
    await redis_client.close()
    await engine.dispose()

app = FastAPI(
    title="Admin Service - FixItNow",
    description="Microservicio de Administración y Métricas",
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

@app.get("/")
async def root():
    return {
        "service": "admin-service",
        "project": "FixItNow",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Obtiene estadísticas generales del dashboard"""
    
    query = text("SELECT * FROM admin_stats")
    result = await db.execute(query)
    stats = result.fetchone()
    
    if not stats:
        return DashboardStats(
            total_users=0,
            total_providers=0,
            active_services=0,
            total_bookings=0,
            completed_bookings=0,
            avg_service_rating=0.0,
            total_reviews=0
        )
    
    return DashboardStats(
        total_users=stats[0] or 0,
        total_providers=stats[1] or 0,
        active_services=stats[2] or 0,
        total_bookings=stats[3] or 0,
        completed_bookings=stats[4] or 0,
        avg_service_rating=float(stats[5] or 0),
        total_reviews=stats[6] or 0
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
