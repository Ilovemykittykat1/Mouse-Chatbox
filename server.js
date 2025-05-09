const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3000;

// Replace with your real keys
const OPENROUTER_KEY = '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';
const OPENWEATHER_KEY = '0f9c4f054043fc28e0a4f1627a8dc798';

app.use(cors());
app.use(express.json());

// ✅ Serve static files (HTML, CSS, JS, and images folder)
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(__dirname));

// ✅ Serve your main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ Chat endpoint with OpenRouter + weather logic
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // 🌦️ Weather check
  const weatherRegex = /weather in ([a-zA-Z\s]+)/i;
  const match = message.match(weatherRegex);

  if (match) {
    const city = match[1].trim();
    try {
      const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: city,
          appid: OPENWEATHER_KEY,
          units: 'metric'
        }
      });

      const weather = weatherRes.data;
      const reply = `☀️ Weather in ${weather.name}: ${weather.weather[0].description}, Temp: ${weather.main.temp}°C`;
      return res.json({ reply });

    } catch (error) {
      console.error('❌ Weather API Error:', error.response?.data || error.message);
      return res.json({
        reply: `🌧️ Hmm… I couldn’t get the weather for "${city}". Try checking your spelling or try another city!`
      });
    }
  }

  // 🧠 OpenRouter fallback (only if not a weather message)
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `You are Chat Katherine, a helpful and fabulous assistant. 
Always reply with code using triple backticks (like \`\`\`js) when giving examples. Now answer this: ${message}`
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

    // ✨ Escape HTML
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
    console.error('❌ Chat API Error:', error.response?.data || error.message);
    const fallback = `💬 Chat Katherine (offline mode): Darling, I can’t reach my brain right now. Try again soon!`;
    res.status(500).json({ reply: fallback });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🧙 Chat Katherine is running at http://localhost:${PORT}`);
});
