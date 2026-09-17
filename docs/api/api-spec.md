# TRINETRA REST API Specification (v1)

Base URL: `/api/v1`  
Interactive OpenAPI Documentation: `http://localhost:8000/docs`

---

## Endpoints Summary

### Authentication & Profiles
- `POST /api/v1/auth/login` - Authenticate with email/password, returns JWT token.
- `GET /api/v1/auth/me` - Authenticated user profile, roles, and assigned mines.
- `POST /api/v1/auth/register` - Create new user with roles and mine scoping (System Admin only).

### Mines & Spatial Hierarchy
- `GET /api/v1/mines` - List accessible mines (role-scoped).
- `POST /api/v1/mines` - Register new coal mine (System Admin only).
- `GET /api/v1/mines/{mine_id}` - Detailed mine metrics, levels, and risk index.
- `POST /api/v1/mines/{mine_id}/levels` - Add underground seam / level.
- `POST /api/v1/mines/{mine_id}/zones` - Add spatial zone with 3D bounding coordinates.
- `GET /api/v1/mines/{mine_id}/digital-twin` - Full 3D spatial state aggregation.

### Sensors & Telemetry
- `GET /api/v1/sensors/types` - List sensor types (Methane, CO, Temp, Air Velocity, etc.).
- `GET /api/v1/sensors?mine_id={id}` - List sensors with 3D positions, thresholds, and readings.
- `POST /api/v1/sensors` - Register a new telemetry sensor node.
- `POST /api/v1/sensors/readings/ingest` - Ingest live or simulated telemetry reading.
- `POST /api/v1/sensors/simulate-batch/{mine_id}` - Trigger a simulated telemetry cycle.

### Cameras & Equipment
- `GET /api/v1/cameras?mine_id={id}` - List camera assets with 3D orientation (yaw, pitch, fov).
- `POST /api/v1/cameras` - Register camera node.
- `GET /api/v1/equipment?mine_id={id}` - List heavy machinery and maintenance schedules.
- `POST /api/v1/equipment` - Register machinery asset.

### Operational Incidents
- `GET /api/v1/incidents?mine_id={id}` - List safety incidents.
- `POST /api/v1/incidents` - Log safety incident.
- `GET /api/v1/incidents/{id}` - Single incident detail and lifecycle transition event history.
- `PATCH /api/v1/incidents/{id}/status` - Advance lifecycle state (`OPEN` -> `TRIAGED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `VERIFIED` -> `CLOSED`).

### Statutory DGMS Violations
- `GET /api/v1/violations?mine_id={id}` - List statutory regulatory violations.
- `POST /api/v1/violations` - Log statutory compliance violation citing CMR 2017.
- `POST /api/v1/violations/{id}/corrective-actions` - Assign corrective action plan.

### Risk & Cryptographic Audit
- `GET /api/v1/risk/{mine_id}` - Multi-factor explainable risk evaluation.
- `GET /api/v1/anomalies?mine_id={id}` - Sensor threshold breaches and silence-to-risk alerts.
- `GET /api/v1/audit?mine_id={id}` - Cryptographic SHA-256 hash-chained audit ledger.
- `GET /api/v1/health` - API probe and database connectivity health check.
