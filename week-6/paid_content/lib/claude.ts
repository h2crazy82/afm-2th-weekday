// Anthropic Claude API 호출 — 프리미엄 맞춤 프롬프트 생성용
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const CATEGORY_GUIDE: Record<string, string> = {
  산업안전: `한국 제조업 산업안전 전문 강사 관점에서 작성한다. "우리 공장에서는~" 어조 사용. 산업안전보건공단 통계 기준 가정. 사례는 구체 가상 시나리오 + 출처 placeholder.`,
  법정의무교육: `한국 노동법 + HR 전문가 관점. 근로기준법/산업안전보건법 조항 명시. 사례는 한국식 이름 + 회사 업종 맞춤 가상 시나리오.`,
  "요즘리더 AI": `한국 기업 임직원 AI 활용 교육 강사. ChatGPT/Claude 실습 단계 + 함정 안내. "이건 AI 답이 아니라 우리 회사 답이어야 한다" 메시지 반복.`,
  NCS: `NCS 능력단위 평가도구 개발 전문가. 5문항 객관식 + 정답 + 해설 + 난이도 + NCS 능력단위요소 매핑. 1문항은 사례 응용, 1문항은 안전·윤리.`,
  "PM 도구": `라라에듀 콘텐츠 PM 관점. 6페이지 제안서 마크다운. 11구간 단가표 + 동시신청 20% 할인 로직. 고객사명 본문에 자연스럽게 삽입.`,
  자유: `사용자 요청에 따라 가장 적합한 형식으로 작성. Markdown 출력.`,
};

export async function generateCustomPrompt(input: {
  category: string;
  companyName?: string | null;
  industry?: string | null;
  employeeCount?: number | null;
  tone?: string | null;
  customRequest: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const guide = CATEGORY_GUIDE[input.category] || CATEGORY_GUIDE["자유"];

  const systemPrompt = `당신은 라라에듀의 콘텐츠 자산을 잘 아는 AI 프롬프트 빌더입니다.
사용자(라라에듀 PM 또는 강사)가 입력한 회사 정보 + 요청에 맞춰
실제로 ChatGPT/Claude에 붙여넣어 즉시 결과를 얻을 수 있는 프롬프트를 만들어주세요.

카테고리 가이드:
${guide}

출력 형식 (Markdown):
## 사용법
입력해야 할 변수 목록 (회사명, 업종, 차시 등)을 \`___\` 로 표시

## 프롬프트 본문
실제로 LLM에 던질 시스템 프롬프트 + 출력 형식 명시 + 톤 규칙 포함

## 출력 예상 (선택)
이 프롬프트를 실행했을 때 나올 결과의 첫 문단 정도 미리보기

규칙:
- 한국어 작성
- 분량: 600~1500자
- "당신은 ~ 전문가입니다" 형식으로 시작
- 출력 형식을 번호 매긴 섹션으로 명시
- 사용자가 채워야 할 변수는 \`___\` 로 강조
- 실무에 바로 쓸 수 있는 디테일 포함 (단가/차시/시간 등)`;

  const userPrompt = `다음 정보로 맞춤 프롬프트를 만들어주세요:

- 카테고리: ${input.category}
- 회사명: ${input.companyName || "(미입력)"}
- 업종: ${input.industry || "(미입력)"}
- 직원 수: ${input.employeeCount ? input.employeeCount + "명" : "(미입력)"}
- 분위기: ${input.tone || "(미입력)"}

요청:
${input.customRequest}

위 요청에 가장 적합한 프롬프트 한 개를 Markdown으로 작성해주세요.`;

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `Anthropic API ${res.status}`);
  }

  // Claude API 응답: { content: [{ type: "text", text: "..." }] }
  const blocks = json.content || [];
  const text = blocks
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n\n");
  if (!text) throw new Error("AI가 빈 응답을 반환했습니다.");
  return text;
}

export const CUSTOM_GENERATION_PRICE = 39000;
export const CATEGORIES = [
  "산업안전",
  "법정의무교육",
  "요즘리더 AI",
  "NCS",
  "PM 도구",
  "자유",
];
