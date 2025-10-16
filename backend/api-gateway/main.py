"""
API Gateway - Punto de entrada único para todos los microservicios
Implementa enrutamiento, autenticación y limitación de tasa
Proyecto: FixItNow
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional
import logging
from datetime import datetime
import redis.asyncio as redis
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8002")
BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://localhost:8003")
ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_URL", "http://localhost:8005")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class RateLimiter:
    """Implementación simple de rate limiting usando Redis"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def check_rate_limit(self, key: str, limit: int = 100, window: int = 60) -> bool:
        current = await self.redis.get(key)
        
        if current is None:
            await self.redis.setex(key, window, 1)
            return True
        
        if int(current) >= limit:
            return False
        
        await self.redis.incr(key)
        return True

redis_client: Optional[redis.Redis] = None
rate_limiter: Optional[RateLimiter] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client, rate_limiter
    
    logger.info("🚀 Starting API Gateway...")
    
    redis_client = await redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    rate_limiter = RateLimiter(redis_client)
    
    logger.info("✅ Connected to Redis")
    logger.info("✨ API Gateway ready!")
    
    yield
    
    logger.info("🛑 Shutting down API Gateway...")
    await redis_client.close()

app = FastAPI(
    title="API Gateway - FixItNow",
    description="Gateway unificado para todos los microservicios",
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

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Middleware de rate limiting"""
    
    client_ip = request.client.host
    rate_limit_key = f"rate_limit:{client_ip}"
    
    if not await rate_limiter.check_rate_limit(rate_limit_key, limit=100, window=60):
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Too many requests. Please try again later.",
                "retry_after": 60
            }
        )
    
    response = await call_next(request)
    return response

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware para logging de requests"""
    
    start_time = datetime.utcnow()
    
    logger.info(f"📨 {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(f"📤 {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

async def forward_request(
    service_url: str,
    path: str,
    method: str,
    headers: dict,
    body: Optional[bytes] = None,
    params: Optional[dict] = None
):
    """Reenvía una request a un microservicio"""
    
    url = f"{service_url}{path}"
    
    filtered_headers = {
        k: v for k, v in headers.items()
        if k.lower() not in ['host', 'content-length']
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=filtered_headers, params=params)
            elif method == "POST":
                response = await client.post(url, headers=filtered_headers, content=body)
            elif method == "PUT":
                response = await client.put(url, headers=filtered_headers, content=body)
            elif method == "PATCH":
                response = await client.patch(url, headers=filtered_headers, content=body)
            elif method == "DELETE":
                response = await client.delete(url, headers=filtered_headers)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")
            
            return JSONResponse(
                content=response.json() if response.text else None,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        
        except httpx.TimeoutException:
            logger.error(f"❌ Timeout calling {service_url}")
            raise HTTPException(status_code=504, detail="Service timeout")
        
        except httpx.RequestError as e:
            logger.error(f"❌ Error calling {service_url}: {e}")
            raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/")
async def root():
    """Health check del gateway"""
    return {
        "service": "api-gateway",
        "project": "FixItNow",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "auth": AUTH_SERVICE_URL,
            "catalog": CATALOG_SERVICE_URL,
            "booking": BOOKING_SERVICE_URL,
            "admin": ADMIN_SERVICE_URL
        }
    }

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def auth_proxy(path: str, request: Request):
    """Proxy para Auth Service"""
    body = await request.body()
    return await forward_request(
        AUTH_SERVICE_URL,
        f"/{path}",
        request.method,
        dict(request.headers),
        body,
        dict(request.query_params)
    )

@app.api_route("/catalog/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def catalog_proxy(path: str, request: Request):
    """Proxy para Catalog Service"""
    body = await request.body()
    return await forward_request(
        CATALOG_SERVICE_URL,
        f"/{path}",
        request.method,
        dict(request.headers),
        body,
        dict(request.query_params)
    )

@app.api_route("/booking/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def booking_proxy(path: str, request: Request):
    """Proxy para Booking Service"""
    body = await request.body()
    return await forward_request(
        BOOKING_SERVICE_URL,
        f"/{path}",
        request.method,
        dict(request.headers),
        body,
        dict(request.query_params)
    )

@app.api_route("/admin/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def admin_proxy(path: str, request: Request):
    """Proxy para Admin Service"""
    body = await request.body()
    return await forward_request(
        ADMIN_SERVICE_URL,
        f"/{path}",
        request.method,
        dict(request.headers),
        body,
        dict(request.query_params)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
