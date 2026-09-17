from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.core.authz import check_mine_access, get_user_roles
from app.core.permissions import RoleEnum
from app.core.ws_manager import ws_manager

router = APIRouter(tags=["Real-time Telemetry WebSockets"])

@router.websocket("/ws/mines/{mine_id}")
async def websocket_mine_stream(
    websocket: WebSocket,
    mine_id: int,
    token: str = Query(..., description="JWT access token")
):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db: Session = SessionLocal()
    try:
        user_id = int(payload["sub"])
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        roles = get_user_roles(user, db)
        is_global = RoleEnum.SYSTEM_ADMIN.value in roles or RoleEnum.REGULATOR.value in roles or user.is_superuser
        has_access = check_mine_access(user, mine_id, db)

        if not has_access and not is_global:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await ws_manager.connect(websocket, mine_id=mine_id, is_global=is_global)

        # Send initial connected greeting
        await websocket.send_json({
            "event_type": "CONNECTED",
            "mine_id": mine_id,
            "message": f"Connected to TRINETRA real-time stream for Mine ID {mine_id}",
            "user": user.email
        })

        while True:
            # Keep-alive loop
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, mine_id=mine_id)
    except Exception:
        ws_manager.disconnect(websocket, mine_id=mine_id)
    finally:
        db.close()
