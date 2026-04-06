const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// .env 파일 로드
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const PORT = 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// 생성된 이미지 저장 폴더
const IMAGES_DIR = path.join(__dirname, 'generated');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

const CUBISM_SUFFIX = ", painted as a cubist artwork with geometric shapes, multiple perspectives, warm earth tone palette, oil painting on canvas";

// base64를 파일로 저장하고 URL 반환
function saveBase64Image(b64) {
  const filename = crypto.randomUUID() + '.png';
  const filePath = path.join(IMAGES_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
  return `/generated/${filename}`;
}

async function callTextToImage(prompt) {
  const fullPrompt = prompt + CUBISM_SUFFIX;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;

  if (b64) return saveBase64Image(b64);
  if (url) return url;
  throw new Error('이미지를 생성할 수 없습니다.');
}

async function callImageToImage(prompt, imageBase64) {
  const fullPrompt = (prompt || '이 이미지를 피카소 큐비즘 스타일로 재해석해줘') + CUBISM_SUFFIX;

  // base64 data URL에서 순수 base64 추출
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // multipart/form-data 구성
  const boundary = '----FormBoundary' + Date.now().toString(16);

  const parts = [];
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${fullPrompt}`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024`);

  const headerPart = `--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n`;
  const footerPart = `\r\n--${boundary}--\r\n`;

  const headerBuf = Buffer.from(parts.join('\r\n') + '\r\n' + headerPart, 'utf-8');
  const footerBuf = Buffer.from(footerPart, 'utf-8');
  const body = Buffer.concat([headerBuf, imageBuffer, footerBuf]);

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;

  if (b64) return saveBase64Image(b64);
  if (url) return url;
  throw new Error('이미지를 생성할 수 없습니다.');
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

  // API: Text-to-Image
  if (req.method === 'POST' && req.url === '/api/text-to-image') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const { prompt } = JSON.parse(body);
        const url = await callTextToImage(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API: Image-to-Image
  if (req.method === 'POST' && req.url === '/api/image-to-image') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const { prompt, image_url } = JSON.parse(body);
        const url = await callImageToImage(prompt, image_url);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url }));
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
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

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
  console.log(`\n🎨 Cubism Studio is live at http://localhost:${PORT}\n`);
});
