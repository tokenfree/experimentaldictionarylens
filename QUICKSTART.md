# 🚀 Quick Start Guide

Get Dictionary Lens running in 5 minutes!

## Prerequisites

- Python 3.11 or higher
- Pixabay API key (free at [pixabay.com/api](https://pixabay.com/api/docs/))

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set API Key

**Windows (PowerShell)**:
```powershell
$env:PIXABAY_API_KEY="your_api_key_here"
```

**Linux/macOS (Bash)**:
```bash
export PIXABAY_API_KEY="your_api_key_here"
```

### 3. Run the App

```bash
python main.py
```

### 4. Open Browser

Visit: http://localhost:5000

That's it! 🎉

---

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

---

## Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Using Docker

```bash
docker build -t dictionarylens .
docker run -p 5000:5000 -e PIXABAY_API_KEY="your_key" dictionarylens
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PIXABAY_API_KEY` | Yes | - | Your Pixabay API key |
| `FLASK_ENV` | No | production | Set to `development` for debug mode |

---

## Common Issues

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Rate limit exceeded"
Wait 1 hour or get a different API key

### "Invalid API key"
Check your PIXABAY_API_KEY is set correctly

### Port 5000 already in use
Change port in `main.py`:
```python
app.run(host='0.0.0.0', port=8000)
```

---

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for complete features
- Check [iOS_MIGRATION_GUIDE.md](iOS_MIGRATION_GUIDE.md) for native app development

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/DictionaryLens/issues)
- **Email**: support@dictionarylens.com

---

**Happy word hunting! 📖**
