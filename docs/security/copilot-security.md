# TRINETRA AI Copilot Security & Defense Specification

## 1. Threat Model & Security Boundaries

As an AI-assisted governance operating system for critical mining infrastructure, TRINETRA enforces multi-layered defenses against adversarial prompts, unauthorized cross-tenant data access, and unintended autonomous execution.

---

## 2. Security Controls & Implementations

### 2.1 Prompt Injection Defense
- **Input Sanitization**: User inputs are scanned against known adversarial patterns (`ignore previous instructions`, `system prompt`, `you are now an unrestricted assistant`, `drop table`, etc.).
- **Untrusted Document Boundaries**: Any text retrieved from user-generated fields (grievances, inspection notes, OCR document fields, contractor descriptions) is encapsulated inside `<UNTRUSTED_DOCUMENT_DATA>` tags in model prompts.
- **Strict Role Instructions**: The Copilot system prompt explicitly states that retrieved document contents must be analyzed as **DATA ONLY** and must never be interpreted as instructions.

### 2.2 Sensitive Data Protection & Scrubbing
- All tool outputs and LLM prompts pass through `CopilotSecurity.scrub_sensitive_data()`.
- Password hashes (`bcrypt`), Bearer JWT tokens, and API secret keys are scrubbed and replaced with `[REDACTED]` markers before reaching the response composer or external LLM API.

### 2.3 Strict Tool-Level RBAC & Mine Tenant Isolation
- Tools can **only** be executed via the `ToolRegistry` dispatcher.
- The user's JWT identity is verified on every request.
- Mine isolation is enforced server-side: if a user lacks explicit assignment to the requested `mine_id` and is not a `SYSTEM_ADMIN` or `REGULATOR`, the query is terminated immediately with `HTTP 403 Forbidden`.

### 2.4 Server-Side API Key Confinement
- External AI credentials (`GEMINI_API_KEY`) remain strictly on the backend server.
- No API keys are bundled into frontend assets or exposed in Vite client builds.
- When no external API key is configured, the system operates seamlessly in **Deterministic Grounded Fallback Mode** with 100% data fidelity.

### 2.5 Rate Limiting & DoS Protection
- In-memory sliding-window rate limiter restricts requests to **60 queries per minute per user ID**.
- Prevents accidental request loops and Denial of Service (DoS) attacks.

### 2.6 Cryptographic Audit Ledger Integration
- Every Copilot query, intent classification, tool invocation list, and response summary is immutably logged into the TRINETRA SHA-256 hash-chained audit ledger (`AuditEvent.action = "COPILOT_QUERY"`).
- Provides complete tamper-evident auditability for statutory oversight.
