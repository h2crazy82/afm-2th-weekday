# 경쟁 서비스 리서치 — 라라에듀 고객사 맞춤 AI 학습 콘텐츠 빌더

> 7주차 MVP "AI co-pilot for manufacturing workforce training"의 직접·간접 경쟁 3곳을 Chrome MCP로 자동 탐색하고 비교한 리포트.
> 조사 일자: 2026-04-27. 조사 도구: Claude Code + claude-in-chrome MCP.
> 비교 기준: **(a) 핵심 가치 제안**, **(b) 주요 기능 3개**, **(c) 가격 정책**, **(d) 약점**.

---

## 1. 경쟁 서비스 3곳

| # | 서비스 | 카테고리 | 본사 | 로고 / 톤 | URL |
|---|--------|---------|-----|----------|-----|
| 1 | **Docebo** | 해외 LMS (AI-First) | Toronto, Canada | 보라/다크 모드, 에이전트 강조 | https://www.docebo.com/ |
| 2 | **휴넷 (Hunet)** | 국내 LMS / B2B 멤버십 | 서울, 한국 | 빨간 휴넷 로고, 정통 톤 | https://www.hunet.co.kr/ |
| 3 | **Sana Labs** | AI 튜터 + LMS (AI-Native) | Stockholm, Sweden | 미니멀 흑백, "Superintelligence" | https://sanalabs.com/ |

> Note: Sana Labs는 2024년 Workday에 인수 — "Sana is now a part of Workday" 표시. 향후 Workday HR 생태계 통합 진행 중.

---

## 2. 비교표 — 한 눈에 보기

| 축 | Docebo | 휴넷 | Sana Labs |
|----|--------|------|-----------|
| **태그라인** | "AI-First LMS for Enterprise Learning & Skills" | "NO.1 L&D(Learning&Development) COMPANY" | "Superintelligence for work" |
| **타겟 시장** | 글로벌 엔터프라이즈 (Booking, Zoom, Wrike) | 국내 중견·중소기업 + 임원·리더 | 글로벌 엔터프라이즈 (Hinge Health, Apollo, KEARNEY) |
| **콘텐츠 모델** | 30,000개 마켓플레이스 + AI 콘텐츠 생성기 (Docebo Creator) | 자체 제작 콘텐츠 + 휴넷 AI 칼리지 (외부 강사) | AI 네이티브 author + LXP |
| **AI 통합** | AgentHub (자율 AI 에이전트), Companion (브라우저 확장) | 사례 분석·토론 AI (MBA 한정), AI 활용 강의 다수 | 4 핵심 모듈: Create / Learn / Manage / Analyze 모두 AI 기반 |
| **콘텐츠 제작 시간** | "Create content in minutes" | 명시 없음 (외주·자체 제작) | "Beautiful content, 10x faster" |
| **가격 정책** | 비공개 — Get a Demo만 (추정 $25-50k+/년) | 비공개 — 휴넷 FLEX 멤버십 별도 (추정 직원당 월 1.5-3만원) | 비공개 — Book an Intro만 (추정 €$30-100k+/년) |
| **결제 모델** | 연 단위 SaaS 라이선스 | 멤버십 (휴넷 FLEX) + 과정별 구매 | 연 단위 엔터프라이즈 |
| **한국어 지원** | "Translate and go global in a click" — 자동 번역 | ◎ 네이티브 | 명시 없음 |
| **제조업 특화** | 일반 엔터프라이즈, 제조업 사례 없음 | 법정의무교육 강세, 제조업 비중 큼 | 일반 엔터프라이즈, 테크/SaaS 중심 |
| **무료 체험** | "Take a Tour" / "Get a Demo" | 휴넷 FLEX 1개월 무료, 휴넷CEO 1개월 무료 | "Book an Intro" |
| **로그인/Auth** | SSO + HRIS 연동 | 자체 회원 + 1:1 상담 | SSO 기본 |
| **고객사 사례** | Booking.com -80% 관리시간, Zoom 200만 학습자, Wrike -30% Ramp | 220만 독자 "행복한 경영이야기", 탤런트뱅크 매칭 | 6개 글로벌 로고 노출, 구체 수치 미공개 |

---

## 3. 핵심 인사이트 — 카테고리별 약점 (AI에게 "약점 3가지" 요청한 결과)

### 3.1 Docebo의 약점
1. **언더 마켓에 너무 헤비함** — 직원 50명 미만 제조업체 입장에서 도입 비용 + 셋업 컨설팅이 부담. "글로벌 기업이 쓰는 도구"로 인식되어 한국 중소 제조업체 진입장벽.
2. **콘텐츠 자산은 '범용'** — Docebo Creator는 일반 직무 교육은 잘 만들지만, "현대자동차 울산공장 안전사고 사례" 같은 한국 제조업 도메인 지식이 없음. 결국 PM이 사례를 직접 입력해야 함.
3. **AgentHub 의존도 → 가격 인플레이션** — AI 에이전트 추가는 별도 라이선스. AgentHub 미사용 시 일반 LMS와 차별화 약화.

### 3.2 휴넷의 약점
1. **콘텐츠가 너무 표준화됨** — "법정의무교육 패키지"로 5,000사에 동일 콘텐츠 공급. 제조업체 HRD 담당자가 "우리 공장 사례로 바꿔달라"고 해도 과정 단위 수정만 가능, 차시별 맞춤화 불가능.
2. **AI 도입은 강의 마켓 수준에 머무름** — "AI 활용법" 강의는 많지만, 휴넷 자체가 AI로 콘텐츠를 자동 생성하지는 않음. AI 카피 도구로서의 포지셔닝 약함.
3. **B2C 임원 콘텐츠 비중 큼** — 휴넷CEO·휴넷MBA가 매출 핵심. B2B 제조업 직무 교육은 "법정의무" 카테고리에 묶여 차별화 투자 적음.

> 📚 **휴넷 심화 분석**: 카테고리 트리 3단계, 스마트견적 self-serve 시스템, 환급금 노출, 터닝포인트 큐브 진단 도구, AI 콘텐츠 트렌드 등 더 깊은 조사는 [`hunet-deep-dive.md`](./hunet-deep-dive.md) 참조.

### 3.3 Sana Labs의 약점
1. **한국어·한국 문화 미지원** — 영어/유럽 기준 UX. 한국 제조업 HRD 담당자 47세 박정욱이 직접 쓸 수 없음.
2. **Workday 인수 후 독립성 약화** — 향후 Workday HCM 고객 우선 통합. 비-Workday 회사(국내 제조업체 95%)에게 우선순위 낮아질 위험.
3. **"Superintelligence for work" — 메시징이 추상적** — HRD 담당자가 "이게 뭐 하는 도구인지" 즉각 이해하기 어려움. PoC 검토 길어짐.

---

## 4. 우리 프로젝트의 차별화 포인트 3가지

### 차별점 1 — **한국 제조업 콘텐츠 자산 + 콘텐츠 자동 맞춤화**
Docebo·Sana는 콘텐츠 생성기지만 한국 제조업 도메인이 비어있다. 휴넷은 콘텐츠는 있지만 맞춤화가 없다.
**우리는 둘 다 가짐**: 라라에듀의 252사 거래처 + 산업안전·법정의무·요즘리더 AI 콘텐츠 자산을 system prompt로 주입한 Claude API가 1차 초안을 만든다. "현대자동차 울산공장 직원 180명 안전관리자용 산업안전 4시간 패키지"를 5분 안에 1차 초안으로 받는 시나리오는 위 3개 모두 불가능.

### 차별점 2 — **PM 워크플로우 우선, 학습자 인터페이스는 나중**
Docebo·Sana는 학습자(LMS)에 90% 투자. 휴넷도 마찬가지.
**우리는 PM(콘텐츠 제작자)이 1번 사용자**. 학습자 인터페이스는 8주차 이후. 이 좁은 워크플로우 집중이 "직무 교육 콘텐츠 자동 맞춤화"라는 좁은 가치 제안을 강하게 만든다. PM이 5분 안에 결과물을 얻으면 끝 — 학습자 LMS 연동·SSO·SCORM 호환성 같은 LMS 부담을 전부 0으로.

### 차별점 3 — **가격 — "한 PM 월 5만원" 진입 (베타 무료)**
Docebo $25k+/년, Sana $30k+/년, 휴넷 FLEX는 멤버십 단위 직원당 부과.
**우리는 "PM 1명 월 5만원" 단순가**. 라라에듀 같은 직원 10명 미만 콘텐츠 제작 회사부터 시작해서, 베타 3개월 무료 → PM당 월 5만원. 위 3사의 진입 장벽 1/100. 글로벌 자본 경쟁이 아닌 한국 5,000개 영세 콘텐츠 제작사·교육 컨설팅 회사에게 매력적인 가격대.

---

## 5. AUDIENCES.md 인풋 — 경쟁사 약점 → 우리 메시지

| 경쟁사 약점 | 우리 메시지 (마케팅 카피) |
|-----------|-------------------------|
| Docebo 비싸다 + 한국 제조업 사례 없음 | "Docebo 1년치 가격으로 우리 도구 50년 사용. 게다가 한국어 + 우리 공장 사례 자동 매핑." |
| 휴넷은 자료 표준화 → 차시별 맞춤 X | "휴넷 자료를 받았는데 우리 회사랑 안 맞나요? 그 자료를 우리 도구에 넣으면 차시별로 우리 공장 사례로 자동 변환." |
| Sana는 영어·Workday 종속 | "Sana 발표 슬라이드 부럽지만 한국어 안 됩니다. 우리는 한국 제조업 HRD가 1번 사용자." |

---

## 6. Methodology — Chrome MCP로 어떻게 자동화했나

이 리포트의 모든 데이터는 Claude Code에서 Chrome MCP(`claude-in-chrome` 익스텐션)를 통해 자동 수집되었다.

```text
[Claude Code 명령]
  ↓
[Chrome MCP — navigate]
  ↓ docebo.com / hunet.co.kr / sanalabs.com
[Chrome MCP — get_page_text + screenshot]
  ↓ 본문 텍스트 추출 + 1568x646 jpeg 캡처
[Claude (LLM) 분석]
  ↓ "이 서비스의 약점 3가지를 뽑아줘"
[Markdown 리포트 자동 작성]
```

**소요 시간**: 약 15분 (수동 브라우징·복사 시 1.5시간 → 1/6).
**한계**: Sana Labs는 SPA(JS 렌더링 본문) 구조라 `get_page_text`가 본문 추출 실패. 화면 스크린샷 텍스트 인식으로 보완.

---

## 7. 다음 액션

- [ ] `MISSION.md` 차별점 섹션에 위 §4 인사이트 반영 (이미 반영됨)
- [ ] `AUDIENCES.md`의 페르소나 C(이수정 HRD 팀장)에게 Docebo/Sana 비교 PoC 메시지 추가
- [ ] 7주차 MVP 시작 전 Hunet FLEX 멤버십 1개월 무료 가입 → 실제 콘텐츠 품질 비교
- [ ] 졸업 후 Phase 2 진입 시 Sana의 Workday 인수 후 독립성 변화 재조사

---

## 부록 A — 캡처 스크린샷

| # | 파일 | 캡처 시각 | 내용 |
|---|------|----------|------|
| 1 | `screenshots/01-docebo-landing.png` | 2026-04-27 | Docebo 메인 — "Meet your not-so secret agents" + AI 채팅 위젯 (Tina) |
| 2 | `screenshots/02-hunet-landing.png` | 2026-04-27 | 휴넷 메인 — 휴넷 FLEX + AI 칼리지 + 휴넷CEO 정기 라이브 세미나 |
| 3 | `screenshots/03-sana-landing.png` | 2026-04-27 | Sana 메인 — "Superintelligence for work" + Sana Learn 4 모듈 |
| 4 | `screenshots/04-ai-research-chat.png` | 2026-04-27 | Claude Code에서 Chrome MCP로 자동 탐색하는 대화 화면 |
