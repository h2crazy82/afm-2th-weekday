require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3005;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY);

function userClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getToken(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

async function getUser(token) {
  if (!token) return null;
  const { data, error } = await anonClient.auth.getUser(token);
  if (error) return null;
  return data.user;
}

function requireAuth(handler) {
  return async (req, res) => {
    const token = getToken(req);
    const user = await getUser(token);
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다.' });
    req.user = user;
    req.supabase = userClient(token);
    return handler(req, res);
  };
}

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
  const { data, error } = await anonClient.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ user: data.user, session: data.session });
});

app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

app.post('/api/auth/signout', async (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getUser(getToken(req));
  if (!user) return res.status(401).json({ error: '세션 없음' });
  res.json({ user });
});

app.get('/api/posts', requireAuth(async (req, res) => {
  const { data: posts, error } = await req.supabase
    .from('posts')
    .select('id, title, content, user_id, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const ids = [...new Set(posts.map((p) => p.user_id))];
  let emailMap = {};
  if (ids.length) {
    const { data: profs } = await req.supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', ids);
    emailMap = Object.fromEntries((profs || []).map((p) => [p.user_id, p.email]));
  }
  res.json(posts.map((p) => ({ ...p, author_email: emailMap[p.user_id] || null })));
}));

app.post('/api/posts', requireAuth(async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title과 content는 필수입니다.' });

  const { data, error } = await req.supabase
    .from('posts')
    .insert([{ title, content, user_id: req.user.id }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

app.patch('/api/posts/:id', requireAuth(async (req, res) => {
  const { title, content } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (content !== undefined) patch.content = content;

  const { data, error } = await req.supabase
    .from('posts')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: '권한이 없거나 게시글을 찾을 수 없습니다.' });
  res.json(data);
}));

app.delete('/api/posts/:id', requireAuth(async (req, res) => {
  const { error, count } = await req.supabase
    .from('posts')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  if (!count) return res.status(404).json({ error: '권한이 없거나 게시글을 찾을 수 없습니다.' });
  res.json({ ok: true });
}));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`💬 Community server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
