const express = require('express');
const cors = require('cors');
require('dotenv').config();
import Anthropic from "@anthropic-ai/sdk";

const app = express();

// Increase JSON body size limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Claude API endpoint
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request to /api/claude');
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [
        {
            role: "user",
            content: JSON.stringify(req.body)
        }
        ]
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Successfully processed request');
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: { 
        message: error.message || 'Internal server error',
        type: 'server_error'
      } 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: { message: `Endpoint ${req.path} not found` }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  Grad App Assistant Backend Server   ║
║  Running on http://localhost:${PORT}   ║
╚═══════════════════════════════════════╝

API Endpoints:
  GET  /api/health  - Health check
  POST /api/claude  - Claude API proxy

Environment:
  API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ Missing'}
  
Ready to accept requests!
  `);
});