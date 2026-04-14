// ============================================================
// Todo App 01 — Backend Server (JWT auth)
// ------------------------------------------------------------
// Run:
//   1) npm install
//   2) Fill .env (SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET)
//   3) node server.js  (or: npm start)
//   Default port: 3000 (override with PORT env)
// ============================================================

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS = 'todo_app_01_todos';
const USERS = 'todo_app_01_users';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
const JWT_SECRET = (process.env.JWT_SECRET || '').trim();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d').trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[warn] SUPABASE_URL / SUPABASE_ANON_KEY missing in .env');
}
if (!JWT_SECRET) {
  console.warn('[warn] JWT_SECRET missing in .env — tokens will be insecure');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ------------------------------------------------------------
// Auth middleware
// ------------------------------------------------------------
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, '로그인이 필요합니다');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch {
    return fail(res, 401, '토큰이 유효하지 않습니다');
  }
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// ------------------------------------------------------------
// Auth routes
// ------------------------------------------------------------

// POST /api/auth/signup — { email, password, name }
app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();

    if (!isEmail(email)) return fail(res, 400, '올바른 이메일을 입력해주세요');
    if (password.length < 6) return fail(res, 400, '비밀번호는 6자 이상이어야 합니다');
    if (!name) return fail(res, 400, '이름을 입력해주세요');

    const { data: existing } = await supabase
      .from(USERS)
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (existing) return fail(res, 409, '이미 가입된 이메일입니다');

    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from(USERS)
      .insert([{ email, password_hash, name }])
      .select('id, email, name')
      .single();
    if (error) throw error;

    const token = signToken(user);
    return res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    console.error('POST /api/auth/signup error:', err.message);
    return fail(res, 500, err.message || '회원가입에 실패했습니다');
  }
});

// POST /api/auth/login — { email, password }
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return fail(res, 400, '이메일과 비밀번호를 입력해주세요');

    const { data: user, error } = await supabase
      .from(USERS)
      .select('id, email, name, password_hash')
      .ilike('email', email)
      .maybeSingle();
    if (error) throw error;
    if (!user) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다');

    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다');

    const safeUser = { id: user.id, email: user.email, name: user.name };
    const token = signToken(safeUser);
    return ok(res, { user: safeUser, token });
  } catch (err) {
    console.error('POST /api/auth/login error:', err.message);
    return fail(res, 500, err.message || '로그인에 실패했습니다');
  }
});

// GET /api/auth/me — verify token, return user
app.get('/api/auth/me', requireAuth, (req, res) => ok(res, req.user));

// ------------------------------------------------------------
// Todo routes (auth required, scoped to user)
// ------------------------------------------------------------

app.get('/api/todos', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TODOS)
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok(res, data);
  } catch (err) {
    console.error('GET /api/todos error:', err.message);
    return fail(res, 500, err.message || 'Failed to fetch todos');
  }
});

app.post('/api/todos', requireAuth, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return fail(res, 400, 'text is required');

    const { data, error } = await supabase
      .from(TODOS)
      .insert([{ text, completed: false, user_id: req.userId }])
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('POST /api/todos error:', err.message);
    return fail(res, 500, err.message || 'Failed to create todo');
  }
});

app.patch('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    if (typeof req.body?.completed === 'boolean') patch.completed = req.body.completed;
    if (typeof req.body?.text === 'string') patch.text = req.body.text.trim();
    if (Object.keys(patch).length === 0) return fail(res, 400, 'nothing to update');

    const { data, error } = await supabase
      .from(TODOS)
      .update(patch)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return fail(res, 404, 'todo not found');
    return ok(res, data);
  } catch (err) {
    console.error('PATCH /api/todos/:id error:', err.message);
    return fail(res, 500, err.message || 'Failed to update todo');
  }
});

// clear-completed must be BEFORE /:id
app.delete('/api/todos/clear-completed', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from(TODOS)
      .delete()
      .eq('user_id', req.userId)
      .eq('completed', true);
    if (error) throw error;
    return ok(res, { cleared: true });
  } catch (err) {
    console.error('DELETE /api/todos/clear-completed error:', err.message);
    return fail(res, 500, err.message || 'Failed to clear completed');
  }
});

app.delete('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from(TODOS)
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);
    if (error) throw error;
    return ok(res, { id });
  } catch (err) {
    console.error('DELETE /api/todos/:id error:', err.message);
    return fail(res, 500, err.message || 'Failed to delete todo');
  }
});

// SPA fallback
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
