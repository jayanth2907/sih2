from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.mines import router as mines_router
from app.api.v1.sensors import router as sensors_router
from app.api.v1.cameras import router as cameras_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.violations import router as violations_router
from app.api.v1.risk import router as risk_router
from app.api.v1.audit import router as audit_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.governance import router as governance_router
from app.api.v1.predictive_risk import router as predictive_risk_router
from app.api.v1.copilot import router as copilot_router
from app.api.v1.mobile import router as mobile_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.demo import router as demo_router
from app.api.v1.websocket import router as websocket_router
from app.api.v1.health import router as health_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(mines_router)
api_v1_router.include_router(sensors_router)
api_v1_router.include_router(cameras_router)
api_v1_router.include_router(incidents_router)
api_v1_router.include_router(violations_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(predictive_risk_router)
api_v1_router.include_router(copilot_router)
api_v1_router.include_router(mobile_router)
api_v1_router.include_router(integrations_router)
api_v1_router.include_router(demo_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(governance_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(websocket_router)
