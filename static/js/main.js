document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('wordSearch');
    const wordTitle = document.getElementById('currentWord');
    const wordSubtitle = document.querySelector('.word-subtitle');
    const definitionContent = document.querySelector('.definition-content');
    const carouselInner = document.querySelector('.carousel-inner');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const clickableToggle = document.getElementById('clickableToggle');
    const loading = document.querySelector('.loading');
    const errorMessage = document.querySelector('.error-message');
    const privacyNotice = document.getElementById('privacyNotice');
    const privacyClose = document.getElementById('privacyClose');
    
    // History sidebar elements
    const historySidebar = document.getElementById('historySidebar');
    const historyToggle = document.getElementById('historyToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    let searchTimeout;
    let searchHistory = [];
    let currentHistoryIndex = -1;
    let isClickableMode = false;
    let isNavigating = false;
    let currentWord = '';
    let currentFetchController = null;
    
    // Privacy notice handling
    const privacyDismissed = localStorage.getItem('privacyNoticeDismissed');
    if (privacyDismissed) {
        privacyNotice.style.display = 'none';
    }
    
    privacyClose.addEventListener('click', function() {
        privacyNotice.style.display = 'none';
        localStorage.setItem('privacyNoticeDismissed', 'true');
    });
    
    // History sidebar handlers
    historyToggle.addEventListener('click', function() {
        historySidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    function closeSidebar() {
        historySidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('Clear all search history?')) {
            searchHistory = [];
            currentHistoryIndex = -1;
            localStorage.removeItem('searchHistory');
            updateHistoryUI();
            updateNavigationButtons();
        }
    });
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
        try {
            searchHistory = JSON.parse(savedHistory);
            currentHistoryIndex = searchHistory.length - 1;
            updateHistoryUI();
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }

    function makeTextClickable(text) {
        if (!text) return '';
        
        return text.split(/\b/).map(word => {
            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
            if (/^[a-zA-Z]+$/.test(cleanWord)) {
                return `<span class="clickable-word" data-word="${cleanWord}">${word}</span>`;
            }
            return word;
        }).join('');
    }

    searchInput.addEventListener('input', function(e) {
        const word = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (word.length > 0) {
            searchTimeout = setTimeout(() => {
                if (!isNavigating) {
                    fetchWordInfo(word, true);
                }
            }, 500); // Increased from 300ms to 500ms
        } else {
            loading.style.display = 'none';
            errorMessage.style.display = 'none';
            wordTitle.textContent = 'Word';
            definitionContent.innerHTML = '<p class="text-muted">Enter a word in the search box above to see its definition and related images.</p>';
            carouselInner.innerHTML = `
                <div class="carousel-item active">
                    <div class="d-flex align-items-center justify-content-center" style="height: 300px; background: rgba(118, 118, 128, 0.08);">
                        <p class="text-muted">Search for a word to see related images</p>
                    </div>
                </div>
            `;
            currentWord = '';
        }
    });

    async function fetchWordInfo(word, isNewSearch = false) {
        word = word.toLowerCase().trim();
        if (!word) return;

        // Cancel previous request if still pending
        if (currentFetchController) {
            currentFetchController.abort();
        }
        currentFetchController = new AbortController();

        // Reset navigating flag to prevent it from getting stuck
        isNavigating = false;

        try {
            loading.classList.add('active');
            errorMessage.textContent = '';
            
            const response = await fetch(`/api/word/${word}`, {
                signal: currentFetchController.signal
            });
            const data = await response.json();
            currentFetchController = null;

            if (data.error) {
                loading.classList.remove('active');
                showError('Word not found or connection error occurred');
                
                // Still add failed searches to history for navigation consistency
                if (isNewSearch) {
                    addToHistory(word);
                }
                return;
            }

            loading.classList.remove('active');
            
            // Update currentWord BEFORE updating UI to ensure synchronization
            currentWord = word;
            
            // Handle history
            if (isNewSearch) {
                addToHistory(word);
            }

            // Store data for clickable mode toggle
            window.lastFetchedData = data;
            updateUI(word, data);
        } catch (error) {
            // Ignore abort errors (user typed another word)
            if (error.name === 'AbortError') {
                console.log('Fetch aborted for:', word);
                return;
            }
            
            loading.classList.remove('active');
            console.error('Error:', error);
            showError('Failed to fetch word information');
            
            // Still add failed searches to history for navigation consistency
            if (isNewSearch) {
                addToHistory(word);
            }
            currentFetchController = null;
        } finally {
            isNavigating = false;
            updateNavigationButtons();
        }
    }

    function updateUI(word, data) {
        try {
            // Update word title with proper capitalization
            wordTitle.textContent = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            if (wordSubtitle) {
                wordSubtitle.style.display = 'none';
            }

            // Update definition
            if (data.definition) {
                const def = data.definition;
                let html = '';
                
                // Add phonetic if available
                const phonetic = def.phonetic || (def.phonetics && def.phonetics[0] && def.phonetics[0].text) || '';
                if (phonetic) {
                    html += `<div class="phonetic">${phonetic}</div>`;
                }

                // Process meanings
                if (def.meanings && Array.isArray(def.meanings)) {
                    def.meanings.forEach(meaning => {
                        html += `<div class="part-of-speech">${meaning.partOfSpeech}</div>`;

                        if (meaning.definitions && Array.isArray(meaning.definitions)) {
                            meaning.definitions.forEach(definition => {
                                const processedDefinition = isClickableMode ? 
                                    makeTextClickable(definition.definition) : 
                                    definition.definition;

                                const processedExample = definition.example && isClickableMode ? 
                                    makeTextClickable(definition.example) : 
                                    definition.example;

                                html += `
                                    <div class="definition-item">
                                        ${processedDefinition}
                                        ${definition.example ? `
                                            <div class="example">"${processedExample}"</div>
                                        ` : ''}
                                    </div>
                                `;
                            });
                        }
                    });
                }

                // Add synonyms
                if (data.synonyms && Array.isArray(data.synonyms) && data.synonyms.length > 0) {
                    html += `
                        <div class="synonyms-section">
                            <div class="part-of-speech">Synonyms</div>
                            <div>
                                ${data.synonyms.slice(0, 10).map(syn => 
                                    `<span class="synonym-chip" data-word="${syn.word}">${syn.word}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }

                // Add antonyms
                if (data.antonyms && Array.isArray(data.antonyms) && data.antonyms.length > 0) {
                    html += `
                        <div class="antonyms-section">
                            <div class="part-of-speech">Antonyms</div>
                            <div>
                                ${data.antonyms.slice(0, 10).map(ant => 
                                    `<span class="antonym-chip" data-word="${ant.word}">${ant.word}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }

                definitionContent.innerHTML = html;
            }

            // Update images
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                carouselInner.innerHTML = data.images.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}" data-bs-interval="3000">
                        <img src="${img}" alt="${word}" class="d-block w-100">
                    </div>
                `).join('');
            } else {
                carouselInner.innerHTML = `
                    <div class="carousel-item active">
                        <div class="empty-image-state">
                            <i class="fas fa-image empty-icon"></i>
                            <p>No images available for "${word}"</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            showError('Error displaying word information');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        definitionContent.innerHTML = `<p class="text-muted">${message}</p>`;
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="d-flex align-items-center justify-content-center" style="height: 300px; background: rgba(118, 118, 128, 0.08);">
                    <p class="text-muted">No image available</p>
                </div>
            </div>
        `;
        wordTitle.textContent = 'Word';
        currentWord = '';
    }

    function updateNavigationButtons() {
        const canGoPrev = currentHistoryIndex > 0 && !isNavigating;
        const canGoNext = currentHistoryIndex < searchHistory.length - 1 && !isNavigating;
        
        prevButton.disabled = !canGoPrev;
        nextButton.disabled = !canGoNext;

        console.log('Navigation:', {
            history: searchHistory,
            currentIndex: currentHistoryIndex,
            canGoPrev,
            canGoNext,
            isNavigating
        });
    }

    function addToHistory(word) {
        word = word.toLowerCase().trim();
        
        // Don't add if empty or same as current
        if (!word || word === searchHistory[currentHistoryIndex]) {
            return;
        }

        // If we're not at the end, remove forward history
        if (currentHistoryIndex < searchHistory.length - 1) {
            searchHistory = searchHistory.slice(0, currentHistoryIndex + 1);
        }

        // Add new word
        searchHistory.push(word);
        currentHistoryIndex = searchHistory.length - 1;
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        
        updateNavigationButtons();
        updateHistoryUI();
    }
    
    function updateHistoryUI() {
        if (searchHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No search history yet</p>';
            return;
        }
        
        // Reverse to show most recent first
        const reversedHistory = [...searchHistory].reverse();
        historyList.innerHTML = reversedHistory.map((word, index) => {
            const actualIndex = searchHistory.length - 1 - index;
            const isActive = actualIndex === currentHistoryIndex;
            return `
                <div class="history-item ${isActive ? 'active' : ''}" data-word="${word}" data-index="${actualIndex}">
                    <i class="fas fa-clock"></i>
                    <span class="history-item-text">${word}</span>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const word = this.getAttribute('data-word');
                searchInput.value = word;
                fetchWordInfo(word, false);
                closeSidebar();
            });
        });
    }

    // Navigation button handlers
    prevButton.addEventListener('click', function() {
        if (isNavigating || currentHistoryIndex <= 0) {
            console.log('Prev navigation blocked');
            return;
        }

        isNavigating = true;
        updateNavigationButtons();

        currentHistoryIndex--;
        const word = searchHistory[currentHistoryIndex];
        searchInput.value = word;
        
        console.log('Navigating to previous word:', word);
        fetchWordInfo(word, false);
    });

    nextButton.addEventListener('click', function() {
        if (isNavigating || currentHistoryIndex >= searchHistory.length - 1) {
            console.log('Next navigation blocked');
            return;
        }

        isNavigating = true;
        updateNavigationButtons();

        currentHistoryIndex++;
        const word = searchHistory[currentHistoryIndex];
        searchInput.value = word;
        
        console.log('Navigating to next word:', word);
        fetchWordInfo(word, false);
    });

    // Clickable mode toggle
    clickableToggle.addEventListener('click', function() {
        isClickableMode = !isClickableMode;
        this.classList.toggle('active');
        this.setAttribute('aria-pressed', isClickableMode);
        document.documentElement.classList.toggle('clickable-active', isClickableMode);
        
        // Refresh current word display with new clickable mode
        if (currentWord && definitionContent.innerHTML) {
            // Re-render the current content with updated clickable mode
            const lastData = window.lastFetchedData;
            if (lastData) {
                updateUI(currentWord, lastData);
            }
        }
    });

    // Enhanced click handler with event delegation
    definitionContent.addEventListener('click', function(e) {
        // Prevent navigation during click handling
        if (isNavigating) return;
        
        let targetWord = '';
        const target = e.target;

        // Handle data-word attribute first (most reliable)
        if (target.hasAttribute('data-word')) {
            targetWord = target.getAttribute('data-word').toLowerCase().trim();
        }
        // Handle class-based clicks
        else if (target.classList.contains('synonym-chip') || 
                 target.classList.contains('antonym-chip')) {
            targetWord = target.textContent.toLowerCase().trim();
        }
        // Handle clickable words in definitions (only when clickable mode is active)
        else if (isClickableMode && target.classList.contains('clickable-word')) {
            targetWord = (target.getAttribute('data-word') || target.textContent)
                .replace(/[^a-zA-Z]/g, '').toLowerCase().trim();
        }

        // Search for any valid word (removed the currentWord check to allow re-clicking)
        if (targetWord) {
            console.log('Clicked word:', targetWord);
            e.preventDefault(); // Prevent default behavior
            
            // Only fetch if it's a different word to avoid unnecessary API calls
            if (targetWord !== currentWord) {
                searchInput.value = targetWord;
                fetchWordInfo(targetWord, true);
            }
        }
    });

    // Initialize
    updateNavigationButtons();
    
    // Register Service Worker for PWA support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/static/sw.js')
                .then(function(registration) {
                    console.log('Service Worker registered:', registration.scope);
                })
                .catch(function(error) {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
});
