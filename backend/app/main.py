from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.db.base import Base
from app.db.session import engine

# Create tables on startup for development setup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# TRINETRA: AI-Based Smart Governance and Compliance Monitoring System for Coal Mines

### Production-Ready Prototype Architecture:
- **Multi-Mine Architecture**: Clean spatial hierarchy with Mine -> Levels -> Zones -> Assets.
- **Strict Role-Based Access Control (RBAC)**: Backend-enforced scoping across System Admins, Mine Managers, Safety Officers, Inspectors, and Regulators.
- **3D Spatial Digital Twin Foundation**: Sensors, Cameras, Machinery, and Incidents have 3D coordinates (x, y, z, lat, lon).
- **Incident vs Violation Separation**: Operational response state machines vs Statutory DGMS compliance.
- **Explainable Multi-Factor Risk**: Rule scores, Sensor anomalies, and Silence-to-Risk (reporting drift).
- **Cryptographic Audit Trail**: Tamper-evident hash-chained governance logging.
- **Simulated IoT Engine**: Clean TelemetryProvider abstraction separating simulated from real MQTT/SCADA streams.
    """,
    version="1.0.0-phase1",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Production Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount API v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/")
def root_status():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_DESCRIPTION,
        "api_docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "OPERATIONAL"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
