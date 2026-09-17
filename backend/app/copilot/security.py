import re
import time
from typing import Dict, List, Tuple
from app.core.exceptions import BusinessRuleViolationError, PermissionDeniedError

# Patterns indicative of prompt injection or system prompt extraction attempts
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"(?i)disregard\s+(all\s+)?(previous|prior|system)\s+rules",
    r"(?i)system\s*prompt",
    r"(?i)you\s+are\s+now\s+(an?\s+)?unrestricted",
    r"(?i)jailbreak",
    r"(?i)reveal\s+(the\s+)?(secret|password|jwt|api_key|token|credentials)",
    r"(?i)delete\s+from\s+",
    r"(?i)drop\s+table",
    r"(?i)select\s+.*\s+from\s+users",
    r"(?i)exec\s*\(",
    r"(?i)eval\s*\("
]

# Sensitive keys/patterns to scrub from evidence and tool outputs
SENSITIVE_PATTERNS = [
    (r"(?i)password(_hash)?\s*[:=]\s*['\"][^'\"]+['\"]", "password: [REDACTED]"),
    (r"(?i)bearer\s+[a-zA-Z0-9_\-\.]+", "Bearer [REDACTED_JWT]"),
    (r"(?i)jwt_secret\s*[:=]\s*['\"][^'\"]+['\"]", "jwt_secret: [REDACTED]"),
    (r"(?i)api_key\s*[:=]\s*['\"][^'\"]+['\"]", "api_key: [REDACTED]")
]

class RateLimiter:
    """Simple thread-safe in-memory rate limiter per user/IP."""
    def __init__(self, max_requests_per_minute: int = 60):
        self.max_requests = max_requests_per_minute
        self.user_requests: Dict[str, List[float]] = {}

    def check_rate_limit(self, identifier: str) -> bool:
        now = time.time()
        window = 60.0
        timestamps = self.user_requests.get(identifier, [])
        # Filter out timestamps older than 60s
        timestamps = [t for t in timestamps if now - t < window]
        if len(timestamps) >= self.max_requests:
            return False
        timestamps.append(now)
        self.user_requests[identifier] = timestamps
        return True

rate_limiter = RateLimiter(max_requests_per_minute=60)

class CopilotSecurity:
    @staticmethod
    def sanitize_user_query(query: str) -> Tuple[str, bool]:
        """
        Sanitizes user input and detects potential injection attempts.
        Returns (sanitized_query, was_injection_detected).
        """
        if not query or not query.strip():
            raise BusinessRuleViolationError("Query cannot be empty.")
        
        cleaned = query.strip()
        injection_detected = False

        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, cleaned):
                injection_detected = True
                break

        return cleaned, injection_detected

    @staticmethod
    def scrub_sensitive_data(text: str) -> str:
        """Removes passwords, secrets, JWTs, and keys from any text."""
        if not text:
            return text
        sanitized = text
        for pattern, replacement in SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)
        return sanitized

    @staticmethod
    def wrap_untrusted_data_for_prompt(data_label: str, content: str) -> str:
        """
        Wraps retrieved database text (e.g. grievance notes, OCR, descriptions)
        inside explicit XML data boundaries so LLMs treat it as DATA, not instructions.
        """
        scrubbed = CopilotSecurity.scrub_sensitive_data(content)
        return f"\n<UNTRUSTED_DOCUMENT_DATA label=\"{data_label}\">\n{scrubbed}\n</UNTRUSTED_DOCUMENT_DATA>\n"
