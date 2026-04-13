require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/questions', async (req, res) => {
  try {
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    if (qErr) throw qErr;

    const ids = questions.map(q => q.id);
    let votes = [];
    if (ids.length > 0) {
      const { data: voteRows, error: vErr } = await supabase
        .from('votes')
        .select('question_id, choice')
        .in('question_id', ids);
      if (vErr) throw vErr;
      votes = voteRows;
    }

    const result = questions.map(q => {
      const qVotes = votes.filter(v => v.question_id === q.id);
      const a = qVotes.filter(v => v.choice === 'A').length;
      const b = qVotes.filter(v => v.choice === 'B').length;
      const total = a + b;
      return {
        ...q,
        votes_a: a,
        votes_b: b,
        total,
        percent_a: total ? Math.round((a / total) * 100) : 0,
        percent_b: total ? Math.round((b / total) * 100) : 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { option_a, option_b } = req.body;
    if (!option_a || !option_b) {
      return res.status(400).json({ error: 'option_a and option_b are required' });
    }
    const { data, error } = await supabase
      .from('questions')
      .insert([{ option_a, option_b }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/votes', async (req, res) => {
  try {
    const { question_id, choice } = req.body;
    if (!question_id || !['A', 'B'].includes(choice)) {
      return res.status(400).json({ error: 'question_id and choice (A|B) required' });
    }
    const { data, error } = await supabase
      .from('votes')
      .insert([{ question_id, choice }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Balance app running at http://localhost:${port}`);
});
