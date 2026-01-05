require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Chat endpoint
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    const apiKey = process.env.GROK_API_KEY;
    const apiUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1';

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set GROK_API_KEY in .env file' 
      });
    }

    // Build messages array from conversation history
    let messages = [];
    if (conversationHistory) {
      try {
        messages = JSON.parse(conversationHistory);
      } catch (e) {
        console.error('Error parsing conversation history:', e);
      }
    }

    // Add the new message
    const userMessage = {
      role: 'user',
      content: []
    };

    // Add text content
    if (message) {
      userMessage.content.push({
        type: 'text',
        text: message
      });
    }

    // Add image if uploaded
    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      
      userMessage.content.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`
        }
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }

    messages.push(userMessage);

    // Call Grok API
    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: 'grok-beta',
        messages: messages,
        stream: false,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistantMessage = response.data.choices[0].message;
    
    res.json({
      message: assistantMessage.content,
      conversationHistory: [...messages, assistantMessage]
    });

  } catch (error) {
    console.error('Error calling Grok API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get response from Grok API',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiConfigured: !!process.env.GROK_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`GLaDOS Chat Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!process.env.GROK_API_KEY}`);
});
