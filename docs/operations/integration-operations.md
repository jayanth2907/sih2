# TRINETRA Integration Operations & Runbooks

## 1. Adapter Operational Matrix

| System | Adapter Class | Default Mode | Data Ingested | Primary Ingestion Trigger | Failure Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CMSMS / Khanan Prahari** | `CMSMSAdapter` | `SIMULATED` | Citizen illegal mining reports, GIS breach signals | Webhook / Polling sync (15m) | Circuit breaker opens; contextual risk marked cached |
| **PARIVESH 2.0** | `PARIVESHAdapter` | `SIMULATED` | EC/FC clearance parameters, buffer zone boundaries | Daily regulatory sync | Retain last valid statutory limits |
| **DGMS** | `DGMSAdapter` | `SIMULATED` | Safety circulars, hazard advisory notices | Periodic sync | Use baseline regulatory rule library |
| **IoT / SCADA Telemetry** | `TelemetryAdapter` | `SIMULATED` | High-frequency sensor streams (gas, vibration, slope) | Real-time WebSocket / MQTT | Anomaly model uses moving average extrapolation |

---

## 2. Transitioning Adapters from SIMULATED to LIVE

To connect an adapter to a genuine government API endpoint:
1. Obtain authorized institutional API credentials and mTLS certificates from the respective Ministry or Authority.
2. In the target environment configuration (`.env`), set:
   ```bash
   CMSMS_MODE=LIVE
   CMSMS_BASE_URL=https://authorized-cmsms-api.gov.in/v1
   CMSMS_API_KEY=your_secured_ministry_token
   ```
3. Restart the integration worker or invoke `POST /api/v1/integrations/sync/cmsms`.
4. Check the Integration Health Dashboard (`IntegrationsHealthPage`) to confirm status reflects `LIVE` and latency metrics are populated.

---

## 3. Incident Management & Circuit Breaker Reset

When a third-party service suffers an outage:
1. The Circuit Breaker automatically trips to `OPEN` state after 3 failed sync attempts.
2. TRINETRA UI displays `CMSMS: DEGRADED / OPEN` on the System Health dashboard.
3. Once the upstream government platform resolves the outage:
   - Wait 30 seconds for automatic `HALF_OPEN` self-healing test, OR
   - Navigate to **Integrations & Health** $\rightarrow$ Click **[Recover Adapter]** or trigger `POST /api/v1/integrations/test-fail/CMSMS` to reset the circuit breaker.
