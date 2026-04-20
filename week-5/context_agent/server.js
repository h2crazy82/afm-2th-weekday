import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import 'dotenv/config';
import { chat } from './chat.js';

const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.OPENAI_API_KEY) {
  console.error('Missing env: SUPABASE_URL / SUPABASE_KEY / OPENAI_API_KEY');
  process.exit(1);
}

const CONTEXT_PATH = new URL('./context.md', import.meta.url);
const loadContext = () => readFile(CONTEXT_PATH, 'utf8');

function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

async function serveStatic(req, res) {
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const file = await readFile(join(import.meta.dirname, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/ask') {
      const { question, mode } = await readBody(req);
      if (!question || typeof question !== 'string') return json(res, 400, { error: 'question required' });
      if (mode !== 'raw' && mode !== 'agent') return json(res, 400, { error: 'mode must be raw|agent' });

      const t0 = Date.now();
      const { answer, toolCalls } = await chat({
        question: question.trim(),
        useContext: mode === 'agent',
      });
      return json(res, 200, { answer, toolCalls, ms: Date.now() - t0 });
    }
    if (req.method === 'GET' && req.url === '/api/context') {
      return json(res, 200, { context: await loadContext() });
    }
    if (req.method === 'GET') return serveStatic(req, res);
    res.writeHead(405);
    res.end('Method Not Allowed');
  } catch (e) {
    console.error(e);
    json(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
