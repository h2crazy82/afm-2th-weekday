const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;

// ========================================
// Helper: MIME types for static file serving
// ========================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// ========================================
// Helper: Parse JSON request body
// ========================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ========================================
// Helper: Send JSON response
// ========================================
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

// ========================================
// Helper: Read all todo*.json files
// ========================================
function readAllTodos() {
  const files = fs.readdirSync(DIR).filter((f) => /^todo\d+\.json$/.test(f));
  const todos = [];
  for (const file of files) {
    const match = file.match(/^todo(\d+)\.json$/);
    const id = Number(match[1]);
    try {
      const content = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf-8'));
      todos.push({ id, task: content.task, done: content.done });
    } catch {
      // skip malformed files
    }
  }
  todos.sort((a, b) => a.id - b.id);
  return todos;
}

// ========================================
// Helper: Find next available ID
// ========================================
function nextId() {
  const todos = readAllTodos();
  if (todos.length === 0) return 1;
  return Math.max(...todos.map((t) => t.id)) + 1;
}

// ========================================
// Server
// ========================================
const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // ----- API Routes -----

  // GET /api/todos
  if (method === 'GET' && pathname === '/api/todos') {
    try {
      const todos = readAllTodos();
      return sendJSON(res, 200, { success: true, data: todos });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Failed to read todos' });
    }
  }

  // POST /api/todos
  if (method === 'POST' && pathname === '/api/todos') {
    try {
      const body = await parseBody(req);
      if (!body.task || typeof body.task !== 'string' || !body.task.trim()) {
        return sendJSON(res, 400, { success: false, message: 'task is required' });
      }
      const id = nextId();
      const todo = { task: body.task.trim(), done: false };
      fs.writeFileSync(path.join(DIR, `todo${id}.json`), JSON.stringify(todo, null, 2));
      return sendJSON(res, 201, { success: true, data: { id, ...todo } });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Failed to create todo' });
    }
  }

  // PATCH /api/todos/:id
  const patchMatch = method === 'PATCH' && pathname.match(/^\/api\/todos\/(\d+)$/);
  if (patchMatch) {
    try {
      const id = Number(patchMatch[1]);
      const filePath = path.join(DIR, `todo${id}.json`);
      if (!fs.existsSync(filePath)) {
        return sendJSON(res, 404, { success: false, message: 'Todo not found' });
      }
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const body = await parseBody(req);
      if (body.task !== undefined) existing.task = body.task;
      if (body.done !== undefined) existing.done = body.done;
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
      return sendJSON(res, 200, { success: true, data: { id, ...existing } });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Failed to update todo' });
    }
  }

  // DELETE /api/todos/:id
  const deleteMatch = method === 'DELETE' && pathname.match(/^\/api\/todos\/(\d+)$/);
  if (deleteMatch) {
    try {
      const id = Number(deleteMatch[1]);
      const filePath = path.join(DIR, `todo${id}.json`);
      if (!fs.existsSync(filePath)) {
        return sendJSON(res, 404, { success: false, message: 'Todo not found' });
      }
      fs.unlinkSync(filePath);
      return sendJSON(res, 200, { success: true, message: 'Todo deleted' });
    } catch (err) {
      return sendJSON(res, 500, { success: false, message: 'Failed to delete todo' });
    }
  }

  // ----- Static File Serving -----
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(DIR, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // SPA fallback: serve index.html for unknown routes
      filePath = path.join(DIR, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
