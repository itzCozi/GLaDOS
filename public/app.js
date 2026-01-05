// Configuration
const API_URL = window.location.origin;

// State
let conversationHistory = [];
let currentImage = null;

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const previewImage = document.getElementById('preview-image');
const removeImageBtn = document.getElementById('remove-image');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// Simple markdown renderer
function renderMarkdown(text) {
    let html = text;
    
    // Code blocks with language
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Unordered lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
        if (!para.match(/^<[^>]+>/)) {
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }
        return para;
    }).join('\n');
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
checkServerStatus();
setupEventListeners();

// Event Listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Image attachment
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    removeImageBtn.addEventListener('click', removeImage);

    // Paste image support
    messageInput.addEventListener('paste', handlePaste);
    document.addEventListener('paste', handlePaste);

    // Controls
    clearBtn.addEventListener('click', clearChat);
    exportBtn.addEventListener('click', exportChat);
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        
        if (data.status === 'ok') {
            if (data.apiConfigured) {
                updateStatus('connected', 'Connected');
            } else {
                updateStatus('error', 'API key not configured');
                addMessage('system', 'Please configure your Grok API key in the .env file');
            }
        }
    } catch (error) {
        updateStatus('error', 'Server offline');
        addMessage('system', 'Cannot connect to server. Please start the server.');
    }
}

function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Please select a valid image file');
    }
}

// Handle paste event
function handlePaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
        if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            loadImage(file);
            break;
        }
    }
}

// Load and preview image
function loadImage(file) {
    currentImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove image
function removeImage() {
    currentImage = null;
    previewImage.src = '';
    imagePreview.style.display = 'none';
    fileInput.value = '';
}

// Send message
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && !currentImage) return;

    // Disable input while sending
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Add user message to chat
    addMessage('user', message, currentImage);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Prepare form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('conversationHistory', JSON.stringify(conversationHistory));
    
    if (currentImage) {
        formData.append('image', currentImage);
        removeImage();
    }

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            body: formData
        });

        removeTypingIndicator(typingId);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to get response');
        }

        const data = await response.json();
        
        // Update conversation history
        conversationHistory = data.conversationHistory;

        // Add assistant response
        addMessage('assistant', data.message);

    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('error', `Error: ${error.message}`);
        console.error('Error:', error);
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Add message to chat
function addMessage(type, content, image = null) {
    // Remove welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (type === 'assistant') {
        // Render markdown for assistant messages
        messageContent.innerHTML = renderMarkdown(content);
    } else {
        messageContent.textContent = content;
    }

    // Add image if present
    if (image) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'message-image';
            img.onclick = () => window.open(e.target.result, '_blank');
            messageContent.appendChild(img);
        };
        reader.readAsDataURL(image);
    }

    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add typing indicator
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    
    typingContent.appendChild(typingIndicator);
    typingDiv.appendChild(typingContent);
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    
    return 'typing-indicator';
}

// Remove typing indicator
function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
        indicator.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        conversationHistory = [];
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to GLaDOS Chat! 👋</h2>
                <p>Start a conversation with Grok AI. You can:</p>
                <ul>
                    <li>💬 Send text messages</li>
                    <li>🖼️ Paste or upload images</li>
                    <li>📝 Share code snippets</li>
                    <li>🔄 Continue multi-turn conversations</li>
                </ul>
            </div>
        `;
        removeImage();
    }
}

// Export chat
function exportChat() {
    if (conversationHistory.length === 0) {
        alert('No chat history to export');
        return;
    }

    const exportData = {
        timestamp: new Date().toISOString(),
        messages: conversationHistory.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : 
                     msg.content.map(c => c.type === 'text' ? c.text : '[Image]').join('\n')
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glados-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
