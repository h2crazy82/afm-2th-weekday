import 'dotenv/config';
import fs from 'node:fs/promises';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_work_logs',
      description:
        '박훈의 3개 사업(lara_edu/lara_care/ai_fate) 업무 로그를 Supabase work_logs 테이블에서 조회. ' +
        '전체 기간·특정 사업·최근 N일 범위로 필터 가능.',
      parameters: {
        type: 'object',
        properties: {
          business: {
            type: 'string',
            enum: ['lara_edu', 'lara_care', 'ai_fate'],
            description: '특정 사업으로 필터. 생략 시 전체',
          },
          since_days: {
            type: 'integer',
            description: '최근 N일만 조회 (예: 7). 생략 시 전체',
          },
          limit: {
            type: 'integer',
            description: '최대 반환 행 수. 기본 50',
          },
        },
      },
    },
  },
];

async function runTool(name, args) {
  if (name !== 'get_work_logs') throw new Error(`Unknown tool: ${name}`);
  let q = supabase
    .from('work_logs')
    .select('date, business, task, hours, outcome')
    .order('date', { ascending: false });
  if (args.business) q = q.eq('business', args.business);
  if (args.since_days) {
    const d = new Date();
    d.setDate(d.getDate() - args.since_days);
    q = q.gte('date', d.toISOString().slice(0, 10));
  }
  q = q.limit(args.limit ?? 50);
  const { data, error } = await q;
  if (error) return { error: error.message };
  return { rows: data };
}

export async function chat({ question, useContext, onToolCall }) {
  const messages = [];
  const toolCalls = [];

  if (useContext) {
    const context = await fs.readFile(new URL('./context.md', import.meta.url), 'utf8');
    messages.push({
      role: 'system',
      content:
        '너는 박훈 전용 에이전트다. 아래 <profile>의 내용을 최우선 컨텍스트로 삼고, ' +
        'work_logs DB 조회가 필요하면 get_work_logs 함수를 반드시 먼저 호출한 뒤 답해라. ' +
        '답변은 박훈의 "선호" 섹션을 철저히 지킨다(한국어, "~습니다"체, 간결, 과장 금지, 비유·사례 중심).\n\n' +
        `<profile>\n${context}\n</profile>`,
    });
  } else {
    messages.push({
      role: 'system',
      content: '너는 일반적인 AI 어시스턴트다. 한국어로 답변해라.',
    });
  }

  messages.push({ role: 'user', content: question });

  for (let turn = 0; turn < 4; turn++) {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: useContext ? tools : undefined,
    });

    const msg = resp.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) {
      return { answer: msg.content, toolCalls };
    }

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments || '{}');
      onToolCall?.(call.function.name, args);
      const result = await runTool(call.function.name, args);
      toolCalls.push({ name: call.function.name, args, result });
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
  return { answer: '(tool loop exhausted)', toolCalls };
}
