require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
