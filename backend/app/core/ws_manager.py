import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("trinetra.websocket")

class WebSocketManager:
    def __init__(self):
        # mine_id -> list of WebSockets
        self.mine_connections: Dict[int, List[WebSocket]] = {}
        # global connections (System Admin / Regulator)
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, mine_id: int, is_global: bool = False):
        await websocket.accept()
        if is_global:
            self.global_connections.append(websocket)
        else:
            if mine_id not in self.mine_connections:
                self.mine_connections[mine_id] = []
            self.mine_connections[mine_id].append(websocket)

    def disconnect(self, websocket: WebSocket, mine_id: int):
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)
        if mine_id in self.mine_connections and websocket in self.mine_connections[mine_id]:
            self.mine_connections[mine_id].remove(websocket)

    async def broadcast_mine_event(self, mine_id: int, event_type: str, data: Any):
        payload = {
            "event_type": event_type,
            "mine_id": mine_id,
            "payload": data
        }
        json_data = json.dumps(payload, default=str)
        
        # 1. Send to mine-scoped subscribers
        if mine_id in self.mine_connections:
            dead_sockets = []
            for ws in self.mine_connections[mine_id]:
                try:
                    await ws.send_text(json_data)
                except Exception:
                    dead_sockets.append(ws)
            for dead in dead_sockets:
                self.mine_connections[mine_id].remove(dead)

        # 2. Send to global subscribers
        dead_global = []
        for ws in self.global_connections:
            try:
                await ws.send_text(json_data)
            except Exception:
                dead_global.append(ws)
        for dead in dead_global:
            self.global_connections.remove(dead)

ws_manager = WebSocketManager()
