# [Auth+MCP+DB+App] 나만의 AI 대시보드 (🔥 보스)

5주차 총정리 — 로그인 + Notion MCP/DB/API 중 2개 이상 연결 + AI "오늘의 브리핑" + Vercel 배포.
위젯 2~3개만 동작해도 인정.

- 원본: https://www.notion.so/db9362eb0134833f9ec3815e293e6f87
- 권장 위젯: Notion 할일(`mcp_notion_ai/` 활용) + 주간 지출(`account_book/` 활용) + AI 브리핑
- 7주차 파이널 프로젝트로 확장 가능

## 배포

- 앱 URL: https://ai-dashboard-boss.vercel.app
- GitHub: https://github.com/h2crazy82/afm-2th-weekday

## 연결 데이터 소스

- Notion API — 📋 프로젝트 보드 (라라케어 Business OS 하위, 진행중/기획/아이디어 프로젝트)
- Supabase `work_logs` — 3개 사업 업무 시간 로그 (라라에듀 / 라라케어 / 아이운명연구소)
- OpenAI `gpt-4o-mini` — context.md + Notion + work_logs 종합 아침 브리핑

## 스크린샷

- `screenshots/01-login.png` — 로그인 화면
- `screenshots/02-dashboard-full.png` — 대시보드 전체 (데이터 + AI 브리핑)
- `screenshots/03-data-sources.png` — 연결 데이터 확인
- `screenshots/04-ai-briefing-detail.png` — AI 브리핑 상세
