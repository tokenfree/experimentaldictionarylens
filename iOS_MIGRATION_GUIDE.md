# iOS Native App Migration Guide

This guide explains how to convert Dictionary Lens to a native iOS/macOS app using SwiftUI.

## Architecture Overview

```
DictionaryLens (iOS)
├── App/
│   ├── DictionaryLensApp.swift       # App entry point
│   ├── ContentView.swift             # Main view
│   └── Info.plist                    # App metadata
├── Models/
│   ├── Word.swift                    # Word data model
│   ├── Definition.swift              # Definition model
│   └── NetworkError.swift            # Error types
├── ViewModels/
│   └── WordViewModel.swift           # Business logic
├── Views/
│   ├── SearchView.swift              # Search interface
│   ├── DefinitionView.swift          # Definition display
│   ├── ImageCarouselView.swift       # Image gallery
│   └── Components/
│       ├── WordCard.swift
│       └── LoadingView.swift
├── Services/
│   ├── DictionaryService.swift       # API client
│   ├── CacheManager.swift            # Local caching
│   └── NetworkMonitor.swift          # Connectivity check
└── Resources/
    ├── Assets.xcassets               # Images & colors
    └── Localizable.strings           # Translations
```

## Step-by-Step Migration

### 1. Create Xcode Project

```bash
# Open Xcode and create new project:
# - iOS App
# - Interface: SwiftUI
# - Language: Swift
# - Bundle ID: com.yourcompany.dictionarylens
```

### 2. App Entry Point (DictionaryLensApp.swift)

```swift
import SwiftUI

@main
struct DictionaryLensApp: App {
    @StateObject private var networkMonitor = NetworkMonitor()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(networkMonitor)
        }
    }
}
```

### 3. Main Content View (ContentView.swift)

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = WordViewModel()
    @State private var searchText = ""
    @State private var isClickableMode = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Search Bar
                SearchBar(text: $searchText, onSubmit: {
                    viewModel.fetchWord(searchText)
                })
                
                // Navigation Buttons
                HStack(spacing: 16) {
                    Button(action: viewModel.goToPrevious) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.accentColor)
                    }
                    .disabled(!viewModel.canGoPrevious)
                    
                    Button(action: { isClickableMode.toggle() }) {
                        Image(systemName: "hand.tap")
                            .foregroundColor(isClickableMode ? .white : .accentColor)
                    }
                    .background(isClickableMode ? Color.accentColor : Color.clear)
                    .clipShape(Circle())
                    
                    Button(action: viewModel.goToNext) {
                        Image(systemName: "chevron.right")
                            .foregroundColor(.accentColor)
                    }
                    .disabled(!viewModel.canGoNext)
                }
                .padding()
                
                // Content
                if viewModel.isLoading {
                    LoadingView()
                } else if let word = viewModel.currentWord {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            // Word Title
                            Text(word.word.capitalized)
                                .font(.largeTitle)
                                .fontWeight(.bold)
                            
                            // Images
                            if !word.images.isEmpty {
                                ImageCarouselView(images: word.images)
                                    .frame(height: 300)
                            }
                            
                            // Definition
                            DefinitionView(definition: word.definition)
                            
                            // Synonyms
                            if !word.synonyms.isEmpty {
                                SynonymSection(title: "Synonyms", words: word.synonyms)
                            }
                            
                            // Antonyms
                            if !word.antonyms.isEmpty {
                                SynonymSection(title: "Antonyms", words: word.antonyms)
                            }
                        }
                        .padding()
                    }
                } else if let error = viewModel.error {
                    ErrorView(error: error)
                }
            }
            .navigationTitle("Dictionary Lens")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            // Show privacy notice
            showPrivacyNoticeIfNeeded()
        }
    }
    
    private func showPrivacyNoticeIfNeeded() {
        // Implement privacy notice modal
    }
}
```

### 4. View Model (WordViewModel.swift)

```swift
import Foundation
import Combine

@MainActor
class WordViewModel: ObservableObject {
    @Published var currentWord: WordData?
    @Published var isLoading = false
    @Published var error: NetworkError?
    @Published var searchHistory: [String] = []
    @Published var historyIndex = -1
    
    private let dictionaryService = DictionaryService()
    private let cacheManager = CacheManager()
    private var cancellables = Set<AnyCancellable>()
    
    var canGoPrevious: Bool {
        historyIndex > 0
    }
    
    var canGoNext: Bool {
        historyIndex < searchHistory.count - 1
    }
    
    func fetchWord(_ word: String) {
        guard !word.isEmpty else { return }
        
        // Check cache first
        if let cached = cacheManager.get(word) {
            self.currentWord = cached
            addToHistory(word)
            return
        }
        
        isLoading = true
        error = nil
        
        Task {
            do {
                let wordData = try await dictionaryService.fetchWordData(word)
                self.currentWord = wordData
                cacheManager.set(word, data: wordData)
                addToHistory(word)
                isLoading = false
            } catch let error as NetworkError {
                self.error = error
                isLoading = false
            }
        }
    }
    
    func goToPrevious() {
        guard canGoPrevious else { return }
        historyIndex -= 1
        let word = searchHistory[historyIndex]
        fetchWord(word)
    }
    
    func goToNext() {
        guard canGoNext else { return }
        historyIndex += 1
        let word = searchHistory[historyIndex]
        fetchWord(word)
    }
    
    private func addToHistory(_ word: String) {
        if historyIndex < searchHistory.count - 1 {
            searchHistory.removeSubrange((historyIndex + 1)...)
        }
        searchHistory.append(word)
        historyIndex = searchHistory.count - 1
    }
}
```

### 5. Models (Word.swift)

```swift
import Foundation

struct WordData: Codable, Identifiable {
    let id = UUID()
    let word: String
    let definition: Definition?
    let synonyms: [String]
    let antonyms: [String]
    let images: [URL]
    
    enum CodingKeys: String, CodingKey {
        case word, definition, synonyms, antonyms, images
    }
}

struct Definition: Codable {
    let phonetic: String?
    let meanings: [Meaning]
}

struct Meaning: Codable, Identifiable {
    let id = UUID()
    let partOfSpeech: String
    let definitions: [DefinitionItem]
    
    enum CodingKeys: String, CodingKey {
        case partOfSpeech, definitions
    }
}

struct DefinitionItem: Codable, Identifiable {
    let id = UUID()
    let definition: String
    let example: String?
    
    enum CodingKeys: String, CodingKey {
        case definition, example
    }
}
```

### 6. API Service (DictionaryService.swift)

```swift
import Foundation

actor DictionaryService {
    private let baseURL = "YOUR_API_URL"
    private let session: URLSession
    
    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: config)
    }
    
    func fetchWordData(_ word: String) async throws -> WordData {
        guard let url = URL(string: "\(baseURL)/api/word/\(word)") else {
            throw NetworkError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.httpError(httpResponse.statusCode)
        }
        
        do {
            let wordData = try JSONDecoder().decode(WordData.self, from: data)
            return wordData
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case decodingError(Error)
    case offline
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "Server error: \(code)"
        case .decodingError:
            return "Failed to decode response"
        case .offline:
            return "No internet connection"
        }
    }
}
```

### 7. Cache Manager (CacheManager.swift)

```swift
import Foundation

actor CacheManager {
    private var cache: [String: CachedItem] = [:]
    private let maxSize = 1000
    private let expirationMinutes = 30
    
    struct CachedItem {
        let data: WordData
        let expiry: Date
    }
    
    func get(_ key: String) -> WordData? {
        guard let item = cache[key] else { return nil }
        
        if item.expiry < Date() {
            cache.removeValue(forKey: key)
            return nil
        }
        
        return item.data
    }
    
    func set(_ key: String, data: WordData) {
        cleanExpired()
        
        if cache.count >= maxSize {
            evictOldest()
        }
        
        let expiry = Date().addingTimeInterval(TimeInterval(expirationMinutes * 60))
        cache[key] = CachedItem(data: data, expiry: expiry)
    }
    
    private func cleanExpired() {
        let now = Date()
        cache = cache.filter { $0.value.expiry >= now }
    }
    
    private func evictOldest() {
        guard let oldestKey = cache.min(by: { $0.value.expiry < $1.value.expiry })?.key else {
            return
        }
        cache.removeValue(forKey: oldestKey)
    }
}
```

## App Store Requirements

### Info.plist Configuration

```xml
<key>CFBundleName</key>
<string>Dictionary Lens</string>
<key>CFBundleDisplayName</key>
<string>Dictionary Lens</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>

<!-- Privacy -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>

<key>NSUserTrackingUsageDescription</key>
<string>We do not track you.</string>
```

### Required Assets

1. **App Icon**: 1024x1024px PNG (all iOS sizes)
2. **Screenshots**: iPhone 6.7", 6.5", 5.5" and iPad Pro 12.9", 12.9" 2nd gen
3. **Privacy Policy URL**: Link to PRIVACY_POLICY.md
4. **Support URL**: Link to GitHub issues

## Testing Checklist

- [ ] Test on iPhone (all screen sizes)
- [ ] Test on iPad
- [ ] Test Dark Mode
- [ ] Test VoiceOver accessibility
- [ ] Test Dynamic Type sizes
- [ ] Test offline mode
- [ ] Test with slow network
- [ ] Test with invalid input
- [ ] Memory leak testing with Instruments

## Deployment

1. **Prepare App Store Connect**:
   - Create app listing
   - Upload screenshots
   - Add privacy policy URL
   - Fill App Store description

2. **Archive and Upload**:
   ```bash
   # In Xcode:
   # Product -> Archive
   # Validate App
   # Distribute App
   ```

3. **Submit for Review**:
   - Select build
   - Add release notes
   - Submit for review

## Additional Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**Note**: This is a template structure. Actual implementation requires Xcode and Swift development environment.
