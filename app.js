// Configuration
let config = {
    apiKey: localStorage.getItem('grok_api_key') || '',
    apiUrl: localStorage.getItem('grok_api_url') || 'https://api.x.ai/v1/chat/completions'
};

// State
let currentImage = null;
let chatHistory = [];

// Configure marked.js for markdown rendering
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error('Highlight error:', err);
            }
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    focusInput();
});

// Settings Management
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('open');
}

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value;
    const apiUrl = document.getElementById('apiUrl').value;

    if (!apiKey) {
        alert('Please enter your Grok API key');
        return;
    }

    config.apiKey = apiKey;
    config.apiUrl = apiUrl;

    localStorage.setItem('grok_api_key', apiKey);
    localStorage.setItem('grok_api_url', apiUrl);

    toggleSettings();
    showNotification('Settings saved successfully!');
}

function loadSettings() {
    if (config.apiKey) {
        document.getElementById('apiKey').value = config.apiKey;
    }
    document.getElementById('apiUrl').value = config.apiUrl;
}

function showNotification(message) {
    const container = document.getElementById('messagesContainer');
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #00d9ff;
        color: #1a1a1a;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1001;
        animation: fadeIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Message Handling
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function focusInput() {
    document.getElementById('messageInput').focus();
}

// Image Handling
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = e.target.result;
            displayImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function handlePaste(event) {
    const items = event.clipboardData.items;
    
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImage = e.target.result;
                displayImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            break;
        }
    }
}

function displayImagePreview(imageData) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <img src="${imageData}" alt="Preview">
        <button class="remove-image" onclick="removeImage()">×</button>
    `;
    preview.classList.add('active');
}

function removeImage() {
    currentImage = null;
    const preview = document.getElementById('imagePreview');
    preview.classList.remove('active');
    preview.innerHTML = '';
    document.getElementById('imageInput').value = '';
}

// Chat Functions
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message && !currentImage) {
        return;
    }

    if (!config.apiKey) {
        alert('Please configure your API key in settings');
        toggleSettings();
        return;
    }

    // Clear input and hide welcome message
    input.value = '';
    input.style.height = 'auto';
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    // Create user message
    const userMessage = {
        role: 'user',
        content: []
    };

    if (message) {
        userMessage.content.push({
            type: 'text',
            text: message
        });
    }

    if (currentImage) {
        userMessage.content.push({
            type: 'image_url',
            image_url: {
                url: currentImage
            }
        });
    }

    // Display user message
    displayMessage(message, 'user', currentImage);
    chatHistory.push(userMessage);

    // Clear image
    const imageData = currentImage;
    removeImage();

    // Show loading indicator
    const loadingId = displayLoadingMessage();

    try {
        // Prepare messages for API
        const messages = chatHistory.map(msg => {
            if (Array.isArray(msg.content)) {
                // Handle multi-part content (text + image)
                return {
                    role: msg.role,
                    content: msg.content
                };
            }
            return msg;
        });

        // Call Grok API
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-beta',
                messages: messages,
                temperature: 0.7,
                stream: false
            })
        });

        removeLoadingMessage(loadingId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const assistantMessage = data.choices[0].message.content;

        // Add to history
        chatHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Display assistant message
        displayMessage(assistantMessage, 'assistant');

    } catch (error) {
        removeLoadingMessage(loadingId);
        displayError(error.message);
        console.error('Error:', error);
    }

    focusInput();
}

function displayMessage(text, role, image = null) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (image && role === 'user') {
        const img = document.createElement('img');
        img.src = image;
        img.alt = 'Uploaded image';
        contentDiv.appendChild(img);
    }

    if (text) {
        if (role === 'assistant') {
            // Render markdown for assistant messages
            const htmlContent = marked.parse(text);
            contentDiv.innerHTML += DOMPurify.sanitize(htmlContent);
        } else {
            // Plain text for user messages, but handle line breaks
            contentDiv.textContent = text;
            contentDiv.style.whiteSpace = 'pre-wrap';
        }
    }

    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);
    scrollToBottom();
}

function displayLoadingMessage() {
    const container = document.getElementById('messagesContainer');
    const loadingDiv = document.createElement('div');
    const loadingId = 'loading-' + Date.now();
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message assistant loading';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    container.appendChild(loadingDiv);
    scrollToBottom();
    return loadingId;
}

function removeLoadingMessage(loadingId) {
    const loading = document.getElementById(loadingId);
    if (loading) {
        loading.remove();
    }
}

function displayError(errorMessage) {
    const container = document.getElementById('messagesContainer');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${DOMPurify.sanitize(errorMessage)}
        <br><small>Please check your API key and try again.</small>
    `;
    container.appendChild(errorDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close settings
    if (e.key === 'Escape') {
        const panel = document.getElementById('settingsPanel');
        if (panel.classList.contains('open')) {
            toggleSettings();
        }
    }
});

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
