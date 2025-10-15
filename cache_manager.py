from datetime import datetime, timedelta
import logging

class Cache:
    """Thread-safe cache with expiration and size limits"""
    
    def __init__(self, expire_minutes=30, max_size=1000):
        self.cache = {}
        self.expire_minutes = expire_minutes
        self.max_size = max_size
        self.access_order = []  # Track access order for LRU eviction

    def get(self, key):
        """Get cached item if exists and not expired"""
        if key in self.cache:
            item = self.cache[key]
            if datetime.now() < item['expires']:
                # Update access order for LRU
                if key in self.access_order:
                    self.access_order.remove(key)
                self.access_order.append(key)
                return item['data']
            else:
                # Remove expired item
                self._remove(key)
        return None

    def set(self, key, value):
        """Set cache item with automatic eviction if size limit exceeded"""
        # Clean expired entries first
        self._clean_expired()
        
        # Check size limit and evict oldest if necessary
        if len(self.cache) >= self.max_size and key not in self.cache:
            self._evict_oldest()
        
        self.cache[key] = {
            'data': value,
            'expires': datetime.now() + timedelta(minutes=self.expire_minutes)
        }
        
        # Update access order
        if key in self.access_order:
            self.access_order.remove(key)
        self.access_order.append(key)
    
    def _remove(self, key):
        """Remove item from cache and access order"""
        if key in self.cache:
            del self.cache[key]
        if key in self.access_order:
            self.access_order.remove(key)
    
    def _evict_oldest(self):
        """Evict least recently used item"""
        if self.access_order:
            oldest_key = self.access_order[0]
            self._remove(oldest_key)
            logging.info(f"Cache evicted oldest entry: {oldest_key}")
    
    def _clean_expired(self):
        """Remove all expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, item in self.cache.items()
            if now >= item['expires']
        ]
        for key in expired_keys:
            self._remove(key)
        if expired_keys:
            logging.info(f"Cache cleaned {len(expired_keys)} expired entries")
    
    def size(self):
        """Get current cache size"""
        return len(self.cache)
    
    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        self.access_order.clear()
        logging.info("Cache cleared")
