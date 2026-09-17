# TRINETRA Security Hardening & Threat Model

## 1. Security Philosophy & Zero-Trust Architecture

TRINETRA enforces a Zero-Trust security model across data ingestion, RBAC authorization, token validation, audit immutability, and API boundaries.

---

## 2. Authentication & JWT Hardening

- **Cryptographic Signing:** Access tokens are signed using `HS256` with strong secret keys (`JWT_SECRET_KEY` configured via environment variables; never hard-coded in source code).
- **Token Expiration & Scope:** Strict expiry windows (`ACCESS_TOKEN_EXPIRE_MINUTES`) with structured payload claims containing `sub` (User ID), `role`, `mine_id`, and `exp`.
- **Mine Isolation Enforcement:** Backend dependency `get_current_user` injects identity and assigned mine boundaries. Handlers enforce cross-mine tenancy checks at the object level.

---

## 3. RBAC & Object-Level Tenancy Isolation

- **Zero Client-Trust Authorization:** Frontend route guards only control navigation UX; backend FastAPI dependencies strictly enforce permissions on every endpoint.
- **Tenancy Boundary Test:**
  - When a `MINE_MANAGER` assigned to `MINE-BDS-04` attempts to query or mutate resources on `MINE-RS-07`, the backend immediately terminates the request with `403 Forbidden: Access forbidden: user not authorized for this mine`.
- **Role Hierarchy:**
  - `SUPER_ADMIN`: Cross-mine read/write, configuration, and security management.
  - `SAFETY_OFFICER` & `DGMS_INSPECTOR`: Statutory compliance, audit verification, circular reviews.
  - `MINE_MANAGER`: Restricted strictly to assigned mine ID.
  - `AUDITOR`: Read-only access to immutable audit trails and compliance reports.

---

## 4. Cryptographic SHA-256 Hash-Chained Audit Ledger

- **Chain Linkage:** Every `AuditEvent` in TRINETRA computes:
  $$\text{current\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{timestamp} + \text{user\_id} + \text{action} + \text{details\_json})$$
- **Tamper Detection (`verify_audit_chain`):**
  - Iterates through the chronological chain starting from the genesis block (`GENESIS_BLOCK_HASH`).
  - Validates `previous_hash` match and recomputes `current_hash`.
  - If any row in the database is modified, deleted, or inserted out of sequence, the verification detects the anomaly and flags the exact record index and tamper timestamp.

---

## 5. Defensive API Hardening & Middleware

- **Production Security Headers:**
  - `X-Content-Type-Options: nosniff` (prevents MIME type sniffing).
  - `X-Frame-Options: DENY` (prevents clickjacking attacks).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`.
- **CORS Policies:** Configurable `ALLOWED_ORIGINS` restricting wildcard origins in production environments.
- **Input Sanitization & Schema Validation:** Pydantic models validate data types, range bounds, coordinate validity (latitude $[-90, 90]$, longitude $[-180, 180]$), and string length caps to mitigate injection attacks.
- **Secret Hygiene:** All API keys (Gemini, DB credentials, JWT secrets) are loaded exclusively via environment variables with `.env.example` templates.
