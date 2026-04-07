const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ========================================
// Middleware
// ========================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ========================================
// Helper Functions: JSON File Database
// ========================================

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], todos: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ========================================
// User API Endpoints
// ========================================

// GET /api/users — list all users
app.get('/api/users', (_req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read users' });
  }
});

// GET /api/users/:id — get a single user
app.get('/api/users/:id', (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find((u) => u.id === Number(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read user' });
  }
});

// POST /api/users — create a user
app.post('/api/users', (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }
    const db = readDB();
    const newId = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
    const newUser = { id: newId, name, email };
    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// GET /api/users/:id/todos — get all todos for a specific user
app.get('/api/users/:id/todos', (req, res) => {
  try {
    const db = readDB();
    const userId = Number(req.params.id);
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userTodos = db.todos.filter((t) => t.userId === userId);
    res.json({ success: true, data: userTodos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read user todos' });
  }
});

// ========================================
// Todo API Endpoints
// ========================================

// GET /api/todos — list all todos (optional ?userId= filter)
app.get('/api/todos', (req, res) => {
  try {
    const db = readDB();
    let { todos } = db;
    if (req.query.userId) {
      const userId = Number(req.query.userId);
      todos = todos.filter((t) => t.userId === userId);
    }
    res.json({ success: true, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read todos' });
  }
});

// GET /api/todos/:id — get a single todo
app.get('/api/todos/:id', (req, res) => {
  try {
    const db = readDB();
    const todo = db.todos.find((t) => t.id === Number(req.params.id));
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read todo' });
  }
});

// POST /api/todos — create a todo
app.post('/api/todos', (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ success: false, message: 'text and userId are required' });
    }
    const db = readDB();
    const user = db.users.find((u) => u.id === Number(userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const newId = db.todos.length > 0 ? Math.max(...db.todos.map((t) => t.id)) + 1 : 1;
    const newTodo = {
      id: newId,
      userId: Number(userId),
      text,
      completed: false,
    };
    db.todos.push(newTodo);
    writeDB(db);
    res.status(201).json({ success: true, data: newTodo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// PATCH /api/todos/:id — update a todo
app.patch('/api/todos/:id', (req, res) => {
  try {
    const db = readDB();
    const todoIndex = db.todos.findIndex((t) => t.id === Number(req.params.id));
    if (todoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    const { text, completed, userId } = req.body;
    if (text !== undefined) db.todos[todoIndex].text = text;
    if (completed !== undefined) db.todos[todoIndex].completed = completed;
    if (userId !== undefined) db.todos[todoIndex].userId = Number(userId);
    writeDB(db);
    res.json({ success: true, data: db.todos[todoIndex] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id — delete a todo
app.delete('/api/todos/:id', (req, res) => {
  try {
    const db = readDB();
    const todoIndex = db.todos.findIndex((t) => t.id === Number(req.params.id));
    if (todoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    const deleted = db.todos.splice(todoIndex, 1)[0];
    writeDB(db);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

// ========================================
// SPA Fallback
// ========================================
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// Start Server / Export for Vercel
// ========================================
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
