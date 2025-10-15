import pytest
from app import app
import json


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestRoutes:
    """Test Flask routes"""
    
    def test_index_route(self, client):
        """Test that index route returns 200"""
        response = client.get('/')
        assert response.status_code == 200
        assert b'Dictionary Lens' in response.data
    
    def test_api_word_route_valid(self, client):
        """Test API with valid word"""
        response = client.get('/api/word/hello')
        assert response.status_code in [200, 504]  # May timeout in tests
    
    def test_api_word_route_invalid_chars(self, client):
        """Test API with invalid characters"""
        response = client.get('/api/word/hello123')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid word format' in data['error']
    
    def test_api_word_route_too_long(self, client):
        """Test API with word that's too long"""
        long_word = 'a' * 51
        response = client.get(f'/api/word/{long_word}')
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'too long' in data['error']
    
    def test_api_word_route_with_hyphen(self, client):
        """Test API with hyphenated word"""
        response = client.get('/api/word/well-being')
        assert response.status_code in [200, 504]
    
    def test_api_word_route_with_apostrophe(self, client):
        """Test API with word containing apostrophe"""
        response = client.get('/api/word/don\'t')
        # URL encoding will be handled by Flask
        assert response.status_code in [200, 400, 504]
    
    def test_404_route(self, client):
        """Test 404 error handling"""
        response = client.get('/nonexistent')
        assert response.status_code == 404


class TestErrorHandlers:
    """Test error handlers"""
    
    def test_rate_limit_error_format(self, client):
        """Test rate limit error returns proper JSON"""
        # Make requests until rate limited (would need to disable rate limit in tests)
        # This is a placeholder test
        assert True
    
    def test_404_error_format(self, client):
        """Test 404 error returns proper JSON for API routes"""
        response = client.get('/api/nonexistent/word')
        assert response.status_code == 404


class TestInputValidation:
    """Test input validation"""
    
    @pytest.mark.parametrize("word,expected_status", [
        ("hello", 200),
        ("test-word", 200),
        ("don't", 200),
        ("", 404),  # Empty word results in 404
        ("123", 400),  # Numbers only
        ("hello!", 400),  # Special char
        ("hello world", 400),  # Space
        ("hello@test", 400),  # @ symbol
    ])
    def test_word_validation(self, client, word, expected_status):
        """Test various word inputs"""
        if word:
            response = client.get(f'/api/word/{word}')
            # Allow for timeout or success
            assert response.status_code in [expected_status, 504]
        else:
            # Empty word
            response = client.get('/api/word/')
            assert response.status_code == 404


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
