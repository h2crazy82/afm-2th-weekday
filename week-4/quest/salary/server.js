require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TABLE = 'salaries';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const CATEGORIES = ['food', 'housing', 'transport', 'leisure', 'saving', 'etc'];
const YEARS_BUCKETS = ['신입', '1-2년차', '3-5년차', '6-10년차', '10년+'];

function yearsBucket(y) {
  const n = Number(y);
  if (!Number.isFinite(n) || n <= 0) return '신입';
  if (n <= 2) return '1-2년차';
  if (n <= 5) return '3-5년차';
  if (n <= 10) return '6-10년차';
  return '10년+';
}

function normalizeExpenses(input = {}) {
  const out = {};
  for (const key of CATEGORIES) {
    const v = Number(input[key]);
    out[key] = Number.isFinite(v) && v >= 0 ? v : 0;
  }
  return out;
}

function percentile(values, target) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let below = 0;
  for (const v of sorted) {
    if (v < target) below++;
    else break;
  }
  return Math.round((below / sorted.length) * 100);
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function buildDistribution(values) {
  const buckets = [
    { label: '~200', min: 0, max: 200, count: 0 },
    { label: '200-300', min: 200, max: 300, count: 0 },
    { label: '300-400', min: 300, max: 400, count: 0 },
    { label: '400-500', min: 400, max: 500, count: 0 },
    { label: '500-700', min: 500, max: 700, count: 0 },
    { label: '700-1000', min: 700, max: 1000, count: 0 },
    { label: '1000+', min: 1000, max: Infinity, count: 0 },
  ];
  for (const v of values) {
    const b = buckets.find((x) => v >= x.min && v < x.max);
    if (b) b.count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

function rowToExpenses(row) {
  return {
    food: Number(row.food) || 0,
    housing: Number(row.housing) || 0,
    transport: Number(row.transport) || 0,
    leisure: Number(row.leisure) || 0,
    saving: Number(row.saving) || 0,
    etc: Number(row.etc) || 0,
  };
}

app.post('/api/salaries', async (req, res) => {
  try {
    const { salary, job, years } = req.body || {};
    const salaryNum = Math.round(Number(salary));
    const yearsNum = Math.round(Number(years));

    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({ error: '월급을 입력해 주세요.' });
    }
    if (!job || typeof job !== 'string') {
      return res.status(400).json({ error: '직군을 입력해 주세요.' });
    }
    if (!Number.isFinite(yearsNum) || yearsNum < 0) {
      return res.status(400).json({ error: '연차를 올바르게 입력해 주세요.' });
    }

    const expenses = normalizeExpenses(req.body.expenses);

    const { data, error } = await supabase
      .from(TABLE)
      .insert([{
        salary: salaryNum,
        job_category: job.trim(),
        years: yearsNum,
        food: Math.round(expenses.food),
        housing: Math.round(expenses.housing),
        transport: Math.round(expenses.transport),
        leisure: Math.round(expenses.leisure),
        saving: Math.round(expenses.saving),
        etc: Math.round(expenses.etc),
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, row: data });
  } catch (err) {
    console.error('POST /api/salaries error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) throw error;

    const rows = data || [];
    const salaries = rows.map((r) => Number(r.salary)).filter(Number.isFinite);

    const byJob = {};
    for (const r of rows) {
      const k = r.job_category || '기타';
      if (!byJob[k]) byJob[k] = [];
      byJob[k].push(Number(r.salary));
    }
    const jobAverages = Object.entries(byJob)
      .map(([job, arr]) => ({ job, avg: Math.round(avg(arr)), count: arr.length }))
      .sort((a, b) => b.avg - a.avg);

    const byYears = {};
    for (const b of YEARS_BUCKETS) byYears[b] = [];
    for (const r of rows) {
      const b = yearsBucket(r.years);
      byYears[b].push(Number(r.salary));
    }
    const yearsAverages = YEARS_BUCKETS.map((b) => ({
      bucket: b,
      avg: Math.round(avg(byYears[b])),
      count: byYears[b].length,
    }));

    const catSums = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
    for (const r of rows) {
      const e = rowToExpenses(r);
      for (const c of CATEGORIES) catSums[c].push(e[c]);
    }
    const categoryAverages = CATEGORIES.map((c) => ({
      category: c,
      avg: Math.round(avg(catSums[c])),
    }));

    res.json({
      total: rows.length,
      overallAvg: Math.round(avg(salaries)),
      min: salaries.length ? Math.min(...salaries) : 0,
      max: salaries.length ? Math.max(...salaries) : 0,
      distribution: buildDistribution(salaries),
      jobAverages,
      yearsAverages,
      categoryAverages,
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

const TIPS = {
  food: {
    over: '식비가 평균보다 많아요 🍱 이번 주 도시락 챌린지 어떠세요? 배달앱 알림 끄기도 효과 만점!',
    under: '식비 관리 완벽 👍 건강한 한 끼도 잊지 마세요.',
  },
  housing: {
    over: '주거/관리비 부담이 커요 🏠 관리비 내역 한번 점검하고, 에너지 요금제·보험 리뉴얼 고려해 보세요.',
    under: '주거비 최적화 완료 🏡 좋은 조건 유지!',
  },
  transport: {
    over: '교통비가 평균 이상이에요 🚶 가까운 거리는 걷기, 대중교통 정기권·환승할인 챙기기!',
    under: '교통비 알뜰하게 쓰고 계세요 🚇',
  },
  leisure: {
    over: '여가/문화비가 많아요 🎬 무료 전시·도서관·공공시설로 취향 찾기 어때요?',
    under: '여가비 절제 중! 가끔은 내 행복에도 투자해요 ✨',
  },
  saving: {
    over: '저축/투자 👑 평균보다 많이 모으고 있어요. 이 페이스 유지!',
    under: '저축이 평균보다 적어요 💰 월급의 10%부터 자동이체로 시작해 보세요.',
  },
  etc: {
    over: '기타 지출이 많아요 💸 카드 명세서에서 숨은 고정비(구독·수수료) 찾아보기!',
    under: '잡다한 지출 잘 통제하고 있어요 👏',
  },
};

const SPEND_CATS = ['food', 'housing', 'transport', 'leisure', 'etc'];

app.post('/api/compare', async (req, res) => {
  try {
    const salaryNum = Number(req.body?.salary);
    const job = (req.body?.job || '').trim();
    const yearsNum = Number(req.body?.years);
    const myExpenses = normalizeExpenses(req.body?.expenses);

    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({ error: '월급을 입력해 주세요.' });
    }

    const { data, error } = await supabase.from(TABLE).select('*');
    if (error) throw error;

    const rows = data || [];
    const salaries = rows.map((r) => Number(r.salary)).filter(Number.isFinite);
    const overallAvg = Math.round(avg(salaries));
    const pctBelow = percentile(salaries, salaryNum);
    const topPercent = Math.max(1, 100 - pctBelow);

    const jobRows = job ? rows.filter((r) => r.job_category === job) : [];
    const jobSalaries = jobRows.map((r) => Number(r.salary)).filter(Number.isFinite);
    const jobAvg = Math.round(avg(jobSalaries));
    const jobPctBelow = percentile(jobSalaries, salaryNum);

    const myBucket = yearsBucket(yearsNum);
    const yearsRows = rows.filter((r) => yearsBucket(r.years) === myBucket);
    const yearsSalaries = yearsRows.map((r) => Number(r.salary)).filter(Number.isFinite);
    const yearsAvg = Math.round(avg(yearsSalaries));
    const yearsPctBelow = percentile(yearsSalaries, salaryNum);

    const catCompare = CATEGORIES.map((c) => {
      const arr = rows.map((r) => rowToExpenses(r)[c]);
      const catAvg = Math.round(avg(arr));
      const mine = myExpenses[c];
      const isSaving = c === 'saving';
      const isOverAverage = isSaving ? mine < catAvg : mine > catAvg;
      return {
        category: c,
        mine,
        avg: catAvg,
        diff: mine - catAvg,
        isOverAverage,
        isSaving,
      };
    });

    const tips = catCompare
      .filter((x) => x.isOverAverage && x.avg > 0)
      .map((x) => ({
        category: x.category,
        diff: x.diff,
        message: TIPS[x.category]?.over || '',
      }));

    const goodCats = catCompare
      .filter((x) => !x.isOverAverage && x.mine > 0 && x.avg > 0)
      .map((x) => ({
        category: x.category,
        message: TIPS[x.category]?.under || '',
      }));

    res.json({
      salary: salaryNum,
      overallAvg,
      topPercent,
      pctBelow,
      sampleSize: salaries.length,
      job: {
        name: job,
        avg: jobAvg,
        topPercent: Math.max(1, 100 - jobPctBelow),
        sampleSize: jobSalaries.length,
      },
      years: {
        bucket: myBucket,
        avg: yearsAvg,
        topPercent: Math.max(1, 100 - yearsPctBelow),
        sampleSize: yearsSalaries.length,
      },
      categoryCompare: catCompare,
      tips,
      goodCats,
    });
  } catch (err) {
    console.error('POST /api/compare error:', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

app.listen(PORT, () => {
  console.log(`salary app running on http://localhost:${PORT}`);
});
