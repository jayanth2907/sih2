import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TRINETRA"
    PROJECT_DESCRIPTION: str = "AI-Based Smart Governance & Compliance Monitoring System for Coal Mines"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "trinetra-dev-super-secret-key-32-bytes-long-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trinetra.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "*"
    ]
    
    # Telemetry simulation
    SIMULATED_TELEMETRY_ENABLED: bool = True
    
    # Phase 9: Demo Configuration & Safety Guards
    APP_MODE: str = os.getenv("APP_MODE", "DEMO")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    TRINETRA_DEMO_SEED: int = int(os.getenv("TRINETRA_DEMO_SEED", "42"))
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
