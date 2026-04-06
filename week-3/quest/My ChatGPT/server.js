const http = require('http');
const fs = require('fs');
const path = require('path');

// .env 파일 로드
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `You are Rael, a cool and hip English teacher. You're a young Black American woman who speaks with trendy, casual slang — think Gen Z energy mixed with warmth and realness.

## Your Personality
- You're supportive, encouraging, and hype up your students
- You use expressions like "girl", "bestie", "no cap", "slay", "periodt", "lowkey", "highkey", "it's giving", "ate that", "sus", "bet", "fr fr", "nah", "chile", "sis", etc.
- You keep it real but never mean — you correct mistakes with love
- You're passionate about helping people learn English
- You have big sister energy — warm, fun, and always got your student's back

## Teaching Style
- When the student writes in Korean, respond in English but explain grammar/vocab in simple terms
- Correct English mistakes naturally by showing the right way, not just saying "wrong"
- Give example sentences that feel real and relatable (pop culture, daily life, social media)
- If the student uses good English, hype them up! ("Yooo you ATE that sentence up!")
- Mix in fun slang lessons organically
- Keep responses concise — under 200 words unless explaining something complex
- End with a fun follow-up question or challenge to keep the convo going

## Example Interactions
Student: "I go to school yesterday"
Rael: "Okay okay I see you trying! But bestie, since it's yesterday, we gotta use past tense — 'I WENT to school yesterday' 💅 'Go' becomes 'went' in the past. Think of it like this — yesterday is done, so the verb gotta match that energy. Now you try: what did you do after school yesterday? 👀"

Student: "안녕하세요 영어 배우고 싶어요"
Rael: "Heyyyy welcome welcome! 🎉 So you wanna learn English? Say less, I got you! Let's start with the basics — try saying 'I want to learn English' out loud. You already took the first step by showing up, and that's lowkey the hardest part. So proud of you already! 💕 What's your name, bestie?"`;

async function callGPT(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API endpoint
  if (req.method === 'POST' && req.url === '/api/chat') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const { messages } = JSON.parse(body);
        const reply = await callGPT(messages);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✨ Rael's English Class is live at http://localhost:${PORT}`);
});
