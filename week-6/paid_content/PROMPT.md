# 프롬프트 — [Payment] 유료 콘텐츠 잠금 해제 미니앱

> Claude Code에 그대로 붙여넣고 `{{...}}`만 채워서 실행.

---

## 전제

- 수업 튜토리얼 "한국형 결제 (TossPayments)" 완료
- Supabase 프로젝트 (week-5와 동일) 사용 — Auth + DB
- shopping_mall_v2 (Q3) 결제 플로우 패턴 학습 완료

## 컨셉

콘텐츠 주제: **AI 프롬프트 템플릿 마켓** — 개인 프로젝트 "라라에듀 고객사 맞춤 AI 콘텐츠 빌더"와 연결. 라라에듀가 보유한 콘텐츠 자산(산업안전·법정의무·요즘리더 AI·NCS 평가도구)에서 추출한 5개 프롬프트 템플릿을 단건 판매.

## 스택

- Next.js 15 App Router
- @supabase/ssr
- @tosspayments/tosspayments-sdk
- Tailwind

## DB

```sql
-- contents: 누구나 SELECT (단, body는 별도 쿼리로 권한 체크 후만)
-- purchases: SELECT/INSERT 본인만 (RLS)
```

## 보안 핵심 — 서버 권한 체크

상세 페이지 흐름:
1. 서버 컴포넌트에서 `contents` SELECT (preview만)
2. user 로그인 + `purchases` (user_id, content_id) 매칭 있는지 체크
3. 매칭 있으면 → 별도 쿼리로 `body` 추가 fetch → 화면 렌더
4. 매칭 없으면 → preview + 결제 버튼만 렌더

**HTML에 body가 절대 들어가지 않음** — 잠금 화면에서 개발자 도구를 켜도 body 노출 X.

## 결제 플로우

```
[잠금 화면] → /checkout/[id] (서버 사이드, 이미 구매했으면 redirect)
            → /api/purchases/draft (POST)
              ├ 가격 서버 재검증
              ├ 중복 결제 차단
              └ purchases pending row + 고유 tossOrderId 발급
            → 토스 결제 위젯
              → 성공 시 /payments/success?contentId=...
                → 서버에서 토스 승인 API 호출 (Secret Key)
                → purchases status=paid + paid_at 갱신
                → 본문 열람 가능 페이지로 이동
```

## 환경변수

```bash
NEXT_PUBLIC_SUPABASE_URL={{week-5 URL}}
NEXT_PUBLIC_SUPABASE_ANON_KEY={{week-5 anon}}
SUPABASE_SERVICE_ROLE_KEY={{service role}}
NEXT_PUBLIC_TOSS_CLIENT_KEY={{test_ck_...}}
TOSS_SECRET_KEY={{test_sk_...}}
```

## 실행

```bash
cd week-6/paid_content
pnpm install
# Supabase에서 schema-add.sql 실행 → seed.sql 순서로 실행
pnpm dev      # http://localhost:3011
```

## 배포

```bash
vercel
# Vercel 환경변수에 위 5개 등록 후
vercel --prod
```

## 📸 스크린샷 목표

- `screenshots/01-list.png` — 5개 콘텐츠 목록 (미리보기 보임)
- `screenshots/02-locked.png` — 잠금 화면 (앞 3줄 + 결제 버튼)
- `screenshots/03-checkout.png` — 토스 결제 위젯
- `screenshots/04-payment-success.png` — 결제 완료
- `screenshots/05-unlocked.png` — 본문 열람 성공
- `screenshots/06-mypage.png` — 구매 이력

## ✅ 제출 체크

- [ ] Vercel 배포 URL
- [ ] GitHub
- [ ] 잠금 → 결제 → 열람 플로우 스크린샷 5장
- [ ] 에이전트 2회 이상 개선 대화 (서버 권한 체크 디자인 + 토스 통합)
- [ ] 단톡방 공유
