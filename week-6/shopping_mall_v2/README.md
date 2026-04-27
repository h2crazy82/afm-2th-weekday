# [Payment+File] 쇼핑몰 v2 — 식물 가게 완성

5주차 식물 가게 쇼핑몰에 **이미지 업로드(ImageKit) + 토스페이먼츠 결제 + 마이페이지 + 주문 확인 이메일**을 추가해서 진짜 서비스로 완성.

- 원본: https://www.notion.so/9b3362eb01348259a41301930c066a13
- 참고 자산: `week-5/shopping_mall/` (스키마 + UX 패턴), Express → Next.js App Router로 재작성
- GitHub: https://github.com/h2crazy82/afm-2th-weekday
- 배포 URL: https://shopping-mall-v2.vercel.app

## 스택

- Next.js 15 App Router (Server Components + Route Handlers)
- @supabase/ssr — Auth + DB (week-5 프로젝트 재사용)
- 토스페이먼츠 결제위젯 SDK (테스트 키)
- ImageKit (서버 sig 발급 → 클라이언트 직접 업로드)
- Resend (주문 확인 이메일, 옵션)
- Tailwind CSS

## 기능

- 상품 목록 / 상세 / 장바구니 (week-5 동일)
- 토스 결제위젯 → 서버 승인 API → orders/order_items DB
- 마이페이지 — 본인 주문 목록 + 주문 상세
- /admin — 관리자만 (ADMIN_EMAILS) 상품 등록 + ImageKit 업로드
- 주문 확인 이메일 자동 발송 (Resend, 환경변수 있을 때만)

## 실행

```bash
pnpm install   # 또는 npm install
# .env 채워넣기 (NEXT_PUBLIC_SUPABASE_URL, TOSS_SECRET_KEY 등)
# Supabase에서 schema-add.sql 실행 (orders + order_items 테이블)
pnpm dev       # http://localhost:3010
```

## 환경변수 (`.env`)

| 키 | 설명 |
|----|------|
| NEXT_PUBLIC_SUPABASE_URL | week-5 Supabase URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon key |
| SUPABASE_SERVICE_ROLE_KEY | 결제 후 orders INSERT용 |
| NEXT_PUBLIC_TOSS_CLIENT_KEY | 토스 클라이언트 키 (test_ck_) |
| TOSS_SECRET_KEY | 토스 시크릿 키 (test_sk_) |
| NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT | ImageKit URL 엔드포인트 |
| NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY | ImageKit public key |
| IMAGEKIT_PRIVATE_KEY | ImageKit private key (서명용) |
| RESEND_API_KEY | (옵션) 주문 확인 이메일 |
| ADMIN_EMAILS | 관리자 이메일 (콤마 구분) |

## 스크린샷

- `screenshots/01-product-list.png` — 상품 목록 (이미지 표시)
- `screenshots/02-cart.png` — 장바구니
- `screenshots/03-checkout.png` — 결제 위젯
- `screenshots/04-payment-success.png` — 결제 완료
- `screenshots/05-mypage.png` — 마이페이지 주문 내역
- `screenshots/06-admin-upload.png` — 관리자 이미지 업로드
