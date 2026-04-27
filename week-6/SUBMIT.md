# Week-6 제출 가이드

> 4개 퀘스트 결과물의 GitHub 푸시는 완료. 남은 단계는 (a) Supabase 스키마 적용, (b) Vercel 배포 + 환경변수, (c) 단톡방 공유.

## ✅ 완료된 것

- [x] Q1 — `project_plan/` (MISSION/DEV/AUDIENCES + README)
- [x] Q2 — `competitor_research/` (research.md + Chrome MCP 스크린샷 3장)
- [x] Q3 — `shopping_mall_v2/` (Next.js 빌드 성공 16개 routes)
- [x] Q4 — `paid_content/` (Next.js 빌드 성공 9개 routes)
- [x] git commit + push to main

---

## 🔧 남은 단계 1 — Supabase 스키마 적용

week-5와 동일 Supabase 프로젝트에서 SQL Editor 열고 다음 두 파일 순서대로 실행.

### Q3용
`week-6/shopping_mall_v2/schema-add.sql`
- products는 week-5 시드 그대로 사용 (orders/order_items만 신규)

### Q4용
1. `week-6/paid_content/schema-add.sql` — contents + purchases 스키마
2. `week-6/paid_content/seed.sql` — 5개 진짜 콘텐츠

---

## 🚀 남은 단계 2 — Vercel 배포

각 폴더에서 별도 프로젝트로 배포.

### Q3 배포

```bash
cd week-6/shopping_mall_v2

# .env 채우기 (이미 .env 파일 있음, 값만 채우면 됨)
# - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (week-5 동일)
# - SUPABASE_SERVICE_ROLE_KEY (Supabase Settings → API)
# - NEXT_PUBLIC_TOSS_CLIENT_KEY, TOSS_SECRET_KEY (이미 발급)
# - NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT, NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY
# - RESEND_API_KEY (선택, 비워도 됨)
# - ADMIN_EMAILS=h2crazy82@gmail.com

# Vercel 배포
vercel              # 첫 배포 (프로젝트 이름: shopping-mall-v2)
# Vercel 대시보드 → Settings → Environment Variables → .env 모두 등록
vercel --prod
```

### Q4 배포

```bash
cd week-6/paid_content

# .env 채우기 (Supabase 5개 + 토스 2개 = 7개)

vercel              # 첫 배포 (프로젝트 이름: paid-content)
vercel --prod
```

> **팁**: 두 앱 모두 Supabase는 week-5와 동일, 토스 키도 동일. ImageKit과 Resend만 Q3 전용.

---

## 📸 남은 단계 3 — 스크린샷 캡처

Vercel 배포 후 다음 스크린샷을 cmd+shift+4로 영역 캡처해서 각 폴더의 `screenshots/`에 저장:

### Q3 `shopping_mall_v2/screenshots/`
- `01-product-list.png` — 상품 목록 (이미지 표시)
- `02-cart.png` — 장바구니
- `03-checkout.png` — 결제 위젯
- `04-payment-success.png` — 결제 완료 + 이메일 발송 메시지
- `05-mypage.png` — 마이페이지 주문 내역
- `06-admin-upload.png` — 관리자 이미지 업로드 (보너스)

### Q4 `paid_content/screenshots/`
- `01-list.png` — 콘텐츠 목록 (5개 미리보기)
- `02-locked.png` — 잠금 화면
- `03-checkout.png` — 결제 위젯
- `04-payment-success.png` — 결제 완료
- `05-unlocked.png` — 본문 열람 성공
- `06-mypage.png` — 구매 이력

### Q1 `project_plan/screenshots/`
- `01-ai-planning-chat.png` — Claude Code에서 MISSION 작성하는 대화 화면 (이 세션 대화 자체)

### Q2 `competitor_research/screenshots/`
- `01-docebo-landing.png` ✅ 자동 저장됨
- `02-hunet-landing.png` ✅ 자동 저장됨
- `03-sana-landing.png` ✅ 자동 저장됨
- `04-ai-research-chat.png` — Claude Code에서 Chrome MCP 대화 화면 (cmd+shift+4)

---

## 📣 남은 단계 4 — 단톡방 공유 멘트 (각 퀘스트당 1개)

> 각각 그대로 복붙 가능. URL은 배포 후 채우기.

### Q1 — 기획서 3종

```
[Q1 / Planning] 라라에듀 고객사 맞춤 AI 콘텐츠 빌더 기획서 3종 완료 🎯

라라에듀가 252사 제조업체에 산업안전·법정의무 콘텐츠 보낼 때
"우리 공장 사례로 바꿔달라" 요청에 매번 4-8시간 수동 작업하는 페인 포인트.
김지원 PM이 5분 안에 1차 초안 받는 7주차 MVP 그림 잡았습니다.

영어 Tagline: "AI co-pilot for manufacturing workforce training"

GitHub: https://github.com/h2crazy82/afm-2th-weekday/tree/main/week-6/project_plan
```

### Q2 — 경쟁사 리서치

```
[Q2 / Research] Docebo / 휴넷 / Sana Labs 비교 리서치 끝 🔎

Chrome MCP로 30분 만에 3곳 자동 탐색 + 스크린샷 자동 저장.
가장 큰 발견: Sana Labs는 작년에 Workday에 인수됐고, "AI 콘텐츠 자동 맞춤화"는
Docebo/휴넷도 못 하는 빈 자리. 한국 제조업 도메인 데이터 보유한 라라에듀의 unfair advantage.

GitHub: https://github.com/h2crazy82/afm-2th-weekday/tree/main/week-6/competitor_research
```

### Q3 — 쇼핑몰 v2

```
[Q3 / Payment+File] 식물 가게 쇼핑몰 완성 🌱

5주차 Express 쇼핑몰을 Next.js 15 App Router로 재구축 + 결제 + 이미지 업로드 + 마이페이지.
- 토스페이먼츠 결제 위젯 (서버 승인)
- ImageKit 이미지 업로드 (관리자 화면)
- Resend로 주문 확인 이메일 자동 발송
- 마이페이지 + 주문 상세

🚀 배포: https://shopping-mall-v2.vercel.app
GitHub: https://github.com/h2crazy82/afm-2th-weekday/tree/main/week-6/shopping_mall_v2
```

### Q4 — 유료 콘텐츠

```
[Q4 / Payment] AI 프롬프트 템플릿 마켓 🔓

개인 프로젝트와 연결: 라라에듀 PM/강사가 매주 쓸 5개 진짜 프롬프트 템플릿을 단건 판매.
잠금 UX 핵심: 본문은 서버에서 purchases 권한 체크 후에만 fetch — HTML에 본문 절대 노출 X.

콘텐츠 5개:
1. 산업안전 1시간 패키지 강사 노트 (₩9,900)
2. 직장 내 괴롭힘 예방 30분 강의 (₩9,900)
3. 요즘리더 AI 1차시 (₩12,000)
4. 라라에듀 PM 6페이지 제안서 (₩19,000)
5. NCS 평가도구 5문항 (₩14,000)

🚀 배포: https://paid-content.vercel.app
GitHub: https://github.com/h2crazy82/afm-2th-weekday/tree/main/week-6/paid_content
```

---

## 🎯 harbor.school 대시보드 등록

Q1·Q2는 GitHub 폴더 링크만 등록. Q3·Q4는 별도 Vercel URL이라 각 polder 의 README.md에 배포 URL을 추가하면 충분.

대시보드 GitHub 저장소 등록은 **이미 5주차에 등록되어 있음** — 추가 액션 불필요.

---

## 🏆 예상 점수

| 퀘스트 | 기본 | 활용 | 창의성 | 공유 | 합계 |
|--------|:---:|:---:|:---:|:---:|:---:|
| Q1 Planning | 10 | 5 | 5 | 5 | **25** |
| Q2 Research | 10 | 5 | 5 | 5 | **25** |
| Q3 Shopping Mall | 10 | 5 | 5 | 5 | **25** |
| Q4 Paid Content | 10 | 5 | 5 | 5 | **25** |
| **총합** | | | | | **100pt** 🏅 |

> 모두 올클리어 시 100pt. 단톡방 공유 4번 + 다른 수강생 결과물 리액션 잊지 말기.
