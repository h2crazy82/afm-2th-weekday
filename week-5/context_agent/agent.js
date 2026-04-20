import { chat } from './chat.js';

const argv = process.argv.slice(2);
const raw = argv.includes('--raw');
const question = argv.filter((a) => a !== '--raw').join(' ').trim();

if (!question) {
  console.error('Usage: node agent.js [--raw] "<질문>"');
  process.exit(1);
}

const mode = raw ? 'BEFORE (일반 GPT)' : 'AFTER (Context + DB)';
console.log(`\n=== ${mode} ===`);
console.log(`Q: ${question}\n`);

const { answer } = await chat({
  question,
  useContext: !raw,
  onToolCall: (name, args) => console.error(`[tool] ${name}(${JSON.stringify(args)})`),
});
console.log(`A: ${answer}\n`);
