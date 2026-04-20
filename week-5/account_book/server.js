require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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

// ===== AI Agent =====
const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description: '가계부 transactions 테이블을 조회한다. 필터 조건으로 기간/유형/카테고리 지정 가능.',
      parameters: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'YYYY-MM-DD (포함). 미지정시 전체.' },
          end_date: { type: 'string', description: 'YYYY-MM-DD (포함). 미지정시 전체.' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'aggregate',
      description:
        '트랜잭션을 집계한다. 합계/평균/최대/개수 + 그룹핑(카테고리/요일/주중주말/날짜/월) 지원. ' +
        '**산술·그룹핑은 반드시 이 툴을 사용. LLM 이 직접 덧셈·평균 금지.**',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['sum', 'avg', 'max', 'min', 'count'] },
          group_by: {
            type: 'string',
            enum: ['category', 'weekday', 'is_weekend', 'date', 'month', 'type'],
            description: '그룹 축. 없으면 전체에 대해 metric 을 계산.',
          },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string', description: '단일 카테고리 정확 일치' },
          categories: { type: 'array', items: { type: 'string' }, description: '복수 카테고리 IN 필터' },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_chart',
      description:
        '사용자 답변에 시각화를 첨부한다. 비교/순위/비율/시계열/분포 질문이면 반드시 호출. ' +
        'bar=수량 비교·순위, pie=비율/점유, table=상세표.',
      parameters: {
        type: 'object',
        properties: {
          chart_type: { type: 'string', enum: ['bar', 'pie', 'table'] },
          title: { type: 'string' },
          unit: { type: 'string', description: '"원", "건", "%" 등' },
          labels: { type: 'array', items: { type: 'string' }, description: 'bar/pie 의 x축/조각 이름' },
          values: { type: 'array', items: { type: 'number' }, description: 'bar/pie 의 수치' },
          columns: { type: 'array', items: { type: 'string' }, description: 'table 헤더' },
          rows: {
            type: 'array',
            description: 'table 행(각 행은 문자열 셀 배열). 숫자도 문자열로 전달.',
            items: { type: 'array', items: { type: 'string' } },
          },
        },
        required: ['chart_type', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_distinct_categories',
      description: 'transactions 에 존재하는 모든 카테고리 목록을 반환한다.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today',
      description: '서버 기준 오늘 날짜 (YYYY-MM-DD) 를 반환한다.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAY_ORDER = { '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6 };

function computeMetric(metric, arr) {
  if (arr.length === 0) return 0;
  if (metric === 'sum') return arr.reduce((s, v) => s + v, 0);
  if (metric === 'avg') return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  if (metric === 'count') return arr.length;
  if (metric === 'max') return Math.max(...arr);
  if (metric === 'min') return Math.min(...arr);
  return 0;
}

function groupKey(groupBy, row) {
  if (groupBy === 'category') return row.category || '미분류';
  if (groupBy === 'date') return row.date;
  if (groupBy === 'type') return row.type;
  if (groupBy === 'month') return row.date?.slice(0, 7);
  if (groupBy === 'weekday') {
    const d = new Date(row.date + 'T00:00:00');
    return WEEKDAY_NAMES[d.getDay()];
  }
  if (groupBy === 'is_weekend') {
    const d = new Date(row.date + 'T00:00:00');
    const dow = d.getDay();
    return dow === 0 || dow === 6 ? '주말' : '주중';
  }
  return 'unknown';
}

async function runTool(name, args) {
  if (name === 'list_transactions') {
    let q = supabase.from('transactions').select('id, type, category, amount, memo, date, created_at');
    if (args.start_date) q = q.gte('date', args.start_date);
    if (args.end_date) q = q.lte('date', args.end_date);
    if (args.type) q = q.eq('type', args.type);
    if (args.category) q = q.eq('category', args.category);
    q = q.order('date', { ascending: true });
    const { data, error } = await q;
    if (error) return { error: error.message };
    return { rows: data, count: data.length };
  }
  if (name === 'aggregate') {
    let q = supabase.from('transactions').select('type, category, amount, date');
    if (args.start_date) q = q.gte('date', args.start_date);
    if (args.end_date) q = q.lte('date', args.end_date);
    if (args.type) q = q.eq('type', args.type);
    if (args.category) q = q.eq('category', args.category);
    if (args.categories?.length) q = q.in('category', args.categories);
    const { data, error } = await q;
    if (error) return { error: error.message };

    const metric = args.metric;
    if (!args.group_by) {
      const nums = data.map((r) => Number(r.amount));
      return { metric, value: computeMetric(metric, nums), row_count: data.length };
    }
    const groups = {};
    for (const row of data) {
      const k = groupKey(args.group_by, row);
      groups[k] = groups[k] || [];
      groups[k].push(Number(row.amount));
    }
    let result = Object.entries(groups).map(([k, arr]) => ({ group: k, value: computeMetric(metric, arr), count: arr.length }));
    if (args.group_by === 'weekday') {
      result.sort((a, b) => (WEEKDAY_ORDER[a.group] ?? 99) - (WEEKDAY_ORDER[b.group] ?? 99));
    } else if (args.group_by === 'date' || args.group_by === 'month') {
      result.sort((a, b) => a.group.localeCompare(b.group));
    } else {
      result.sort((a, b) => b.value - a.value);
    }
    return { metric, group_by: args.group_by, groups: result, row_count: data.length };
  }
  if (name === 'emit_chart') {
    return { ok: true };
  }
  if (name === 'get_distinct_categories') {
    const { data, error } = await supabase.from('transactions').select('category, type');
    if (error) return { error: error.message };
    const set = new Set(data.map((r) => `${r.type}:${r.category}`));
    return { categories: [...set] };
  }
  if (name === 'get_today') {
    return { today: new Date().toISOString().slice(0, 10) };
  }
  return { error: `unknown tool: ${name}` };
}

const SYSTEM_PROMPT = `당신은 한국어 소비 분석가 에이전트입니다. 사용자의 Supabase 가계부 데이터를 분석합니다.

**도구 사용 원칙 (절대 규칙):**
1. 숫자 계산(합계·평균·최대·개수)과 그룹핑(카테고리별·요일별·주중주말·월별)은 반드시 **aggregate** 툴 사용. LLM이 직접 덧셈/평균 금지.
2. 개별 영수증·메모·ID가 필요한 질문에만 list_transactions 사용 (예: "가장 많이 쓴 날의 메모는?").
3. "이번 달/오늘/지난주" 등 시점 표현은 먼저 **get_today** 호출로 오늘 확정. "이번 달" = YYYY-MM-01 ~ YYYY-MM-말일.
4. 카테고리 이름이 모호하면 **get_distinct_categories** 로 실제 이름 확인 (예: "교통비"→"교통").
5. **비교·순위·비율·시계열·분포 질문에는 반드시 emit_chart 호출하여 시각화 첨부:**
   - 두 개 이상 항목 비교/순위 → chart_type: "bar"
   - 비율/점유/구성 → chart_type: "pie"
   - 상세 리스트 → chart_type: "table"

**답변 스타일:**
- 한국어, 간결. 결론 먼저, 근거 1~2줄만.
- 금액은 "1,234,567원" 형식.
- aggregate 결과 숫자를 그대로 인용 (재계산 금지).

**스키마:** transactions(id, type='income'|'expense', category, amount, memo, date 'YYYY-MM-DD', created_at).`;

app.post('/api/ask', async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OPENAI_API_KEY 가 설정되어 있지 않습니다. .env 에 추가하세요.' });
  const { question } = req.body || {};
  if (!question || !String(question).trim()) return res.status(400).json({ error: 'question is required' });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: String(question).trim() },
  ];
  const trace = [];
  const charts = [];
  const MAX_TURNS = 8;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
        temperature: 0.1,
      });
      const msg = completion.choices[0].message;
      messages.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return res.json({ answer: msg.content || '', trace, charts });
      }

      for (const call of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch (e) {}
        const result = await runTool(call.function.name, args);
        trace.push({ tool: call.function.name, args, result_summary: summarizeResult(result) });
        if (call.function.name === 'emit_chart') charts.push(args);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 8000),
        });
      }
    }
    res.json({ answer: '답변 생성 한도(8턴) 초과. 질문을 좀 더 구체적으로 해주세요.', trace, charts });
  } catch (e) {
    console.error('ask error:', e);
    res.status(500).json({ error: e.message });
  }
});

function summarizeResult(r) {
  if (!r) return null;
  if (r.error) return { error: r.error };
  if (Array.isArray(r.rows)) return { rows_returned: r.rows.length };
  if (r.groups) return { metric: r.metric, group_by: r.group_by, group_count: r.groups.length, total_rows: r.row_count };
  if (typeof r.value === 'number' && r.metric) return { metric: r.metric, value: r.value, row_count: r.row_count };
  if (r.categories) return { category_count: r.categories.length };
  if (r.today) return { today: r.today };
  return r;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`AI agent: ${openai ? 'enabled (OPENAI_API_KEY found)' : 'disabled — set OPENAI_API_KEY in .env'}`);
});
