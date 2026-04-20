require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3006;

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

// ── Auth ──────────────────────────────────────
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

// ── Products (공개) ───────────────────────────
app.get('/api/products', async (_req, res) => {
  const { data, error } = await anonClient
    .from('products')
    .select('id, name, price, image_url, description, created_at')
    .order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Cart (본인만) ─────────────────────────────
app.get('/api/cart', requireAuth(async (req, res) => {
  const { data, error } = await req.supabase
    .from('cart')
    .select('id, product_id, quantity, created_at, products ( id, name, price, image_url )')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}));

app.post('/api/cart', requireAuth(async (req, res) => {
  const product_id = Number(req.body.product_id);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  if (!product_id) return res.status(400).json({ error: 'product_id가 필요합니다.' });

  // 이미 담긴 상품이면 수량 증가, 아니면 insert
  const { data: existing } = await req.supabase
    .from('cart')
    .select('id, quantity')
    .eq('user_id', req.user.id)
    .eq('product_id', product_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await req.supabase
      .from('cart')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await req.supabase
    .from('cart')
    .insert([{ user_id: req.user.id, product_id, quantity }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}));

app.patch('/api/cart/:id', requireAuth(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'quantity는 1 이상 정수여야 합니다.' });
  }
  const { data, error } = await req.supabase
    .from('cart')
    .update({ quantity })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: '장바구니 항목을 찾을 수 없습니다.' });
  res.json(data);
}));

app.delete('/api/cart/:id', requireAuth(async (req, res) => {
  const { error, count } = await req.supabase
    .from('cart')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  if (!count) return res.status(404).json({ error: '장바구니 항목을 찾을 수 없습니다.' });
  res.json({ ok: true });
}));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌱 Shopping mall running on http://localhost:${PORT}`);
  });
}

module.exports = app;
