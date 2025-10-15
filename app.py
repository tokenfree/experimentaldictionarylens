from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
import os
import re
from cache_manager import Cache
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)

# CORS configuration for web-based access
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Rate limiting: 100 requests per hour per IP
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"],
    storage_uri="memory://"
)

logging.basicConfig(level=logging.INFO)  # Changed to INFO for production

# Initialize cache
word_cache = Cache()

# Free Dictionary API endpoint
DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"
PIXABAY_API_URL = "https://pixabay.com/api/"
PIXABAY_API_KEY = os.environ.get("PIXABAY_API_KEY")
DATAMUSE_API_URL = "https://api.datamuse.com/words"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/word/<word>')
@limiter.limit("100 per hour")
def get_word_info(word):
    # Input validation: only allow letters, hyphens, and apostrophes
    # Prevent injection attacks and invalid input
    word = word.strip().lower()
    
    # Length validation (prevent abuse)
    if len(word) > 50:
        return jsonify({"error": "Word too long (max 50 characters)"}), 400
    
    # Character validation (only letters, hyphens, apostrophes)
    if not re.match(r"^[a-z\-']+$", word):
        return jsonify({"error": "Invalid word format. Only letters, hyphens, and apostrophes allowed."}), 400
    
    # Check cache first
    cached_result = word_cache.get(word)
    if cached_result:
        return jsonify(cached_result)

    try:
        # Set timeout for all requests (5 seconds)
        timeout = 5
        
        # Define API fetch functions
        def fetch_definition():
            try:
                response = requests.get(f"{DICTIONARY_API_URL}{word}", timeout=timeout)
                return ('definition', response.json() if response.status_code == 200 else None)
            except Exception as e:
                logging.error(f"Error fetching definition: {str(e)}")
                return ('definition', None)
        
        def fetch_synonyms():
            try:
                response = requests.get(
                    DATAMUSE_API_URL,
                    params={"rel_syn": word},
                    timeout=timeout
                )
                return ('synonyms', response.json() if response.status_code == 200 else [])
            except Exception as e:
                logging.error(f"Error fetching synonyms: {str(e)}")
                return ('synonyms', [])
        
        def fetch_antonyms():
            try:
                response = requests.get(
                    DATAMUSE_API_URL,
                    params={"rel_ant": word},
                    timeout=timeout
                )
                return ('antonyms', response.json() if response.status_code == 200 else [])
            except Exception as e:
                logging.error(f"Error fetching antonyms: {str(e)}")
                return ('antonyms', [])
        
        def fetch_images():
            try:
                response = requests.get(
                    PIXABAY_API_URL,
                    params={
                        "key": PIXABAY_API_KEY,
                        "q": word,
                        "per_page": 10,
                        "image_type": "photo"
                    },
                    timeout=timeout
                )
                if response.status_code != 200:
                    logging.debug(f"Pixabay API error response: {response.text}")
                return ('images', response.json() if response.status_code == 200 else None)
            except Exception as e:
                logging.error(f"Error fetching images: {str(e)}")
                return ('images', None)
        
        # Execute all API calls concurrently
        results = {}
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(fetch_definition),
                executor.submit(fetch_synonyms),
                executor.submit(fetch_antonyms),
                executor.submit(fetch_images)
            ]
            
            for future in as_completed(futures):
                key, data = future.result()
                results[key] = data
        
        dict_data = results.get('definition')
        synonyms_data = results.get('synonyms', [])
        antonyms_data = results.get('antonyms', [])
        image_data = results.get('images')

        result = {
            "definition": dict_data[0] if dict_data else None,
            "synonyms": synonyms_data,
            "antonyms": antonyms_data,
            "images": [img["webformatURL"] for img in image_data["hits"][:10]] if image_data and "hits" in image_data else []  # Ensure we only use first 10 images
        }

        # Cache the result
        word_cache.set(word, result)
        return jsonify(result)

    except requests.Timeout:
        logging.error(f"Timeout fetching word info for: {word}")
        return jsonify({"error": "Request timed out. Please check your internet connection and try again."}), 504
    except requests.RequestException as e:
        logging.error(f"Network error fetching word info: {str(e)}")
        return jsonify({"error": "Network error. Please check your internet connection."}), 503
    except Exception as e:
        logging.error(f"Error fetching word info: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again."}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors"""
    return jsonify({
        "error": "Rate limit exceeded. Please wait before making more requests.",
        "message": "You've reached the maximum of 100 requests per hour."
    }), 429

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    logging.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Get debug mode from environment (default: False for production)
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
