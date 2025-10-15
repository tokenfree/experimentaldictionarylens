# 📖 Dictionary Lens

An intelligent dictionary application that provides definitions, synonyms, antonyms, and contextual images for any word you search.

## ✨ Features

- **Instant Definitions**: Real-time dictionary lookups with phonetic pronunciations
- **Rich Context**: Synonyms, antonyms, and usage examples
- **Visual Learning**: Contextual images from Pixabay to enhance understanding
- **Interactive Mode**: Click on words within definitions to explore related terms
- **Navigation History**: Browse through your search history with back/forward buttons
- **Dark Mode Support**: Automatic theme adaptation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Offline Caching**: Recently searched words cached for 30 minutes

## 🛠️ Technology Stack

- **Backend**: Python 3.11+ with Flask
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **UI Framework**: Bootstrap 5.3
- **APIs Used**:
  - [Free Dictionary API](https://dictionaryapi.dev/) - Word definitions
  - [Datamuse API](https://www.datamuse.com/api/) - Synonyms and antonyms
  - [Pixabay API](https://pixabay.com/api/docs/) - Contextual images

## 📋 Requirements

- Python 3.11 or higher
- Pixabay API key (free at [pixabay.com/api](https://pixabay.com/api/docs/))

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/DictionaryLens.git
   cd DictionaryLens
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or with Poetry:
   ```bash
   poetry install
   ```

3. **Set up environment variables**:
   ```bash
   # On Linux/macOS
   export PIXABAY_API_KEY="your_api_key_here"
   
   # On Windows (PowerShell)
   $env:PIXABAY_API_KEY="your_api_key_here"
   ```

4. **Run the application**:
   ```bash
   python main.py
   ```

5. **Open in browser**:
   ```
   http://localhost:5000
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PIXABAY_API_KEY` | Yes | Your Pixabay API key for image search |
| `FLASK_ENV` | No | Set to `development` or `production` (default: `production`) |
| `CACHE_EXPIRE_MINUTES` | No | Cache expiration time in minutes (default: 30) |

### Rate Limiting

- API requests are limited to **100 requests per hour** per IP address
- This prevents API quota exhaustion and abuse

## 📱 Apple App Store Compliance

This application follows Apple's App Store Review Guidelines:

### Privacy (Guideline 5.1)
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for data collection disclosure
- User search queries are sent to third-party APIs
- No personal identifiable information is collected or stored

### Security (Guideline 2.5.13)
- API keys stored securely on backend only
- Input validation prevents injection attacks
- Rate limiting prevents abuse

### Accessibility (Guideline 2.5.7)
- Full keyboard navigation support
- ARIA labels for screen readers
- Semantic HTML for assistive technologies

## 🧪 Testing

Run tests with pytest:
```bash
pytest tests/ -v
```

Run linting:
```bash
ruff check .
black --check .
```

## 📦 Deployment

### Production Deployment

1. **Using Gunicorn** (Linux/macOS):
   ```bash
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

2. **Using Docker**:
   ```bash
   docker build -t dictionarylens .
   docker run -p 5000:5000 -e PIXABAY_API_KEY="your_key" dictionarylens
   ```

3. **Deploy to Cloud**:
   - **Replit**: Already configured with `.replit` file
   - **Heroku**: Add `Procfile` with `web: gunicorn app:app`
   - **AWS/GCP/Azure**: Use standard Python web app deployment

## 🔒 Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement CSRF protection for production
- Monitor API usage to prevent quota exhaustion

## 🎨 Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Flask Backend  │────▶│  Cache (30 min)  │
└────────┬────────┘     └──────────────────┘
         │
         ├──────────▶ Dictionary API (dictionaryapi.dev)
         ├──────────▶ Datamuse API (synonyms/antonyms)
         └──────────▶ Pixabay API (images)
```

## 🐛 Known Issues & Limitations

- **Offline Mode**: Limited to cached words only
- **Image Accuracy**: Images are algorithmically matched, may not always be contextually accurate
- **API Dependencies**: Relies on third-party API availability
- **Browser Support**: Requires modern browsers with ES6+ support

## 🚀 Future Roadmap

- [ ] Convert to native iOS/macOS app with SwiftUI
- [ ] Add pronunciation audio playback
- [ ] Implement word-of-the-day feature
- [ ] Add user accounts and favorites
- [ ] Support multiple languages
- [ ] Add etymology information
- [ ] Implement spaced repetition learning
- [ ] Add browser extension

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/DictionaryLens/issues)
- **Email**: support@dictionarylens.com
- **Documentation**: [Wiki](https://github.com/yourusername/DictionaryLens/wiki)

## 🙏 Acknowledgments

- Dictionary data provided by [Free Dictionary API](https://dictionaryapi.dev/)
- Synonym/antonym data from [Datamuse API](https://www.datamuse.com/api/)
- Images courtesy of [Pixabay](https://pixabay.com/)
- UI inspired by Apple Human Interface Guidelines

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: ✅ Production Ready
