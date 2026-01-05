// GLaDOS - AI Chat Interface
// Main Application Logic

class GLaDOS {
    constructor() {
        // DOM Elements
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsClose = document.getElementById('settings-close');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.apiKeyInput = document.getElementById('api-key');
        this.modelSelect = document.getElementById('model-select');
        this.systemPromptInput = document.getElementById('system-prompt');
        this.chatHistory = document.getElementById('chat-history');
        this.imagePreviewContainer = document.getElementById('image-preview-container');

        // State
        this.currentChatId = null;
        this.chats = {};
        this.pendingImages = [];
        this.isStreaming = false;

        // Configuration
        this.MAX_CONTEXT_MESSAGES = 20;

        // Initialize
        this.init();
    }

    init() {
        // Load saved settings
        this.loadSettings();
        
        // Load chat history
        this.loadChats();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Configure marked.js for markdown rendering
        this.configureMarked();
        
        // Start a new chat if none exists
        if (Object.keys(this.chats).length === 0) {
            this.createNewChat();
        } else {
            // Load the most recent chat
            const chatIds = Object.keys(this.chats).sort((a, b) => b - a);
            this.loadChat(chatIds[0]);
        }
    }

    configureMarked() {
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
    }

    setupEventListeners() {
        // Send button
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Input handling
        this.messageInput.addEventListener('input', () => this.handleInput());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Image paste
        document.addEventListener('paste', (e) => this.handlePaste(e));
        
        // New chat
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.settingsClose.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                this.closeLightbox();
            }
        });
    }

    handleInput() {
        // Auto-resize textarea
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + 'px';
        
        // Enable/disable send button
        const hasContent = this.messageInput.value.trim() || this.pendingImages.length > 0;
        this.sendBtn.disabled = !hasContent || this.isStreaming;
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.sendBtn.disabled) {
                this.sendMessage();
            }
        }
    }

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                this.addImage(file);
            }
        }
    }

    addImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.pendingImages.push({
                data: imageData,
                type: file.type
            });
            this.renderImagePreviews();
            this.handleInput();
        };
        reader.readAsDataURL(file);
    }

    renderImagePreviews() {
        this.imagePreviewContainer.innerHTML = '';
        this.pendingImages.forEach((image, index) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${image.data}" alt="Uploaded image">
                <button class="remove-image" data-index="${index}">&times;</button>
            `;
            preview.querySelector('.remove-image').addEventListener('click', () => {
                this.pendingImages.splice(index, 1);
                this.renderImagePreviews();
                this.handleInput();
            });
            this.imagePreviewContainer.appendChild(preview);
        });
    }

    async sendMessage() {
        const text = this.messageInput.value.trim();
        const images = [...this.pendingImages];
        
        if (!text && images.length === 0) return;
        
        // Clear input
        this.messageInput.value = '';
        this.pendingImages = [];
        this.renderImagePreviews();
        this.handleInput();
        this.messageInput.style.height = 'auto';
        
        // Add user message to UI
        this.addMessage('user', text, images);
        
        // Save to chat history
        this.saveMessageToChat('user', text, images);
        
        // Remove welcome message if present
        const welcome = this.chatMessages.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        
        // Check for API key
        const apiKey = localStorage.getItem('glados_api_key');
        if (!apiKey) {
            this.addMessage('assistant', '⚠️ Please set your Grok API key in Settings to start chatting.', []);
            return;
        }
        
        // Show loading indicator
        const loadingDiv = this.addLoadingIndicator();
        
        // Send to API
        this.isStreaming = true;
        this.sendBtn.disabled = true;
        
        try {
            const response = await this.callGrokAPI(text, images);
            loadingDiv.remove();
            this.addMessage('assistant', response, []);
            this.saveMessageToChat('assistant', response, []);
            
            // Update chat title if it's the first message
            this.updateChatTitle();
        } catch (error) {
            loadingDiv.remove();
            this.addMessage('assistant', `❌ Error: ${error.message}`, [], true);
        } finally {
            this.isStreaming = false;
            this.handleInput();
        }
    }

    async callGrokAPI(text, images) {
        const apiKey = localStorage.getItem('glados_api_key');
        const model = localStorage.getItem('glados_model') || 'grok-3';
        const systemPrompt = localStorage.getItem('glados_system_prompt') || '';
        
        // Get conversation history for context
        const chat = this.chats[this.currentChatId];
        const messages = [];
        
        // Add system prompt if set
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Add previous messages for context (limit to configured max)
        if (chat && chat.messages) {
            const recentMessages = chat.messages.slice(-this.MAX_CONTEXT_MESSAGES);
            for (const msg of recentMessages) {
                const content = [];
                
                // Add text content
                if (msg.text) {
                    content.push({ type: 'text', text: msg.text });
                }
                
                // Add images (for vision models)
                if (msg.images && msg.images.length > 0 && model.includes('vision')) {
                    for (const img of msg.images) {
                        content.push({
                            type: 'image_url',
                            image_url: {
                                url: img.data
                            }
                        });
                    }
                }
                
                messages.push({
                    role: msg.role,
                    content: content.length === 1 && content[0].type === 'text' 
                        ? content[0].text 
                        : content
                });
            }
        }
        
        // Add current message
        const currentContent = [];
        if (text) {
            currentContent.push({ type: 'text', text: text });
        }
        if (images.length > 0 && model.includes('vision')) {
            for (const img of images) {
                currentContent.push({
                    type: 'image_url',
                    image_url: {
                        url: img.data
                    }
                });
            }
        }
        
        messages.push({
            role: 'user',
            content: currentContent.length === 1 && currentContent[0].type === 'text'
                ? currentContent[0].text
                : currentContent
        });
        
        // Call Grok API
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    addMessage(role, text, images, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        
        // Process markdown for assistant messages
        let processedText = text;
        if (role === 'assistant' && !isError) {
            processedText = this.processMarkdown(text);
        } else {
            processedText = this.escapeHtml(text);
        }
        
        // Build image HTML
        let imagesHtml = '';
        if (images && images.length > 0) {
            imagesHtml = images.map(img => 
                `<img src="${img.data}" class="message-image" onclick="app.openLightbox('${img.data}')">`
            ).join('');
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content ${isError ? 'error-message' : ''}">
                ${imagesHtml}
                ${processedText}
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add copy buttons to code blocks
        if (role === 'assistant') {
            this.addCopyButtons(messageDiv);
        }
    }

    processMarkdown(text) {
        // Parse markdown
        let html = marked.parse(text);
        
        // Add language headers to code blocks
        html = html.replace(/<pre><code class="language-(\w+)">/g, 
            '<div class="code-block-header"><span>$1</span><button class="copy-code-btn">Copy</button></div><pre><code class="language-$1">');
        
        return html;
    }

    addCopyButtons(messageDiv) {
        const copyBtns = messageDiv.querySelectorAll('.copy-code-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const messageContent = btn.closest('.message-content');
                if (!messageContent) return;
                
                const codeBlock = messageContent.querySelector('pre code');
                if (codeBlock) {
                    const code = codeBlock.textContent;
                    await navigator.clipboard.writeText(code);
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(loadingDiv);
        this.scrollToBottom();
        return loadingDiv;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Chat Management
    createNewChat() {
        const chatId = Date.now().toString();
        this.chats[chatId] = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            createdAt: Date.now()
        };
        this.currentChatId = chatId;
        this.saveChats();
        this.renderChatHistory();
        this.clearChatMessages();
    }

    loadChat(chatId) {
        this.currentChatId = chatId;
        this.clearChatMessages();
        
        const chat = this.chats[chatId];
        if (chat && chat.messages.length > 0) {
            chat.messages.forEach(msg => {
                this.addMessage(msg.role, msg.text, msg.images || []);
            });
        }
        
        this.renderChatHistory();
    }

    clearChatMessages() {
        this.chatMessages.innerHTML = '';
        const welcome = document.createElement('div');
        welcome.className = 'welcome-message';
        welcome.innerHTML = `
            <h2>Welcome to GLaDOS</h2>
            <p>Your AI-powered chat interface for the Grok API</p>
            <p>Start a conversation below. You can:</p>
            <ul>
                <li>📝 Send text messages</li>
                <li>🖼️ Paste images (Ctrl+V)</li>
                <li>💻 Share code snippets</li>
                <li>📄 Format with Markdown</li>
            </ul>
        `;
        this.chatMessages.appendChild(welcome);
    }

    saveMessageToChat(role, text, images) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return;
        
        this.chats[this.currentChatId].messages.push({
            role,
            text,
            images,
            timestamp: Date.now()
        });
        this.saveChats();
    }

    updateChatTitle() {
        const chat = this.chats[this.currentChatId];
        if (chat && chat.messages.length === 2 && chat.title === 'New Chat') {
            // Use first user message as title
            const firstMessage = chat.messages[0].text || 'Image Chat';
            chat.title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
            this.saveChats();
            this.renderChatHistory();
        }
    }

    deleteChat(chatId) {
        delete this.chats[chatId];
        this.saveChats();
        
        if (this.currentChatId === chatId) {
            const chatIds = Object.keys(this.chats);
            if (chatIds.length > 0) {
                this.loadChat(chatIds[0]);
            } else {
                this.createNewChat();
            }
        } else {
            this.renderChatHistory();
        }
    }

    renderChatHistory() {
        this.chatHistory.innerHTML = '';
        
        const chatIds = Object.keys(this.chats).sort((a, b) => b - a);
        
        chatIds.forEach(chatId => {
            const chat = this.chats[chatId];
            const item = document.createElement('div');
            item.className = `chat-history-item ${chatId === this.currentChatId ? 'active' : ''}`;
            item.innerHTML = `
                <span class="chat-icon">💬</span>
                <span class="chat-title">${this.escapeHtml(chat.title)}</span>
                <button class="delete-btn" title="Delete chat">🗑️</button>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    this.loadChat(chatId);
                }
            });
            
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this chat?')) {
                    this.deleteChat(chatId);
                }
            });
            
            this.chatHistory.appendChild(item);
        });
    }

    // Settings
    openSettings() {
        this.settingsModal.classList.add('active');
        this.apiKeyInput.value = localStorage.getItem('glados_api_key') || '';
        this.modelSelect.value = localStorage.getItem('glados_model') || 'grok-3';
        this.systemPromptInput.value = localStorage.getItem('glados_system_prompt') || '';
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    saveSettings() {
        const apiKey = this.apiKeyInput.value.trim();
        const model = this.modelSelect.value;
        const systemPrompt = this.systemPromptInput.value.trim();
        
        if (apiKey) {
            localStorage.setItem('glados_api_key', apiKey);
        } else {
            localStorage.removeItem('glados_api_key');
        }
        
        localStorage.setItem('glados_model', model);
        localStorage.setItem('glados_system_prompt', systemPrompt);
        
        this.closeSettings();
    }

    // Persistence
    saveChats() {
        const chatsToSave = {};
        for (const chatId in this.chats) {
            chatsToSave[chatId] = {
                ...this.chats[chatId],
                messages: this.chats[chatId].messages.map(msg => ({
                    ...msg,
                    images: msg.images
                }))
            };
        }
        localStorage.setItem('glados_chats', JSON.stringify(chatsToSave));
    }

    loadChats() {
        try {
            const saved = localStorage.getItem('glados_chats');
            if (saved) {
                this.chats = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load chats:', e);
            this.chats = {};
        }
        this.renderChatHistory();
    }

    // Lightbox for images
    openLightbox(imageSrc) {
        let lightbox = document.querySelector('.lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = '<img src="" alt="Full size image">';
            lightbox.addEventListener('click', () => this.closeLightbox());
            document.body.appendChild(lightbox);
        }
        lightbox.querySelector('img').src = imageSrc;
        lightbox.classList.add('active');
    }

    closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GLaDOS();
});
