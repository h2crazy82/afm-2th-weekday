require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Ingredients CRUD =====
app.get('/api/ingredients', async (req, res) => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/ingredients/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

app.post('/api/ingredients', async (req, res) => {
  const { name, quantity, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { data, error } = await supabase
    .from('ingredients')
    .insert([{ name, quantity, category }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/ingredients/:id', async (req, res) => {
  const { name, quantity, category } = req.body;
  const { data, error } = await supabase
    .from('ingredients')
    .update({ name, quantity, category })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/ingredients/:id', async (req, res) => {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// ===== Recipes CRUD =====
app.get('/api/recipes', async (req, res) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/recipes/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

app.post('/api/recipes', async (req, res) => {
  const { title, ingredients, steps } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { data, error } = await supabase
    .from('recipes')
    .insert([{ title, ingredients, steps }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/recipes/:id', async (req, res) => {
  const { title, ingredients, steps } = req.body;
  const { data, error } = await supabase
    .from('recipes')
    .update({ title, ingredients, steps })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/recipes/:id', async (req, res) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// ===== AI Recipe Generation =====
app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { cuisine, note } = req.body || {};

    const { data: ingredients, error: ingErr } = await supabase
      .from('ingredients')
      .select('name, quantity, category');
    if (ingErr) return res.status(500).json({ error: ingErr.message });

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: '냉장고에 등록된 재료가 없습니다. 먼저 재료를 추가해 주세요.' });
    }

    const fridgeText = ingredients
      .map((i) => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ''}${i.category ? ` [${i.category}]` : ''}`)
      .join('\n');

    const userPrompt = [
      '다음은 현재 냉장고에 있는 재료 목록입니다:',
      fridgeText,
      '',
      '위 재료를 중심으로 만들 수 있는 한 가지 레시피를 제안해 주세요.',
      cuisine ? `선호하는 요리 스타일: ${cuisine}` : '',
      note ? `추가 요청: ${note}` : '',
      '',
      '냉장고에 없는 재료는 최소한의 기본 양념(소금, 후추, 간장, 식용유 등) 정도만 허용합니다.',
      '응답은 반드시 아래 JSON 스키마만 출력하세요.',
      '{"title": string, "ingredients": string, "steps": string}',
      '- ingredients: 한 줄에 한 재료씩, "이름 수량" 형태',
      '- steps: "1. ...", "2. ..." 형태로 단계별 한 줄씩',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: '당신은 집에 있는 재료로 간단하고 맛있는 요리를 제안하는 한국인 요리사입니다. 반드시 JSON 형식으로만 응답합니다.' },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    let recipe;
    try {
      recipe = JSON.parse(content);
    } catch (e) {
      return res.status(502).json({ error: 'AI 응답을 해석할 수 없습니다.', raw: content });
    }

    res.json({
      title: recipe.title || '',
      ingredients: recipe.ingredients || '',
      steps: recipe.steps || '',
      used_fridge: ingredients,
    });
  } catch (err) {
    console.error('generate-recipe error:', err);
    res.status(500).json({ error: err.message || 'AI 레시피 생성 실패' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
