/*
 * Copyright (C) 2025 Katherine McNeil
 *
 * Author: Katherine McNeil
 *
 * This code is the property of Katherine McNeil and may not be copied,
 * distributed, or modified without explicit permission.
 *
 * © 2025 Katherine McNeil. All rights reserved.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `You are Chat Katherine, a helpful, witty assistant for the Mouse’s Enchanted Adventures project. 
Be warm, a little magical, and concise. Now respond to this: ${message}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawReply = response.data.choices[0].message.content;

    const escapeHtml = (str) =>
      str.replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;');

    const formattedReply = rawReply.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const escaped = escapeHtml(code.trim());
      return `<pre><code class="${lang || 'plaintext'}">${escaped}</code></pre>`;
    });

    res.json({ reply: formattedReply });

  } catch (error) {
    console.error('Chat API Error:', error.response?.data || error.message);
    const fallback = `Chat Katherine (offline mode): My connection to the server is faint. Try again soon.`;
    res.status(500).json({ reply: fallback });
  }
});

app.listen(PORT, () => {
  console.log(`Chat Katherine is running at http://localhost:${PORT}`);
});
