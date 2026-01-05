# GLaDOS
**G**enetic **L**ifeform **a**nd **D**isk **O**perating **S**ystem

A minimalistic AI chat interface for the Grok API with support for text, images, code, and markdown formatting.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

✨ **Minimalistic Design** - Clean, modern interface inspired by ChatGPT  
💬 **Full Markdown Support** - Render formatted text, code blocks, tables, and more  
🖼️ **Image Support** - Upload or paste images directly into chat  
💻 **Syntax Highlighting** - Beautiful code formatting with highlight.js  
🌙 **Dark Theme** - Easy on the eyes for long coding sessions  
🔐 **Secure** - API keys stored locally in your browser  
📱 **Responsive** - Works on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites

- A Grok API key from [x.ai](https://x.ai)
- A modern web browser
- A simple web server (Python, Node.js, or any HTTP server)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/itzCozi/GLaDOS.git
cd GLaDOS
```

2. Start a local web server:

**Using Python 3:**
```bash
python3 -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Configuration

1. Click the settings icon (⚙️) in the top-right corner
2. Enter your Grok API key
3. (Optional) Modify the API URL if needed
4. Click "Save Settings"

Your settings are stored locally in your browser and never sent anywhere except to the Grok API.

## Usage

### Sending Messages

- Type your message in the input box at the bottom
- Press **Enter** to send (or click the send button)
- Press **Shift+Enter** to add a new line without sending

### Attaching Images

**Method 1: Click to Upload**
- Click the paperclip icon (📎)
- Select an image from your computer

**Method 2: Paste**
- Copy an image to your clipboard
- Paste it directly into the input box (Ctrl+V / Cmd+V)

**Method 3: Drag & Drop**
- Drag an image file into the chat interface

### Using Markdown

The assistant's responses support full markdown formatting:

**Code Blocks:**
\`\`\`python
def hello_world():
    print("Hello, GLaDOS!")
\`\`\`

**Inline Code:**
Use backticks for `inline code`

**Lists:**
- Bullet points
- Another point

**Tables:**
| Feature | Supported |
|---------|-----------|
| Text    | ✓         |
| Images  | ✓         |
| Code    | ✓         |

**And more:**
- Bold, italic, strikethrough
- Links
- Blockquotes
- Headings

## Keyboard Shortcuts

- **Enter** - Send message
- **Shift+Enter** - New line in message
- **Escape** - Close settings panel
- **Ctrl/Cmd+V** - Paste image

## Architecture

GLaDOS is built with vanilla JavaScript, HTML, and CSS for maximum compatibility and minimal dependencies:

- **index.html** - Main application structure
- **style.css** - All styling and animations
- **app.js** - Application logic and API integration

### External Libraries (CDN)

- [marked.js](https://marked.js.org/) - Markdown parsing
- [highlight.js](https://highlightjs.org/) - Syntax highlighting
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS protection

## API Configuration

### Grok API

The default configuration uses the Grok API from x.ai:

```javascript
{
  "apiUrl": "https://api.x.ai/v1/chat/completions",
  "model": "grok-beta"
}
```

### Custom API Endpoints

You can configure GLaDOS to work with any OpenAI-compatible API:

1. Open settings
2. Change the API URL to your endpoint
3. Save settings

## Privacy & Security

- **API keys** are stored only in your browser's localStorage
- **No data** is sent to any third-party services except the configured API
- **XSS protection** via DOMPurify sanitization
- **No telemetry** or analytics

## Browser Support

GLaDOS works on all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Development

### Project Structure

```
GLaDOS/
├── index.html          # Main HTML file
├── style.css           # Styling
├── app.js              # Application logic
├── package.json        # Project metadata
├── config.example.js   # Example configuration
├── README.md           # Documentation
└── LICENSE             # MIT License
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### API Key Not Working

- Verify your API key is correct
- Check that you have credits/access with x.ai
- Look at browser console for error messages

### Images Not Displaying

- Ensure the image is in a supported format (PNG, JPG, GIF, WebP)
- Check file size (large images may fail)
- Verify the Grok API supports vision for your plan

### Messages Not Sending

- Check your internet connection
- Verify API endpoint is correct
- Open browser developer tools (F12) to see error messages

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

Created by [itzCozi](https://github.com/itzCozi)

Inspired by ChatGPT and other modern AI chat interfaces.

## Support

For issues, questions, or contributions, please visit:
https://github.com/itzCozi/GLaDOS/issues
