# GLaDOS
Genetic Lifeform and Disk Operating System (GLaDOS)

A minimalistic AI chat interface for the Grok API with support for text, images, code, and markdown formatting.

## Features

- 🎨 **Modern, Clean UI** - Dark theme with a sleek, minimalistic design
- 💬 **Chat Interface** - Full conversation history with context-aware responses
- 📝 **Markdown Support** - Rich text formatting in AI responses
- 💻 **Code Highlighting** - Syntax highlighting for code blocks with copy functionality
- 🖼️ **Image Support** - Paste images directly (Ctrl+V) for vision model analysis
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **Persistent Storage** - Chat history saved locally in browser
- ⚙️ **Customizable** - Configure API key, model selection, and system prompts

## Getting Started

1. Open `index.html` in your web browser
2. Click the ⚙️ Settings button
3. Enter your Grok API key from [x.ai](https://console.x.ai)
4. Select your preferred model:
   - **Grok 3** - Latest and most capable model
   - **Grok 3 Mini** - Faster, lighter model
   - **Grok 2 Vision** - For image analysis
5. Start chatting!

## Usage

### Text Messages
Simply type your message and press Enter or click the send button.

### Pasting Images
Press Ctrl+V (or Cmd+V on Mac) to paste images from your clipboard. The image will appear as a preview before sending.

### Code Sharing
Share code snippets in your messages. AI responses with code will be syntax-highlighted with a copy button.

### Markdown
The AI's responses support full markdown formatting including:
- Headers
- Bold, italic text
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Links

## Project Structure

```
GLaDOS/
├── index.html      # Main HTML file
├── styles.css      # Stylesheet with dark theme
├── app.js          # Application logic
├── README.md       # This file
└── LICENSE         # MIT License
```

## Technical Details

- Pure HTML, CSS, and JavaScript (no build required)
- Uses [Marked.js](https://marked.js.org/) for markdown parsing
- Uses [Highlight.js](https://highlightjs.org/) for code syntax highlighting
- Integrates with [Grok API](https://docs.x.ai/api) (OpenAI-compatible)
- Chat history stored in browser localStorage

## License

MIT License - See [LICENSE](LICENSE) for details
