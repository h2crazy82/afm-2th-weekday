# [Payment] 유료 콘텐츠 잠금 해제 미니앱

토스페이먼츠로 **AI 프롬프트 템플릿**을 단건 결제하고 영구 열람하는 마켓.

- 원본: https://www.notion.so/cc8362eb0134820cae4d0126a8e3d708
- 콘텐츠 주제: AI 프롬프트 템플릿 (개인 프로젝트 "라라에듀 고객사 맞춤 AI 콘텐츠 빌더"와 연결)
- 결제 모델: 단건 결제 (영구 열람)
- 잠금 UX: 미리보기 앞 3줄 + "결제하고 열람" 버튼
- GitHub: https://github.com/h2crazy82/afm-2th-weekday
- 배포 URL: (Vercel 배포 후 추가)

## 스택

- Next.js 15 App Router
- @supabase/ssr
- 토스페이먼츠 결제위젯 SDK (테스트 키)
- Tailwind CSS

## 보안 핵심

`contents.body`는 **서버 컴포넌트에서 `purchases` 권한 체크 후에만** 쿼리/반환. 프론트엔드 HTML에 본문 전체가 노출되는 일 없음.

```
[목록 페이지]            preview만 fetch (body 안 보냄)
[상세 페이지 (잠금)]     preview만, 결제 버튼만
[상세 페이지 (열람)]     서버에서 purchases 확인 후 body 추가 fetch
```

## 시드 (5개 진짜 콘텐츠 — `seed.sql`)

1. **[제조업 산업안전 1시간 패키지]** — 화학물질 사업장용 강사 노트 자동 생성 (₩9,900)
2. **[법정의무교육]** 직장 내 괴롭힘 예방 30분 강의 — 회사 사례 자동 매핑 (₩9,900)
3. **[요즘리더 AI]** "ChatGPT 첫 30분" 팀장용 1차시 (₩12,000)
4. **[라라에듀 PM 전용]** 고객사 미팅 6페이지 제안서 PDF 초안 (₩19,000)
5. **[NCS 평가도구 자동 생성]** 1과목 5문항 + 정답 + 해설 (₩14,000)

## 환경변수 (`.env`)

| 키 | 설명 |
|----|------|
| NEXT_PUBLIC_SUPABASE_URL | week-5 Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon key |
| SUPABASE_SERVICE_ROLE_KEY | service role |
| NEXT_PUBLIC_TOSS_CLIENT_KEY | test_ck_... |
| TOSS_SECRET_KEY | test_sk_... |

## 실행

```bash
pnpm install
# Supabase에서 schema-add.sql + seed.sql 순서로 실행
pnpm dev      # http://localhost:3011
```

## 스크린샷

- `screenshots/01-list.png` — 콘텐츠 목록 (미리보기 + 잠금)
- `screenshots/02-locked.png` — 잠금 화면
- `screenshots/03-checkout.png` — 결제 위젯
- `screenshots/04-payment-success.png` — 결제 완료
- `screenshots/05-unlocked.png` — 본문 열람 성공
- `screenshots/06-mypage.png` — 구매 이력
