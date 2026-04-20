require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('node:fs/promises');
const { createClient } = require('@supabase/supabase-js');
const { Client: NotionClient } = require('@notionhq/client');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const anonClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const notion = NOTION_TOKEN ? new NotionClient({ auth: NOTION_TOKEN }) : null;

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

// --- [Auth 레이어] ---
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

app.get('/api/auth/me', async (req, res) => {
  const user = await getUser(getToken(req));
  if (!user) return res.status(401).json({ error: '세션 없음' });
  res.json({ user });
});

async function fetchNotionTasks() {
  if (!notion) throw new Error('NOTION_TOKEN 미설정');
  const resp = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      and: [
        { property: '상태', select: { does_not_equal: '완료' } },
        { property: '상태', select: { does_not_equal: '보류' } },
      ],
    },
    sorts: [{ property: '마감일', direction: 'ascending' }],
    page_size: 8,
  });
  return resp.results.map((p) => ({
    id: p.id,
    title: p.properties['프로젝트명']?.title?.[0]?.plain_text ?? '(제목 없음)',
    status: p.properties['상태']?.select?.name ?? null,
    priority: p.properties['우선순위']?.select?.name ?? null,
    category: p.properties['카테고리']?.select?.name ?? null,
    due: p.properties['마감일']?.date?.start ?? null,
    progress: p.properties['진행률']?.number ?? null,
    url: p.url,
  }));
}

async function fetchWorkLogs(supabase) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from('work_logs')
    .select('date, business, task, hours, outcome')
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);

  const labels = { lara_edu: '라라에듀', lara_care: '라라케어', ai_fate: '아이운명연구소' };
  const byBusiness = {};
  for (const row of data) {
    byBusiness[row.business] = (byBusiness[row.business] || 0) + Number(row.hours);
  }
  const summary = Object.entries(byBusiness).map(([k, v]) => ({
    business: labels[k] || k,
    hours: Number(v.toFixed(1)),
  })).sort((a, b) => b.hours - a.hours);
  return { rows: data, summary };
}

// --- [MCP 레이어] Notion 프로젝트 보드 ---
app.get('/api/notion/tasks', requireAuth(async (_req, res) => {
  try {
    const tasks = await fetchNotionTasks();
    res.json({ tasks });
  } catch (e) {
    console.error('[notion]', e.body || e.message);
    res.status(500).json({ error: 'Notion 조회 실패', detail: e.message });
  }
}));

// --- [DB 레이어] Supabase work_logs ---
app.get('/api/work-logs', requireAuth(async (req, res) => {
  try {
    const data = await fetchWorkLogs(req.supabase);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}));

// --- [AI 레이어] 종합 브리핑 ---
app.get('/api/briefing', requireAuth(async (req, res) => {
  try {
    const [tasks, logs, context] = await Promise.all([
      fetchNotionTasks(),
      fetchWorkLogs(req.supabase),
      fs.readFile(path.join(__dirname, 'context.md'), 'utf8'),
    ]);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? '좋은 아침' : hour < 18 ? '좋은 오후' : '좋은 저녁';

    const system = `너는 박훈 전용 아침 브리핑 에이전트다. 아래 <profile>를 읽고,
제공된 Notion 프로젝트와 Supabase 업무 기록을 **둘 다 이름으로 호명하며** 종합한 2~3문장 브리핑을 작성해라.
박훈의 "선호" 섹션을 철저히 지킨다(한국어, "~습니다"체, 간결, 과장 금지).
브리핑 첫 단어는 "${greeting}"로 시작한다.

<profile>
${context}
</profile>`;

    const userPrompt = `[Notion 프로젝트 보드 — 진행중/기획/아이디어 상위]
${JSON.stringify(tasks, null, 2)}

[Supabase work_logs — 최근 7일 사업별 시간]
${JSON.stringify(logs.summary, null, 2)}

위 두 출처를 모두 근거로 브리핑을 작성해라.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });

    res.json({
      briefing: completion.choices[0].message.content,
      sources: {
        notion_tasks: tasks.length,
        work_logs_summary: logs.summary,
      },
    });
  } catch (e) {
    console.error('[briefing]', e);
    res.status(500).json({ error: e.message });
  }
}));

// --- 정적 페이지 라우팅 ---
app.get('/dashboard', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
