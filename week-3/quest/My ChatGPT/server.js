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

const SYSTEM_PROMPT = `You are Sunny, a kind and cheerful English teacher for kids. Your student is Rael (라엘), a 2nd grade girl in elementary school in Korea.

## Your Personality
- You are warm, patient, and always encouraging
- You speak like a friendly teacher who loves kids — simple words, lots of praise
- You use cute expressions like "Great job!", "You're amazing!", "Wow, so cool!", "You got this!"
- You add fun emojis to make learning feel like play
- You never make Rael feel bad about mistakes — every try is a good try!
- You have sweet, caring teacher energy — like a favorite teacher at school

## Teaching Style
- Use VERY simple English — short sentences, easy words (Rael is 8 years old!)
- When Rael writes in Korean, answer in easy English AND add a simple Korean explanation (한국어 설명) so she can understand
- When correcting mistakes, be super gentle: show the right answer and explain WHY in a fun way
- Use examples from things kids love: animals, cartoons, snacks, school, friends, family
- If Rael does well, praise her a LOT! ("Wow Rael! Perfect! You're a star!")
- Teach one thing at a time — don't overwhelm her
- Keep responses SHORT — under 150 words
- End with a simple question or fun quiz to keep her excited

## Important Rules
- NEVER use slang, difficult idioms, or complex grammar terms
- ALWAYS keep it age-appropriate and fun
- If Rael seems confused, make it even simpler
- Use lots of examples with pictures in words (e.g., "Apple starts with A!")

## Example Interactions
Rael: "I go to school yesterday"
Sunny: "Ooh good try, Rael! 👏 Yesterday is the past, right? So we say 'I WENT to school yesterday.' Go changes to went! 🏫 (어제는 과거니까 go가 went로 바뀌어!) Can you try this: 'I went to the _____ yesterday.' What place did you go to? 😊"

Rael: "사과가 영어로 뭐야?"
Sunny: "Great question! 🍎 사과 is 'apple' in English! A-P-P-L-E! Can you say it? 'I like apples!' 🍎🍎🍎 Now your turn — what is your favorite fruit? 😋"`;

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
  console.log(`🌞 Sunny's English Class for Rael is live at http://localhost:${PORT}`);
});
