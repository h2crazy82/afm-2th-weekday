require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3003;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ALLOWED_CATEGORIES = ['고민', '칭찬', '응원'];

app.get('/api/posts', async (req, res) => {
  const sortKey = req.query.sort;
  const sort = sortKey === 'likes' || sortKey === 'dislikes' ? sortKey : 'created_at';
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order(sort, { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/posts', async (req, res) => {
  const { category, content } = req.body;

  if (!category || !content) {
    return res.status(400).json({ error: 'category와 content는 필수입니다.' });
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([{ category, content, likes: 0, dislikes: 0 }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

async function incrementField(id, field) {
  const { data: current, error: fetchError } = await supabase
    .from('posts')
    .select(field)
    .eq('id', id)
    .single();

  if (fetchError) return { error: { status: 404, message: '게시글을 찾을 수 없습니다.' } };

  const { data, error } = await supabase
    .from('posts')
    .update({ [field]: (current[field] || 0) + 1 })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: { status: 500, message: error.message } };
  return { data };
}

app.patch('/api/posts/:id/like', async (req, res) => {
  const { data, error } = await incrementField(req.params.id, 'likes');
  if (error) return res.status(error.status).json({ error: error.message });
  res.json(data);
});

app.patch('/api/posts/:id/dislike', async (req, res) => {
  const { data, error } = await incrementField(req.params.id, 'dislikes');
  if (error) return res.status(error.status).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`📝 Board server running on http://localhost:${PORT}`);
});
