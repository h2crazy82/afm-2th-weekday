require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const VALID_TYPES = new Set(['income', 'expense']);

function validatePayload(body) {
  const { type, category, amount, memo, date } = body || {};
  if (!VALID_TYPES.has(type)) return { error: "type must be 'income' or 'expense'" };
  if (!category || !String(category).trim()) return { error: 'category is required' };
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount < 0) return { error: 'amount must be a non-negative number' };
  if (!date) return { error: 'date is required (YYYY-MM-DD)' };
  return {
    value: {
      type,
      category: String(category).trim(),
      amount: numAmount,
      memo: memo ? String(memo) : null,
      date,
    },
  };
}

// ===== Transactions =====
app.get('/api/transactions', async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/transactions/summary', async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('type, category, amount');
  if (error) return res.status(500).json({ error: error.message });

  const summary = { income: {}, expense: {} };
  for (const row of data) {
    if (!summary[row.type]) continue;
    const key = row.category || '미분류';
    summary[row.type][key] = (summary[row.type][key] || 0) + Number(row.amount);
  }
  res.json(summary);
});

app.post('/api/transactions', async (req, res) => {
  const { error: vErr, value } = validatePayload(req.body);
  if (vErr) return res.status(400).json({ error: vErr });

  const { data, error } = await supabase
    .from('transactions')
    .insert([value])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/api/transactions/:id', async (req, res) => {
  const { error: vErr, value } = validatePayload(req.body);
  if (vErr) return res.status(400).json({ error: vErr });

  const { data, error } = await supabase
    .from('transactions')
    .update(value)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
