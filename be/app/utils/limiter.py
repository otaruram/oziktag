import time
from fastapi import HTTPException, status

class MemoryRateLimiter:
    """
    A simple in-memory rate limiter that prevents memory leaks by periodically
    sweeping (garbage collecting) expired keys.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60, cleanup_interval: int = 300):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.cleanup_interval = cleanup_interval
        self._store = {}
        self._last_cleanup = time.time()

    def check_rate_limit(self, user_id: str, max_requests: int = None, window_seconds: int = None):
        now = time.time()
        
        limit = max_requests or self.max_requests
        window = window_seconds or self.window_seconds

        # Run cleanup if interval has passed
        if now - self._last_cleanup > self.cleanup_interval:
            self._cleanup(now)

        if user_id not in self._store:
            self._store[user_id] = []

        # Remove expired timestamps
        self._store[user_id] = [t for t in self._store[user_id] if now - t < window]

        if len(self._store[user_id]) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Terlalu banyak permintaan. Silakan tunggu beberapa saat."
            )

        self._store[user_id].append(now)

    def _cleanup(self, now: float):
        """Remove keys that have no recent requests."""
        expired_keys = []
        for uid, timestamps in self._store.items():
            valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
            if not valid_timestamps:
                expired_keys.append(uid)
            else:
                self._store[uid] = valid_timestamps
                
        for key in expired_keys:
            del self._store[key]
            
        self._last_cleanup = now

# Global instance for general upload rate limiting
upload_rate_limiter = MemoryRateLimiter(max_requests=10, window_seconds=60)
