# 프롬프트 — [Payment+File] 쇼핑몰 완성

> Claude Code에 그대로 붙여넣고 `{{...}}`만 채워서 실행.

---

## 전제

- 5주차 `week-5/shopping_mall` (Express + Supabase) 구조 학습 완료
- Supabase 프로젝트 재사용 (week-5 동일)
- 토스페이먼츠 테스트 키 발급 완료
- ImageKit 계정·키 발급 완료

## 스택 변경

Express → **Next.js 15 App Router**로 재구축 (week-5 코드는 schema와 UX만 참고).

- @supabase/ssr (서버 컴포넌트 + middleware)
- @tosspayments/tosspayments-sdk (결제위젯)
- imagekit (서버 sig + 클라이언트 직접 업로드)
- resend (주문 확인 이메일, 옵션)
- TailwindCSS

## 구조

```
shopping_mall_v2/
├── app/
│   ├── page.tsx                          # 상품 목록
│   ├── auth/page.tsx                     # 로그인 + 회원가입 탭
│   ├── products/[id]/page.tsx            # 상품 상세 + 장바구니 담기
│   ├── cart/page.tsx                     # 장바구니
│   ├── checkout/page.tsx                 # 토스 결제 위젯
│   ├── payments/success/page.tsx         # 결제 승인 → orders 저장 → 이메일
│   ├── payments/fail/page.tsx
│   ├── mypage/page.tsx                   # 본인 주문 목록
│   ├── mypage/orders/[orderId]/page.tsx  # 주문 상세
│   ├── admin/page.tsx                    # 관리자 — 상품 등록 + 이미지 업로드
│   └── api/
│       ├── cart/route.ts                 # GET/POST 본인
│       ├── cart/[id]/route.ts            # PATCH/DELETE
│       ├── products/route.ts             # GET 공개 / POST 관리자
│       ├── orders/draft/route.ts         # 결제 전 pending 주문 생성
│       └── upload/route.ts               # ImageKit signature 발급
├── lib/
│   ├── supabase/{server,client}.ts
│   ├── imagekit.ts
│   ├── toss.ts
│   └── format.ts
├── middleware.ts                         # Supabase 세션 갱신
├── schema-add.sql                        # orders + order_items
└── ...
```

## DB 추가 (Supabase)

`schema-add.sql` 실행:
- orders (id, user_id, total_price, status, toss_payment_key, toss_order_id, paid_at, ...)
- order_items (order_id, product_name, product_image, quantity, price)
- RLS: SELECT 본인만, INSERT는 service-role (서버 결제 승인 후)

## 결제 플로우 (보안 핵심)

1. 클라이언트 `/checkout` → `/api/orders/draft` POST → 서버에서 unique tossOrderId 생성, status=pending row insert
2. 클라이언트가 토스 결제 위젯 호출 → 토스 결제 페이지 → 성공 시 `/payments/success?paymentKey=...&orderId=...&amount=...`
3. **`/payments/success` 서버 컴포넌트에서 토스 승인 API 호출 (Secret Key)** — 절대 클라이언트에서 호출 금지
4. 승인 성공 → orders 행 update(status=paid, paid_at), 장바구니 비움
5. Resend로 주문 확인 이메일 발송 (RESEND_API_KEY 있을 때만)
6. 마이페이지로 이동

## 환경변수 채우기

```bash
# .env (이미 생성됨, 값만 채우면 됨)
NEXT_PUBLIC_SUPABASE_URL={{week-5와 동일}}
NEXT_PUBLIC_SUPABASE_ANON_KEY={{week-5와 동일}}
SUPABASE_SERVICE_ROLE_KEY={{Supabase Settings → API에서 service_role}}

NEXT_PUBLIC_TOSS_CLIENT_KEY={{test_ck_...}}
TOSS_SECRET_KEY={{test_sk_...}}

NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT={{https://ik.imagekit.io/계정명}}
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY={{public_...}}
IMAGEKIT_PRIVATE_KEY={{private_...}}

RESEND_API_KEY={{re_... 또는 비워두기}}
ADMIN_EMAILS=h2crazy82@gmail.com
```

## 실행

```bash
cd week-6/shopping_mall_v2
pnpm install   # 또는 npm install
# Supabase Studio에서 schema-add.sql 실행
pnpm dev
# http://localhost:3010
```

## 배포

```bash
vercel        # 첫 배포
# Vercel 대시보드 → Settings → Environment Variables → .env 모두 추가
vercel --prod
```

## 📸 스크린샷 목표

- `screenshots/01-product-list.png` — 상품 목록 (이미지 표시)
- `screenshots/02-cart.png` — 장바구니
- `screenshots/03-checkout.png` — 결제 위젯
- `screenshots/04-payment-success.png` — 결제 완료
- `screenshots/05-mypage.png` — 마이페이지 주문 내역
- `screenshots/06-admin-upload.png` — 관리자 이미지 업로드 (보너스)

## ✅ 제출 체크

- [ ] Vercel 배포 URL
- [ ] GitHub
- [ ] 스크린샷 5장 (결제 성공 + 마이페이지 필수)
- [ ] 에이전트 2회 이상 개선 대화 (week-5 → Next.js 전환 + Toss 통합)
- [ ] 단톡방 공유
