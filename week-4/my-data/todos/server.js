const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;

// ========================================
// Helpers
// ========================================

/** MIME types for static file serving */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/** Send a JSON response */
function sendJSON(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/** Read request body as parsed JSON */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/** Parse a todo file into { id, text, done } */
function parseTodoFile(filename, content) {
  const lines = content.split('\n');
  const text = (lines[0] || '').trim();
  const done = (lines[1] || '').trim() === 'true';
  return { id: filename, text, done };
}

/** Write a todo object back to its file */
function writeTodoFile(id, text, done) {
  const filePath = path.join(DIR, id);
  const content = text + '\n' + (done ? 'true' : 'false');
  fs.writeFileSync(filePath, content, 'utf-8');
}

/** Get all todo filenames sorted naturally */
function getTodoFiles() {
  return fs.readdirSync(DIR)
    .filter(f => /^todo\d+$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace('todo', ''), 10);
      const numB = parseInt(b.replace('todo', ''), 10);
      return numA - numB;
    });
}

/** Determine the next available todo filename */
function nextTodoId() {
  const files = getTodoFiles();
  if (files.length === 0) return 'todo1';
  const maxNum = Math.max(...files.map(f => parseInt(f.replace('todo', ''), 10)));
  return 'todo' + (maxNum + 1);
}

// ========================================
// Route handlers
// ========================================

/** GET /api/todos — list all todos */
function handleGetTodos(req, res) {
  try {
    const files = getTodoFiles();
    const todos = files.map(f => {
      const content = fs.readFileSync(path.join(DIR, f), 'utf-8');
      return parseTodoFile(f, content);
    });
    sendJSON(res, 200, { success: true, data: todos });
  } catch (err) {
    sendJSON(res, 500, { success: false, message: 'Failed to read todos' });
  }
}

/** POST /api/todos — create a new todo */
async function handleCreateTodo(req, res) {
  try {
    const body = await readBody(req);
    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return sendJSON(res, 400, { success: false, message: 'Text is required' });
    }
    const id = nextTodoId();
    const text = body.text.trim();
    writeTodoFile(id, text, false);
    sendJSON(res, 201, { success: true, data: { id, text, done: false } });
  } catch (err) {
    sendJSON(res, 400, { success: false, message: err.message });
  }
}

/** PUT /api/todos/:id — update a todo */
async function handleUpdateTodo(req, res, id) {
  const filePath = path.join(DIR, id);
  if (!fs.existsSync(filePath)) {
    return sendJSON(res, 404, { success: false, message: 'Todo not found' });
  }
  try {
    const body = await readBody(req);
    const existing = parseTodoFile(id, fs.readFileSync(filePath, 'utf-8'));

    const text = (typeof body.text === 'string') ? body.text.trim() : existing.text;
    const done = (typeof body.done === 'boolean') ? body.done : existing.done;

    writeTodoFile(id, text, done);
    sendJSON(res, 200, { success: true, data: { id, text, done } });
  } catch (err) {
    sendJSON(res, 400, { success: false, message: err.message });
  }
}

/** DELETE /api/todos/:id — delete a todo */
function handleDeleteTodo(req, res, id) {
  const filePath = path.join(DIR, id);
  if (!fs.existsSync(filePath)) {
    return sendJSON(res, 404, { success: false, message: 'Todo not found' });
  }
  try {
    fs.unlinkSync(filePath);
    sendJSON(res, 200, { success: true });
  } catch (err) {
    sendJSON(res, 500, { success: false, message: 'Failed to delete todo' });
  }
}

// ========================================
// Server
// ========================================

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsed.pathname;
  const method = req.method;

  // --- API routes ---

  // GET /api/todos
  if (method === 'GET' && pathname === '/api/todos') {
    return handleGetTodos(req, res);
  }

  // POST /api/todos
  if (method === 'POST' && pathname === '/api/todos') {
    return handleCreateTodo(req, res);
  }

  // PUT /api/todos/:id
  const putMatch = method === 'PUT' && pathname.match(/^\/api\/todos\/(todo\d+)$/);
  if (putMatch) {
    return handleUpdateTodo(req, res, putMatch[1]);
  }

  // DELETE /api/todos/:id
  const delMatch = method === 'DELETE' && pathname.match(/^\/api\/todos\/(todo\d+)$/);
  if (delMatch) {
    return handleDeleteTodo(req, res, delMatch[1]);
  }

  // --- Static file serving ---

  // Serve index.html for root
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(DIR, 'index.html');
  } else {
    // Prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
    filePath = path.join(DIR, safePath);
  }

  // Only serve files that exist and are within the project directory
  if (method === 'GET' && filePath.startsWith(DIR)) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = MIME[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(content);
      }
    } catch (err) {
      // fall through to 404
    }
  }

  sendJSON(res, 404, { success: false, message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
