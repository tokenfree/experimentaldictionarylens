import pytest
from cache_manager import Cache
from datetime import datetime, timedelta
import time


class TestCache:
    """Test cache functionality"""
    
    def test_cache_initialization(self):
        """Test cache is initialized correctly"""
        cache = Cache(expire_minutes=10, max_size=100)
        assert cache.expire_minutes == 10
        assert cache.max_size == 100
        assert cache.size() == 0
    
    def test_cache_set_and_get(self):
        """Test setting and getting cache values"""
        cache = Cache()
        cache.set('test_key', {'data': 'test_value'})
        
        result = cache.get('test_key')
        assert result is not None
        assert result['data'] == 'test_value'
    
    def test_cache_get_nonexistent(self):
        """Test getting non-existent key returns None"""
        cache = Cache()
        result = cache.get('nonexistent_key')
        assert result is None
    
    def test_cache_expiration(self):
        """Test cache items expire correctly"""
        cache = Cache(expire_minutes=0.01)  # 0.6 seconds
        cache.set('test_key', 'test_value')
        
        # Should exist immediately
        assert cache.get('test_key') == 'test_value'
        
        # Wait for expiration
        time.sleep(1)
        
        # Should be expired
        assert cache.get('test_key') is None
    
    def test_cache_size_limit(self):
        """Test cache respects max size limit"""
        cache = Cache(max_size=3)
        
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.set('key3', 'value3')
        
        assert cache.size() == 3
        
        # Adding 4th item should evict oldest
        cache.set('key4', 'value4')
        
        assert cache.size() == 3
        assert cache.get('key1') is None  # Oldest should be evicted
        assert cache.get('key4') == 'value4'
    
    def test_cache_lru_eviction(self):
        """Test LRU eviction policy"""
        cache = Cache(max_size=3)
        
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.set('key3', 'value3')
        
        # Access key1 to make it more recent
        cache.get('key1')
        
        # Add key4, should evict key2 (oldest)
        cache.set('key4', 'value4')
        
        assert cache.get('key1') == 'value1'  # Should still exist
        assert cache.get('key2') is None  # Should be evicted
        assert cache.get('key4') == 'value4'
    
    def test_cache_update_existing_key(self):
        """Test updating an existing key"""
        cache = Cache(max_size=2)
        
        cache.set('key1', 'value1')
        cache.set('key1', 'value1_updated')
        
        assert cache.size() == 1
        assert cache.get('key1') == 'value1_updated'
    
    def test_cache_clear(self):
        """Test clearing the cache"""
        cache = Cache()
        
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        
        assert cache.size() == 2
        
        cache.clear()
        
        assert cache.size() == 0
        assert cache.get('key1') is None
        assert cache.get('key2') is None
    
    def test_cache_clean_expired(self):
        """Test automatic cleanup of expired entries"""
        cache = Cache(expire_minutes=0.01, max_size=10)
        
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        
        # Wait for expiration
        time.sleep(1)
        
        # Setting new key should trigger cleanup
        cache.set('key3', 'value3')
        
        assert cache.get('key1') is None
        assert cache.get('key2') is None
        assert cache.get('key3') == 'value3'
    
    def test_cache_size_method(self):
        """Test size method returns correct count"""
        cache = Cache()
        
        assert cache.size() == 0
        
        cache.set('key1', 'value1')
        assert cache.size() == 1
        
        cache.set('key2', 'value2')
        assert cache.size() == 2
        
        cache.clear()
        assert cache.size() == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
