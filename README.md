# GLaDOS
Genetic Lifeform and Disk Operating System (GLaDOS)

An AI chat interface for the Grok API with support for text, images, code, and multi-turn conversations.

## Features

- 💬 **Text Chat**: Send and receive text messages with Grok AI
- 🖼️ **Image Support**: Paste or upload images for visual analysis
- 📝 **Code Formatting**: Automatic syntax highlighting for code blocks
- 🎨 **Markdown Rendering**: Rich text formatting in responses
- 💾 **Chat History**: Maintains conversation context
- 📤 **Export Capability**: Export chat history as JSON
- 🎯 **Modern UI**: Beautiful, responsive interface

## Setup

### Prerequisites

- Node.js (v14 or higher)
- A Grok API key from X.AI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/itzCozi/GLaDOS.git
   cd GLaDOS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your API key:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Grok API key:
   ```
   GROK_API_KEY=your_actual_api_key_here
   GROK_API_URL=https://api.x.ai/v1
   PORT=3000
   ```

### Running the Application

Start the server:
```bash
npm start
```

The chat interface will be available at `http://localhost:3000`

## Usage

### Sending Messages

1. Type your message in the input box at the bottom
2. Press `Ctrl+Enter` or click the send button (➤)

### Adding Images

**Method 1: Paste**
- Copy an image to your clipboard
- Press `Ctrl+V` in the chat interface

**Method 2: Upload**
- Click the attachment button (📎)
- Select an image file

### Working with Code

Simply include code in your messages. Code blocks will be automatically formatted with syntax highlighting in responses.

Example:
````
Can you explain this code?

```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

### Managing Chat

- **Clear Chat**: Remove all messages and start fresh
- **Export Chat**: Download conversation history as JSON

## API Configuration

The application uses the Grok API from X.AI. You can obtain an API key from [x.ai](https://x.ai/).

Default configuration:
- API URL: `https://api.x.ai/v1`
- Model: `grok-beta`
- Temperature: `0.7`

## Architecture

- **Backend**: Node.js + Express server (`server.js`)
- **Frontend**: Vanilla JavaScript + HTML/CSS (`public/`)
- **Dependencies**:
  - `express`: Web server
  - `axios`: HTTP client for API calls
  - `multer`: File upload handling
  - `dotenv`: Environment configuration
  - `marked`: Markdown rendering
  - `highlight.js`: Code syntax highlighting

## Project Structure

```
GLaDOS/
├── server.js           # Backend API server
├── package.json        # Dependencies and scripts
├── .env.example        # Example environment configuration
├── .env               # Your API configuration (create this)
├── public/            # Frontend files
│   ├── index.html     # Main HTML structure
│   ├── styles.css     # UI styling
│   └── app.js         # Client-side JavaScript
└── README.md          # This file
```

## Troubleshooting

**Server won't start:**
- Ensure Node.js is installed: `node --version`
- Check that port 3000 is available
- Verify all dependencies are installed: `npm install`

**API errors:**
- Verify your API key is correct in `.env`
- Check that your API key has sufficient credits/permissions
- Ensure the GROK_API_URL is correct

**Images not working:**
- Ensure the image is in a supported format (JPEG, PNG, GIF)
- Check that the image size is under 10MB

## License

See LICENSE file for details.
