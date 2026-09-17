# TRINETRA (त्रिनेत्र) — 3D Digital Mine Operational Twin Architecture

## 1. Overview
The **3D Digital Mine Operational Twin** is a real-time, interactive WebGL visualization engine powered by Three.js and integrated with the TRINETRA backend. It spatializes all mine levels, zones, telemetry sensors, CCTV camera orientations, heavy machinery assets, hazard beacons, and anomaly events into a unified operational command center.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Backend [TRINETRA Backend Engine]
        DB[(PostgreSQL / SQLite)]
        MineService[MineService: /api/v1/mines/{id}/digital-twin]
        SpatialSvc[SpatialContextService: Euclidean Proximity Math]
        TelemetryEngine[Telemetry Ingestion & Anomaly Detection]
        WSManager[WebSocket Real-time Broadcast: /ws/mines/{id}]
    end

    subgraph Frontend [3D Digital Twin Frontend]
        Canvas3D[MineCanvas3D: Three.js WebGL Scene]
        GeometryEngine[MineGeometryBuilder: Procedural Underground/Opencast/Incline Geometry]
        AssetBuilder[AssetMarkersBuilder: 3D Sensors, Camera Cones, Machinery, Beacons]
        LayerCtrl[LayerControls: Toggles for Sensors, Cameras, Machinery, Shafts]
        PresetCtrl[ScenePresetControls: Operational / Risk Heatmap Mode & Presets]
        Inspector[ObjectInspector: Real-Time Readings, Thresholds & Proximity]
        ReplayEngine[ReplayTimeline: 7-Stage Time-Series Event Scrubber]
    end

    DB --> MineService
    MineService --> Canvas3D
    TelemetryEngine --> WSManager
    WSManager --> Canvas3D
    SpatialSvc --> Inspector
    GeometryEngine --> Canvas3D
    AssetBuilder --> Canvas3D
```

---

## 3. The 7 Mandatory Core Capabilities

### Capability 1: 3D Mine Navigation
- **Orbit, Pan, Zoom, Rotate:** Full 6-DOF controls with smooth inertial damping via Three.js OrbitControls.
- **Preset Camera Trajectories:** `RESET VIEW`, `FIT MINE OVERVIEW`, and direct level transitions.
- **Smooth Cosine Interpolation:** Camera transitions lerp position and `controls.target` smoothly over 1000ms without abrupt clipping.

### Capability 2: Spatial Sensors, Cameras & Equipment
- **Sensors:** 3D glowing markers with status indicators and animated expanding pulse rings.
- **Cameras:** Directional camera body + translucent Field of View (FOV) cone mesh oriented according to `yaw` and `pitch` degrees.
- **Heavy Machinery & Ventilation:** Recognizable 3D industrial geometries (Double-drum shearer, centrifugal exhauster fan with rotating impellers, armoured conveyor belt, excavator shovel).
- **Mine Geometry:**
  - *Bharat Deep Shaft 4 (Underground):* Surface yard, headframe winding tower, vertical shafts, seam 1 & 2 drifts, haulage tracks.
  - *Singrauli Basin (Opencast):* Stepped terraced highwall bench cuts ($z=250m, 235m, 190m$), spiral haul road.
  - *Raniganj Seam 7 (Incline):* Angled drift slope from surface portal down to continuous miner heading.

### Capability 3: Live Sensor State Visualization & WebSocket Stream
- Color coding:
  - `NORMAL / ACTIVE`: Emerald `#10b981`
  - `WARNING`: Amber `#f59e0b`
  - `CRITICAL`: Rose `#ef4444` (pulsing glowing wave)
  - `OFFLINE`: Purple/Slate `#64748b`
  - `RECOVERING`: Cyan `#06b6d4`
- Real-time updates delivered over authenticated WebSocket (`/api/v1/ws/mines/{mine_id}`) update 3D mesh colors and values dynamically without full-page reloads.

### Capability 4: Risk Heatmap Mode
- Toggle between **Operational Mode** (standard equipment/sensor status) and **Risk Heatmap Mode** (mine zone volumes glow with backend risk bands):
  - 0–30: LOW (Green/Teal)
  - 31–60: MEDIUM (Amber)
  - 61–80: HIGH (Orange)
  - 81–100: CRITICAL (Crimson Red)

### Capability 5: Incident -> Automatic 3D Focus
- When an incident or critical anomaly is triggered, clicking **[3D Focus]** smoothly navigates the camera to the exact `(x, y, z)` hazard origin, highlights the affected seam zone, flashes the sensor marker, draws 3D distance links to nearby cameras/equipment, and opens the Object Inspector.

### Capability 6: Camera & Equipment Proximity Context
- Discovers nearby assets dynamically using 3D Euclidean distance:
  $$\text{dist} = \sqrt{(x_1-x_2)^2 + (y_1-y_2)^2 + (z_1-z_2)^2}$$
- Renders dashed 3D proximity links connecting the sensor to nearby cameras and ventilation fans with floating distance tags.

### Capability 7: Event / Time Replay
- Bottom timeline scrubber supporting Play, Pause, Scrubbing, and Speed multipliers (1x, 2x, 5x).
- 7-Stage deterministic event timeline:
  1. `00:00`: Normal Baseline (CH4: 0.35%, Risk: 24.5)
  2. `01:15`: Seam Heading Gas Rising (CH4: 0.65%, Risk: 38.0)
  3. `02:30`: Warning Threshold Breached (CH4: 0.88%, Risk: 58.5)
  4. `03:45`: Critical Surge Event (CH4: 1.82%, Risk: 91.0)
  5. `04:30`: Alert Dispatched & Incident Auto-Created (Hazard Beacon active, Risk: 92.5)
  6. `05:45`: Auxiliary Ventilation Ramp-up (CH4: 1.05%, Risk: 62.0)
  7. `07:00`: Restabilized Baseline (CH4: 0.42%, Risk: 28.0)

---

## 4. Credibility & Reality Boundaries (SIH Standards)

| Capability | Phase 3 Implementation Status | Credibility Label |
| :--- | :--- | :--- |
| **3D Spatial Geometry Engine** | **REAL** | WebGL Three.js rendering of database levels, zones, sensors, and equipment. |
| **Proximity Distance Calculations**| **REAL** | Exact Euclidean 3D distance between database asset coordinates. |
| **WebSocket Event Updates** | **REAL** | Authenticated, mine-scoped real-time event pipeline. |
| **Sensor Telemetry Data** | **SIMULATED** | Seeded deterministic scenarios; labeled `source = "SIMULATED"`. |
| **CCTV Feeds** | **METADATA ONLY** | 3D spatial FOV cones rendered; streams labeled `SIMULATED / DEMO FEED`. |
| **Incident Auto-Creation** | **REAL** | Autonomous state machine incident creation with SHA-256 audit logging. |
